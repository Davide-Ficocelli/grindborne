import { lazy, Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import QuestActionConfirmModal from "../components/QuestActionConfirmModal";
import { useApi } from "../hooks/useApi";
import {
  useQuestActions,
  type QuestActionKind,
} from "../hooks/useQuestActions";
import api from "../lib/api";
import type { QuestInDb } from "../types/quest";
import "../styles/pages/QuestLogPage.css";

const Quest = lazy(() => import("../components/Quest"));
const QuestPage = lazy(() => import("./QuestPage"));

// A completed or failed quest disappears from the list (see the visibility
// filter below), and so does a deleted one. Tracking keeps it in the list.
const ACTIONS_THAT_HIDE_THE_QUEST: QuestActionKind[] = [
  "complete",
  "fail",
  "delete",
];

export default function QuestLogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // FIX: Listen to search params for filtering
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";

  const {
    data: quests,
    loading,
    error,
    refetch,
  } = useApi<QuestInDb[]>(() => api.get("/quests"), []);

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState(0);

  const questActions = useQuestActions({
    onActionSucceeded: handleActionSucceeded,
  });

  function handleActionSucceeded(kind: QuestActionKind, quest: QuestInDb) {
    // FIX: if the deleted quest was selected, clear it
    if (ACTIONS_THAT_HIDE_THE_QUEST.includes(kind)) {
      clearSelectionIfSelected(quest.id);
    }
    refetch();
    // Changing `version` remounts the side view, which reloads its quest.
    setVersion((v) => v + 1);
  }

  // If on desktop, it shows the selected quest's details in the side view
  function handleSelect(quest: QuestInDb) {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      setSelectedId(quest.id);
    } else {
      navigate(`/quest-log/action/view/${quest.id}`);
    }
  }

  // A completed or failed quest disappears from the list (see the visibility
  // filter below). If it was the one shown in the side view, the side view
  // must stop pointing at it, otherwise it would keep showing a quest that is
  // no longer in the list. Clearing the selection makes the side view fall
  // back to the first visible quest (see effectiveSelectedId).
  function clearSelectionIfSelected(questId: string | undefined) {
    if (questId !== undefined && questId === selectedId) {
      setSelectedId(undefined);
    }
  }

  // Show the full-page loader only on the FIRST load. On later refetches
  // (e.g. after completing a quest) the data is already on screen, and
  // replacing the whole list with the loader collapses the page height and
  // throws the scroll position back to the top.
  if (loading && !quests) return <LoadingFallback />;
  if (error)
    return (
      <div className="quest-log-page__message quest-log-page__message--error">
        {error}
      </div>
    );
  if (!quests || quests.length === 0) {
    return (
      <div className="quest-log-page__message">{t("questLog.noQuests")}</div>
    );
  }

  const filteredQuests = quests.filter((q) => {
    // Completed and failed quests are not shown in the quest log: they would
    // pile up and push the quests still to do out of view. They are kept in
    // the database (to be used later for statistics or a dedicated view); this
    // is only a frontend filter for now.
    if (q.is_completed || q.is_failed) return false;

    if (!query) return true;
    const matchName = q.name.toLowerCase().includes(query);
    const matchDesc = q.description?.toLowerCase().includes(query) || false;
    return matchName || matchDesc;
  });

  if (filteredQuests.length === 0) {
    return (
      <div className="quest-log-page__message">{t("questLog.noQuests")}</div>
    );
  }

  const effectiveSelectedId = selectedId ?? filteredQuests[0]?.id;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <section aria-label="quest-log-list" className="quest-log-page">
        <section
          aria-label="quest-details"
          className="quest-log-page__side-view"
        >
          <QuestPage
            key={`${effectiveSelectedId}-${version}`}
            variant="view-side-view"
            questId={effectiveSelectedId}
            onRequestAction={questActions.requestAction}
          />
        </section>
        <section aria-label="quests-list">
          {filteredQuests.map((q) => (
            <Quest
              key={q.id}
              quest={q}
              onSelect={handleSelect}
              onRequestAction={questActions.requestAction}
            />
          ))}
        </section>
      </section>

      <QuestActionConfirmModal
        pending={questActions.pending}
        loading={questActions.isLoading}
        onConfirm={questActions.confirmAction}
        onCancel={questActions.cancelAction}
      />
    </Suspense>
  );
}
