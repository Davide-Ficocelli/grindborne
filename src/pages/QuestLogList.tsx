import { lazy, Suspense } from "react";
import LoadingFallback from "../components/LoadingFallback";
import { useApi } from "../hooks/useApi";
import api from "../lib/api";
import type { QuestInDb } from "../types/quest";

export default function QuestLogPage() {
  // Using useApi: Handles loading, error, and data automatically.
  // Decision: We call the real API instead of reading from QuestsContext.
  const {
    data: quests,
    loading,
    error,
  } = useApi<QuestInDb[]>(() => api.get("/quests"), []);

  // Lazy load components
  const Quest = lazy(() => import("../components/Quest"));
  const QuestDetails = lazy(() => import("../components/QuestDetails"));

  if (loading) return <LoadingFallback />;
  if (error)
    return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!quests || quests.length === 0) {
    return (
      <div className="text-center py-8 text-orange-200">
        Nessuna missione trovata. Creane una nuova!
      </div>
    );
  }

  // We map the backend data (QuestInDb) to the format expected by the Quest component.
  // The backend uses 'id', 'name', 'description'; the frontend uses 'questId', 'questTitle', etc.
  const mappedQuests = quests.map((q) => ({
    questId: q.id as any, // Cast necessario perché il tipo UI usa numero, il backend stringa
    questTitle: q.name,
    questDescription: q.description || "",
    estimatedDuration: q.estimated_time || undefined,
    // is_tracked, is_completed, etc. can be mapped if needed by components
  }));

  return (
    <Suspense fallback={<LoadingFallback />}>
      <section aria-label="quest-log-list" className="lg:grid lg:grid-cols-2">
        {/* Quest details (large screens only) */}
        <section
          aria-label="quest-details"
          className={`hidden ${
            mappedQuests.length === 0 ? "lg:hidden" : "lg:block"
          } lg:col-start-1`}
        >
          <Suspense fallback={<LoadingFallback />}>
            {/* Note: QuestDetails will need to be updated to accept the real ID */}
            <QuestDetails variant="side-view" />
          </Suspense>
        </section>
        <section aria-label="quests-list">
          {/* Render quests from array and removes bottom border to the last one */}
          {mappedQuests.map((q, _, qs) => {
            if (qs.indexOf(q) === qs.length - 1)
              return (
                <Quest
                  key={q.questId}
                  questId={q.questId}
                  styles="border-none"
                />
              );
            else return <Quest key={q.questId} questId={q.questId} />;
          })}
        </section>
      </section>
    </Suspense>
  );
}
