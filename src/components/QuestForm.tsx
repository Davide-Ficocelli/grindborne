import { lazy, Suspense, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import LoadingFallback from "./LoadingFallback";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import api from "../lib/api";
import type { AttributeInDb } from "../types/attribute";
import type { QuestInDb } from "../types/quest";

type QuestFormProps = {
  variant: string;
};

// ================================================================
// PAYLOAD TYPES
//
// Listed here (rather than inline) because there are two mutations with different payloads:
// POST (add) accepts attributes_ids + is_tracked, whilst PUT (edit) does not. This makes the contract with the backend explicit.
// ================================================================

// POST /quests (createNewQuestController):
//   { name, description, icon, is_rewardable, is_tracked,
//     estimated_time, attributes_ids }
// users_id should not be sent: the backend derives it from the JWT.

type CreateQuestPayload = {
  name: string;
  description?: string;
  is_rewardable: boolean;
  estimated_time?: number;
  is_tracked: boolean;
  attributes_ids: string[];
};

// PUT /quests/:id (updateQuestController):
//   { name, description, icon, is_rewardable, estimated_time }
// attributes_ids is NOT accepted (P2). We document it here.
type UpdateQuestPayload = {
  name: string;
  description?: string;
  is_rewardable: boolean;
  estimated_time?: number;
};

export default function QuestForm(props: QuestFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = props.variant === "edit-quest";

  // ================================================================
  // SHARED STATE
  //
  // ‘Add’ and ‘Edit’ share the same state because the component is
  // re-rendered when the route changes. There is no risk of one variant
  // ‘contaminating’ the other: only one is active at a time.
  // ================================================================
  const [isQuestRewardable, setIsQuestRewardable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // estimatedTime: "" when empty, otherwise a number. We use the empty string
  // as a sentinel to distinguish between "not compiled" and "0 minutes".
  // (Number("") = 0, so we cannot use 0 as a sentinel.)
  const [estimatedTime, setEstimatedTime] = useState<number | "">("");
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    [],
  );
  const [trackOnCreate, setTrackOnCreate] = useState(false);

  // ================================================================
  // FETCH DATA
  // ================================================================

  // User attributes: these are required both in the ‘add’ function (for the checkboxes) and in the
  // ‘edit’ function (for the read-only list). A single call.
  const { data: attributes, loading: attrLoading } = useApi<AttributeInDb[]>(
    () => api.get("/attributes"),
    [],
  );

  // Existing quest: fetch ONLY in edit mode. In add mode, we return a
  // Promise that has already been resolved with `data: undefined` to avoid making an
  // to `/quests/undefined` (useApi processes the response as if
  // the backend had replied `ok: true, data: undefined`, and sets
  // data = null). This workaround maintains the hook rule
  // (useApi is always called) without any side effects in add mode.

  const { data: existingQuest, loading: loadingQuest } =
    useApi<QuestInDb>(() => {
      if (!isEdit || !id) {
        return Promise.resolve({
          data: { ok: true, status: 200, message: "", data: undefined },
        }) as any;
      }
      return api.get(`/quests/${id}`);
    }, [id, isEdit]);

  // Pre-populate the fields when the quest arrives (edit mode only). The dependencies
  // [existingQuest, isEdit] prevent the fields from being overwritten every time
  // the user types (the effect only runs when the quest arrives
  // or the variant changes).
  useEffect(() => {
    if (!existingQuest || !isEdit) return;
    setName(existingQuest.name ?? "");
    setDescription(existingQuest.description ?? "");
    setEstimatedTime(existingQuest.estimated_time ?? "");
    setIsQuestRewardable(existingQuest.is_rewardable ?? true);
  }, [existingQuest, isEdit]);

  // ================================================================
  // MUTATIONS
  // ================================================================
  const createMutation = useMutation<QuestInDb, [CreateQuestPayload]>(
    (payload) => api.post("/quests", payload),
    {
      pendingMessage: t("questLog.form.creating"),
      successMessage: t("questLog.form.created"),
      onSuccess: () => navigate("/quest-log/list"),
    },
  );

  const updateMutation = useMutation<QuestInDb, [UpdateQuestPayload]>(
    (payload) => api.put(`/quests/${id}`, payload),
    {
      pendingMessage: t("questLog.form.saving"),
      successMessage: t("questLog.form.saved"),
      onSuccess: () => navigate("/quest-log/list"),
    },
  );

  // ================================================================
  // HANDLERS
  // ================================================================
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

    // If rewardable, `estimated_time` is required. If not rewardable,
    // the backend rejects non-empty `attributes_ids` and (in theory) does not
    // expect a duration. We send `estimated_time = undefined` in that case.
    const estimated_time =
      isQuestRewardable && estimatedTime !== ""
        ? Number(estimatedTime)
        : undefined;

    if (isEdit) {
      // EDIT: the backend only accepts name/description/is_rewardable/
      // estimated_time. attributes_ids is ignored, so we do not send it.
      await updateMutation.mutate({
        name,
        description,
        is_rewardable: isQuestRewardable,
        estimated_time,
      });
    } else {
      // ADD: Full POST request with `attributes_ids` and `is_tracked`. The backend
      // creates the quest, then if `is_tracked` is set, it calls `trackQuestService` (a single
      // POST request: no separate PATCH is required).
      await createMutation.mutate({
        name,
        description,
        is_rewardable: isQuestRewardable,
        estimated_time,
        is_tracked: trackOnCreate,
        attributes_ids: isQuestRewardable ? selectedAttributeIds : [],
      });
    }
  }

  const AddQuestIcon = lazy(() =>
    import("../assets/icons/add-quest.png").then((module) => ({
      default: () => (
        <img
          src={module.default}
          alt="Add quest icon"
          className="size-20 rounded-lg"
        />
      ),
    })),
  );

  type ObjOfStrings = {
    [key: string]: string;
  };

  const classStyles: ObjOfStrings = {
    inputsWrapper:
      "flex flex-col justify-center items-start gap-y-12 w-full sm:grid sm:grid-cols-3",
    labelAndInputContainer:
      "flex flex-col gap-y-4 justify-center items-start sm:items-start sm:text-start",
    firstGridInput: "sm:col-start-1 sm:col-end-2",
    secondGridInput: "sm:col-start-3 sm:col-end-3",
  };

  if (isEdit && loadingQuest) return <LoadingFallback />;

  // ================================================================
  // VARIANT ADD
  // ================================================================
  if (props.variant === "add-quest" || props.variant === undefined)
    return (
      <>
        <Suspense fallback={<LoadingFallback />}>
          <section
            aria-labelledby="add-quest-page"
            className="flex flex-col justify-center"
          >
            <Link
              to="/quest-log/list"
              className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 focus:text-yellow-500 hover:border-b-yellow-500 px-4 pt-4 sm:justify-start"
            >
              <span className="order-1 focus:border-b-yellow-500 hover:border-b-2 focus:border-b-2 transition-[border] duration-100 ease-in">
                Ritorna al registro missioni
              </span>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <div className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
              <h1
                aria-labelledby="add-quest-heading"
                className="h1-font-size text-center order-1"
              >
                Nuova missione
              </h1>
              <Suspense fallback={<LoadingFallback />}>
                <AddQuestIcon />
              </Suspense>
            </div>

            {/* --- ADD QUEST FORM --- */}
            <form
              className="quest-form-grid-area-container"
              onSubmit={handleSubmit}
            >
              {/* Container for title and description */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-title-description-grid-area`}
              >
                {/* Title field */}
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="quest-title" className="input-label">
                    Titolo *
                  </label>
                  <input
                    id="quest-title"
                    name="quest_title"
                    type="text"
                    required
                    aria-required="true"
                    placeholder="Titolo..."
                    className="quest-form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </fieldset>

                {/* Description field */}
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="quest-description" className="input-label">
                    Descrizione
                  </label>
                  <textarea
                    id="quest-description"
                    name="quest_description"
                    placeholder="Descrizione..."
                    rows={6}
                    className="quest-form-input text-sm resize-vertical"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area"></div>

              {/* Container for Attributes and duration field */}
              {/* These are the main fields that will determine the total XP reward from quest completion */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-attributes-duration-grid-area`}
              >
                {/* Toggle quest rewards button */}
                <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                  <span className="medium-font-size text-center">
                    Ricompense missione
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={toggleQuestRewards}
                  >
                    {isQuestRewardable ? "Disattiva" : "Attiva"}
                  </button>
                </div>

                {/* Attributes fieldset (loadeed via API, clickable checkboxes) */}
                {isQuestRewardable && (
                  <fieldset className={classStyles.firstGridInput}>
                    <legend className="input-label">
                      Attributi coinvolti *
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

                {/* Duration field with measure unit */}
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${
                    isQuestRewardable
                      ? classStyles.secondGridInput
                      : "col-start-2 col-end-2 row-span-2"
                  }`}
                >
                  <label htmlFor="duration" className="input-label">
                    Durata stimata {isQuestRewardable ? "*" : null}
                  </label>
                  <div className="flex flex-col items-start gap-y-2">
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Durata..."
                      aria-describedby="duration-input"
                      className="quest-form-input order-1"
                      required={isQuestRewardable ? true : false}
                      value={estimatedTime}
                      onChange={(e) =>
                        setEstimatedTime(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                    <span id="duration-unit">Espressa in minuti</span>
                  </div>
                  {/*
                    NOTE (Q4): There used to be a placeholder block here: “Reward
                    XP per attribute: 200 / Total XP reward: 400”.
                    Removed: the total XP is calculated by the backend only upon 
                    completion (the `calculateQuestTotalXPHelper` depends on `actual_time`, 
                    which does not exist beforehand). Displaying an estimate on the frontend 
                    would duplicate a formula that is subject to change. For now, the reward is 
                    only visible upon completion.
                  */}
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {/*
                START AND END DATE/TIME — COMMENTED OUT (Q3)

                The backend does NOT persist these fields: `createNewQuestModel`
                only inserts `name`, `description`, `icon`, `is_rewardable`,
                `estimated_time`. We keep them in the code (commented out) for a
                future extension: when the backend supports date/time/
                two_date/two_time, we’ll simply need to remove the comments and add
                the fields to the handleSubmit payload.

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area"></div>

              <fieldset className={`${classStyles.inputsWrapper} quest-date-time-grid-area`}>
                <fieldset className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}>
                  <label htmlFor="date" className="input-label">Data</label>
                  <input id="date" name="date" type="date" className="quest-form-input" />
                </fieldset>
                <fieldset className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}>
                  <label htmlFor="time" className="input-label">Orario</label>
                  <input id="time" name="time" type="time" className="quest-form-input" />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-4-grid-area"></div>

              <fieldset className={`${classStyles.inputsWrapper} quest-due-date-due-time-grid-area`}>
                <fieldset className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}>
                  <label htmlFor="due-date" className="input-label">Data di scadenza</label>
                  <input id="due-date" name="due_date" type="date" className="quest-form-input" />
                </fieldset>
                <fieldset className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}>
                  <label htmlFor="due-time" className="input-label">Orario di scadenza</label>
                  <input id="due-time" name="due_time" type="time" className="quest-form-input" />
                </fieldset>
              </fieldset>
              */}

              {/* Tracking fieldset */}
              {isQuestRewardable && (
                <>
                  <fieldset className="quest-do-track-grid-area">
                    <legend className="input-label">
                      Traccia al momento della creazione? *
                    </legend>
                    <div>
                      <div className="flex gap-x-1">
                        <input
                          id="track-yes"
                          name="track"
                          type="radio"
                          value="sì"
                          checked={trackOnCreate}
                          onChange={() => setTrackOnCreate(true)}
                        />
                        <label htmlFor="track-yes">Sì</label>
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
                        <label htmlFor="track-no">No</label>
                      </div>
                    </div>
                  </fieldset>

                  <div className="bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111] divider-5-grid-area"></div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createMutation.loading}
                className="btn-primary quest-form-submit-grid-area disabled:opacity-50"
              >
                {createMutation.loading
                  ? t("questLog.form.creating")
                  : "Crea missione"}
              </button>
            </form>
          </section>
        </Suspense>
      </>
    );

  // ================================================================
  // VARIANT EDIT
  // ================================================================
  const EditQuestIcon = lazy(() =>
    import("../assets/icons/edit-quest.png").then((module) => ({
      default: () => (
        <img
          src={module.default}
          alt="Edit quest icon"
          className="size-20 rounded-lg border border-[#FFD6A7]"
        />
      ),
    })),
  );

  if (props.variant === "edit-quest")
    return (
      <>
        <Suspense fallback={<LoadingFallback />}>
          <section
            aria-labelledby="edit-quest-page"
            className="flex flex-col justify-center"
          >
            <Link
              to="/quest-log/list"
              className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 focus:text-yellow-500 hover:border-b-yellow-500 px-4 pt-4 sm:justify-start"
            >
              <span className="order-1 focus:border-b-yellow-500 hover:border-b-2 focus:border-b-2 transition-[border] duration-100 ease-in">
                Ritorna al registro missioni
              </span>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <div className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
              <h1
                aria-labelledby="add-quest-heading"
                className="h1-font-size text-center order-1"
              >
                Modifica missione
              </h1>
              <Suspense fallback={<LoadingFallback />}>
                <EditQuestIcon />
              </Suspense>
            </div>

            {/* --- EDIT QUEST FORM --- */}
            <form
              className="quest-form-grid-area-container"
              onSubmit={handleSubmit}
            >
              {/* Container for title and description */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-title-description-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="quest-title" className="input-label">
                    Titolo *
                  </label>
                  <input
                    id="quest-title"
                    name="quest_title"
                    type="text"
                    required
                    aria-required="true"
                    placeholder="Titolo..."
                    className="quest-form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="quest-description" className="input-label">
                    Descrizione
                  </label>
                  <textarea
                    id="quest-description"
                    name="quest_description"
                    placeholder="Descrizione..."
                    rows={6}
                    className="quest-form-input text-sm resize-vertical"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area"></div>

              <fieldset
                className={`${classStyles.inputsWrapper} quest-attributes-duration-grid-area`}
              >
                <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                  <span className="medium-font-size text-center">
                    Ricompense missione
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={toggleQuestRewards}
                  >
                    {isQuestRewardable ? "Disattiva" : "Attiva"}
                  </button>
                </div>

                {/*
                  ATTRIBUTES IN EDIT — READ-ONLY (P2)

                  The updateQuestController backend does not accept
                  attributes_ids: the PUT request can only modify name,
                  description, is_rewardable and estimated_time. We display
                  the list of user attributes for reference only
                  (disabled), with a note explaining that they are not
                  editable in this version.

                  NOTE: In future, to correctly pre-select the
                  CURRENT attributes of the quest, we will use
                  GET /quests-attributes/:questId (existing endpoint).
                  For now, we display the user’s global list as a
                  placeholder.
                */}
                {isQuestRewardable && (
                  <fieldset className={classStyles.firstGridInput} disabled>
                    <legend className="input-label">
                      Attributi coinvolti (non modificabili)
                    </legend>
                    <div>
                      {attrLoading && <p>{t("loading")}</p>}
                      {attributes?.map((attr) => (
                        <div key={attr.id} className="flex gap-x-1">
                          <input
                            id={`edit-attr-${attr.id}`}
                            type="checkbox"
                            value={attr.id}
                            disabled
                          />
                          <label htmlFor={`edit-attr-${attr.id}`}>
                            {attr.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="small-font-size">
                      {t("questLog.form.attributesNotEditable")}
                    </p>
                  </fieldset>
                )}

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${
                    isQuestRewardable
                      ? classStyles.secondGridInput
                      : "col-start-2 col-end-2 row-span-2"
                  }`}
                >
                  <label htmlFor="duration" className="input-label">
                    Durata stimata {isQuestRewardable ? "*" : null}
                  </label>
                  <div className="flex flex-col items-start gap-y-2">
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Durata..."
                      aria-describedby="duration-input"
                      className="quest-form-input order-1"
                      required={isQuestRewardable ? true : false}
                      value={estimatedTime}
                      onChange={(e) =>
                        setEstimatedTime(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                    <span id="duration-unit">Espressa in minuti</span>
                  </div>
                  {/* XP rewards placeholder REMOVED here too (Q4). */}
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {/*
                DATE/TIME: COMMENTS (Q3). Same reason as the
                additional variant. See above.
              */}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={updateMutation.loading}
                className="btn-primary quest-form-submit-grid-area disabled:opacity-50"
              >
                {updateMutation.loading
                  ? t("questLog.form.saving")
                  : "Modifica missione"}
              </button>
            </form>
          </section>
        </Suspense>
      </>
    );
}
