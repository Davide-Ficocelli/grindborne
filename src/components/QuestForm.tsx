import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingFallback from "./LoadingFallback";

type QuestFormProps = {
  variant: string;
};

export default function QuestForm(props: QuestFormProps) {
  const [isQuestRewardable, setIsQuestRewardable] = useState(true);

  function toggleQuestRewards(e: any) {
    e.preventDefault();
    setIsQuestRewardable((prevIsQuestRewardable) => !prevIsQuestRewardable);
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
    }))
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
            <form className="quest-form-grid-area-container">
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
                  <button className="btn-primary" onClick={toggleQuestRewards}>
                    {isQuestRewardable ? "Disattiva" : "Attiva"}
                  </button>
                </div>

                {/* Attributes fieldset */}
                {isQuestRewardable && (
                  <fieldset className={classStyles.firstGridInput}>
                    <legend className="input-label">
                      Attributi coinvolti *
                    </legend>

                    <div>
                      <div className="flex gap-x-1">
                        <input
                          id="forza"
                          name="forza"
                          type="checkbox"
                          value="forza"
                        />
                        <label htmlFor="forza">Forza</label>
                      </div>

                      <div className="flex gap-x-1">
                        <input
                          id="intelligenza"
                          name="intelligenza"
                          type="checkbox"
                          value="intelligenza"
                        />
                        <label htmlFor="intelligenza">Intelligenza</label>
                      </div>
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
                    />
                    <span id="duration-unit">Espressa in minuti</span>
                  </div>

                  {isQuestRewardable && (
                    <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                      <p className="flex flex-col">
                        Ricompensa XP per attributo:<span>200</span>
                      </p>
                      <p className="flex flex-col">
                        Ricompensa totale XP:<span>400</span>
                      </p>
                    </div>
                  )}
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {/* Start date and time selection */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-date-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="date" className="input-label">
                    Data
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="quest-form-input"
                  />
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="time" className="input-label">
                    Orario
                  </label>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    className="quest-form-input"
                  />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area"></div>

              {/* Due date and due time selection */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-due-date-due-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="due-date" className="input-label">
                    Data di scadenza
                  </label>
                  <input
                    id="due-date"
                    name="due_date"
                    type="date"
                    className="quest-form-input"
                  />
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="due-time" className="input-label">
                    Orario di scadenza
                  </label>
                  <input
                    id="due-time"
                    name="due_time"
                    type="time"
                    className="quest-form-input"
                  />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-4-grid-area"></div>

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
                        />
                        <label htmlFor="track-yes">Sì</label>
                      </div>

                      <div className="flex gap-x-1">
                        <input
                          id="track-no"
                          name="track"
                          type="radio"
                          value="no"
                          defaultChecked
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
                className="btn-primary quest-form-submit-grid-area"
              >
                Crea missione
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
    }))
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

            {/* --- ADD QUEST FORM --- */}
            <form className="quest-form-grid-area-container">
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
                  <button className="btn-primary" onClick={toggleQuestRewards}>
                    {isQuestRewardable ? "Disattiva" : "Attiva"}
                  </button>
                </div>

                {/* Attributes fieldset */}
                {isQuestRewardable && (
                  <fieldset className={classStyles.firstGridInput}>
                    <legend className="input-label">
                      Attributi coinvolti *
                    </legend>

                    <div>
                      <div className="flex gap-x-1">
                        <input
                          id="forza"
                          name="forza"
                          type="checkbox"
                          value="forza"
                        />
                        <label htmlFor="forza">Forza</label>
                      </div>

                      <div className="flex gap-x-1">
                        <input
                          id="intelligenza"
                          name="intelligenza"
                          type="checkbox"
                          value="intelligenza"
                        />
                        <label htmlFor="intelligenza">Intelligenza</label>
                      </div>
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
                    />
                    <span id="duration-unit">Espressa in minuti</span>
                  </div>

                  {isQuestRewardable && (
                    <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                      <p className="flex flex-col">
                        Ricompensa XP per attributo:<span>200</span>
                      </p>
                      <p className="flex flex-col">
                        Ricompensa totale XP:<span>400</span>
                      </p>
                    </div>
                  )}
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {/* Start date and time selection */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-date-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="date" className="input-label">
                    Data
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="quest-form-input"
                  />
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="time" className="input-label">
                    Orario
                  </label>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    className="quest-form-input"
                  />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area"></div>

              {/* Due date and due time selection */}
              <fieldset
                className={`${classStyles.inputsWrapper} quest-due-date-due-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.firstGridInput}`}
                >
                  <label htmlFor="due-date" className="input-label">
                    Data di scadenza
                  </label>
                  <input
                    id="due-date"
                    name="due_date"
                    type="date"
                    className="quest-form-input"
                  />
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndInputContainer} ${classStyles.secondGridInput}`}
                >
                  <label htmlFor="due-time" className="input-label">
                    Orario di scadenza
                  </label>
                  <input
                    id="due-time"
                    name="due_time"
                    type="time"
                    className="quest-form-input"
                  />
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-4-grid-area"></div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary quest-form-submit-grid-area"
              >
                Modifica missione
              </button>
            </form>
          </section>
        </Suspense>
      </>
    );
}
