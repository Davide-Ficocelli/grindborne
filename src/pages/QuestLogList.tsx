import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import { useApi } from "../hooks/useApi";
import api from "../lib/api";
import type { QuestInDb } from "../types/quest";

export default function QuestLogPage() {
  const { t } = useTranslation();
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
        {t("questLog.noQuests")}
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <section aria-label="quest-log-list" className="lg:grid lg:grid-cols-2">
        {/* Quest details (large screens only) */}
        <section
          aria-label="quest-details"
          className={`hidden ${
            quests.length === 0 ? "lg:hidden" : "lg:block"
          } lg:col-start-1`}
        >
          <Suspense fallback={<LoadingFallback />}>
            {/* We pass the id of the first quest by default to the side view,
                so it shows something meaningful on desktop. */}
            <QuestDetails variant="side-view" questId={quests[0]?.id} />
          </Suspense>
        </section>
        <section aria-label="quests-list">
          {/* Render real quests from array and remove bottom border to the last one */}
          {quests.map((q, index) => {
            const isLast = index === quests.length - 1;
            return (
              <Quest
                key={q.id}
                quest={q}
                styles={isLast ? "border-none" : undefined}
              />
            );
          })}
        </section>
      </section>
    </Suspense>
  );
}
