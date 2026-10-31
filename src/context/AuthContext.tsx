// ---------------------------------------------------------------------------
// THE STORE IS THE SOURCE OF TRUTH.
//
// Earlier AuthProvider held the access token in React state. That worked
// for display, but the interceptor couldn't WRITE to React state (it runs
// outside React). So we moved the token to an external store (tokenStore.ts)
// and now React READS from it instead of owning it.
//
// This component has two jobs now:
//
//   1. Provide the login and logout ACTIONS to the rest of the app. Context
//      is a fine place for these—they're the same for every component.
//
//   2. Wrap everything in a Provider so components can call useAuth().
//
// The token itself is no longer stored here. The useAuth hook combines the
// actions from Context with the token from the external store.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  useSyncExternalStore,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { getAccessToken, setAccessToken, subscribe } from "../lib/tokenStore";
import { refreshAccessToken } from "../lib/refreshAccessToken";

// The value Context actually provides. Notice it holds NO token—just the
// actions. This is a deliberate change from Step 1: state lives in the
// store, actions live in Context.
interface AuthContextType {
  // Takes credentials, calls the backend, stores the returned tokens.
  // Throws if the backend rejects (so the login form can show an error).
  login: (email: string, password: string) => Promise<void>;

  // Tells the backend to invalidate the refresh token, then clears local
  // state. Never throws—logout should always succeed from the user's POV.
  logout: () => Promise<void>;

  isInitialized: boolean;
}

