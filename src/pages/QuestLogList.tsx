import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import ConfirmModal from "../components/ConfirmModal";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import type { QuestInDb } from "../types/quest";

const Quest = lazy(() => import("../components/Quest"));
const QuestDetails = lazy(() => import("../components/QuestDetails"));

// Union type for the modal’s pending state.
type Pending = {
  kind: "delete" | "complete" | "fail";
  quest: QuestInDb;
} | null;

export default function QuestLogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: quests,
    loading,
    error,
    refetch,
  } = useApi<QuestInDb[]>(() => api.get("/quests"), []);

  // ID of the quest selected for the side-view. Initialised to the first
  // quest when the data arrives. Note: as the side-view is only visible on a
  // desktop (CSS), if the user is on a mobile device this state has no visual effect,
  // and clicking on the card navigates to the full-page view (see handleSelect).
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  // Version: increments after each mutation to force the side-view to be refetched.
  // See the note ‘How do I propagate the update?’.
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  // Temporary XP for the badge. Displayed for 3 seconds, then cleared.
  const [xpGained, setXpGained] = useState<{
    questId: string;
    xp: number;
  } | null>(null);

  // Mutations: the 3 ‘status’ actions of a quest.
  // Each useMutation has its own loading state, so the modal displays the correct status
  // depending on the action currently being performed.
  const deleteMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}`),
    {
      pendingMessage: t("questLog.mutations.deleting"),
      successMessage: t("questLog.mutations.deleted"),
      onSuccess: () => {
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
      },
    },
  );

  const completeMutation = useMutation<{ quest: QuestInDb; userData: unknown }>(
    () => api.patch(`/quests/${pending?.quest.id}/complete`),
    {
      // We won’t include the final success message here: we want to
      // display the total XP inline. We’ll let the generic toast message
      // display the backend message, and add the badge separately.
      pendingMessage: t("questLog.mutations.completing"),
      successMessage: t("questLog.mutations.completed"),
      onSuccess: (data) => {
        const completed = (data as any)?.quest as QuestInDb;
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
        if (completed?.total_xp) {
          setXpGained({ questId: completed.id, xp: completed.total_xp });
          // 3 seconds: ‘a few moments’, as requested in Q17.
          setTimeout(() => setXpGained(null), 3000);
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
        setPending(null);
        refetch();
        setVersion((v) => v + 1);
      },
    },
  );

  // Handles clicks on the card. On desktop (>=1024px, Tailwind’s lg breakpoint)
  // updates the side-view. On mobile, navigates to the full page
  // (the side-view is hidden). Note: I use window.matchMedia so as not to
  // rely on an external library. The trade-off is a check on click.
  function handleSelect(quest: QuestInDb) {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      setSelectedId(quest.id);
    } else {
      navigate(`/quest-log/action/view/${quest.id}`);
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

  // Fallback: if selectedId is undefined, I use the first query. This way, the
  // side-view displays something meaningful on the first desktop render.
  const effectiveSelectedId = selectedId ?? quests[0]?.id;

  // Modal labels by action type.
  const modalCopy: Record<
    NonNullable<Pending>["kind"],
    { title: string; description: string; confirm: string }
  > = {
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
          : null;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <section aria-label="quest-log-list" className="lg:grid lg:grid-cols-2">
        <section
          aria-label="quest-details"
          className="hidden lg:block lg:col-start-1"
        >
          <Suspense fallback={<LoadingFallback />}>
            {/* key = `${id}-${version}`: remount when the selection changes
                or when a mutation has modified the data. The remount
                forces a refetch of useApi within QuestDetails. */}
            <QuestDetails
              key={`${effectiveSelectedId}-${version}`}
              variant="side-view"
              questId={effectiveSelectedId}
              onRequestComplete={(q) =>
                setPending({ kind: "complete", quest: q })
              }
              onRequestFail={(q) => setPending({ kind: "fail", quest: q })}
              onRequestDelete={(q) => setPending({ kind: "delete", quest: q })}
            />
          </Suspense>
        </section>
        <section aria-label="quests-list">
          {quests.map((q, index) => {
            const isLast = index === quests.length - 1;
            return (
              <Quest
                key={q.id}
                quest={q}
                styles={isLast ? "border-none" : undefined}
                onSelect={handleSelect}
                onRequestComplete={(x) =>
                  setPending({ kind: "complete", quest: x })
                }
                onRequestFail={(x) => setPending({ kind: "fail", quest: x })}
                onRequestDelete={(x) =>
                  setPending({ kind: "delete", quest: x })
                }
                xpGained={xpGained?.questId === q.id ? xpGained.xp : null}
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
          else failMutation.mutate();
        }}
        onCancel={() => setPending(null)}
      />
    </Suspense>
  );
}
