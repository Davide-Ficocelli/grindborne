import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Header from "../layout/Header";
import MainContent from "../layout/MainContent";
import AttributesChart from "../components/AttributesChart";
import Attribute from "../components/Attribute";
import type { TailwindClasses } from "../utils/types";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export default function PlayerStatusPage() {
  const classStyles: TailwindClasses = {
    sectionHeading:
      "h2-font-size px-4 text-orange-100 pb-4 bottom-linear-gradient-border after:from-orange-100 after:to-[#111]",
    verticalFlexContainer: "flex flex-col gap-y-4",
    playerAndLevelInfoContainer:
      "flex justify-between pb-4 standard-font-size bottom-linear-gradient-border after:from-[#ffffff] after:to-[#111]",
    horizontalPadding: "px-4",
  };

  return (
    <>
      <Header />

      <MainContent>
        <section className="flex flex-col gap-y-18">
          <h1
            aria-labelledby="status-heading"
            className="h1-font-size text-center"
          >
            Status
          </h1>
          <section className={classStyles.verticalFlexContainer}>
            <h2 id="main-info-heading" className={classStyles.sectionHeading}>
              Main Info
            </h2>
            <dl className={classStyles.verticalFlexContainer}>
              <dt className={classStyles.playerAndLevelInfoContainer}>
                <p className={classStyles.horizontalPadding}>Player:</p>
                <p className={classStyles.horizontalPadding}>SolidDavid03</p>
              </dt>
              <dt className="flex flex-col standard-font-size gap-y-2 bottom-linear-gradient-border after:from-[#ffffff] after:to-[#111]">
                <p className={classStyles.horizontalPadding}>Stamina</p>
                <meter max="100" value="75" className="w-screen mb-4"></meter>
              </dt>

              <dt className={classStyles.playerAndLevelInfoContainer}>
                <p className={classStyles.horizontalPadding}>Level</p>
                <p className={classStyles.horizontalPadding}>1</p>
              </dt>
            </dl>
          </section>

          <section className={classStyles.verticalFlexContainer}>
            <h2 id="attributes-heading" className={classStyles.sectionHeading}>
              Attributes
            </h2>
            <dl className={classStyles.verticalFlexContainer}>
              <Attribute classStyles={classStyles} />
            </dl>
            <div
              className={`small-font-size w-50 self-start flex items-center gap-x-2 ${classStyles.horizontalPadding}`}
            >
              <FontAwesomeIcon
                icon={faPlus}
                className="border-2 rounded-xl p-1"
              />
              <p>Add attribute</p>
            </div>
          </section>

          <section className="flex flex-col justify-center items-center gap-y-8 pb-4">
            <h2
              aria-labelledby="attributes-chart-heading"
              className={`${classStyles.sectionHeading} w-screen self-start`}
            >
              Proficiency
            </h2>
            <AttributesChart />
          </section>
        </section>
      </MainContent>
    </>
  );
}
