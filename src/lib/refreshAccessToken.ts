// ---------------------------------------------------------------------------
// THE SINGLE-FLIGHT REFRESH.
//
// Both the app-mount effect and the response interceptor call this. If a
// refresh is already in progress, later callers get the SAME promise rather
// than kicking off a second request.
//
// WHY SINGLE-FLIGHT MATTERS
//   Consider: the app mounts and immediately makes a protected API call.
//   The mount effect starts a refresh. The API call 401s (old token expired),
//   and the interceptor also tries to refresh. Without single-flight, we'd
//   send TWO refresh requests in parallel. If the backend rotates refresh
//   tokens (invalidating the old one on use), the second request would fail
//   because its token was already consumed. The user gets logged out—for a
//   reason that has nothing to do with their actual session.
//
//   Single-flight collapses concurrent calls into one network request.
// ---------------------------------------------------------------------------

import axios from "axios";
import { setAccessToken } from "./tokenStore";

// Arbitrary value: The backend ONLY checks for the presence of the header,
// not the content. See verifyCsrf.ts in the backend repo for full motivation.
const CSRF_HEADER = "required";

// The in-flight promise, or null when no refresh is running. This is a
// module-level variable—shared across every importer—which is what makes
// the "same promise for all callers" behavior possible.
let inflightRefresh: Promise<string | null> | null = null;

// Vite env var, extracted here for reuse.
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Attempts to exchange the stored refresh token for a new access token.
 *
 * Returns the new access token on success, or null if the refresh failed
 * (no refresh token present, or the backend rejected it). Never throws—
 * callers should check for null.
 *
 * Side effects on success: updates the access token in the store, and
 * updates the refresh token if the backend rotated it.
 *
 * Side effects on failure: clears BOTH tokens from the store, so the app
 * ends up cleanly logged out rather than in a half-state.
 */
export function refreshAccessToken(): Promise<string | null> {
  // Single-flight: return the existing promise if one is running.
  if (inflightRefresh) return inflightRefresh;

  // Wrap the actual work in an async IIFE so we can assign the promise to
  // `inflightRefresh` BEFORE it resolves. This is the whole trick—the
  // assignment happens synchronously, before any `await`, so any call that
  // arrives during the network round-trip finds the in-flight promise.
  inflightRefresh = (async () => {
    try {
      // The refresh token is no longer readable from JS: it lives in an
      // HttpOnly cookie managed by the browser. There is no longer an "if
      // (!refreshToken) return null" check because we cannot know in advance
      // whether the cookie is present. The backend will respond with 401 if it is missing.
      //
      // withCredentials: true is MANDATORY: without it, Axios does not attach
      // cookies to the request and the backend would never receive the refresh
      // token.
      //
      // RAW axios, not our `api` instance. Same reasoning as the
      // interceptor in api.ts: this call must NOT go through the pipeline
      // that triggers it, or a 401 here would try to refresh again,
      // recursing forever (well, until the _retry guard saved us—but
      // cleaner to just bypass).
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        {}, // body vuoto: il token viaggia nel cookie
        { withCredentials: true, headers: { "X-CSRF-Token": CSRF_HEADER } },
      );

      // HANDLE THE NESTED RESPONSE SHAPE. Your backend wraps payloads as
      // `{ success, message, data: {...} }`. So the actual tokens are at
      // data.data, not data. This is the same gotcha we hit on login.
      //
      // The `?? data` fallback makes this work regardless of whether the
      // backend is wrapping or not. Feel free to collapse to just
      // `data.data` once you're certain of the shape.
      const payload = data.data ?? data;

      // Commit the new token to the store. Writing to the store notifies
      // React's useSyncExternalStore subscribers, so any component
      // displaying the token re-renders with the fresh value.
      setAccessToken(payload.accessToken);

      // Refresh token rotation is handled by the backend via
      // Set-Cookie in the response. The browser updates the cookie itself:
      // no longer need to call setRefreshToken here.

      return payload.accessToken as string;
    } catch {
      // Refresh failed. The refresh token is dead (expired, revoked, or
      // invalid). Clear both so the app is cleanly logged out.
      //
      // We do NOT re-throw: callers should be able to write
      //     const token = await refreshAccessToken();
      //     if (!token) { /* not logged in */ }
      // without wrapping in try/catch. Returning null is the failure signal.
      // Now there is only the access token to clean, the refresh token is a cookie and the
      // will clear the backend on the next /logout or expiration.
      setAccessToken(null);
      return null;
    } finally {
      // Clear the in-flight promise so the NEXT refresh (after this one
      // completes and its result has been delivered) starts fresh.
      //
      // Ordering: the `finally` block runs before the promise resolves to
      // its awaiters. So by the time any `.then()` callback executes,
      // inflightRefresh is null and a fresh call would start a new request.
      // That's correct—we don't want to cache the result forever.
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}
