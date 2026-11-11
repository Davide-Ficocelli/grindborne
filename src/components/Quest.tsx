import { useTranslation } from "react-i18next";
import {
  faInfo,
  faPencil,
  faTrash,
  faCheck,
  faX,
  faPlay, // Imported for Track
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestInDb } from "../types/quest";

type QuestProps = {
  quest: QuestInDb;
  styles?: string;
  // Click on the card (non-action area only). On desktop, it refreshes the
  // side-view; on mobile, it navigates to the full page. The logic resides in the
  // parent (QuestLogList), which knows the breakpoint.
  onSelect?: (quest: QuestInDb) => void;
  onRequestComplete?: (quest: QuestInDb) => void;
  onRequestFail?: (quest: QuestInDb) => void;
  onRequestDelete?: (quest: QuestInDb) => void;
  onRequestTrack?: (quest: QuestInDb) => void;
  xpGained?: number | null;
};

export default function Quest(props: QuestProps) {
  const { t } = useTranslation();
  const { quest, styles } = props;

  const classStyles = {
    actionIcon: "text-white cursor-pointer sm:text-2xl",
    actionBtn:
      "text-white flex flex-col justify-center items-center gap-y-2 hover:opacity-80 focus:opacity-80 active:opacity-80 cursor-pointer",
  };

  // Shared handler: if the card is selectable, click; stopPropagation
  // For actions, prevent a click on an icon from also triggering the select.
  function handleSelect() {
    props.onSelect?.(quest);
  }

  // FIX: conditional action buttons
  const canTrack = !quest.is_tracked && !quest.is_completed && !quest.is_failed;
  const canComplete =
    quest.is_tracked && !quest.is_completed && !quest.is_failed;
  const canFail = quest.is_tracked && !quest.is_completed && !quest.is_failed;
  const canEdit = !quest.is_tracked && !quest.is_completed;

  return (
    <article
      onClick={handleSelect}
      className={`flex flex-col gap-y-4 items-center p-4 bottom-linear-gradient-border after:from-white after:to-[#111] w-full ${styles ?? ""} ${props.onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex gap-x-8 items-center px-4">
        <h2 className="order-1 h2-font-size text-center font-semibold">
          {quest.name}
        </h2>
      </div>
      <p className="text-md text-center">{quest.description}</p>

      {props.xpGained != null && (
        <span className="text-green-300 font-semibold">
          +{props.xpGained} XP
        </span>
      )}

      <nav
        aria-label="Actions"
        role="toolbar"
        className="flex items-baseline gap-x-2 justify-center"
        // stopPropagation here: clicking on any icon must not
        // also select the card.
        onClick={(e) => e.stopPropagation()}
      >
        {canTrack && (
          <button
            className={classStyles.actionBtn}
            onClick={() => props.onRequestTrack?.(quest)}
          >
            <span className="order-1 text-center small-font-size">
              {t("questLog.actions.track")}
            </span>
            <FontAwesomeIcon className={classStyles.actionIcon} icon={faPlay} />
          </button>
        )}

        {canFail && (
          <button
            className={classStyles.actionBtn}
            onClick={() => props.onRequestFail?.(quest)}
          >
            <span className="order-1 text-center small-font-size">
              {t("questLog.actions.fail")}
            </span>
            <FontAwesomeIcon className={classStyles.actionIcon} icon={faX} />
          </button>
        )}

        {canComplete && (
          <button
            className={classStyles.actionBtn}
            onClick={() => props.onRequestComplete?.(quest)}
          >
            <span className="order-1 text-center small-font-size">
              {t("questLog.actions.complete")}
            </span>
            <FontAwesomeIcon
              className={classStyles.actionIcon}
              icon={faCheck}
            />
          </button>
        )}

        <button
          className={classStyles.actionBtn}
          onClick={() => props.onRequestDelete?.(quest)}
        >
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.delete")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faTrash} />
        </button>

        {canEdit && (
          <Link
            to={`/quest-log/action/edit/${quest.id}`}
            className={classStyles.actionBtn}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="order-1 text-center small-font-size">
              {t("questLog.actions.edit")}
            </span>
            <FontAwesomeIcon
              className={classStyles.actionIcon}
              icon={faPencil}
            />
          </Link>
        )}

        <Link
          className={classStyles.actionBtn}
          to={`/quest-log/action/view/${quest.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.details")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faInfo} />
        </Link>
      </nav>
    </article>
  );
}
