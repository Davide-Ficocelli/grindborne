import { lazy, Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import ConfirmModal from "../components/ConfirmModal";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import { pushLog } from "../lib/logMessagesStore";
import type { QuestInDb } from "../types/quest";

const Quest = lazy(() => import("../components/Quest"));
const QuestDetails = lazy(() => import("../components/QuestDetails"));

type Pending = {
  kind: "delete" | "complete" | "fail" | "track"; // <-- NEW: track
  quest: QuestInDb;
} | null;

export default function QuestLogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // FIX Q10: Listen to search params for filtering
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
  const [pending, setPending] = useState<Pending>(null);

  const trackMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}/track`),
    {
      pendingMessage: t("questLog.mutations.tracking"),
      successMessage: t("questLog.mutations.tracked"),
      onSuccess: () => {
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
      },
    },
  );

  const deleteMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}`),
    {
      pendingMessage: t("questLog.mutations.deleting"),
      successMessage: t("questLog.mutations.deleted"),
      onSuccess: () => {
        // FIX Q11: if the deleted quest was selected, clear it
        if (pending?.quest.id === selectedId) {
          setSelectedId(undefined);
        }
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
      },
    },
  );

  const completeMutation = useMutation<{ quest: QuestInDb; userData: unknown }>(
    () => api.patch(`/quests/${pending?.quest.id}/complete`),
    {
      pendingMessage: t("questLog.mutations.completing"),
      successMessage: t("questLog.mutations.completed"),
      onSuccess: (data) => {
        const completed = (data as any)?.quest as QuestInDb;
        clearSelectionIfSelected(pending?.quest.id);
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
        // Global reward message (top-center, survives navigation). Only
        // rewardable quests return total_xp, so non-rewardable ones show none.
        if (completed?.total_xp) {
          pushLog(
            "reward",
            t("questLog.mutations.xpGained", { xp: completed.total_xp }),
          );
        }
      },
    },
  );

  const failMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}/fail`),
    {
      pendingMessage: t("questLog.mutations.failing"),
      successMessage: t("questLog.mutations.failed"),
      onSuccess: () => {
        clearSelectionIfSelected(pending?.quest.id);
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
      },
    },
  );

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
      <div className="text-center py-8 text-orange-200">
        {t("questLog.noQuests")}
      </div>
    );
  }

  const effectiveSelectedId = selectedId ?? filteredQuests[0]?.id;

  const modalCopy: Record<
    NonNullable<Pending>["kind"],
    { title: string; description: string; confirm: string }
  > = {
    track: {
      title: t("questLog.modals.trackTitle"),
      description: t("questLog.modals.trackDescription"),
      confirm: t("questLog.actions.track"),
    },
    delete: {
      title: t("questLog.modals.deleteTitle"),
      description: t("questLog.modals.deleteDescription"),
      confirm: t("common.delete"),
    },
    complete: {
      title: t("questLog.modals.completeTitle"),
      description: t("questLog.modals.completeDescription"),
      confirm: t("questLog.actions.complete"),
    },
    fail: {
      title: t("questLog.modals.failTitle"),
      description: t("questLog.modals.failDescription"),
      confirm: t("questLog.actions.fail"),
    },
  };

  const activeMutation =
    pending?.kind === "delete"
      ? deleteMutation
      : pending?.kind === "complete"
        ? completeMutation
        : pending?.kind === "fail"
          ? failMutation
          : pending?.kind === "track"
            ? trackMutation
            : null;

  // Show the full-page loader only on the FIRST load. On later refetches
  // (e.g. after completing a quest) the data is already on screen, and
  // replacing the whole list with the loader collapses the page height and
  // throws the scroll position back to the top.
  if (loading && !quests) return <LoadingFallback />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <section aria-label="quest-log-list" className="lg:grid lg:grid-cols-2">
        <section
          aria-label="quest-details"
          className="hidden lg:block lg:col-start-1"
        >
          <Suspense fallback={<LoadingFallback />}>
            <QuestDetails
              key={`${effectiveSelectedId}-${version}`}
              variant="side-view"
              questId={effectiveSelectedId}
              onRequestTrack={(q) => setPending({ kind: "track", quest: q })}
              onRequestComplete={(q) =>
                setPending({ kind: "complete", quest: q })
              }
              onRequestFail={(q) => setPending({ kind: "fail", quest: q })}
              onRequestDelete={(q) => setPending({ kind: "delete", quest: q })}
            />
          </Suspense>
        </section>
        <section aria-label="quests-list">
          {filteredQuests.map((q, index) => {
            const isLast = index === filteredQuests.length - 1;
            return (
              <Quest
                key={q.id}
                quest={q}
                styles={isLast ? "border-none" : undefined}
                onSelect={handleSelect}
                onRequestTrack={(x) => setPending({ kind: "track", quest: x })}
                onRequestComplete={(x) =>
                  setPending({ kind: "complete", quest: x })
                }
                onRequestFail={(x) => setPending({ kind: "fail", quest: x })}
                onRequestDelete={(x) =>
                  setPending({ kind: "delete", quest: x })
                }
              />
            );
          })}
        </section>
      </section>

      <ConfirmModal
        open={pending !== null}
        title={pending ? modalCopy[pending.kind].title : ""}
        description={pending ? modalCopy[pending.kind].description : ""}
        confirmLabel={pending ? modalCopy[pending.kind].confirm : ""}
        cancelLabel={t("common.cancel")}
        loading={activeMutation?.loading ?? false}
        onConfirm={() => {
          if (!pending) return;
          if (pending.kind === "delete") deleteMutation.mutate();
          else if (pending.kind === "complete") completeMutation.mutate();
          else if (pending.kind === "fail") failMutation.mutate();
          else if (pending.kind === "track") trackMutation.mutate();
        }}
        onCancel={() => setPending(null)}
      />
    </Suspense>
  );
}
