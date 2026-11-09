import { useTranslation } from "react-i18next";
import { faInfo, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type AttributeInDb } from "../types/attribute";

interface AttributeProps {
  key: string;
  attrData: AttributeInDb;
  onDeleteRequest?: () => void;
}

export default function Attribute(props: AttributeProps) {
  const { t } = useTranslation();

  const tAttribute = t("playerStatusPage.attribute", {
    returnObjects: true,
  }) as { attributeDecayingWarning: string };

  const data = props.attrData;

  const actionIcon = "text-white cursor-pointer sm:text-xl";
  const actionBtn =
    "text-white flex flex-col justify-center items-center gap-y-1 hover:opacity-80 focus:opacity-80 active:opacity-80 cursor-pointer";

  // FIX: Previously, `max="100"` was hard-coded. The correct value is
  // the current threshold for the attribute, which depends on the level and is
  // stored in the database.
  const max = data.xp_to_next_level ?? 100;
  const currentXp = data.xp ?? 0;

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
          id={`xp-bar-${data.id}`}
          max={max}
          value={currentXp}
          className="w-full h-3"
        />
        <span className="absolute top-[14px] left-4 text-start text-[0.6rem] leading-none">
          {currentXp}/{max} XP
        </span>
      </div>
      <span className="small-font-size mb-2 px-4">
        {tAttribute.attributeDecayingWarning}
      </span>

      {/* Stock icons: consistent with Quest.tsx. No ‘complete’ or ‘fail’ here. */}
      <nav
        aria-label="Attribute actions"
        role="toolbar"
        className="flex items-center gap-x-6 justify-center"
      >
        <button
          type="button"
          className={actionBtn}
          onClick={props.onDeleteRequest}
        >
          <span className="order-1 text-center small-font-size">
            {t("playerStatusPage.attribute.actions.delete")}
          </span>
          <FontAwesomeIcon className={actionIcon} icon={faTrash} />
        </button>
        <Link to={`/attributes/edit/${data.id}`} className={actionBtn}>
          <span className="order-1 text-center small-font-size">
            {t("playerStatusPage.attribute.actions.edit")}
          </span>
          <FontAwesomeIcon className={actionIcon} icon={faPencil} />
        </Link>
        <Link to={`/attributes/view/${data.id}`} className={actionBtn}>
          <span className="order-1 text-center small-font-size">
            {t("playerStatusPage.attribute.actions.details")}
          </span>
          <FontAwesomeIcon className={actionIcon} icon={faInfo} />
        </Link>
      </nav>
    </dt>
  );
}
