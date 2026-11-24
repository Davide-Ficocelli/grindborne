import { useTranslation } from "react-i18next";
import ConfirmModal from "./ConfirmModal";
import type {
  PendingQuestAction,
  QuestActionKind,
} from "../hooks/useQuestActions";

type QuestActionConfirmModalProps = {
  pending: PendingQuestAction;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function QuestActionConfirmModal(
  props: QuestActionConfirmModalProps,
) {
  const { t } = useTranslation();

  // Modal labels: the same four actions have different text.
  const modalCopy: Record<
    QuestActionKind,
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

  const copy = props.pending ? modalCopy[props.pending.kind] : null;

  return (
    <ConfirmModal
      open={props.pending !== null}
      title={copy?.title ?? ""}
      description={copy?.description ?? ""}
      confirmLabel={copy?.confirm ?? ""}
      cancelLabel={t("common.cancel")}
      loading={props.loading}
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    />
  );
}
