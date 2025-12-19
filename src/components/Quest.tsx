// import { useTranslation } from "react-i18next";
import { useQuest } from "../hooks/useQuest";
import {
  faInfo,
  faPencil,
  faTrash,
  faCheck,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Component representing a single quest

type QuestProps = {
  key: number;
  questId: number;
  styles?: string;
};

export default function Quest(props: QuestProps) {
  const currentQuest = useQuest(props.questId);
  const { styles } = props;

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
          {currentQuest?.questTitle}
        </h2>
      </div>
      <p className="text-md text-center">{currentQuest?.questDescription}</p>
      <nav
        aria-label="Actions"
        role="toolbar"
        className="flex items-baseline gap-x-2 justify-center"
      >
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">
            Segna come fallita
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faX} />
        </button>
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">
            Segna come completata
          </span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faCheck} />
        </button>
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">Elimina</span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faTrash} />
        </button>
        <Link
          to={`/quest-log/action/edit/${currentQuest?.questId}`}
          className={classStyles.actionBtn}
        >
          <span className="order-1 text-center small-font-size">Modifica</span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faPencil} />
        </Link>
        <Link
          className={classStyles.actionBtn}
          to={`/quest-log/action/view/${currentQuest?.questId}`}
        >
          <span className="order-1 text-center small-font-size">Dettagli</span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faInfo} />
        </Link>
      </nav>

      {/* <h3 className="text-center medium-font-size">3 sotto-missioni</h3> */}
    </article>
  );
}
