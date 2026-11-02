import { useTranslation } from "react-i18next";
import {
  faInfo,
  faPencil,
  faTrash,
  faCheck,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestInDb } from "../types/quest";

// Component representing a single quest

type QuestProps = {
  quest: QuestInDb; // Accept the full object
  styles?: string;
};

export default function Quest(props: QuestProps) {
  const { t } = useTranslation();
  const { quest, styles } = props;

  type ObjOfStrings = {
    [key: string]: string;
  };

  const classStyles: ObjOfStrings = {
    actionIcon: "text-white cursor-pointer sm:text-2xl",
    actionBtn:
      "text-white flex flex-col justify-center items-center gap-y-2 hover:opacity-80 focus:opacity-80 active:opacity-80 cursor-pointer",
  };

  return (
    <article
      className={`flex flex-col gap-y-4 items-center p-4 bottom-linear-gradient-border after:from-white after:to-[#111] w-full ${styles}`}
    >
      <div className="flex gap-x-8 items-center px-4">
        <h2 className="order-1 h2-font-size text-center font-semibold">
          {quest.name}
        </h2>
      </div>
      <p className="text-md text-center">{quest.description}</p>
      <nav
        aria-label="Actions"
        role="toolbar"
        className="flex items-baseline gap-x-2 justify-center"
      >
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.fail")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faX} />
        </button>
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.complete")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faCheck} />
        </button>
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.delete")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faTrash} />
        </button>
        <Link
          to={`/quest-log/action/edit/${quest.id}`}
          className={classStyles.actionBtn}
        >
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.edit")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faPencil} />
        </Link>
        <Link
          className={classStyles.actionBtn}
          to={`/quest-log/action/view/${quest.id}`}
        >
          <span className="order-1 text-center small-font-size">
            {t("questLog.actions.details")}
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faInfo} />
        </Link>
      </nav>

      {/* <h3 className="text-center medium-font-size">3 sotto-missioni</h3> */}
    </article>
  );
}
