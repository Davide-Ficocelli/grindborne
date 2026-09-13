// ---------------------------------------------------------------------------
// AuthContext.tsx
//
// PURPOSE
//   Holds the JWT access token in React state (which lives only in the running
//   page's memory) and exposes it—along with a setter and a convenience
//   boolean—to any component in the tree.
//
// WHY CONTEXT
//   React passes data to children through props. If a deeply nested component
//   needs the token, prop-drilling it down through every intermediate
//   component is painful. Context lets us "provide" a value at a high level
//   and "consume" it anywhere below, without touching the intermediate layers.
//
// WHY REACT STATE == "IN MEMORY"
//   useState stores its value in the JavaScript heap of the running page.
//   It is NOT written to localStorage, sessionStorage, cookies, or IndexedDB.
//   Refreshing or closing the tab wipes it. That's the property we want for
//   the access token: XSS payloads cannot read it out of a storage API
//   because there is no storage API involved.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, type ReactNode } from "react";

// The TypeScript "shape" of the value we'll share through the Context.
// Every consumer gets autocomplete + type checking against these three fields.
interface AuthContextType {
  // The JWT string, or null when logged out.
  // We use `string | null` rather than `string | undefined` because `null`
  // is an explicit "there is no token" value, whereas `undefined` typically
  // means "this field was never set." Being explicit about "logged out"
  // avoids a whole class of bugs where you can't tell the two apart.
  accessToken: string | null;

  // The setter. Mirrors React's useState setter signature: takes a new value
  // (string or null) and returns nothing. Calling it updates React state AND
  // triggers a re-render of this component and every consumer below.
  setAccessToken: (token: string | null) => void;

  // A derived convenience boolean so consumers can write `if (isAuthenticated)`
  // instead of `if (accessToken !== null && accessToken !== '')`.
  isAuthenticated: boolean;
}

// createContext returns a Context object. The generic <AuthContextType | undefined>
// says: "the value stored here is either an AuthContextType or undefined."
//
// WHY ALLOW undefined?
//   We pass `undefined` as the default value—the value React returns if a
//   component calls useContext(AuthContext) OUTSIDE of any provider.
//
//   That's not a real situation we want to happen; it means a component tried
//   to read auth data without the app being wrapped in <AuthProvider>. If we
//   used a fake default object instead, that mistake would go unnoticed and
//   cause silently broken behavior. By making `undefined` the default and
//   typing it in, we can force a loud runtime check in `useAuth` below.
//   This is a common React pattern: the `undefined` default is a tripwire.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The Provider component. It wraps the rest of the app and injects the
// Context value into the tree.
//
// `{ children }` is destructuring: React passes a single `props` object to
// every component, and `children` is a special property holding whatever JSX
// you nest inside <AuthProvider>...</AuthProvider>. That nested JSX arrives
// here as `children`, and we render it inside the Context.Provider below.
export function AuthProvider({ children }: { children: ReactNode }) {
  // useState returns [currentValue, setterFunction].
  //   - `accessToken` starts as null (logged out).
  //   - `setAccessToken` updates the value AND re-renders this component.
  //
  // TWO THINGS TO INTERNALIZE:
  //   1. The initial value (null) is used ONLY on the first render.
  //      On subsequent renders, `accessToken` holds whatever you last set.
  //   2. Calling setAccessToken('newtoken') re-renders this component and
  //      every consumer. That's the entire point: log in → token set →
  //      navbar updates; log out → token nulled → protected routes redirect.
  //
  // The <string | null> generic guarantees `accessToken` is always a string
  // or null—never undefined or a number. This is what lets you safely write
  // `accessToken.length` in a component AFTER a null check.
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // The object we share with the world. Shorthand syntax:
  //   { accessToken } is equivalent to { accessToken: accessToken }
  //
  // `!!accessToken` coerces any value to a boolean:
  //   !!'some.jwt.string'  → true
  //   !!null               → false
  //   !!''                 → false   (empty string is falsy)
  //
  // So `isAuthenticated` is true exactly when we have a non-empty token.
  //
  // NOTE: this object is recreated on every render of AuthProvider. That
  // means every consumer re-renders whenever AuthProvider re-renders, even
  // if the token didn't change. For a small app this is completely fine. If
  // you ever notice performance issues, wrap this in useMemo. Don't bother
  // now—premature optimization here causes more bugs than it prevents.
  const value = {
    accessToken,
    setAccessToken,
    isAuthenticated: !!accessToken,
  };

  // Render the Context's built-in Provider component, hand it the `value`,
  // and render `children` inside it. Everything inside `children`—which will
  // be your entire app—can now call useContext(AuthContext) or useAuth()
  // and receive this value.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook. Just a function whose name starts with `use`. Wraps useContext
// with two additions:
//
//   1. THE SAFETY CHECK. If `context` is undefined, someone called useAuth()
//      outside of <AuthProvider>. Rather than let the app crash later with a
//      confusing "cannot read property 'accessToken' of undefined" error, we
//      throw a clear message right away. This is the payoff for choosing the
//      `undefined` default earlier—the tripwire fires exactly here.
//
//   2. A CLEAN API. Components write `const { accessToken } = useAuth()`
//      instead of importing AuthContext and calling useContext themselves.
//      If you ever swap Context for Zustand or Redux, only this function
//      changes—not every consumer.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
