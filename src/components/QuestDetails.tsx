import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
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

  const involvedAttributes = [
    { attributeName: "Forza" },
    { attributeName: "Intelligenza" },
  ];

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
  if (props.variant === "full-page" || props.variant === undefined)
    return (
      <>
        <Suspense fallback={<LoadingFallback />}>
          <section
            aria-labelledby="quest-details-page"
            className="flex flex-col"
          >
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
            <div className="flex flex-wrap justify-center items-center w-screen gap-x-8 gap-y-8 py-16 px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
              <h1
                aria-labelledby="add-quest-heading"
                className="h1-font-size text-center order-1"
              >
                Dettagli missione
              </h1>
              <Suspense fallback={<LoadingFallback />}>
                <QuestDetailsIcon />
              </Suspense>
            </div>

            {/* --- QUEST DETAILS --- */}
            <section className="quest-details-grid-area-container">
              {/* Container for title and description */}
              <fieldset
                className={`${classStyles.fieldsWrapper} quest-title-description-grid-area`}
              >
                {/* Title field */}
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                >
                  <p className="field-title">Titolo</p>
                  <p>Esercizi in palestra</p>
                </fieldset>

                {/* Description field */}
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <p className="field-title flex">Descrizione</p>
                  <p>Solleva dei pesi per migliorare la massa muscolare</p>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area"></div>

              {/* Container for Attributes and duration field */}
              {/* These are the main fields that will determine the total XP reward from quest completion */}
              <fieldset
                className={`${classStyles.fieldsWrapper} gap-y-8 sm:relative quest-attributes-duration-grid-area`}
              >
                {/* Toggle quest rewards button */}
                <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                  <p className="medium-font-size text-center">
                    Ricompense missione{" "}
                    <span className="font-bold">attive</span>
                  </p>
                </div>

                {/* Attributes fieldset */}
                <fieldset className={classStyles.firstGridField}>
                  <p className="field-title">Attributi coinvolti</p>
                  <ul className="flex flex-col gap-y-2">
                    {involvedAttributes.map((attribute) => (
                      <li>{attribute.attributeName}</li>
                    ))}
                  </ul>
                </fieldset>

                {/* Duration field with measure unit */}
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <p className="field-title">Durata stimata</p>
                  <p>
                    30 <span>minuti</span>
                  </p>

                  <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                    <p className="flex flex-col">
                      Ricompensa XP per attributo:<span>200</span>
                    </p>
                    <p className="flex flex-col">
                      Ricompensa totale XP:<span>400</span>
                    </p>
                  </div>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {/* Start date and time selection */}
              <fieldset
                className={`${classStyles.fieldsWrapper} quest-date-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                >
                  <p className="field-title">Data</p>
                  <p>16/12/2025</p>
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <p className="field-title">Orario</p>
                  <p>18:30</p>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area"></div>

              {/* Due date and due time selection */}
              <fieldset
                className={`${classStyles.fieldsWrapper} quest-due-date-due-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                >
                  <p className="field-title">Data di scadenza</p>
                  <p>18/12/2025</p>
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <label htmlFor="due-time" className="field-title">
                    Orario di scadenza
                  </label>
                  <p>15:00</p>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-4-grid-area"></div>

              {/* Quest actions bar */}
              <nav
                aria-label="Actions"
                role="toolbar"
                className="w-full flex items-baseline gap-x-2 justify-center sm:justify-evenly quest-actions-grid-area"
              >
                <button className={classStyles.actionBtn}>
                  <span className="order-1 text-center small-font-size">
                    Segna come fallita
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faX}
                  />
                </button>
                <button className={classStyles.actionBtn}>
                  <span className="order-1 text-center small-font-size">
                    Segna come completata
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faCheck}
                  />
                </button>
                <button className={classStyles.actionBtn}>
                  <span className="order-1 text-center small-font-size">
                    Elimina
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faTrash}
                  />
                </button>
                <Link to="" className={classStyles.actionBtn}>
                  <span className="order-1 text-center small-font-size">
                    Modifica
                  </span>
                  <FontAwesomeIcon
                    className={classStyles.actionIcon}
                    icon={faPencil}
                  />
                </Link>
              </nav>
            </section>
          </section>
        </Suspense>
      </>
    );

  if (props.variant === "side-view")
    return (
      <>
        <Suspense fallback={<LoadingFallback />}>
          <section
            aria-labelledby="quest-details"
            id="quest-details-side-view"
            className="flex flex-col border-r-white border-r-1"
          >
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-8 py-[3.15rem] px-4 bottom-linear-gradient-border after:from-[#FFFFFF] after:to-[#111]">
              <h2
                aria-labelledby="add-quest-heading"
                className="h2-font-size text-center order-1"
              >
                Dettagli missione
              </h2>
              <Suspense fallback={<LoadingFallback />}>
                <QuestDetailsIcon />
              </Suspense>
            </div>

            {/* --- QUEST DETAILS --- */}
            <section className="quest-details-grid-area-container h-screen overflow-y-scroll">
              {/* Container for title and description */}
              <fieldset
                className={`${classStyles.fieldsWrapper} quest-title-description-grid-area`}
              >
                {/* Title field */}
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                >
                  <p className="field-title">Titolo</p>
                  <p>Esercizi in palestra</p>
                </fieldset>

                {/* Description field */}
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <p className="field-title flex">Descrizione</p>
                  <p>Solleva dei pesi per migliorare la massa muscolare</p>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-1-grid-area"></div>

              {/* Container for Attributes and duration field */}
              {/* These are the main fields that will determine the total XP reward from quest completion */}
              <fieldset
                className={`${classStyles.fieldsWrapper} gap-y-8 sm:relative quest-attributes-duration-grid-area`}
              >
                {/* Toggle quest rewards button */}
                <div className="flex flex-col gap-y-4 sm:col-start-2 sm:col-end-2">
                  <p className="medium-font-size text-center">
                    Ricompense missione{" "}
                    <span className="font-bold">attive</span>
                  </p>
                </div>

                {/* Attributes fieldset */}
                <fieldset className={classStyles.firstGridField}>
                  <p className="field-title">Attributi coinvolti</p>
                  <ul className="flex flex-col gap-y-2">
                    {involvedAttributes.map((attribute) => (
                      <li>{attribute.attributeName}</li>
                    ))}
                  </ul>
                </fieldset>

                {/* Duration field with measure unit */}
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <p className="field-title">Durata stimata</p>
                  <p>
                    30 <span>minuti</span>
                  </p>

                  <div className="small-font-size pt-8 flex flex-col gap-y-4 justify-center items-start font-semibold">
                    <p className="flex flex-col">
                      Ricompensa XP per attributo:<span>200</span>
                    </p>
                    <p className="flex flex-col">
                      Ricompensa totale XP:<span>400</span>
                    </p>
                  </div>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-2-grid-area"></div>

              {/* Start date and time selection */}
              <fieldset
                className={`${classStyles.fieldsWrapper} quest-date-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                >
                  <p className="field-title">Data</p>
                  <p>16/12/2025</p>
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <p className="field-title">Orario</p>
                  <p>18:30</p>
                </fieldset>
              </fieldset>

              <div className="bottom-linear-gradient-border after:from-orange-100 after:to-[#111] divider-3-grid-area"></div>

              {/* Due date and due time selection */}
              <fieldset
                className={`${classStyles.fieldsWrapper} quest-due-date-due-time-grid-area`}
              >
                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.firstGridField}`}
                >
                  <p className="field-title">Data di scadenza</p>
                  <p>18/12/2025</p>
                </fieldset>

                <fieldset
                  className={`${classStyles.labelAndFieldContainer} ${classStyles.secondGridField}`}
                >
                  <label htmlFor="due-time" className="field-title">
                    Orario di scadenza
                  </label>
                  <p>15:00</p>
                </fieldset>
              </fieldset>
            </section>
          </section>
        </Suspense>
      </>
    );
}
