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

export default function QuestForm(props: QuestFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = props.variant === "edit-quest";

  const [isQuestRewardable, setIsQuestRewardable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState<number | "">("");
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    [],
  );
  const [trackOnCreate, setTrackOnCreate] = useState(false);

  const { data: attributes, loading: attrLoading } = useApi<AttributeInDb[]>(
    () => api.get("/attributes"),
    [],
  );

  const { data: existingQuest, loading: loadingQuest } =
    useApi<QuestInDb>(() => {
      if (!isEdit || !id) {
        return Promise.resolve({
          data: { ok: true, status: 200, message: "", data: undefined },
        }) as any;
      }
      return api.get(`/quests/${id}`);
    }, [id, isEdit]);

  useEffect(() => {
    if (!existingQuest || !isEdit) return;
    setName(existingQuest.name ?? "");
    setDescription(existingQuest.description ?? "");
    setEstimatedTime(existingQuest.estimated_time ?? "");
    setIsQuestRewardable(existingQuest.is_rewardable ?? true);
  }, [existingQuest, isEdit]);

  // FIX Q15: reset trackOnCreate when rewardable is false
  useEffect(() => {
    if (!isQuestRewardable) {
      setTrackOnCreate(false);
    }
  }, [isQuestRewardable]);

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

    const estimated_time =
      isQuestRewardable && estimatedTime !== ""
        ? Number(estimatedTime)
        : undefined;

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

  type ObjOfStrings = { [key: string]: string };

  const classStyles: ObjOfStrings = {
    inputsWrapper:
      "flex flex-col justify-center items-start gap-y-12 w-full sm:grid sm:grid-cols-3",
    labelAndInputContainer:
      "flex flex-col gap-y-4 justify-center items-start sm:items-start sm:text-start",
    firstGridInput: "sm:col-start-1 sm:col-end-2",
    secondGridInput: "sm:col-start-3 sm:col-end-3",
  };

  if (isEdit && loadingQuest) return <LoadingFallback />;

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
                {t("questLog.form.backToLog")}
              </span>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <div className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
              <h1
                aria-labelledby="add-quest-heading"
                className="h1-font-size text-center order-1"
              >
                {t("questLog.form.newQuest")}
              </h1>
              <Suspense fallback={<LoadingFallback />}>
                <AddQuestIcon />
              </Suspense>
            </div>

            <form
              className="quest-form-grid-area-container"
              onSubmit={handleSubmit}
            >
              <fieldset
                className={`${classStyles.inputsWrapper} quest-title-description-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="quest-title" className="input-label">
                    {t("questLog.form.title")} *
                  </label>
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
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="quest-description" className="input-label">
                    {t("questLog.form.description")}
                  </label>
                  <textarea
                    id="quest-description"
                    name="quest_description"
                    placeholder={t("questLog.form.descriptionPlaceholder")}
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

                {isQuestRewardable && (
                  <fieldset className={classStyles.firstGridInput}>
                    <legend className="input-label">
                      {t("questLog.form.involvedAttributes")} *
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

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${
                    isQuestRewardable
                      ? classStyles.secondGridInput
                      : "col-start-2 col-end-2 row-span-2"
                  }`}
                >
                  <label htmlFor="duration" className="input-label">
                    {t("questLog.form.estimatedTime")}{" "}
                    {isQuestRewardable ? "*" : null}
                  </label>
                  <div className="flex flex-col items-start gap-y-2">
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="0"
                      step="1"
                      placeholder={t("questLog.form.durationPlaceholder")}
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
                    <span id="duration-unit">{t("questLog.form.minutes")}</span>
                  </div>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {isQuestRewardable && (
                <>
                  <fieldset className="quest-do-track-grid-area">
                    <legend className="input-label">
                      {t("questLog.form.trackPrompt")} *
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

                  <div className="bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111] divider-5-grid-area"></div>
                </>
              )}

              <button
                type="submit"
                disabled={createMutation.loading}
                className="btn-primary quest-form-submit-grid-area disabled:opacity-50"
              >
                {createMutation.loading
                  ? t("questLog.form.creating")
                  : t("questLog.form.create")}
              </button>
            </form>
          </section>
        </Suspense>
      </>
    );

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
                {t("questLog.form.backToLog")}
              </span>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <div className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
              <h1
                aria-labelledby="add-quest-heading"
                className="h1-font-size text-center order-1"
              >
                {t("questLog.form.editQuest")}
              </h1>
              <Suspense fallback={<LoadingFallback />}>
                <EditQuestIcon />
              </Suspense>
            </div>

            <form
              className="quest-form-grid-area-container"
              onSubmit={handleSubmit}
            >
              <fieldset
                className={`${classStyles.inputsWrapper} quest-title-description-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="quest-title" className="input-label">
                    {t("questLog.form.title")} *
                  </label>
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
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="quest-description" className="input-label">
                    {t("questLog.form.description")}
                  </label>
                  <textarea
                    id="quest-description"
                    name="quest_description"
                    placeholder={t("questLog.form.descriptionPlaceholder")}
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

                {isQuestRewardable && (
                  <fieldset className={classStyles.firstGridInput} disabled>
                    <legend className="input-label">
                      {t("questLog.form.involvedAttributes")} (
                      {t("questLog.form.attributesNotEditable")})
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
                    {t("questLog.form.estimatedTime")}{" "}
                    {isQuestRewardable ? "*" : null}
                  </label>
                  <div className="flex flex-col items-start gap-y-2">
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="0"
                      step="1"
                      placeholder={t("questLog.form.durationPlaceholder")}
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
                    <span id="duration-unit">{t("questLog.form.minutes")}</span>
                  </div>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              <button
                type="submit"
                disabled={updateMutation.loading}
                className="btn-primary quest-form-submit-grid-area disabled:opacity-50"
              >
                {updateMutation.loading
                  ? t("questLog.form.saving")
                  : t("questLog.form.save")}
              </button>
            </form>
          </section>
        </Suspense>
      </>
    );
}
