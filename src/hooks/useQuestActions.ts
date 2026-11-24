import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "./useMutation";
import api from "../lib/api";
import { pushLog } from "../lib/logMessagesStore";
import type { QuestInDb } from "../types/quest";

// To add a new action: add it here, add its mutation below, add its entry in
// `mutationByKind` and its text in QuestActionConfirmModal.
export type QuestActionKind = "track" | "complete" | "fail" | "delete";

// The action waiting for the user's confirmation (null = no modal).
export type PendingQuestAction = {
  kind: QuestActionKind;
  quest: QuestInDb;
} | null;

type UseQuestActionsOptions = {
  // What the PAGE does after an action succeeded (refetch, navigate, clear
  // the selection...). The hook cannot know it: it differs per page.
  onActionSucceeded: (kind: QuestActionKind, quest: QuestInDb) => void;
};

export function useQuestActions(options: UseQuestActionsOptions) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingQuestAction>(null);

  // Shared by all the mutations: close the modal, then let the page react.
  function handleActionSucceeded(kind: QuestActionKind) {
    if (!pending) return;
    const { quest } = pending;
    setPending(null);
    options.onActionSucceeded(kind, quest);
  }

  // The fetchers read `pending` when they run, i.e. after the user confirmed.
  const trackMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}/track`),
    {
      pendingMessage: t("questLog.mutations.tracking"),
      successMessage: t("questLog.mutations.tracked"),
      onSuccess: () => handleActionSucceeded("track"),
    },
  );

  const deleteMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}`),
    {
      pendingMessage: t("questLog.mutations.deleting"),
      successMessage: t("questLog.mutations.deleted"),
      onSuccess: () => handleActionSucceeded("delete"),
    },
  );

  const completeMutation = useMutation<{ quest: QuestInDb; userData: unknown }>(
    () => api.patch(`/quests/${pending?.quest.id}/complete`),
    {
      pendingMessage: t("questLog.mutations.completing"),
      successMessage: t("questLog.mutations.completed"),
      onSuccess: (data) => {
        // The payload for the 'complete' event is { quest, userData }.
        // Global reward message (top-center, survives navigation). Only
        // rewardable quests return total_xp, so non-rewardable ones show none
        // (their payload is the bare quest, so `data.quest` is undefined).
        // NOTE: the XP earned used to be a temporary inline badge (xpGained
        // state + setTimeout); it is now a global reward message pushed
        // through pushLog("reward", ...), shown at the top of the screen
        // whatever page the user is on.
        const xpGained = data?.quest?.total_xp;
        if (xpGained) {
          pushLog("reward", t("questLog.mutations.xpGained", { xp: xpGained }));
        }
        handleActionSucceeded("complete");
      },
    },
  );

  const failMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${pending?.quest.id}/fail`),
    {
      pendingMessage: t("questLog.mutations.failing"),
      successMessage: t("questLog.mutations.failed"),
      onSuccess: () => handleActionSucceeded("fail"),
    },
  );

  // A record (instead of nested ternaries) to find the mutation of an action.
  const mutationByKind: Record<
    QuestActionKind,
    { mutate: () => Promise<unknown>; loading: boolean }
  > = {
    track: trackMutation,
    complete: completeMutation,
    fail: failMutation,
    delete: deleteMutation,
  };

  function requestAction(kind: QuestActionKind, quest: QuestInDb) {
    setPending({ kind, quest });
  }

  function cancelAction() {
    setPending(null);
  }

  function confirmAction() {
    if (!pending) return;
    mutationByKind[pending.kind].mutate();
  }

  // Loading state of the mutation of the action waiting for confirmation.
  const isLoading = pending ? mutationByKind[pending.kind].loading : false;

  return { pending, requestAction, cancelAction, confirmAction, isLoading };
}
