import { useEffect, useState, type ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BackLink from "../components/BackLink";
import FieldTitle from "../components/FieldTitle";
import GradientDivider from "../components/GradientDivider";
import LoadingFallback from "../components/LoadingFallback";
import PageHeading from "../components/PageHeading";
import QuestActionConfirmModal from "../components/QuestActionConfirmModal";
import QuestActionsToolbar from "../components/QuestActionsToolbar";
import QuestInvolvedAttributes from "../components/QuestInvolvedAttributes";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import {
  useQuestActions,
  type QuestActionKind,
} from "../hooks/useQuestActions";
import api from "../lib/api";
import { createLazyIcon } from "../lib/createLazyIcon";
import { pushLog } from "../lib/logMessagesStore";
import type { AttributeInDb } from "../types/attribute";
import type { QuestInDb } from "../types/quest";
import "../styles/pages/QuestPage.css";

// All the icons are declared at module level on purpose. A `lazy()` created
// inside the component is a brand new component on every render, so React
// would remount the icon (and flash the Suspense fallback) each time the user
// types a character in the form, after a refetch or when a modal opens.
const AddQuestIcon = createLazyIcon(
  () => import("../assets/icons/add-quest.png"),
  { hasBorder: false },
);
const EditQuestIcon = createLazyIcon(
  () => import("../assets/icons/edit-quest.png"),
  { hasBorder: true },
);
const QuestDetailsIcon = createLazyIcon(
  () => import("../assets/icons/quest-details.png"),
  { hasBorder: true },
);

// ---------------------------------------------------------------------------
// VARIANTS
//   add            → form to create a quest
//   edit           → form to change an existing quest
//   view-full-page → details page (its own route)
//   view-side-view → details panel inside the quest log (desktop)
//
// Everything that is only a matter of "which text/icon/heading" lives in
// VARIANT_SETTINGS. To add a variant, add its name to the type and one entry
// here; the component itself changes only if the new variant has new behavior.
// ---------------------------------------------------------------------------
export type QuestPageVariant =
  | "add"
  | "edit"
  | "view-full-page"
  | "view-side-view";

type QuestPageSettings = {
  titleKey: string;
  Icon: ElementType;
  headingTag: "h1" | "h2";
  // Missing = no "back" link (the side view lives inside the quest log).
  backLabelKey?: string;
  // Heading levels of the fields in the view variants, one level below the
  // page heading (h1 → h2/h3, h2 → h3/h4) to keep a valid outline (WCAG).
  // The forms use <label>s, so they ignore these two.
  primaryFieldLevel: 2 | 3;
  secondaryFieldLevel: 3 | 4;
  // Present only in the form variants: the text of the submit button.
  form?: { submitLabelKey: string; submittingLabelKey: string };
};

const VARIANT_SETTINGS: Record<QuestPageVariant, QuestPageSettings> = {
  add: {
    titleKey: "questLog.form.newQuest",
    Icon: AddQuestIcon,
    headingTag: "h1",
    backLabelKey: "questLog.form.backToLog",
    primaryFieldLevel: 2,
    secondaryFieldLevel: 3,
    form: {
      submitLabelKey: "questLog.form.create",
      submittingLabelKey: "questLog.form.creating",
    },
  },
  edit: {
    titleKey: "questLog.form.editQuest",
    Icon: EditQuestIcon,
    headingTag: "h1",
    backLabelKey: "questLog.form.backToLog",
    primaryFieldLevel: 2,
    secondaryFieldLevel: 3,
    form: {
      submitLabelKey: "questLog.form.save",
      submittingLabelKey: "questLog.form.saving",
    },
  },
  "view-full-page": {
    titleKey: "questLog.details.title",
    Icon: QuestDetailsIcon,
    headingTag: "h1",
    backLabelKey: "questLog.details.back",
    primaryFieldLevel: 2,
    secondaryFieldLevel: 3,
  },
  "view-side-view": {
    titleKey: "questLog.details.title",
    Icon: QuestDetailsIcon,
    headingTag: "h2",
    primaryFieldLevel: 3,
    secondaryFieldLevel: 4,
  },
};

const HEADING_ID = "quest-page-heading";

type QuestPageProps = {
  variant: QuestPageVariant;
  // Only for "view-side-view": the quest is chosen by the parent, not by the URL.
  questId?: string;
  // Only for "view-side-view": if present, the component does nothing 'on its
  // own' and delegates the action to the parent (QuestLogPage), which owns the
  // confirmation modal. If absent (full-page view), the page uses its own modal.
  onRequestAction?: (kind: QuestActionKind, quest: QuestInDb) => void;
};

type CreateQuestPayload = {
  name: string;
  description?: string;
  is_rewardable: boolean;
  estimated_time?: number;
  is_tracked: boolean;
  attributes_ids: string[];
};

type UpdateQuestPayload = {
  name: string;
  description?: string;
  is_rewardable: boolean;
  estimated_time?: number;
};

export default function QuestPage(props: QuestPageProps) {
  const { variant } = props;
  const settings = VARIANT_SETTINGS[variant];
  const { Icon } = settings;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const isAdd = variant === "add";
  const isEdit = variant === "edit";
  const isForm = isAdd || isEdit;
  const isView = !isForm;

  // Use the id from params (edit / full-page) or the prop (side-view).
  const targetId = routeId || props.questId;
  // Only edit and view need an existing quest. "add" must not request one.
  const needsExistingQuest = !isAdd && !!targetId;

  // --- Form state (only used by the form variants) ------------------------
  const [isQuestRewardable, setIsQuestRewardable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState<number | "">("");
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    [],
  );
  const [trackOnCreate, setTrackOnCreate] = useState(false);

  // --- Data ---------------------------------------------------------------
  // Hooks cannot be called conditionally, so each request is switched on only
  // for the variants that need it (`enabled`).
  const { data: attributes, loading: attrLoading } = useApi<AttributeInDb[]>(
    () => api.get("/attributes"),
    [],
    { enabled: isForm },
  );

  const {
    data: quest,
    loading: loadingQuest,
    error,
    refetch,
  } = useApi<QuestInDb>(() => api.get(`/quests/${targetId}`), [targetId], {
    enabled: needsExistingQuest,
  });

  // Edit only: fill the form with the quest being edited.
  useEffect(() => {
    if (!quest || !isEdit) return;
    setName(quest.name ?? "");
    setDescription(quest.description ?? "");
    setEstimatedTime(quest.estimated_time ?? "");
    setIsQuestRewardable(quest.is_rewardable ?? true);
  }, [quest, isEdit]);

  // HISTORY: trackOnCreate used to be reset to false when rewards
  // were disabled, because non-rewardable quests could not be tracked.
  // Business rule changed: non-rewardable quests CAN be tracked (from this
  // form and from the quest list), so that reset was removed on purpose.
  // Do not add it back.

  // --- Mutations ----------------------------------------------------------
  const createMutation = useMutation<QuestInDb, [CreateQuestPayload]>(
    (payload) => api.post("/quests", payload),
    {
      pendingMessage: t("questLog.form.creating"),
      successMessage: t("questLog.form.created"),
      onSuccess: () => navigate("/quest-log/list"),
    },
  );

  const updateMutation = useMutation<QuestInDb, [UpdateQuestPayload]>(
    (payload) => api.put(`/quests/${targetId}`, payload),
    {
      pendingMessage: t("questLog.form.saving"),
      successMessage: t("questLog.form.saved"),
      onSuccess: () => navigate("/quest-log/list"),
    },
  );

  // View only (when the parent does not handle the actions): track / complete
  // / fail / delete with a local confirmation modal.
  const questActions = useQuestActions({
    onActionSucceeded: handleActionSucceeded,
  });

  function handleActionSucceeded(kind: QuestActionKind) {
    // In full-page mode a deleted quest no longer exists: go back to the list.
    // In every other case, the quest still exists, so it is reloaded.
    if (kind === "delete" && variant === "view-full-page") {
      navigate("/quest-log/list");
      return;
    }
    refetch();
  }

  // The side view delegates to its parent when it gave a callback; otherwise
  // this page opens its own modal.
  const requestAction = props.onRequestAction ?? questActions.requestAction;

  function toggleQuestRewards(e: React.MouseEvent) {
    e.preventDefault();
    setIsQuestRewardable((prev) => !prev);
  }

  function toggleAttribute(attrId: string) {
    setSelectedAttributeIds((prev) =>
      prev.includes(attrId)
        ? prev.filter((x) => x !== attrId)
        : [...prev, attrId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // A rewardable quest gives XP to attributes: with none selected there
    // would be nobody to give the XP to ("*" on the legend means required).
    if (isAdd && isQuestRewardable && selectedAttributeIds.length === 0) {
      pushLog("error", t("questLog.form.attributesRequired"));
      return;
    }

    // The estimated time is mandatory for rewardable quests (enforced by the
    // input's `required` attribute) and OPTIONAL for non-rewardable ones.
    // In both cases it is sent when the user filled it in.
    const estimated_time =
      estimatedTime !== "" ? Number(estimatedTime) : undefined;

    if (isEdit) {
      await updateMutation.mutate({
        name,
        description: description.trim() || undefined,
        is_rewardable: isQuestRewardable,
        estimated_time,
      });
    } else {
      await createMutation.mutate({
        name,
        description: description.trim() || undefined,
        is_rewardable: isQuestRewardable,
        estimated_time,
        is_tracked: trackOnCreate,
        attributes_ids: isQuestRewardable ? selectedAttributeIds : [],
      });
    }
  }

  // --- Guards (state of the data, not variants) ---------------------------
  // If no ID is available, we can't show an existing quest.
  if (!isAdd && !targetId) return null;
  if (loadingQuest) return <LoadingFallback />;
  if (error)
    return (
      <div className="quest-page__message quest-page__message--error">
        {error}
      </div>
    );
  if (!isAdd && !quest)
    return <div className="quest-page__message">{t("questLog.noQuests")}</div>;

  // --- Values derived from the variant and the data -----------------------
  const mode = isForm ? "form" : "view";
  const isSaving = isEdit ? updateMutation.loading : createMutation.loading;

  // Rewards-related parts are only for rewardable quests: a non-rewardable
  // quest can have an estimated time too, but it has no attributes and earns
  // no XP.
  const hasRewards = isForm ? isQuestRewardable : !!quest?.is_rewardable;
  // A view shows the description (and the duration block) only when the quest
  // has one; a form always has its inputs.
  const hasDescription = isForm || !!quest?.description;
  const hasDurationSection = isForm || !!quest?.estimated_time;

  // Without a description the title takes the middle column instead of the first.
  const titlePositionClass = hasDescription
    ? "quest-page__field--first"
    : "quest-page__field--middle";
  const fieldsClass = hasRewards
    ? "quest-page__section quest-page__fields"
    : "quest-page__section quest-page__fields quest-page__fields--no-rewards";

  // Legend of the attributes group: required in "add", read-only in "edit".
  let attributesLegendSuffix = "*";
  if (isEdit) {
    attributesLegendSuffix = `(${t("questLog.form.attributesNotEditable")})`;
  }

  // <aside> for the side panel, <section> for the others; <form> only when the
  // variant is a form. `ElementType` lets the tag change without a second return.
  const RootTag: ElementType =
    variant === "view-side-view" ? "aside" : "section";
  const ContentTag: ElementType = isForm ? "form" : "section";

  return (
    <RootTag
      aria-labelledby={HEADING_ID}
      className={`quest-page quest-page--${mode} quest-page--${variant}`}
    >
      {settings.backLabelKey && (
        <BackLink to="/quest-log/list" label={t(settings.backLabelKey)} />
      )}

      <PageHeading
        id={HEADING_ID}
        title={t(settings.titleKey)}
        headingTag={settings.headingTag}
        icon={<Icon />}
        className="quest-page__heading bottom-linear-gradient-border"
      />

      <ContentTag
        className="quest-page__content"
        onSubmit={isForm ? handleSubmit : undefined}
      >
        {/* 1. Title and description */}
        <div className="quest-page__section quest-page__fields">
          <div className={`quest-page__field ${titlePositionClass}`}>
            {isForm && (
              <>
                <FieldTitle htmlFor="quest-title">
                  {t("questLog.form.title")} *
                </FieldTitle>
                <input
                  id="quest-title"
                  name="quest_title"
                  type="text"
                  required
                  aria-required="true"
                  placeholder={t("questLog.form.titlePlaceholder")}
                  className="quest-form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </>
            )}
            {isView && (
              <>
                <FieldTitle headingLevel={settings.primaryFieldLevel}>
                  {t("questLog.details.questTitle")}
                </FieldTitle>
                <p>{quest?.name}</p>
              </>
            )}
          </div>

          {hasDescription && (
            <div className="quest-page__field quest-page__field--last">
              {isForm && (
                <>
                  <FieldTitle htmlFor="quest-description">
                    {t("questLog.form.description")}
                  </FieldTitle>
                  <textarea
                    id="quest-description"
                    name="quest_description"
                    placeholder={t("questLog.form.descriptionPlaceholder")}
                    rows={6}
                    className="quest-form-input text-sm resize-vertical"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </>
              )}
              {isView && (
                <>
                  <FieldTitle headingLevel={settings.primaryFieldLevel}>
                    {t("questLog.details.description")}
                  </FieldTitle>
                  <p>{quest?.description}</p>
                </>
              )}
            </div>
          )}
        </div>

        <GradientDivider tone="orange" className="quest-page__divider" />

        {/* 2. Rewards, attributes and duration */}
        {hasDurationSection && (
          <>
            <div className={fieldsClass}>
              {isForm && (
                <div className="flex flex-col gap-y-4 quest-page__field--middle">
                  <span className="medium-font-size text-center">
                    {t("questLog.form.rewards")}
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={toggleQuestRewards}
                  >
                    {isQuestRewardable
                      ? t("questLog.form.disable")
                      : t("questLog.form.enable")}
                  </button>
                </div>
              )}
              {isView && hasRewards && (
                <div className="flex flex-col gap-y-4 quest-page__field--middle">
                  <p className="medium-font-size text-center">
                    {t("questLog.details.rewardsActive")}
                  </p>
                </div>
              )}

              {/* Attributes. Add: selectable. Edit: shown but disabled, they
                  cannot be changed in this version. View: the attributes
                  really involved, from GET /quests-attributes/:questId. */}
              {isForm && hasRewards && (
                <fieldset
                  className="quest-page__field--first"
                  disabled={isEdit}
                >
                  <legend className="field-title">
                    {t("questLog.form.involvedAttributes")}{" "}
                    {attributesLegendSuffix}
                  </legend>
                  <div>
                    {attrLoading && <p>{t("loading")}</p>}
                    {attributes?.map((attr) => (
                      <div key={attr.id} className="flex gap-x-1">
                        <input
                          id={`attr-${attr.id}`}
                          type="checkbox"
                          value={attr.id}
                          checked={selectedAttributeIds.includes(attr.id)}
                          onChange={() => toggleAttribute(attr.id)}
                        />
                        <label htmlFor={`attr-${attr.id}`}>{attr.name}</label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}
              {isView && hasRewards && quest && (
                <div className="quest-page__field--first">
                  <FieldTitle headingLevel={settings.secondaryFieldLevel}>
                    {t("questLog.details.involvedAttributes")}
                  </FieldTitle>
                  <QuestInvolvedAttributes questId={quest.id} />
                </div>
              )}

              {/* Duration */}
              <div className="quest-page__field quest-page__field--last">
                {isForm && (
                  <>
                    <FieldTitle htmlFor="duration">
                      {t("questLog.form.estimatedTime")}
                      {isQuestRewardable ? " *" : null}
                    </FieldTitle>
                    <div className="flex flex-col items-start gap-y-2">
                      <input
                        id="duration"
                        name="duration"
                        type="number"
                        min="0"
                        step="1"
                        placeholder={t("questLog.form.durationPlaceholder")}
                        aria-describedby="duration-unit"
                        className="quest-form-input order-1"
                        required={isQuestRewardable}
                        value={estimatedTime}
                        onChange={(e) =>
                          setEstimatedTime(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                      />
                      <span id="duration-unit">
                        {t("questLog.form.minutes")}
                      </span>
                    </div>
                  </>
                )}
                {isView && (
                  <>
                    <FieldTitle headingLevel={settings.secondaryFieldLevel}>
                      {t("questLog.details.estimatedDuration")}
                    </FieldTitle>
                    <p>
                      {quest?.estimated_time}{" "}
                      <span>{t("questLog.details.minutes")}</span>
                    </p>

                    {/* The XP earned per attribute is NOT shown for now: it
                        used to be a hard-coded total_xp / 2. It will come
                        back once it is calculated with the real number of
                        attributes. */}
                    {hasRewards && (
                      <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                        <p>
                          {t("questLog.details.totalXp")}:{" "}
                          <strong>{quest?.total_xp || 0}</strong>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <GradientDivider tone="orange" className="quest-page__divider" />
          </>
        )}

        {/* 3. View only: start date/time (tracked_at) and due date/time. */}
        {isView && quest?.tracked_at && (
          <>
            <DateTimeFields
              timestamp={quest.tracked_at}
              dateLabel={t("questLog.details.date")}
              timeLabel={t("questLog.details.time")}
              headingLevel={settings.secondaryFieldLevel}
            />
            <GradientDivider tone="orange" className="quest-page__divider" />
          </>
        )}
        {isView && quest?.completed_at && (
          <>
            <DateTimeFields
              timestamp={quest.completed_at}
              dateLabel={t("questLog.details.dueDate")}
              timeLabel={t("questLog.details.dueTime")}
              headingLevel={settings.secondaryFieldLevel}
            />
            <GradientDivider tone="orange" className="quest-page__divider" />
          </>
        )}

        {/* 4. Add only. Tracking on creation is available for ALL quests,
            rewardable or not (business rule). */}
        {isAdd && (
          <>
            <fieldset className="quest-page__section quest-page__section--centered">
              <legend className="field-title">
                {t("questLog.form.trackPrompt")} *
              </legend>
              <div>
                <div className="flex gap-x-1">
                  <input
                    id="track-yes"
                    name="track"
                    type="radio"
                    value="yes"
                    checked={trackOnCreate}
                    onChange={() => setTrackOnCreate(true)}
                  />
                  <label htmlFor="track-yes">{t("common.yes")}</label>
                </div>
                <div className="flex gap-x-1">
                  <input
                    id="track-no"
                    name="track"
                    type="radio"
                    value="no"
                    checked={!trackOnCreate}
                    onChange={() => setTrackOnCreate(false)}
                  />
                  <label htmlFor="track-no">{t("common.no")}</label>
                </div>
              </div>
            </fieldset>

            <GradientDivider tone="white" className="quest-page__divider" />
          </>
        )}

        {/* 5. Forms end with the submit button, views with the actions. */}
        {settings.form && (
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary quest-page__section quest-page__section--centered disabled:opacity-50"
          >
            {isSaving
              ? t(settings.form.submittingLabelKey)
              : t(settings.form.submitLabelKey)}
          </button>
        )}
        {isView && quest && (
          <QuestActionsToolbar
            quest={quest}
            showDetailsLink={false}
            onRequestAction={requestAction}
            className="quest-page__section quest-page__actions"
          />
        )}
      </ContentTag>

      {/* Local modal: opens only when the page handles the action itself,
          i.e. only if the parent has NOT provided `onRequestAction`. */}
      {isView && (
        <QuestActionConfirmModal
          pending={questActions.pending}
          loading={questActions.isLoading}
          onConfirm={questActions.confirmAction}
          onCancel={questActions.cancelAction}
        />
      )}
    </RootTag>
  );
}

// ---------------------------------------------------------------------------
// A "date + time" pair. Used for the start (tracked_at) and the due
// (completed_at) moments, which were two copies of the same block.
// It only exists for QuestPage, so it lives in the same file.
// ---------------------------------------------------------------------------
type DateTimeFieldsProps = {
  // The API serializes dates as ISO strings, so we rebuild a Date.
  timestamp: Date | string;
  dateLabel: string;
  timeLabel: string;
  headingLevel: 2 | 3 | 4;
};

function DateTimeFields(props: DateTimeFieldsProps) {
  const date = new Date(props.timestamp);

  return (
    <div className="quest-page__section quest-page__fields">
      <div className="quest-page__field quest-page__field--first">
        <FieldTitle headingLevel={props.headingLevel}>
          {props.dateLabel}
        </FieldTitle>
        <time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time>
      </div>
      <div className="quest-page__field quest-page__field--last">
        <FieldTitle headingLevel={props.headingLevel}>
          {props.timeLabel}
        </FieldTitle>
        <time dateTime={date.toISOString()}>{date.toLocaleTimeString()}</time>
      </div>
    </div>
  );
}
