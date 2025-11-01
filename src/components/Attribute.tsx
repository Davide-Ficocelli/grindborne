import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";

export default function Attribute() {
  const { t } = useTranslation();

  const tAttribute = t("playerStatusPage.attribute", {
    returnObjects: true,
  }) as { attributeDecayingWarning: string };

  const StrengthIcon = lazy(() =>
    import("../assets/icons/attribute-placeholder-icon.png").then((module) => ({
      default: () => (
        <img
          src={module.default}
          alt="strength icon"
          className="w-15 rounded-lg"
        />
      ),
    }))
  );

  return (
    <dt className="flex flex-col gap-4 standard-font-size bottom-linear-gradient-border pb-4 after:from-[#ffffff] after:to-[#111]">
      <div className="flex justify-between items-center w-screen px-4">
        <div className="attribute-name-grid-area flex items-center justify-between gap-x-4">
          <Suspense fallback={<LoadingFallback />}>
            <StrengthIcon />
          </Suspense>
          <p className="text-start">Forza</p>
        </div>
        <p className="text-end">1</p>
      </div>
      <div className="w-full relative">
        <progress
          id="xp-bar"
          max="100"
          value="45"
          className="w-full h-3"
        ></progress>
        <span className="absolute top-[14px] left-4 text-start text-[0.6rem] leading-none">
          45/100 XP
        </span>
      </div>
      <span className="small-font-size mb-4 px-4">
        {tAttribute.attributeDecayingWarning}
      </span>
    </dt>
  );
}
