import type { QuestInDb } from "../types/quest";

// Business rules about WHICH actions a quest offers. They live here (and not
// inside the components) so the quest card and the quest page can never
// disagree about them.
export function getQuestAvailableActions(quest: QuestInDb) {
  const isStillOpen = !quest.is_completed && !quest.is_failed;

  return {
    canTrack: !quest.is_tracked && isStillOpen,
    canComplete: quest.is_tracked && isStillOpen,
    canFail: quest.is_tracked && isStillOpen,
    // Same rule as before: a failed quest can still be edited.
    canEdit: !quest.is_tracked && !quest.is_completed,
  };
}
