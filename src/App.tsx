import { lazy, Suspense, createContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingFallback from "./components/LoadingFallback";

// Lazy load components
const PlayerStatusPage = lazy(() => import("./pages/PlayerStatusPage"));
const QuestLogList = lazy(() => import("./pages/QuestLogList"));
const QuestForm = lazy(() => import("./components/QuestForm"));
const QuestDetails = lazy(() => import("./components/QuestDetails"));
const Layout = lazy(() => import("./layout/Layout"));
const QuestLogLayout = lazy(() => import("./layout/QuestLogLayout"));

const quests = [
  {
    questId: 1,
    questTitle: "Esercizi in palestra",
    questDescription: "Solleva dei pesi per migliorare la massa muscolare",
    involvedAttributes: ["Forza", "Intelligenza"],
    estimatedDuration: 30,
    startDate: "16/12/2025",
    startTime: "18:30",
    dueDate: "18/12/2025",
    dueTime: "15:00",
  },
  {
    questId: 2,
    questTitle: "Raccogli la legna",
    questDescription: "Raccogli 10 pezzi di legna nella foresta.",
  },
  {
    questId: 3,
    questTitle: "Colloquio di lavoro",
  },
];

export const QuestsContext = createContext(quests);

function App() {
  return (
    <>
      <QuestsContext.Provider value={quests}>
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
          </Routes>
        </BrowserRouter>
      </QuestsContext.Provider>
    </>
  );
}

export default App;
