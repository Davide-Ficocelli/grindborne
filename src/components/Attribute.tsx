import strengthIcon from "../assets/icons/attribute-placeholder-icon.webp";
import type { TailwindClasses } from "../utils/types";

interface AttributeProps {
  classStyles: TailwindClasses;
}

export default function Attribute({ classStyles }: AttributeProps) {
  return (
    <dt className="standard-font-size grid grid-cols-[4rem_1fr_1fr] gap-y-2 bottom-linear-gradient-border after:from-[#ffffff] after:to-[#111]">
      <img
        src={strengthIcon}
        className={`col-start-1 row-span-1 w-20 ${classStyles.horizontalPadding}`}
      />
      <p className="col-start-2 row-span-1 text-start">Strength</p>
      <p
        className={`col-start-3 row-span-1 text-end ${classStyles.horizontalPadding}`}
      >
        1
      </p>
      <div className="col-span-full w-full relative">
        <progress max="100" value="45" className="w-full h-3"></progress>
        <span className="absolute top-3 left-4 text-start text-[0.6rem] leading-none">
          45/100 XP
        </span>
      </div>
      <span
        className={`col-span-full small-font-size ${classStyles.horizontalPadding} mb-4`}
      >
        7 days left before XP decaying
      </span>
    </dt>
  );
}