// Same tripwire pattern as Step 1: undefined default + loud error in useAuth.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Vite env var, extracted here since we use it twice below.
const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Tracks whether the app has finished its initial "am I logged in?"
  // check. Starts false. Becomes true after the mount refresh completes
  // (success OR failure). Consumers wait for this before redirecting.
  const [isInitialized, setIsInitialized] = useState(false);

  // -------------------------------------------------------------------------
  // SILENT REFRESH ON MOUNT
  //
  // On app startup, exchange the refresh token cookie (if present) for a
  // fresh access token. This is what makes the user "stay logged in"
  // across page reloads despite the access token being memory-only.
  //
  // WHY useEffect AND NOT top-level code:
  //   The refresh must run AFTER the first render, not during it. React
  //   renders must be pure—no network calls, no side effects. useEffect
  //   is React's escape hatch for "run this after the render commits."
  //
  // WHY THE EMPTY DEPENDENCY ARRAY:
  //   We want this to run exactly once per mount. [] means "no dependencies,
  //   so never re-run." Without it, the effect would fire after every
  //   render—a refresh storm.
  //
  // ABOUT REACT 18 STRICT MODE:
  //   In development, Strict Mode deliberately mounts, unmounts, and
  //   remounts components to surface bugs. This effect runs TWICE in dev.
  //   Thanks to single-flight in refreshAccessToken, the second call
  //   returns the first call's in-flight promise—so we still only send
  //   ONE network request. This is exactly why single-flight matters.

  // call refreshAccessToken() at the mount. Now it works even better,
  // why does the cookie survive reload even if sessionStorage had been emptied
  //
  //   In production, Strict Mode does nothing and the effect runs once.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // `.finally` (rather than `.then`) ensures setIsInitialized(true) runs
    // whether the refresh succeeded or failed. Both outcomes mean "we've
    // determined the session state"—which is what isInitialized tracks.
    refreshAccessToken().finally(() => {
      setIsInitialized(true);
    });
  }, []);

  // useMemo with an empty dependency array means the value is created ONCE
  // and never changes for the lifetime of the app. The functions inside are
  // stable references—consumers won't re-render just because AuthProvider
  // re-rendered (which shouldn't happen anymore, since it no longer holds
  // state, but defense in depth is cheap here).
  //
  // The functions are defined INSIDE useMemo so they close over the fresh
  // `axios` and store imports. They don't close over any prop or state, so
  // there's no staleness risk.
  const value = useMemo<AuthContextType>(
    () => ({
      // -----------------------------------------------------------------
      // LOGIN
      // -----------------------------------------------------------------
      // Uses RAW axios, not our `api` instance. Two reasons:
      //
      //   1. The login endpoint doesn't need an Authorization header—you
      //      don't have a token yet.
      //
      //   2. If login fails with a 401 (bad credentials), we do NOT want
      //      the response interceptor to try to "refresh" and retry. That
      //      would hammer the refresh endpoint pointlessly and could mask
      //      the real error ("wrong password") behind a confusing chain.
      //
      // This is the same reasoning as the refresh call inside the api.ts
      // interceptor: endpoints that are ABOUT authentication should not go
      // through the authentication pipeline.
      // -----------------------------------------------------------------
      async login(email: string, password: string) {
        // withCredentials: true is also needed here: the backend
        // will respond with Set-Cookie for the refresh token. Without this
        // option, the browser would discard the Set-Cookie and refresh
        // would not work after reload.
        const { data: responseBody } = await axios.post(
          `${API_URL}/auth/login`,
          { email, password },
          { withCredentials: true },
        );

        // The body now contains only the access token. The refresh token
        // arrives as an HttpOnly cookie: the client doesn't see it, it doesn't
        // touch, it doesn't store it.
        const { accessToken } = responseBody.data;

        // Store the access token in memory (reactive—consumers re-render).
        setAccessToken(accessToken);
      },

      // -----------------------------------------------------------------
      // LOGOUT
      // -----------------------------------------------------------------
      // Also uses raw axios, for the same "don't route auth endpoints
      // through the auth pipeline" reason.
      //
      // Strategy: best-effort server-side revocation, then guaranteed
      // local cleanup. If the server call fails (network down, token
      // already expired, whatever), we STILL clear the client—otherwise
      // the user would be stuck "logged in" with a dead token.
      //
      // We no longer send the refresh token in the body: it travels in the cookie.
      // withCredentials: true automatically attaches it.
      //
      // The backend will invalidate the refresh token in the DB and delete the
      // cookie with an expired Set-Cookie. If the call fails,
      // let's clean the access token in memory anyway: the user must not
      // stay "logged in" with a dead token.
      // -----------------------------------------------------------------
      async logout() {
        try {
          await axios.delete(`${API_URL}/auth/logout`, {
            withCredentials: true,
            headers: { "X-CSRF-Token": "required" },
          });
        } catch {
          // Swallow the error. A failed logout call is not a reason to
          // refuse to log out locally. Log it if you have a logger, but
          // don't throw.
        }

        // Clear local state. This triggers re-renders in every component
        // that reads the token—including any ProtectedRoute wrapper, which
        // will then redirect to /login on its next render. No imperative
        // navigation needed from here.
        setAccessToken(null);
      },

      isInitialized,
    }),
    [isInitialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// useAuth — the hook components actually call.
//
// It merges TWO sources:
//   - The actions (login, logout) from Context.
//   - The reactive token from the external store, via useSyncExternalStore.
//
// useSyncExternalStore is React 18's official way to subscribe a component
// to non-React state. It takes:
//   - `subscribe`: how to register a listener for changes.
//   - `getAccessToken`: how to read the current value during render.
// It returns the current value and re-renders the component whenever the
// store notifies—automatically, with no useEffect needed.
//
// WHY THIS IS BETTER THAN useState + useEffect:
//   The naive approach (subscribe in an effect, set state in the callback)
//   has subtle bugs around concurrent rendering—React can render a component
//   with a stale value mid-update. useSyncExternalStore handles all of that.
//   You get correctness for free.
//
// RULE OF HOOKS: both useContext and useSyncExternalStore are called
// unconditionally, in the same order, on every render. Never wrap these in
// an if or a loop.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// useAuth — updated to expose isInitialized.
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");

  const accessToken = useSyncExternalStore(subscribe, getAccessToken);

  return {
    ...context,
    accessToken,
    isAuthenticated: !!accessToken,
  };
}
