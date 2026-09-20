// ---------------------------------------------------------------------------
// api.ts
//
// AFTER STEP 3: ALL PLACEHOLDERS REPLACED.
//
// The interceptor now talks to tokenStore.ts instead of localStorage. The
// "outside React updates React state" problem is solved: writing to the
// store notifies React's useSyncExternalStore subscribers, which re-render
// the app. No events, no callbacks, no imperative navigation.
//
// The ONLY remaining compromise is the refresh token living in
// sessionStorage—documented in tokenStore.ts, and addressed in a later step
// by migrating to httpOnly cookies.
// ---------------------------------------------------------------------------

import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} from "./tokenStore";

// Same configured instance as Step 2. The comments there still apply:
// baseURL from Vite env, withCredentials for the eventual cookie migration.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
//
// Now reads from the store. The `if (token)` check matters: when the user is
// logged out (or when we make an unauthenticated call like login—though
// login goes through raw axios, so this doesn't come up), we skip the header
// entirely rather than sending `Authorization: Bearer null`.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
//
// The retry-guard, error.config replay, and "don't use api for the refresh
// call" decisions from Step 2 are unchanged. What's new is what happens on
// SUCCESSFUL refresh and on FAILED refresh—both now write to the store.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      // If we don't even have a refresh token, there's nothing to refresh
      // with. Clear the (nonexistent) access token to be safe and bail.
      // This can happen if a request 401s when the user was never logged
      // in—we don't want to send garbage to the refresh endpoint.
      if (!refreshToken) {
        setAccessToken(null);
        return Promise.reject(error);
      }

      try {
        // RAW axios—deliberately outside the interceptor pipeline. See the
        // extended reasoning in the Step 2 comments: the refresh endpoint
        // must not trigger the refresh interceptor on itself.
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { token: refreshToken },
        );

        // THIS IS THE LINE THAT USED TO BE A COMMENT.
        //
        // Writing to the store:
        //   - Updates the token so future requests use the new one.
        //   - Notifies every useSyncExternalStore subscriber, so any
        //     component reading the token re-renders with the fresh value.
        //
        // None of that requires touching React directly. React reacts
        // because it subscribed, not because we called into it.
        setAccessToken(data.accessToken);

        // If the backend rotates the refresh token (a good practice—it
        // limits the blast radius of a leaked token), update that too.
        // If it doesn't, this branch is skipped and the old refresh token
        // stays in place.
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }

        // Retry the original request with the new token. Everything from
        // here down is identical to Step 2.
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed. The refresh token is dead—wipe it so we don't
        // keep retrying with a known-bad credential.
        setRefreshToken(null);

        // Clear the access token. THIS IS THE CRUCIAL LINE.
        //
        // In Step 2 this was `window.location.href = '/login'`, which
        // caused a full page reload and bypassed React Router. Now we just
        // clear the store. React notices (via useSyncExternalStore) and
        // re-renders every consumer. Any ProtectedRoute wrapper will see
        // `isAuthenticated === false` and render its `<Navigate to="/login" />`.
        //
        // That's the React way: change state, let the UI react. No
        // imperative navigation, no page reload, no lost scroll position.
        setAccessToken(null);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
