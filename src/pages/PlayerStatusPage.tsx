import { lazy, Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";

// Lazy load all components
const AttributesChart = lazy(() => import("../components/AttributesChart"));
const Attribute = lazy(() => import("../components/Attribute"));

// Lazy load the image
const StatusIcon = lazy(() =>
  import("../assets/icons/player-status.png").then((module) => ({
    default: () => (
      <img
        src={module.default}
        alt="Player status icon"
        className="size-20 rounded-lg"
      />
    ),
  }))
);

// Type definitions remain the same
interface PlayerStatusPageTranslations {
  statusHeading: string;
  mainInfoHeading: string;
  playerLabel: string;
  staminaLabel: string;
  levelLabel: string;
  attributesHeading: string;
  addAttributeBtnLabel: string;
  proficiencyHeading: string;
}

type ObjOfStrings = {
  [key: string]: string;
};

export default function PlayerStatusPage() {
  const { t } = useTranslation();

  const tPlayerStatusPage = t("playerStatusPage", {
    returnObjects: true,
  }) as PlayerStatusPageTranslations;

  const {
    statusHeading,
    mainInfoHeading,
    playerLabel,
    staminaLabel,
    levelLabel,
    attributesHeading,
    addAttributeBtnLabel,
    proficiencyHeading,
  } = tPlayerStatusPage;

  const classStyles: ObjOfStrings = {
    sectionHeading:
      "h2-font-size px-4 text-orange-100 pb-4 bottom-linear-gradient-border after:from-orange-100 after:to-[#111]",
    verticalFlexContainer: "flex flex-col gap-y-4",
    playerAndLevelInfoFlexContainer:
      "flex justify-between pb-4 standard-font-size bottom-linear-gradient-border after:from-[#ffffff] after:to-[#111]",
    horizontalPadding: "px-4",
  };

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <section
          aria-labelledby="status-page"
          className="flex flex-col gap-y-18 md:gap-y-0 status-grid-area-container"
        >
          <div
            className={`flex gap-x-8 items-center py-16 ${classStyles.horizontalPadding} status-heading-grid-area`}
          >
            <h1
              aria-labelledby="status-heading"
              className="h1-font-size order-1"
            >
              {statusHeading}
            </h1>
            <Suspense
              fallback={
                <div className="size-20 bg-gray-300 animate-pulse rounded" />
              }
            >
              <StatusIcon />
            </Suspense>
          </div>

          <section
            aria-labelledby="main-info-section"
            className={`${classStyles.verticalFlexContainer} main-info-section`}
          >
            <h2 id="main-info-heading" className={classStyles.sectionHeading}>
              {mainInfoHeading}
            </h2>
            <dl className={classStyles.verticalFlexContainer}>
              <dt className={classStyles.playerAndLevelInfoFlexContainer}>
                <p className={classStyles.horizontalPadding}>{playerLabel}:</p>
                <p className={`text-end ${classStyles.horizontalPadding}`}>
                  SolidDavid03
                </p>
              </dt>
              <dt className="flex flex-col standard-font-size gap-y-2 bottom-linear-gradient-border pb-4 after:from-[#ffffff] after:to-[#111]">
                <p className={classStyles.horizontalPadding}>{staminaLabel}</p>
                <div className="w-full relative">
                  <meter
                    id="stamina-bar"
                    max="100"
                    value="75"
                    className="w-screen mb-4 md:w-full"
                  ></meter>
                  <span className="absolute top-[10px] left-4 text-start text-[0.6rem] leading-none">
                    10:50/22:00
                  </span>
                </div>
              </dt>

              <dt className={classStyles.playerAndLevelInfoFlexContainer}>
                <p className={classStyles.horizontalPadding}>{levelLabel}</p>
                <p className={classStyles.horizontalPadding}>1</p>
              </dt>
            </dl>
          </section>

          <section
            aria-labelledby="attributes-section"
            className={`${classStyles.verticalFlexContainer} attributes-section`}
          >
            <h2 id="attributes-heading" className={classStyles.sectionHeading}>
              {attributesHeading}
            </h2>
            <dl className={classStyles.verticalFlexContainer}>
              <Suspense fallback={<LoadingFallback />}>
                <Attribute />
              </Suspense>
            </dl>
            <button className="small-font-size max-w-60 gap-x-2 self-start flex items-center justify-center pl-4 md:pb-4 cursor-pointer focus:opacity-80 hover:opacity-80">
              <FontAwesomeIcon
                icon={faPlus}
                className="border-2 rounded-xl p-1"
              />
              <span className="w-full text-center">{addAttributeBtnLabel}</span>
            </button>
          </section>

          <section
            aria-labelledby="proficiency-section"
            className="flex flex-col justify-center items-center gap-y-8 pb-4 proficiency-section"
          >
            <h2
              aria-labelledby="proficiency-heading"
              className={`${classStyles.sectionHeading} w-full self-start`}
            >
              {proficiencyHeading}
            </h2>
            <Suspense fallback={<LoadingFallback />}>
              <AttributesChart />
            </Suspense>
          </section>
        </section>
      </Suspense>
    </>
  );
}
