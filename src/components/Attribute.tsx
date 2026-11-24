import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { faInfo, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import ActionButton from "./ActionButton";
import ActionLink from "./ActionLink";
import ActionToolbar from "./ActionToolbar";
import AttributeDecayText from "./AttributeDecayText";
import { type AttributeInDb } from "../types/attribute";
import { getIconUrl } from "../lib/iconHelper";
import { getAttributeXpCeiling } from "../lib/attributeDisplayHelpers";

// (the `key` prop was removed from this interface: React never passes `key`
// to the component, so declaring it here had no effect)
interface AttributeProps {
  attrData: AttributeInDb;
  onDeleteRequest?: () => void;
}

// Styles of the row: `.status-page__row` in PlayerStatusPage.css.
export default function Attribute(props: AttributeProps) {
  const { t } = useTranslation();

  const data = props.attrData;

  // UPDATE: `xp_to_next_level` is the XP still MISSING to the next level (e.g.
  // 71), not the threshold. The threshold shown to the user is
  // xp + xp_to_next_level (e.g. 29 + 71 = 100). See getAttributeXpCeiling.
  const max = getAttributeXpCeiling(data);
  const currentXp = data.xp ?? 0;

  // Extract icon URL
  const iconUrl = useMemo(() => getIconUrl(data.icon), [data.icon]);

  return (
    <li className="status-page__row bottom-linear-gradient-border standard-font-size flex flex-col gap-4">
      <div className="flex justify-between items-center w-full px-4">
        <div className="flex items-center justify-between gap-x-4">
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
          aria-label={`${data.name} ${t("attributesPage.fields.xp")}`}
          max={max}
          value={currentXp}
          className="status-page__xp-bar w-full h-3"
        />
        <span className="absolute top-[14px] left-4 text-start text-[0.6rem] leading-none">
          {currentXp}/{max} XP
        </span>
      </div>
      <span className="small-font-size mb-2 px-4">
        <AttributeDecayText attribute={data} showLabel />
      </span>

      <ActionToolbar
        label={t("attributesPage.actionsLabel")}
        className="flex items-center gap-x-6 justify-center"
      >
        <ActionButton
          label={t("playerStatusPage.attribute.actions.delete")}
          icon={faTrash}
          onClick={props.onDeleteRequest}
        />
        <ActionLink
          label={t("playerStatusPage.attribute.actions.edit")}
          icon={faPencil}
          to={`/attributes/edit/${data.id}`}
        />
        <ActionLink
          label={t("playerStatusPage.attribute.actions.details")}
          icon={faInfo}
          to={`/attributes/view/${data.id}`}
        />
      </ActionToolbar>
    </li>
  );
}
