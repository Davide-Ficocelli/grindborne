import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AddQuestBtn(props: { positionClasses?: string }) {
  const { t } = useTranslation();

  // The Link itself is styled as the button. A <button> nested inside an <a>
  // is invalid HTML and gives keyboard users two tab stops for one action.
  return (
    <Link
      to="/quest-log/action/add"
      className={`flex items-center justify-center gap-x-2 btn-primary ${props.positionClasses ?? ""}`}
    >
      <FontAwesomeIcon
        icon={faPlus}
        className="border-2 rounded-xl p-1 order-1"
        aria-hidden="true"
      />
      <span>{t("common.add")}</span>
    </Link>
  );
}
