import { useTranslation } from "react-i18next";
import { getDecayDisplay } from "../lib/attributeDisplayHelpers";
import type { AttributeInDb } from "../types/attribute";

type AttributeDecayTextProps = {
  attribute: AttributeInDb;
  // The card shows "Decays on <date>"; the details page already has a
  // "Decay date" title, so it shows only the date.
  showLabel: boolean;
};

// Decay line: the real decay date when the attribute can decay, otherwise a
// message telling the user when the date will start to appear.
// A plain if/else is used (instead of a nested ternary) for readability.
export default function AttributeDecayText(props: AttributeDecayTextProps) {
  // `i18n` is needed to format the decay date in the user's language.
  const { t, i18n } = useTranslation();
  const decayDisplay = getDecayDisplay(props.attribute);

  let decayText: string;
  if (decayDisplay.kind === "scheduled") {
    const formattedDate = decayDisplay.date.toLocaleDateString(i18n.language);
    if (props.showLabel) {
      decayText = `${t("playerStatusPage.attribute.decayDateLabel")} ${formattedDate}`;
    } else {
      decayText = formattedDate;
    }
  } else {
    decayText = t("playerStatusPage.attribute.decayNotStarted");
  }

  return <>{decayText}</>;
}
