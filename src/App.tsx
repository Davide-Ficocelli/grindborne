import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingFallback from "./components/LoadingFallback";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LogMessages from "./components/LogMessages";

// Lazy load components
const PlayerStatusPage = lazy(() => import("./pages/PlayerStatusPage"));
const QuestLogList = lazy(() => import("./pages/QuestLogList"));
const QuestForm = lazy(() => import("./components/QuestForm"));
const QuestDetails = lazy(() => import("./components/QuestDetails"));
const Layout = lazy(() => import("./layout/Layout"));
const QuestLogLayout = lazy(() => import("./layout/QuestLogLayout"));
const AddAttributePage = lazy(() => import("./pages/AddAttributePage"));
const EditAttributePage = lazy(() => import("./pages/EditAttributePage"));
const AttributeDetailsPage = lazy(() => import("./pages/AttributeDetailsPage"));

function App() {
  const { isInitialized, isAuthenticated } = useAuth();

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
        {/* All routes included in the Routes component */}
        <Routes>
          {/* Public route: login page has its own full-screen layout */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
              </Suspense>
            }
          />

          {/* Protected routes: wrapped in ProtectedRoute.
              If not authenticated, they redirect to /login.
              If authenticated, they render <Layout> which contains <Outlet />. */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Layout />
                </Suspense>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PlayerStatusPage />
                  </Suspense>
                }
              />
              {/* Route for attributes pages */}
              <Route path="attributes">
                <Route
                  path="add"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AddAttributePage />
                    </Suspense>
                  }
                />
                <Route
                  path="edit/:id"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <EditAttributePage />
                    </Suspense>
                  }
                />
                <Route
                  path="view/:id"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AttributeDetailsPage />
                    </Suspense>
                  }
                />
              </Route>
              {/* Route for quest log pages */}
              <Route
                path="quest-log"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <QuestLogLayout />
                  </Suspense>
                }
              >
                <Route
                  path="list"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <QuestLogList />
                    </Suspense>
                  }
                />
              </Route>
              {/* Route for quest log actions pages */}
              <Route path="quest-log/action">
                <Route
                  path="view/:id"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <QuestDetails variant="full-page" />
                    </Suspense>
                  }
                />
                <Route
                  path="add"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <QuestForm variant="add-quest" />
                    </Suspense>
                  }
                />
                <Route
                  path="edit/:id"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <QuestForm variant="edit-quest" />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
