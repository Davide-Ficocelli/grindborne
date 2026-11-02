import { useTranslation } from "react-i18next";
import { type AttributeInDb } from "../types/attribute";

interface AttributeProps {
  key: string;
  attrData: AttributeInDb;
}

export default function Attribute(props: AttributeProps) {
  const { t } = useTranslation();

  const tAttribute = t("playerStatusPage.attribute", {
    returnObjects: true,
  }) as { attributeDecayingWarning: string };

  const data = props.attrData;

  return (
    <dt className="flex flex-col gap-4 standard-font-size bottom-linear-gradient-border pb-4 after:from-[#ffffff] after:to-[#111]">
      <div className="flex justify-between items-center w-full px-4">
        <div className="attribute-name-grid-area flex items-center justify-between gap-x-4">
          <p className="text-start">{data?.name || "N/A"}</p>
        </div>
        <p className="text-center">{data?.level || 0}</p>
      </div>
      <div className="w-full relative">
        <progress
          id="xp-bar"
          max="100"
          value={data?.xp || 0}
          className="w-full h-3"
        ></progress>
        <span className="absolute top-[14px] left-4 text-start text-[0.6rem] leading-none">
          {data?.xp || 0}/100 XP
        </span>
      </div>
      <span className="small-font-size mb-4 px-4">
        {tAttribute.attributeDecayingWarning}
      </span>
    </dt>
  );
}
