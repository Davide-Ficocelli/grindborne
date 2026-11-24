import { useTranslation } from "react-i18next";
import {
  faCheck,
  faInfo,
  faPencil,
  faPlay,
  faTrash,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import ActionButton from "./ActionButton";
import ActionLink from "./ActionLink";
import ActionToolbar from "./ActionToolbar";
import { getQuestAvailableActions } from "../lib/questActionHelpers";
import type { QuestActionKind } from "../hooks/useQuestActions";
import type { QuestInDb } from "../types/quest";

type QuestActionsToolbarProps = {
  quest: QuestInDb;
  // The quest card links to the details page; the details page itself does not.
  showDetailsLink: boolean;
  onRequestAction: (kind: QuestActionKind, quest: QuestInDb) => void;
  className?: string;
};

export default function QuestActionsToolbar(props: QuestActionsToolbarProps) {
  const { t } = useTranslation();
  const { quest } = props;
  const { canTrack, canComplete, canFail, canEdit } =
    getQuestAvailableActions(quest);

  return (
    <ActionToolbar
      label={t("questLog.details.actionsLabel")}
      className={`flex items-baseline gap-x-2 justify-center ${props.className ?? ""}`}
    >
      {canTrack && (
        <ActionButton
          label={t("questLog.actions.track")}
          icon={faPlay}
          onClick={() => props.onRequestAction("track", quest)}
        />
      )}
      {canFail && (
        <ActionButton
          label={t("questLog.actions.fail")}
          icon={faX}
          onClick={() => props.onRequestAction("fail", quest)}
        />
      )}
      {canComplete && (
        <ActionButton
          label={t("questLog.actions.complete")}
          icon={faCheck}
          onClick={() => props.onRequestAction("complete", quest)}
        />
      )}
      <ActionButton
        label={t("questLog.actions.delete")}
        icon={faTrash}
        onClick={() => props.onRequestAction("delete", quest)}
      />
      {canEdit && (
        <ActionLink
          label={t("questLog.actions.edit")}
          icon={faPencil}
          to={`/quest-log/action/edit/${quest.id}`}
        />
      )}
      {props.showDetailsLink && (
        <ActionLink
          label={t("questLog.actions.details")}
          icon={faInfo}
          to={`/quest-log/action/view/${quest.id}`}
        />
      )}
    </ActionToolbar>
  );
}
