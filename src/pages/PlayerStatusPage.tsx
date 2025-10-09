import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Header from "../layout/Header";
import MainContent from "../layout/MainContent";
import AttributesChart from "../components/AttributesChart";
import Attribute from "../components/Attribute";
import type { ObjOfStrings } from "../utils/types";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import statusIcon from "../assets/icons/ER_Main_Menu_Icon_Status.webp";

export default function PlayerStatusPage() {
  const { t } = useTranslation();

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
      <Header />

      <MainContent>
        <section
          aria-labelledby="status-page"
          className="flex flex-col gap-y-18 md:gap-y-0 status-grid-area-container"
        >
          <div
            className={`flex gap-x-8 items-center py-16 ${classStyles.horizontalPadding} status-heading`}
          >
            <h1
              aria-labelledby="status-heading"
              className="h1-font-size order-1"
            >
              {statusHeading}
            </h1>
            <img src={statusIcon} className="size-20" />
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
                <p className={classStyles.horizontalPadding}>SolidDavid03</p>
              </dt>
              <dt className="flex flex-col standard-font-size gap-y-2 bottom-linear-gradient-border after:from-[#ffffff] after:to-[#111]">
                <p className={classStyles.horizontalPadding}>{staminaLabel}</p>
                <div className="w-full relative">
                  <meter
                    max="100"
                    value="75"
                    className="w-screen mb-4 md:w-full"
                  ></meter>
                  <span className="absolute top-[0.30rem] left-4 text-start text-[0.6rem] leading-none">
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
              <Attribute classStyles={classStyles} />
            </dl>
            <div
              className={`small-font-size w-50 self-start flex items-center gap-x-2 md:pb-4 ${classStyles.horizontalPadding}`}
            >
              <FontAwesomeIcon
                icon={faPlus}
                className="border-2 rounded-xl p-1"
              />
              <p>{addAttributeBtnLabel}</p>
            </div>
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
            <AttributesChart />
          </section>
        </section>
      </MainContent>
    </>
  );
}
