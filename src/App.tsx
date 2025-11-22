import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingFallback from "./components/LoadingFallback";

// Lazy load components
const PlayerStatusPage = lazy(() => import("./pages/PlayerStatusPage"));
const QuestLogList = lazy(() => import("./pages/QuestLogList"));
const AddQuestPage = lazy(() => import("./pages/AddQuestPage"));
const Layout = lazy(() => import("./layout/Layout"));
const QuestLogLayout = lazy(() => import("./layout/QuestLogLayout"));

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
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
              <Route
                path="quest-log/:id"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    {/* <QuestDetails /> */}
                  </Suspense>
                }
              />
            </Route>
            <Route
              path="quest-log/add"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AddQuestPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
