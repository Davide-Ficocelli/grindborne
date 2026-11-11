import { lazy, Suspense, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  faArrowLeft,
  faPencil,
  faTrash,
  faCheck,
  faX,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingFallback from "./LoadingFallback";
import ConfirmModal from "./ConfirmModal";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import type { QuestInDb } from "../types/quest";

type QuestDetailsProps = {
  variant: string;
  questId?: string;
  // Optional callbacks: if present, the component does nothing ‘on its own’
  // and delegates to the parent (in the case of a side-view within QuestLogList). If absent
  // (in the case of a full-page view), the component opens a local confirmation modal
  // and uses its own `useMutation`.
  onRequestComplete?: (quest: QuestInDb) => void;
  onRequestFail?: (quest: QuestInDb) => void;
  onRequestDelete?: (quest: QuestInDb) => void;
  onRequestTrack?: (quest: QuestInDb) => void;
};

export default function QuestDetails(props: QuestDetailsProps) {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Use the id from params (full-page) or the prop (side-view).
  // Decision: Fallback to null if neither is present, so the hook doesn't crash.
  const targetId = id || props.questId;

  // Fetch the quest from the API
  const {
    data: currentQuest,
    loading,
    error,
    refetch,
  } = useApi<QuestInDb>(() => api.get(`/quests/${targetId}`), [targetId]);

  // --- Local state for the "full-page" case -----------------------------
  // pendingAction is the type of action awaiting confirmation. In the side-view,
  // it ALWAYS remains null because the parent’s callbacks are provided: the modal is
  // handled by QuestLogList.
  const [pendingAction, setPendingAction] = useState<
    "delete" | "complete" | "fail" | "track" | null
  >(null);

  // Temporary XP badge: after a successful completion, we display
  // “+X XP” for 3 seconds so that the user sees it appear inline.
  const [xpGained, setXpGained] = useState<number | null>(null);

  // --- Local mutations --------------------------------------------------
  // These mutations are ONLY needed when the parent does not provide a callback
  // (full-page). In side-view, they are ‘dormant’: they are never called.
  // I keep them defined anyway because useMutation is a hook and hooks
  // must be called unconditionally, in the same order, on every render.

  const deleteMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${currentQuest?.id}`),
    {
      pendingMessage: t("questLog.mutations.deleting"),
      successMessage: t("questLog.mutations.deleted"),
      onSuccess: () => {
        setPendingAction(null);
        // In full-page mode, the query no longer exists: I return to the list.
        // In side-view mode (edge case: no callback), I simply perform a refetch.
        if (props.variant === "full-page" || props.variant === undefined) {
          navigate("/quest-log/list");
        } else {
          refetch();
        }
      },
    },
  );

  const completeMutation = useMutation<{ quest: QuestInDb; userData: unknown }>(
    () => api.patch(`/quests/${currentQuest?.id}/complete`),
    {
      pendingMessage: t("questLog.mutations.completing"),
      successMessage: t("questLog.mutations.completed"),
      onSuccess: (data) => {
        setPendingAction(null);
        // The payload for the ‘complete’ event is { quest, userData }. I extract the
        // total_xp to display the temporary badge.
        const completed = (data as any)?.quest as QuestInDb;
        if (completed?.total_xp) {
          setXpGained(completed.total_xp);
          setTimeout(() => setXpGained(null), 3000);
        }
        refetch();
      },
    },
  );

  const failMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${currentQuest?.id}/fail`),
    {
      pendingMessage: t("questLog.mutations.failing"),
      successMessage: t("questLog.mutations.failed"),
      onSuccess: () => {
        setPendingAction(null);
        refetch();
      },
    },
  );

  const trackMutation = useMutation<QuestInDb>(
    () => api.patch(`/quests/${currentQuest?.id}/track`),
    {
      pendingMessage: t("questLog.mutations.tracking"),
      successMessage: t("questLog.mutations.tracked"),
      onSuccess: () => {
        setPendingAction(null);
        refetch();
      },
    },
  );

  function handleActionClick(kind: "delete" | "complete" | "fail" | "track") {
    if (!currentQuest) return;
    const parentCallback =
      kind === "delete"
        ? props.onRequestDelete
        : kind === "complete"
          ? props.onRequestComplete
          : kind === "fail"
            ? props.onRequestFail
            : props.onRequestTrack;
    if (parentCallback) {
      parentCallback(currentQuest);
    } else {
      setPendingAction(kind);
    }
  }

  function handleConfirmLocal() {
    if (pendingAction === "delete") deleteMutation.mutate();
    else if (pendingAction === "complete") completeMutation.mutate();
    else if (pendingAction === "fail") failMutation.mutate();
    else if (pendingAction === "track") trackMutation.mutate();
  }

  // Mutation currently active for the local modal (for loading only).
  const activeLocalMutation =
    pendingAction === "delete"
      ? deleteMutation
      : pendingAction === "complete"
        ? completeMutation
        : pendingAction === "fail"
          ? failMutation
          : pendingAction === "track"
            ? trackMutation
            : null;

  // Modal labels: the same four  actions have different text.
  const modalCopy: Record<
    NonNullable<typeof pendingAction>,
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

  const QuestDetailsIcon = lazy(() =>
    import("../assets/icons/quest-details.png").then((module) => ({
      default: () => (
        <img
          src={module.default}
          alt="Quest details icon"
          className="size-20 rounded-lg border border-[#FFD6A7]"
        />
      ),
    })),
  );

  type ObjOfStrings = { [key: string]: string };

  const classStyles: ObjOfStrings = {
    fieldsWrapper:
      "flex flex-col justify-center items-start gap-y-4 w-full sm:grid sm:grid-cols-3",
    firstGridField: "sm:col-start-1 sm:col-end-2",
    secondGridField: "sm:col-start-3 sm:col-end-3",
    labelAndFieldContainer:
      "flex flex-col gap-y-4 justify-center items-start sm:items-start sm:text-start",
    actionIcon: "text-white text-xl sm:text-3xl cursor-pointer",
    actionBtn:
      "text-white flex flex-col justify-center items-center gap-y-2 hover:opacity-80 focus:opacity-80 active:opacity-80 cursor-pointer",
  };

  // If no ID is available, we can't show details.
  if (!targetId) return null;

  if (loading) return <LoadingFallback />;
  if (error)
    return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!currentQuest)
    return <div className="text-center py-8">{t("questLog.noQuests")}</div>;

  // FIX: calculate action visibility
  const canTrack =
    !currentQuest.is_tracked &&
    !currentQuest.is_completed &&
    !currentQuest.is_failed;
  const canComplete =
    currentQuest.is_tracked &&
    !currentQuest.is_completed &&
    !currentQuest.is_failed;
  const canFail =
    currentQuest.is_tracked &&
    !currentQuest.is_completed &&
    !currentQuest.is_failed;
  const canEdit = !currentQuest.is_tracked && !currentQuest.is_completed;

  if (props.variant === "full-page" || props.variant === undefined)
    return (
      <Suspense fallback={<LoadingFallback />}>
        <section aria-label="Quest details">
          {/* Navigation */}
          <nav>
            <Link
              to="/quest-log/list"
              className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 focus:text-yellow-500 hover:border-b-yellow-500 px-4 pt-4 sm:justify-start"
            >
              <span className="order-1 focus:border-b-yellow-500 hover:border-b-2 focus:border-b-2 transition-[border] duration-100 ease-in">
                {t("questLog.details.back")}
              </span>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </nav>

          {/* Header Section */}
          <header className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
            <h1 className="h1-font-size text-center order-1">
              {t("questLog.details.title")}
            </h1>
            <Suspense fallback={<LoadingFallback />}>
              <QuestDetailsIcon />
            </Suspense>
          </header>

          {/* Main Content */}
          <section className="quest-details-grid-area-container">
            {/* Title and Description */}
            <div
              className={`${classStyles.fieldsWrapper} quest-title-description-grid-area`}
            >
              <div
                className={`${classStyles.labelAndFieldContainer} ${
                  currentQuest.description
                    ? classStyles.firstGridField
                    : "sm:col-start-2 sm:col-end-3"
                }`}
              >
                <h2 className="field-title">
                  {t("questLog.details.questTitle")}
                </h2>
                <p>{currentQuest.name}</p>
              </div>

              {currentQuest.description && (
                <div
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <h2 className="field-title">
                    {t("questLog.details.description")}
                  </h2>
                  <p>{currentQuest.description}</p>
                </div>
              )}
            </div>

            <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area" />

            {currentQuest.estimated_time && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} gap-y-8 sm:relative quest-attributes-duration-grid-area`}
                >
                  <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                    <p className="medium-font-size text-center">
                      {t("questLog.details.rewardsActive")}
                    </p>
                  </div>

                  <div className={classStyles.firstGridField}>
                    <h3 className="field-title">
                      {t("questLog.details.involvedAttributes")}
                    </h3>
                    <ul className="flex flex-col gap-y-2">
                      {/* Placeholder until API provides attributes */}
                      <li>Forza</li>
                      <li>Intelligenza</li>
                    </ul>
                  </div>

                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h3 className="field-title">
                      {t("questLog.details.estimatedDuration")}
                    </h3>
                    <p>
                      {currentQuest.estimated_time}{" "}
                      <span>{t("questLog.details.minutes")}</span>
                    </p>

                    <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                      <p>
                        {t("questLog.details.xpPerAttribute")}:{" "}
                        <strong>
                          {Math.floor((currentQuest.total_xp || 0) / 2)}
                        </strong>
                      </p>
                      <p>
                        {t("questLog.details.totalXp")}:{" "}
                        <strong>{currentQuest.total_xp || 0}</strong>
                      </p>
                      {/* Temporary XP badge: appears for 3 seconds after completion. */}
                      {xpGained != null && (
                        <p className="text-green-300 font-semibold animate-pulse">
                          +{xpGained} XP
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area" />
              </>
            )}

            {/* Start Date and Time (Using tracked_at as start date) */}
            {currentQuest.tracked_at && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} quest-date-time-grid-area`}
                >
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                  >
                    <h3 className="field-title">
                      {t("questLog.details.date")}
                    </h3>
                    <time
                      dateTime={new Date(currentQuest.tracked_at).toISOString()}
                    >
                      {new Date(currentQuest.tracked_at).toLocaleDateString()}
                    </time>
                  </div>
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h3 className="field-title">
                      {t("questLog.details.time")}
                    </h3>
                    <time
                      dateTime={new Date(currentQuest.tracked_at).toISOString()}
                    >
                      {new Date(currentQuest.tracked_at).toLocaleTimeString()}
                    </time>
                  </div>
                </div>
                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area" />
              </>
            )}

            {/* Due Date and Time (Using completed_at/failed_at if available, else placeholder) */}
            {currentQuest.completed_at && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} quest-due-date-due-time-grid-area`}
                >
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                  >
                    <h3 className="field-title">
                      {t("questLog.details.dueDate")}
                    </h3>
                    <time
                      dateTime={new Date(
                        currentQuest.completed_at,
                      ).toISOString()}
                    >
                      {new Date(currentQuest.completed_at).toLocaleDateString()}
                    </time>
                  </div>
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h3 className="field-title">
                      {t("questLog.details.dueTime")}
                    </h3>
                    <time
                      dateTime={new Date(
                        currentQuest.completed_at,
                      ).toISOString()}
                    >
                      {new Date(currentQuest.completed_at).toLocaleTimeString()}
                    </time>
                  </div>
                </div>
                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-4-grid-area" />
              </>
            )}

            {/* Actions Toolbar */}
            <nav
              aria-label={t("questLog.details.actionsLabel")}
              role="toolbar"
              className="w-full flex items-baseline gap-x-2 justify-center sm:justify-evenly quest-actions-grid-area"
            >
              {canTrack && (
                <button
                  className={classStyles.actionBtn}
                  onClick={() => handleActionClick("track")}
                >
                  <span className="order-1 text-center small-font-size">
                    {t("questLog.actions.track")}
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faPlay}
                    aria-hidden="true"
                  />
                </button>
              )}
              {canFail && (
                <button
                  className={classStyles.actionBtn}
                  onClick={() => handleActionClick("fail")}
                >
                  <span className="order-1 text-center small-font-size">
                    {t("questLog.actions.fail")}
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faX}
                    aria-hidden="true"
                  />
                </button>
              )}
              {canComplete && (
                <button
                  className={classStyles.actionBtn}
                  onClick={() => handleActionClick("complete")}
                >
                  <span className="order-1 text-center small-font-size">
                    {t("questLog.actions.complete")}
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faCheck}
                    aria-hidden="true"
                  />
                </button>
              )}
              <button
                className={classStyles.actionBtn}
                onClick={() => handleActionClick("delete")}
              >
                <span className="order-1 text-center small-font-size">
                  {t("questLog.actions.delete")}
                </span>
                <FontAwesomeIcon
                  className={classStyles.actionIcon}
                  icon={faTrash}
                  aria-hidden="true"
                />
              </button>
              {canEdit && (
                <Link
                  to={`/quest-log/action/edit/${currentQuest.id}`}
                  className={classStyles.actionBtn}
                >
                  <span className="order-1 text-center small-font-size">
                    {t("questLog.actions.edit")}
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faPencil}
                    aria-hidden="true"
                  />
                </Link>
              )}
            </nav>
          </section>

          {/* Local modal: opens only when `pendingAction` is set,
              i.e. only if the parent has NOT provided the callbacks (full-page). */}
          <ConfirmModal
            open={pendingAction !== null}
            title={pendingAction ? modalCopy[pendingAction].title : ""}
            description={
              pendingAction ? modalCopy[pendingAction].description : ""
            }
            confirmLabel={pendingAction ? modalCopy[pendingAction].confirm : ""}
            cancelLabel={t("common.cancel")}
            loading={activeLocalMutation?.loading ?? false}
            onConfirm={handleConfirmLocal}
            onCancel={() => setPendingAction(null)}
          />
        </section>
      </Suspense>
    );

  if (props.variant === "side-view")
    return (
      <Suspense fallback={<LoadingFallback />}>
        <aside
          id="quest-details-side-view"
          aria-label="Pannello dettagli della missione"
          className="flex flex-col border-r-white border-r-1"
        >
          {/* Header Section */}
          <header className="flex flex-wrap justify-center items-center gap-x-8 gap-y-8 py-[3.15rem] px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
            <h2 className="h2-font-size text-center order-1">
              {t("questLog.details.title")}
            </h2>
            <Suspense fallback={<LoadingFallback />}>
              <QuestDetailsIcon />
            </Suspense>
          </header>

          {/* Main Content */}
          <section
            aria-label="Contenuto della missione"
            className="quest-details-grid-area-container h-screen overflow-y-scroll"
          >
            {/* Title and Description */}
            <div
              className={`${classStyles.fieldsWrapper} quest-title-description-grid-area`}
            >
              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
              >
                <h3 className="field-title">
                  {t("questLog.details.questTitle")}
                </h3>
                <p>{currentQuest.name}</p>
              </div>

              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
              >
                <h3 className="field-title">
                  {t("questLog.details.description")}
                </h3>
                <p>{currentQuest.description}</p>
              </div>
            </div>

            <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area" />

            {/* Attributes and Duration */}
            {currentQuest.estimated_time && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} gap-y-8 sm:relative quest-attributes-duration-grid-area`}
                >
                  <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                    <p className="medium-font-size text-center">
                      {t("questLog.details.rewardsActive")}
                    </p>
                  </div>

                  <div className={classStyles.firstGridField}>
                    <h4 className="field-title">
                      {t("questLog.details.involvedAttributes")}
                    </h4>
                    <ul className="flex flex-col gap-y-2">
                      <li>Forza</li>
                      <li>Intelligenza</li>
                    </ul>
                  </div>

                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h4 className="field-title">
                      {t("questLog.details.estimatedDuration")}
                    </h4>
                    <p>
                      {currentQuest.estimated_time}{" "}
                      <span>{t("questLog.details.minutes")}</span>
                    </p>

                    <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                      <p>
                        {t("questLog.details.xpPerAttribute")}:{" "}
                        <strong>
                          {Math.floor((currentQuest.total_xp || 0) / 2)}
                        </strong>
                      </p>
                      <p>
                        {t("questLog.details.totalXp")}:{" "}
                        <strong>{currentQuest.total_xp || 0}</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area" />
              </>
            )}

            {/* Start Date and Time */}
            {currentQuest.tracked_at && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} quest-date-time-grid-area`}
                >
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                  >
                    <h4 className="field-title">
                      {t("questLog.details.date")}
                    </h4>
                    <time
                      dateTime={new Date(currentQuest.tracked_at).toISOString()}
                    >
                      {new Date(currentQuest.tracked_at).toLocaleDateString()}
                    </time>
                  </div>
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h4 className="field-title">
                      {t("questLog.details.time")}
                    </h4>
                    <time
                      dateTime={new Date(currentQuest.tracked_at).toISOString()}
                    >
                      {new Date(currentQuest.tracked_at).toLocaleTimeString()}
                    </time>
                  </div>
                </div>
                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area" />
              </>
            )}

            {/* Due Date and Time */}
            {currentQuest.completed_at && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} quest-due-date-due-time-grid-area`}
                >
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                  >
                    <h4 className="field-title">
                      {t("questLog.details.dueDate")}
                    </h4>
                    <time
                      dateTime={new Date(
                        currentQuest.completed_at,
                      ).toISOString()}
                    >
                      {new Date(currentQuest.completed_at).toLocaleDateString()}
                    </time>
                  </div>
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h4 className="field-title">
                      {t("questLog.details.dueTime")}
                    </h4>
                    <time
                      dateTime={new Date(
                        currentQuest.completed_at,
                      ).toISOString()}
                    >
                      {new Date(currentQuest.completed_at).toLocaleTimeString()}
                    </time>
                  </div>
                </div>
              </>
            )}

            <nav
              aria-label={t("questLog.details.actionsLabel")}
              role="toolbar"
              className="w-full flex items-baseline gap-x-2 justify-center sm:justify-evenly quest-actions-grid-area py-4"
            >
              {canTrack && (
                <button
                  className={classStyles.actionBtn}
                  onClick={() => handleActionClick("track")}
                >
                  <span className="order-1 text-center small-font-size">
                    {t("questLog.actions.track")}
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faPlay}
                  />
                </button>
              )}
              {canFail && (
                <button
                  className={classStyles.actionBtn}
                  onClick={() => handleActionClick("fail")}
                >
                  <span className="order-1 text-center small-font-size">
                    {t("questLog.actions.fail")}
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faX}
                  />
                </button>
              )}
              {canComplete && (
                <button
                  className={classStyles.actionBtn}
                  onClick={() => handleActionClick("complete")}
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
                onClick={() => handleActionClick("delete")}
              >
                <span className="order-1 text-center small-font-size">
                  {t("questLog.actions.delete")}
                </span>
                <FontAwesomeIcon
                  className={classStyles.actionIcon}
                  icon={faTrash}
                />
              </button>
              {canEdit && (
                <Link
                  to={`/quest-log/action/edit/${currentQuest.id}`}
                  className={classStyles.actionBtn}
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
            </nav>
          </section>

          <ConfirmModal
            open={pendingAction !== null}
            title={pendingAction ? modalCopy[pendingAction].title : ""}
            description={
              pendingAction ? modalCopy[pendingAction].description : ""
            }
            confirmLabel={pendingAction ? modalCopy[pendingAction].confirm : ""}
            cancelLabel={t("common.cancel")}
            loading={activeLocalMutation?.loading ?? false}
            onConfirm={handleConfirmLocal}
            onCancel={() => setPendingAction(null)}
          />
        </aside>
      </Suspense>
    );
}
