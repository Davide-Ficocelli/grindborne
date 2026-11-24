import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingFallback from "./components/LoadingFallback";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LogMessages from "./components/LogMessages";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load components
const PlayerStatusPage = lazy(() => import("./pages/PlayerStatusPage"));
const QuestLogPage = lazy(() => import("./pages/QuestLogPage"));
const QuestPage = lazy(() => import("./pages/QuestPage"));
const AttributePage = lazy(() => import("./pages/AttributePage"));
const Layout = lazy(() => import("./layout/Layout"));
const QuestLogLayout = lazy(() => import("./layout/QuestLogLayout"));

function App() {
  const { isInitialized } = useAuth();

  // Don't render routes until we know the auth state.
  // isInitialized flips to true only after the mount refresh resolves
  // (success OR failure). Without this gate, isAuthenticated is false
  // for a moment on every reload, and any consumer that redirects on
  // !isAuthenticated would flash the login page during the refresh.
  if (!isInitialized) return <LoadingFallback />;

  // Decision point: what to show when the user is not authenticated.
  // Option A (simplest, current stage): just render the routes anyway
  // and let individual pages handle "not logged in" — useful while
  // you are still building and want to navigate freely.
  // Option B (proper): wrap protected routes in a ProtectedRoute that
  // redirects to /login when !isAuthenticated. Recommended once you
  // have a login page.
  return (
    <>
      <LogMessages />
      <BrowserRouter>
        {/* Scrolls to the top on every navigation (see ScrollToTop). It must
            be inside the router because it reads the current location. */}
        <ScrollToTop />
        {/* One Suspense for the lazy layouts. The lazy PAGES are covered by
            the Suspense around the <Outlet /> of each layout, so the header
            stays on screen while a page chunk is loading. */}
        <Suspense fallback={<LoadingFallback />}>
          {/* All routes included in the Routes component */}
          <Routes>
            {/* Public route: login page has its own full-screen layout */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes: wrapped in ProtectedRoute.
                If not authenticated, they redirect to /login.
                If authenticated, they render <Layout> which contains <Outlet />. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<PlayerStatusPage />} />
                {/* Route for attributes pages: one page, three variants */}
                <Route path="attributes">
                  <Route path="add" element={<AttributePage variant="add" />} />
                  <Route
                    path="edit/:id"
                    element={<AttributePage variant="edit" />}
                  />
                  <Route
                    path="view/:id"
                    element={<AttributePage variant="view" />}
                  />
                </Route>
                {/* Route for quest log pages */}
                <Route path="quest-log" element={<QuestLogLayout />}>
                  <Route path="list" element={<QuestLogPage />} />
                </Route>
                {/* Route for quest log actions pages: one page, three variants */}
                <Route path="quest-log/action">
                  <Route
                    path="view/:id"
                    element={<QuestPage variant="view-full-page" />}
                  />
                  <Route path="add" element={<QuestPage variant="add" />} />
                  <Route
                    path="edit/:id"
                    element={<QuestPage variant="edit" />}
                  />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
