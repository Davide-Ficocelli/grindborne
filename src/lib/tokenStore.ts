// ---------------------------------------------------------------------------
// tokenStore.ts
//
// The "bridge" between React and the Axios interceptor.
//
// THE PROBLEM WE'RE SOLVING
//   React state lives inside React components. The Axios interceptor is a
//   plain function that runs outside React entirely. Both need to share the
//   access token. React components need to know WHEN it changes (so they can
//   re-render). The interceptor needs to read and write it freely.
//
// THE SOLUTION: AN EXTERNAL STORE
//   A module-level variable holds the token. A Set of listener functions is
//   notified whenever it changes. React subscribes via useSyncExternalStore
//   (which handles re-rendering for us). The interceptor just calls get/set.
//
// WHY NOT JUST USE REACT STATE AND PASS IT DOWN?
//   Because the interceptor can't call React hooks—it runs outside the render
//   cycle. And because the interceptor needs to WRITE the token after a silent
//   refresh, which is a one-way street: React state can be updated from React,
//   but not from arbitrary functions. An external store flips that around: the
//   store is the source of truth, and React reads from it.
//
// WHY MODULE-LEVEL VARIABLES ARE SAFE HERE
//   ES modules are singletons. Every file that does `import { setAccessToken }
//   from './tokenStore'` gets the SAME `accessToken` variable. There's no risk
//   of two copies drifting apart. This is what makes the pattern work.
// ---------------------------------------------------------------------------

// A listener is just a function that gets called when the token changes.
// useSyncExternalStore will register one of these internally.
type Listener = () => void;

// The single source of truth for the access token.
//   - null  → logged out
//   - string → logged in, holds the current JWT
//
// This is a plain `let`, not `const`, because we reassign it on every set.
// Because it lives in a module (not in localStorage, not in a cookie), it is
// wiped the moment the page unloads. That's the entire security win.
let accessToken: string | null = null;

// The set of currently-registered listeners. A Set (not an array) because we
// need fast add/delete and guaranteed uniqueness. Multiple components can
// subscribe simultaneously—React tracks each consumer separately.
const listeners = new Set<Listener>();

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------
// Returns the current token, or null if logged out.
//
// This is passed to useSyncExternalStore as the "getSnapshot" argument. React
// calls it during render to know what the current value is. React requires
// that if nothing has changed, this function returns the SAME value across
// calls—which is trivially true for primitives like strings and null. (If we
// returned a new object every call, React would complain loudly.)
export function getAccessToken(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
// Updates the token and notifies every subscriber. This is what the login
// flow, the logout flow, and the token-refresh interceptor all call.
export function setAccessToken(token: string | null): void {
  // The equality guard. If the new value is identical to the current one,
  // do nothing. Two reasons:
  //
  //   1. AVOIDING POINTLESS RE-RENDERS. Without this, every call to
  //      setAccessToken would notify listeners even when the token didn't
  //      change, causing the entire app to re-render for no reason.
  //
  //   2. useSyncExternalStore CORRECTNESS. React expects the snapshot to
  //      change only when there's a real change. Notifying listeners
  //      without a real change can trigger React's "getSnapshot should be
  //      cached" warning and, in the worst case, infinite re-render loops.
  if (token === accessToken) return;

  // Update the source of truth FIRST, then notify. If we notified first,
  // subscribers would read a stale value. Order matters.
  accessToken = token;

  // Notify every subscriber. Each listener is a function that React set up
  // to trigger a re-render of the component(s) that subscribed.
  //
  // We're iterating a Set directly rather than converting to an array first.
  // This is safe because listeners never modify the Set during iteration—
  // React's unsubscribe is called later, not from inside the notification.
  // If that ever changed, we'd need `Array.from(listeners).forEach(...)`.
  listeners.forEach((listener) => listener());
}

// ---------------------------------------------------------------------------
// SUBSCRIBE
// ---------------------------------------------------------------------------
// Registers a listener and returns an "unsubscribe" function. This is the
// shape useSyncExternalStore expects: subscribe(callback) → unsubscribe.
//
// React calls subscribe() when a component first mounts, and calls the
// returned unsubscribe function when the component unmounts. This prevents
// memory leaks—without it, unmounted components would keep receiving
// notifications they can't do anything with.
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// THE REFRESH TOKEN — A DIFFERENT STORY
// ---------------------------------------------------------------------------
// Everything above concerns the ACCESS token (short-lived, in memory).
//
// The REFRESH token is a different beast. It's long-lived (days, not minutes)
// and its job is to let the user stay logged in across page reloads.
//
// THE RIGHT HOME FOR IT IS AN httpOnly COOKIE, set by the backend. That way
// JavaScript—and therefore any XSS payload—literally cannot read it. The
// browser sends it automatically with requests to your API.
//
// We're not there yet. Your backend currently returns the refresh token in
// the response body, so we have to store it somewhere on the client. For now
// we use sessionStorage, which is:
//   - Wiped when the tab closes (better than localStorage, which persists).
//   - Still readable by JavaScript (XSS-vulnerable—hence "temporary").
//
// THE MIGRATION PATH: once the backend sets the refresh token as an httpOnly
// cookie, delete the functions below. The rest of the app doesn't care—the
// interceptor will still call getRefreshToken(), but it'll return null, and
// the browser will send the cookie automatically instead.
//
// We don't need a subscription mechanism for the refresh token: it's never
// rendered, never used in a dependency array, never displayed. It's read
// imperatively by the interceptor and that's it.
// ---------------------------------------------------------------------------

const REFRESH_TOKEN_KEY = "grindborne.refresh_token";

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token === null) {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}
