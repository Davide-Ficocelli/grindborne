// THE INTERCEPTOR DELEGATES TO refreshAccessToken().
//
// The request interceptor
// attaches the token, the response interceptor handles 401s with a retry
// guard. The refresh logic doesn't live inline. It lives
// in refreshAccessToken.ts so the app-mount effect can share it.
// ---------------------------------------------------------------------------

import axios from "axios";
import { getAccessToken } from "./tokenStore";
import { refreshAccessToken } from "./refreshAccessToken";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR — unchanged from Step 3.
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
// The retry-guard and error.config replay are unchanged. The refresh call
// is now a single line that delegates to refreshAccessToken(). Because that
// function is single-flight, if the app-mount refresh is already running,
// this await resolves with the SAME new token rather than starting a
// parallel refresh.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Single-flight refresh. Returns the new token, or null if it failed.
      const newToken = await refreshAccessToken();

      if (!newToken) {
        // Refresh failed. refreshAccessToken already cleared the store, so
        // any ProtectedRoute will see isAuthenticated === false and
        // redirect on its next render. We just propagate the error so the
        // original caller knows the request failed.
        return Promise.reject(error);
      }

      // Retry the original request with the fresh token.
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
