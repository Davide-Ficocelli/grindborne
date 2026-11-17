import { useTranslation } from "react-i18next";
import { faInfo, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type AttributeInDb } from "../types/attribute";
import { getIconUrl } from "../lib/iconHelper";
import { useMemo } from "react";
import {
  getAttributeXpCeiling,
  getDecayDisplay,
} from "../lib/attributeDisplayHelpers";

interface AttributeProps {
  key: string;
  attrData: AttributeInDb;
  onDeleteRequest?: () => void;
}

export default function Attribute(props: AttributeProps) {
  // `i18n` is needed to format the decay date in the user's language.
  const { t, i18n } = useTranslation();

  // (the old `tAttribute` object was removed: its only field,
  // `attributeDecayingWarning`, was the hard-coded "7 days before decaying")

  const data = props.attrData;

  const actionIcon = "text-white cursor-pointer sm:text-xl";
  const actionBtn =
    "text-white flex flex-col justify-center items-center gap-y-1 hover:opacity-80 focus:opacity-80 active:opacity-80 cursor-pointer";

  // UPDATE: `xp_to_next_level` is the XP still MISSING to the next level (e.g.
  // 71), not the threshold. The threshold shown to the user is
  // xp + xp_to_next_level (e.g. 29 + 71 = 100). See getAttributeXpCeiling.
  const max = getAttributeXpCeiling(data);
  const currentXp = data.xp ?? 0;

  // FIX: extract icon URL
  const iconUrl = useMemo(() => getIconUrl(data.icon), [data.icon]);

  // Decay line: the real decay date when the attribute can decay, otherwise
  // a message telling the user when the date will start to appear.
  // A plain if/else is used (instead of a nested ternary) for readability.
  const decayDisplay = getDecayDisplay(data);
  let decayMessage: string;
  if (decayDisplay.kind === "scheduled") {
    const formattedDate = decayDisplay.date.toLocaleDateString(i18n.language);
    decayMessage = `${t("playerStatusPage.attribute.decayDateLabel")} ${formattedDate}`;
  } else {
    decayMessage = t("playerStatusPage.attribute.decayNotStarted");
  }

  return (
    <dt className="flex flex-col gap-4 standard-font-size bottom-linear-gradient-border pb-4 after:from-[#ffffff] after:to-[#111]">
      <div className="flex justify-between items-center w-full px-4">
        <div className="attribute-name-grid-area flex items-center justify-between gap-x-4">
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="size-8 rounded-md border border-[#FFD6A7] object-cover"
            />
          )}
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
      <span className="small-font-size mb-2 px-4">{decayMessage}</span>

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
