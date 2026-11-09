// ---------------------------------------------------------------------------
// External store for global feedback messages (“creating…”,
// “quest created”, “server error”).
//
// WHY AN EXTERNAL STORE AND NOT A CONTEXT:
//   Same reason as tokenStore: useMutation is a hook, but the code that
//   needs to push messages might not be within React (e.g. an axios callback). A module-level store is the single source of truth
//   and React subscribes via useSyncExternalStore. No providers, no
//   prop-drilling, no cascading re-renders.
//
// WHY A SET OF LISTENERS: identical to tokenStore. Guaranteed speed for add/delete operations
//   and guaranteed uniqueness. Notification is synchronous (forEach) as in tokenStore.
// ---------------------------------------------------------------------------

export type LogLevel = "info" | "success" | "error";

export interface LogMessage {
  id: string;
  level: LogLevel;
  text: string;
  // If undefined, the message remains until it is removed manually
  // (e.g. "in progress…"). If defined, LogMessages removes it after N ms.
  autoDismissMs?: number;
}

let messages: LogMessage[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// Generate a simple ID. No cryptography is required: the ID just needs to be unique
// within the in-memory list.
function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Adds a message. Returns the generated ID, to be used with
 * dismissLog() if you wish to remove it before it is automatically dismissed (typical scenario:
 * the ‘pending’ message is removed and replaced by ‘success’ or ‘error’).
 */
export function pushLog(
  level: LogLevel,
  text: string,
  autoDismissMs?: number,
): string {
  const id = makeId();
  // Default auto-dismiss time for each level:
  //   • info: undefined → remains until you remove it (it is 'pending')
  //   • success: 3000ms
  //   • error: 5000ms (more time to read)
  let resolvedAutoDismiss: number | undefined = autoDismissMs;

  // An explicit value always takes precedence, so only fall back to
  // the per-level defaults when none was provided.
  if (resolvedAutoDismiss === undefined) {
    switch (level) {
      case "success":
        resolvedAutoDismiss = 3000;
        break;
      case "error":
        resolvedAutoDismiss = 5000;
        break;
      default:
        // "info" (or any other level): stays undefined
        resolvedAutoDismiss = undefined;
        break;
    }
  }

  messages = [
    ...messages,
    { id, level, text, autoDismissMs: resolvedAutoDismiss },
  ];
  notify();
  return id;
}

export function dismissLog(id: string): void {
  const next = messages.filter((m) => m.id !== id);
  if (next.length === messages.length) return; // nothing has been removed
  messages = next;
  notify();
}

export function getLogMessages(): LogMessage[] {
  return messages;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
