import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingFallback from "./components/LoadingFallback";

// Lazy load components
const PlayerStatusPage = lazy(() => import("./pages/PlayerStatusPage"));
const QuestLogList = lazy(() => import("./pages/QuestLogList"));
const AddQuestPage = lazy(() => import("./pages/AddQuestPage"));
const QuestDetails = lazy(() => import("./components/QuestDetails"));
const Layout = lazy(() => import("./layout/Layout"));
const QuestLogLayout = lazy(() => import("./layout/QuestLogLayout"));

function App() {
  return (
    <>
      <BrowserRouter>
        {/* All routes included in the Routes component */}
        <Routes>
          {/* Base route */}
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
                path="add-quest"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AddQuestPage />
                  </Suspense>
                }
              />
              <Route
                path="view/:id"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <QuestDetails variant="full-page" />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
