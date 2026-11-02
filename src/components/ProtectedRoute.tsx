import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingFallback from "./LoadingFallback";

// Wraps protected routes. If the user is not authenticated, it redirects
// to /login. If auth state is still initializing, it shows a loader instead
// of flashing the login page (though App.tsx also gates on isInitialized).
export default function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuth();

  // Wait for the initial "am I logged in?" check to finish.
  // Without this, on a page reload the user would see a flash of
  // the login page while the mount refresh is in progress.
  if (!isInitialized) return <LoadingFallback />;

  if (!isAuthenticated) {
    // `replace` prevents the protected URL from staying in the browser
    // history. Otherwise, after a successful login, the user could press
    // "Back" and end up on the login page again, which is confusing.
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child route (which will be Layout).
  return <Outlet />;
}
