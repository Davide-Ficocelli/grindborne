import { useContext } from "react";
import { QuestsContext } from "../App";

type Quest = {
  questId: number;
  questTitle: string;
  questDescription?: string;
  involvedAttributes?: string[];
  estimatedDuration?: number;
  startDate?: string;
  startTime?: string;
  dueDate?: string;
  dueTime?: string;
};

/**
 * Hook personalizzato per ottenere una missione dal context
 * @param questId - L'ID della missione da cercare
 * @returns La missione trovata o undefined
 */
export function useQuest(questId: number): Quest | undefined {
  const quests = useContext(QuestsContext);
  return quests.find((quest) => quest.questId === questId);
}
