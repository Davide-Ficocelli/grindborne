// ---------------------------------------------------------------------------
// api.ts
//
// PURPOSE
//   A configured Axios instance that attaches the JWT access token to every
//   outgoing request, and—on a 401—transparently refreshes the token and
//   retries the original request. The calling component never sees the 401
//   or the refresh; it just gets the response as if nothing happened.
//
// IMPORTANT: THIS FILE IS DELIBERATELY HALF-FINISHED.
//   Some lines are placeholders marked with `// PLACEHOLDER` comments, and
//   some decisions are intentionally wrong so we have something concrete to
//   fix. The genuine, production-quality parts are the base URL, the retry
//   guard, the error.config replay, the "don't use `api` inside its own
//   interceptor" rule, and the header format. Everything else gets corrected
//   in Step 3.
// ---------------------------------------------------------------------------

import axios from "axios";

// PLACEHOLDER IMPORT — THIS IS WRONG ON PURPOSE.
//
// React hooks (including useAuth) can ONLY be called inside a React component
// or another hook. An Axios interceptor is a plain function that runs outside
// React's render cycle entirely. Calling useAuth() inside it would throw
// `Invalid hook call` at runtime.
//
// I left it here as a SIGNPOST: the interceptor will need to update the
// Context's setter somehow, but you can't do that from here directly. Solving
// that "outside React updates React state" problem is the whole point of
// Step 3, where we'll introduce a module-level variable that mirrors the
// Context state.
import { useAuth } from "../context/AuthContext"; // PLACEHOLDER

