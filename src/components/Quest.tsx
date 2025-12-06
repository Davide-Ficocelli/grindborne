// import { useTranslation } from "react-i18next";
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

interface QuestProps {
  key: number;
  questData: {
    questTitle?: string;
    questDescription?: string;
    questIcon?: string;
  };
  styles?: string;
}

export default function Quest(props: QuestProps) {
  const { questTitle, questDescription } = props.questData;
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
      className={`flex flex-col gap-y-4 items-center p-4 border-b-2 border-white w-screen ${styles}`}
    >
      <div className="flex gap-x-8 items-center px-4">
        <h2 className="order-1 h2-font-size text-center font-semibold">
          {questTitle}
        </h2>
      </div>
      <p className="text-md text-center">{questDescription}</p>
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
        <button className={classStyles.actionBtn}>
          <span className="order-1 text-center small-font-size">Modifica</span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faPencil} />
        </button>
        <Link
          className={classStyles.actionBtn}
          to={`/quest-log/action/view/${1}`}
        >
          <span className="order-1 text-center small-font-size">Dettagli</span>
          <FontAwesomeIcon className={classStyles.actionIcon} icon={faInfo} />
        </Link>
      </nav>

      {/* <h3 className="text-center medium-font-size">3 sotto-missioni</h3> */}
    </article>
  );
}
