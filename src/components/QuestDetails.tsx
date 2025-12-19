import { lazy, Suspense } from "react";
import { useQuest } from "../hooks/useQuest";
import { Link, useParams } from "react-router-dom";
import {
  faArrowLeft,
  faPencil,
  faTrash,
  faCheck,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingFallback from "./LoadingFallback";

type QuestDetailsProps = {
  variant: string;
};

export default function QuestDetails(props: QuestDetailsProps) {
  const { id } = useParams();
  const currentQuest = useQuest(Number(id));

  const QuestDetailsIcon = lazy(() =>
    import("../assets/icons/quest-details.png").then((module) => ({
      default: () => (
        <img
          src={module.default}
          alt="Quest details icon"
          className="size-20 rounded-lg border border-[#FFD6A7]"
        />
      ),
    }))
  );

  type ObjOfStrings = {
    [key: string]: string;
  };

  // sm:flex-row sm:justify-baseline sm:items-start

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

  // Conditional rendering based on the variant props
  // --- FULL PAGE VARIANT ---
  if (props.variant === "full-page" || props.variant === undefined)
    return (
      <Suspense fallback={<LoadingFallback />}>
        <section aria-label="Dettagli della missione">
          {/* Navigation */}
          <nav>
            <Link
              to="/quest-log/list"
              className="flex items-center justify-center medium-font-size text-orange-200 hover:text-yellow-500 focus:text-yellow-500 hover:border-b-yellow-500 px-4 pt-4 sm:justify-start"
            >
              <span className="order-1 focus:border-b-yellow-500 hover:border-b-2 focus:border-b-2 transition-[border] duration-100 ease-in">
                Ritorna al registro missioni
              </span>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </nav>

          {/* Header Section */}
          <header className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
            <h1 className="h1-font-size text-center order-1">
              Dettagli missione
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
                  currentQuest?.questDescription
                    ? classStyles.firstGridField
                    : "sm:col-start-2 sm:col-end-3"
                }`}
              >
                <h2 className="field-title">Titolo</h2>
                <p>{currentQuest?.questTitle}</p>
              </div>

              {currentQuest?.questDescription && (
                <div
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <h2 className="field-title">Descrizione</h2>
                  <p>{currentQuest?.questDescription}</p>
                </div>
              )}
            </div>

            <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area" />

            {/* Attributes and Duration */}
            {currentQuest?.involvedAttributes &&
              currentQuest.estimatedDuration && (
                <>
                  <div
                    className={`${classStyles.fieldsWrapper} gap-y-8 sm:relative quest-attributes-duration-grid-area`}
                  >
                    <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                      <p className="medium-font-size text-center">
                        Ricompense missione{" "}
                        <span className="font-bold">attive</span>
                      </p>
                    </div>

                    {currentQuest?.involvedAttributes && (
                      <div className={classStyles.firstGridField}>
                        <h3 className="field-title">Attributi coinvolti</h3>
                        <ul className="flex flex-col gap-y-2">
                          {currentQuest?.involvedAttributes.map(
                            (attribute, index) => (
                              <li key={index}>{attribute}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <div
                      className={`${classStyles.labelAndFieldContainer} ${
                        currentQuest.involvedAttributes
                          ? classStyles.secondGridField
                          : "col-start-2 col-end-3 row-start-2 row-end-2"
                      }`}
                    >
                      <h3 className="field-title">Durata stimata</h3>
                      <p>
                        {currentQuest?.estimatedDuration} <span>minuti</span>
                      </p>

                      <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                        <p>
                          Ricompensa XP per attributo: <strong>200</strong>
                        </p>
                        <p>
                          Ricompensa totale XP: <strong>400</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area" />
                </>
              )}

            {/* Start Date and Time */}
            {currentQuest?.startDate && currentQuest?.startTime && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} quest-date-time-grid-area`}
                >
                  {currentQuest.startDate && (
                    <div
                      className={`${classStyles.labelAndFieldContainer} ${
                        currentQuest.startTime
                          ? classStyles.firstGridField
                          : "col-start-2 col-end-2"
                      }`}
                    >
                      <h3 className="field-title">Data</h3>
                      <time dateTime="2025-12-16">
                        {currentQuest?.startDate}
                      </time>
                    </div>
                  )}

                  {currentQuest.startTime && (
                    <div
                      className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                    >
                      <h3 className="field-title">Orario</h3>
                      <time dateTime="18:30">{currentQuest?.startTime}</time>
                    </div>
                  )}
                </div>

                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area" />
              </>
            )}

            {/* Due Date and Time */}
            {currentQuest?.dueDate && currentQuest.dueTime && (
              <>
                <div
                  className={`${classStyles.fieldsWrapper} quest-due-date-due-time-grid-area`}
                >
                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                  >
                    <h3 className="field-title">Data di scadenza</h3>
                    <time dateTime="2025-12-18">{currentQuest?.dueDate}</time>
                  </div>

                  <div
                    className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                  >
                    <h3 className="field-title">Orario di scadenza</h3>
                    <time dateTime="15:00">{currentQuest?.dueTime}</time>
                  </div>
                </div>

                <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-4-grid-area" />
              </>
            )}

            {/* Actions Toolbar */}
            <nav
              aria-label="Azioni della missione"
              role="toolbar"
              className="w-full flex items-baseline gap-x-2 justify-center sm:justify-evenly quest-actions-grid-area"
            >
              <button
                className={classStyles.actionBtn}
                aria-label="Segna questa missione come fallita"
              >
                <span className="order-1 text-center small-font-size">
                  Segna come fallita
                </span>
                <FontAwesomeIcon
                  className={classStyles.actionIcon}
                  icon={faX}
                  aria-hidden="true"
                />
              </button>
              <button
                className={classStyles.actionBtn}
                aria-label="Segna questa missione come completata"
              >
                <span className="order-1 text-center small-font-size">
                  Segna come completata
                </span>
                <FontAwesomeIcon
                  className={classStyles.actionIcon}
                  icon={faCheck}
                  aria-hidden="true"
                />
              </button>
              <button
                className={classStyles.actionBtn}
                aria-label="Elimina questa missione"
              >
                <span className="order-1 text-center small-font-size">
                  Elimina
                </span>
                <FontAwesomeIcon
                  className={classStyles.actionIcon}
                  icon={faTrash}
                  aria-hidden="true"
                />
              </button>
              <Link
                to={`/quest-log/action/edit/${1}`}
                className={classStyles.actionBtn}
                aria-label="Modifica questa missione"
              >
                <span className="order-1 text-center small-font-size">
                  Modifica
                </span>
                <FontAwesomeIcon
                  className={classStyles.actionIcon}
                  icon={faPencil}
                  aria-hidden="true"
                />
              </Link>
            </nav>
          </section>
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
              Dettagli missione
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
                <h3 className="field-title">Titolo</h3>
                <p>Esercizi in palestra</p>
              </div>

              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
              >
                <h3 className="field-title">Descrizione</h3>
                <p>Solleva dei pesi per migliorare la massa muscolare</p>
              </div>
            </div>

            <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area" />

            {/* Attributes and Duration */}
            <div
              className={`${classStyles.fieldsWrapper} gap-y-8 sm:relative quest-attributes-duration-grid-area`}
            >
              <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                <p className="medium-font-size text-center">
                  Ricompense missione <span className="font-bold">attive</span>
                </p>
              </div>

              <div className={classStyles.firstGridField}>
                <h4 className="field-title">Attributi coinvolti</h4>
                <ul className="flex flex-col gap-y-2">
                  <li>Forza</li>
                  <li>Intelligenza</li>
                </ul>
              </div>

              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
              >
                <h4 className="field-title">Durata stimata</h4>
                <p>
                  30 <span>minuti</span>
                </p>

                <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                  <p>
                    Ricompensa XP per attributo: <strong>200</strong>
                  </p>
                  <p>
                    Ricompensa totale XP: <strong>400</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area" />

            {/* Start Date and Time */}
            <div
              className={`${classStyles.fieldsWrapper} quest-date-time-grid-area`}
            >
              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
              >
                <h4 className="field-title">Data</h4>
                <time dateTime="2025-12-16">16/12/2025</time>
              </div>

              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
              >
                <h4 className="field-title">Orario</h4>
                <time dateTime="18:30">18:30</time>
              </div>
            </div>

            <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area" />

            {/* Due Date and Time */}
            <div
              className={`${classStyles.fieldsWrapper} quest-due-date-due-time-grid-area`}
            >
              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
              >
                <h4 className="field-title">Data di scadenza</h4>
                <time dateTime="2025-12-18">18/12/2025</time>
              </div>

              <div
                className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
              >
                <h4 className="field-title">Orario di scadenza</h4>
                <time dateTime="15:00">15:00</time>
              </div>
            </div>
          </section>
        </aside>
      </Suspense>
    );
}
