import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { getLogMessages, subscribe, dismissLog } from "../lib/logMessagesStore";

// Each level has its own colour. This is centralised to ensure consistency
// with the design (orange/yellow/red) already used in the rest of the app.
const levelClasses: Record<string, string> = {
  info: "bg-[#a48621]/90 border-[#FFD6A7]",
  success: "bg-green-700/90 border-green-300",
  error: "bg-red-700/90 border-red-300",
};

// Auto-dismiss timer: for each message with autoDismissMs, start a
// setTimeout that calls dismissLog(id). Mandatory clean-up: if the
// component is unmounted beforehand, call clearTimeout to prevent memory leaks.
function AutoDismiss({ id, ms }: { id: string; ms: number }) {
  useEffect(() => {
    const t = setTimeout(() => dismissLog(id), ms);
    return () => clearTimeout(t);
  }, [id, ms]);
  return null;
}

export default function LogMessages() {
  const messages = useSyncExternalStore(subscribe, getLogMessages);

  // Reward messages (XP earned) have their own position and style, so they
  // are rendered separately from the regular toasts.
  const toastMessages = messages.filter((m) => m.level !== "reward");
  const rewardMessages = messages.filter((m) => m.level === "reward");

  return (
    <>
      {/* `pointer-events: none` on the wrapper: toasts do not block clicks
          `pointer-events: auto` on individual toasts: the X button works */}
      <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        {toastMessages.map((m) => (
          <div
            key={m.id}
            role="status"
            className={`pointer-events-auto text-white px-4 py-2 rounded border shadow-lg max-w-sm flex items-start gap-2 ${levelClasses[m.level]}`}
          >
            <span className="flex-1">{m.text}</span>
            <button
              aria-label="Dismiss"
              className="text-white/80 hover:text-white"
              onClick={() => dismissLog(m.id)}
            >
              ×
            </button>
            {m.autoDismissMs !== undefined && (
              <AutoDismiss id={m.id} ms={m.autoDismissMs} />
            )}
          </div>
        ))}
      </div>

      {/* XP reward message: top-center of the screen, above everything else
          (z-index above the toasts and the confirm modal), whatever page the
          user is on. It lives here, outside the router, so it survives
          navigation. The fade duration comes from the message itself, so it
          ends exactly when AutoDismiss removes the message. */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] flex flex-col gap-2 pointer-events-none">
        {rewardMessages.map((m) => (
          <div
            key={m.id}
            role="status"
            style={{ animationDuration: `${m.autoDismissMs}ms` }}
            className="reward-log-fade bg-black/90 text-green-300 border-2 border-green-300 rounded-lg px-8 py-4 text-4xl font-bold shadow-2xl"
          >
            {m.text}
            {m.autoDismissMs !== undefined && (
              <AutoDismiss id={m.id} ms={m.autoDismissMs} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