// ---------------------------------------------------------------------------
// Creating a CUSTOM AXIOS INSTANCE
//
// Two ways to use Axios: the default `axios` object (with axios.get, .post,
// etc.) or a custom instance created with axios.create. We use an instance
// because configuration applied to it applies to EVERY request made through
// it. We import `api` wherever we make HTTP calls and never think about
// interceptors again.
//
// The alternative—using default `axios` and configuring globally via
// axios.defaults—is messy because any third-party library that also uses
// Axios inherits our config. An instance keeps auth concerns scoped to OUR
// calls.
// ---------------------------------------------------------------------------
const api = axios.create({
  // import.meta.env is Vite's mechanism for BUILD-TIME environment variables.
  // Not a runtime thing—Vite literally text-replaces this expression with the
  // string from your .env file when it bundles the code.
  //
  // The VITE_ prefix is mandatory; Vite ignores env vars without it as a
  // safety measure so you don't accidentally leak server-side secrets into
  // the client bundle.
  //
  // WHY AN ENV VAR AT ALL: the backend URL differs between environments
  // (localhost:3000 in dev, a real domain in prod, maybe a staging URL in
  // between). Hardcoding means editing and redeploying the frontend every
  // time the backend moves. One .env file flip and you're done.
  //
  // Create `.env` in your frontend root with: VITE_API_URL=http://localhost:3000
  // and add it to .gitignore if it contains anything sensitive.
  baseURL: import.meta.env.VITE_API_URL,

  // Tells Axios to send cookies along with cross-origin requests.
  //
  // RIGHT NOW YOUR BACKEND DOESN'T USE COOKIES, so this line does nothing.
  // I included it because we're probably going to switch to a cookie-based
  // refresh token later—the correct place to store it (httpOnly cookies are
  // inaccessible to JavaScript, so XSS can't steal them). Forgetting this
  // flag later is a classic multi-hour debugging trap: browsers refuse to
  // send cookies cross-origin unless the client opts in AND the server
  // sends the right CORS headers. Better to have it now and wonder why, than
  // need it later and wonder why it doesn't work.
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
//
// Runs before EVERY request made through `api`. Receives the request's
// `config` object (headers, URL, method, body, etc.) and whatever it RETURNS
// is what actually gets sent.
//
// WHY AN INTERCEPTOR INSTEAD OF PASSING THE TOKEN AT EACH CALL SITE:
//   Forgetting is easy and dangerous. If twenty components call api.get()
//   and each must remember `Authorization: Bearer ...`, you WILL eventually
//   forget. The bug is silent—the request goes out unauthenticated and you
//   get a confusing 401 on a screen where you thought the user was logged
//   in. Interceptors centralize the policy so it can't be forgotten.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  // PLACEHOLDER LINE — WRONG ON PURPOSE. Two separate problems:
  //
  //   1. localStorage reads PERSISTENT storage. That's exactly what we're
  //      trying to avoid—the whole point of the in-memory strategy. Storing
  //      the access token in localStorage puts us back to square one with
  //      XSS vulnerability.
  //
  //   2. The key '__temp_access' doesn't correspond to anything we ever
  //      write, so even if you ran this, `token` would always be null.
  //
  // The correct version will read from a module-level variable that mirrors
  // the Context state, e.g.:
  //     const token = currentAccessToken;
  // where `currentAccessToken` is a `let` exported from a small module.
  // The AuthProvider updates both React state AND this variable whenever
  // the token changes. That bridge is Step 3.
  const token = localStorage.getItem("__temp_access"); // PLACEHOLDER

  // (In the fixed version, this is where you'd do:
  //    if (token) config.headers.Authorization = `Bearer ${token}`;
  // )

  // YOU MUST RETURN THE CONFIG. If you forget—if you leave a bare `{ }`—
  // Axios sends undefined as the config and the request fails cryptically.
  // Interceptors are TRANSFORMER functions, not callbacks. Their return
  // value matters.
  return config;
});

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
//
// Takes two functions: a success handler and an error handler.
//
// THE SUCCESS HANDLER is trivial: identity function that returns the response
// unchanged. Why include it? Because the API requires the first argument if
// you want to provide the second. The method signature is use(onFulfilled,
// onRejected). In a bigger app you might use this slot for logging or
// response transformation. For now, pass-through.
//
// THE ERROR HANDLER is async because we'll `await` a refresh call inside it.
// Async makes the function return a Promise, which Axios expects—an
// interceptor can return a Promise and Axios resolves it before delivering
// the response to the caller.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    // THE ENTIRE REASON WE USE AXIOS FOR THIS PATTERN:
    // When a request fails, Axios attaches the original request's config to
    // the error as `error.config`. That config contains URL, method, body,
    // headers—everything we need to REPLAY the request after refreshing.
    //
    // Without this, on a 401 we'd have no way to know what the user
    // originally tried to do. We could refresh the token, but then what?
    // The failed request is gone and the user would have to manually retry.
    // With error.config, we retry transparently—the user never notices.
    const originalRequest = error.config;

    // Three things happen on this line:
    //
    // 1. `error.response?.status === 401`
    //    We only intervene on 401 Unauthorized. Other errors (500, 403,
    //    404, network failure) should propagate unchanged. Refreshing on a
    //    500 would mask server bugs and hammer the refresh endpoint pointlessly.
    //
    //    The `?.` is OPTIONAL CHAINING. error.response might be undefined
    //    (request never reached the server: CORS failure, network down,
    //    timeout). Without `?.` we'd throw "Cannot read property 'status'
    //    of undefined" and hide the real error. With `?.`, the expression
    //    short-circuits to undefined, which is not === 401, so we skip the
    //    block and let the original error propagate. Correct behavior.
    //
    // 2. `!originalRequest._retry`
    //    A RETRY GUARD. Scenario it prevents: the refresh endpoint itself
    //    returns 401 (expired/revoked refresh token). Without the guard,
    //    the response interceptor fires AGAIN on the failed refresh, tries
    //    to refresh AGAIN, fails AGAIN... infinite loop, tab hangs, frozen
    //    page. By setting originalRequest._retry = true before retrying and
    //    checking it here, any given request is retried AT MOST ONCE.
    //
    //    The leading underscore is a convention meaning "internal field,
    //    don't touch from application code." Axios's config type doesn't
    //    declare `_retry`, so in strict TS you'd need to cast or extend.
    //    For now we treat the config as loose.
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Set the guard BEFORE attempting the refresh, not after. If we set
      // it after and the refresh call re-entered the interceptor (which it
      // can, with parallel requests), we'd still get the loop. Setting it
      // first is the safe order.
      originalRequest._retry = true;

      try {
        // PLACEHOLDER LINE — WRONG ON PURPOSE. Two problems:
        //
        //   1. localStorage is the wrong place for a refresh token. The
        //      refresh token is LONGER-LIVED than the access token—it's
        //      what keeps the user logged in across days. Storing it in
        //      localStorage means an XSS attack steals a token that grants
        //      access for a week, not 15 minutes.
        //
        //      The right home is an httpOnly cookie set by the backend:
        //      the browser sends it automatically, JavaScript can't read
        //      it, and XSS can't exfiltrate it.
        //
        //   2. The key 'refresh_token' is separate from the backend API
        //      shape. Your /auth/refresh endpoint expects the token in the
        //      request BODY as `{ token: ... }`, which we pass below.
        //
        // Like the request interceptor placeholder, this is a signpost:
        // "the storage decision for the refresh token lives here, and it's
        // the next big thing to fix."
        const refreshToken = localStorage.getItem("refresh_token"); // PLACEHOLDER

        // Why axios.post and NOT api.post?
        //
        //   `api` has our interceptors attached. If we used api.post to
        //   refresh, and the refresh itself 401'd, the response interceptor
        //   would fire—and even with the _retry guard, that's a footgun
        //   waiting to happen. Worse, the REQUEST interceptor would try to
        //   attach the (now-expired) access token to the refresh call,
        //   which is pointless noise.
        //
        //   Using the raw `axios` object avoids both problems: the refresh
        //   call is deliberately OUTSIDE the interceptor pipeline. This is
        //   a subtle but important pattern: THE REFRESH ENDPOINT MUST NOT
        //   GO THROUGH THE SAME PIPELINE THAT TRIGGERS REFRESH.
        //
        // Why await?
        //   We need the new token before we can retry. This is a sequential
        //   flow: refresh → get token → retry original. `await` makes that
        //   sequencing explicit. The `async` on the interceptor function
        //   enables this.
        //
        // Why destructure { data }?
        //   Axios wraps the server response as { data, status, statusText,
        //   headers, config }. The actual JSON body from your backend is
        //   under `.data`. Destructuring pulls it out cleanly. Your backend
        //   returns { accessToken: '...' }, so data.accessToken is the new
        //   token.
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { token: refreshToken },
        );

        // THE CRUX OF THE WHOLE PROBLEM — NO OBVIOUS SOLUTION EXISTS.
        //
        // You cannot call setAccessToken from the Context here—we're
        // outside React. You cannot reach into React state from an
        // interceptor. Every app that does token refresh solves this one
        // way or another. The common approaches:
        //
        //   (a) A MODULE-LEVEL VARIABLE that mirrors Context state. The
        //       AuthProvider's setAccessToken wrapper updates both React
        //       state AND this module variable. The interceptor reads it
        //       directly. Simple, but requires discipline: two sources of
        //       truth must stay in sync.
        //
        //   (b) A CALLBACK REGISTRY. The AuthProvider registers a setter
        //       with the API module on mount. The interceptor calls
        //       registeredSetToken(newToken). Decoupled, more code.
        //
        //   (c) AN EVENT EMITTER. The interceptor dispatches a
        //       'token-refreshed' event; the AuthProvider listens and
        //       updates state. Loosely coupled, useful if multiple parts
        //       of the app need to react.
        //
        // Step 3 will walk through option (a) because it's simplest to
        // reason about and most common in real codebases.
        //
        // Update Context / memory with new access token
        // e.g. via a global setter or event

        // Mutate the original request to include the new token. Why mutate
        // instead of cloning? Axios re-uses the config object we pass to
        // api(originalRequest), and it's simpler to modify in place. In a
        // more careful codebase you'd clone first to avoid side effects.
        // For our purposes, mutating is fine—the object was already
        // attached to a failed request that's been discarded.
        //
        // The `Bearer ${...}` format is the standard OAuth 2.0 bearer
        // scheme. Your backend middleware almost certainly parses
        // req.headers.authorization, strips "Bearer ", and verifies the
        // remainder as a JWT. Formatting it differently (just the raw
        // token) causes a common "why is my request 401'ing" bug.
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // THE ACTUAL RETRY. `api` is callable as a function—api(config) is
        // equivalent to axios(config) with the instance's config merged in.
        // We pass the modified original request, now with the new token.
        //
        // The returned Promise resolves to the successful response (if the
        // retry works). Because this whole thing is inside an async
        // function, returning it means the CALLER of the original request
        // receives that resolved response as if the 401 never happened.
        //
        // This is the TRANSPARENCY payoff. From the caller's perspective,
        // they made one call and got one response. The 401, the refresh,
        // the retry—all invisible.
        return api(originalRequest);
      } catch (refreshError) {
        // If anything in the try block fails—the refresh call itself 401'd,
        // network dropped mid-refresh, response body was malformed—we land
        // here. The variable is named `refreshError` rather than `error` to
        // distinguish it from the OUTER `error`, which is the original 401.
        // Mixing them up is an easy mistake.

        // PLACEHOLDER — CRUDE ON PURPOSE.
        //
        // window.location.href triggers a FULL PAGE RELOAD—the browser
        // navigates to /login as if you'd typed it in the address bar.
        //
        // Two consequences:
        //   1. All React state is lost, including the useless access token.
        //      That's actually what we want—the user is logged out.
        //   2. It BYPASSES YOUR REACT ROUTER. If you're using React Router
        //      (and you probably are), you should instead trigger a state
        //      change that causes your route guard to redirect.
        //
        // The "React way": clear the Context state and let a ProtectedRoute
        // wrapper render <Navigate to="/login" />. That requires a
        // reference to the Context's setter FROM INSIDE THIS INTERCEPTOR—
        // which is exactly the problem we deferred. Once Step 3 solves the
        // "outside React updates React state" problem, this becomes:
        //
        //     window.dispatchEvent(new Event('auth:logout'));
        //     // or
        //     logoutCallback?.();
        //
        // ...and the AuthProvider listens and performs a proper React-level
        // logout.
        //
        // Refresh failed → log out
        window.location.href = "/login";

        // Return Promise.reject rather than just `throw`. In an async
        // function these are almost equivalent—`throw` would also reject
        // the Promise. But returning Promise.reject makes the rejection
        // explicit and matches the style used in the outer branch below.
        // Some developers prefer it in interceptor code because it's
        // easier to spot that we're DELIBERATELY propagating failure.
        //
        // Choosing refreshError (not the original error) matters: if the
        // refresh failed, the caller wants to know WHY—was the refresh
        // token expired? Was the refresh endpoint down? Returning the
        // original 401 would obscure that.
        return Promise.reject(refreshError);
      }
    }

    // We reach here if the error is NOT a 401, OR it's a 401 for a request
    // that's already been retried. In either case we don't handle it—we
    // pass it through unchanged so the calling component can deal with it
    // (try/catch around the api.get call, or a global error boundary).
    //
    // The symmetry is intentional: HANDLE WHAT YOU CAN, PROPAGATE EVERYTHING
    // ELSE. An interceptor that swallows errors is a nightmare to debug.
    return Promise.reject(error);
  },
);

// Export the INSTANCE, not the underlying axios. Every part of the app that
// imports this file automatically gets the interceptors and base URL. There
// is no way to accidentally bypass the auth pipeline by importing axios
// directly—UNLESS you deliberately import axios in a file that doesn't
// import api, which is exactly what the refresh call above does on purpose.
//
// If you wanted to enforce this more strictly, you could lint against direct
// axios imports elsewhere. For now, discipline plus comments is enough.
export default api;
