import QuestActionsToolbar from "./QuestActionsToolbar";
import type { QuestActionKind } from "../hooks/useQuestActions";
import type { QuestInDb } from "../types/quest";

type QuestProps = {
  quest: QuestInDb;
  // Click on the card (non-action area only). On desktop, it refreshes the
  // side-view; on mobile, it navigates to the full page. The logic resides in the
  // parent (QuestLogPage), which knows the breakpoint.
  onSelect?: (quest: QuestInDb) => void;
  onRequestAction: (kind: QuestActionKind, quest: QuestInDb) => void;
  // (xpGained was removed: the XP message is now a global reward message,
  // see logMessagesStore / LogMessages)
};

// Styles of the card: `.quest-card` in QuestLogPage.css.
export default function Quest(props: QuestProps) {
  const { quest } = props;

  // Shared handler: if the card is selectable, click. The action toolbar
  // stops the propagation (see ActionToolbar), so a click on an icon does not
  // also trigger the select.
  function handleSelect() {
    props.onSelect?.(quest);
  }

  return (
    <article
      onClick={handleSelect}
      className={`quest-card bottom-linear-gradient-border ${props.onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex gap-x-8 items-center px-4">
        <h2 className="order-1 h2-font-size text-center font-semibold">
          {quest.name}
        </h2>
      </div>
      <p className="text-center">{quest.description}</p>

      <QuestActionsToolbar
        quest={quest}
        showDetailsLink
        onRequestAction={props.onRequestAction}
      />
    </article>
  );
}
