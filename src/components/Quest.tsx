// import { useTranslation } from "react-i18next";
import {
  faHammer,
  faInfo,
  faPencil,
  faTrash,
  faCheck,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Component representing a single quest

interface QuestProps {
  questTitle: string;
  questDescription?: string;
  questIcon?: string;
  styles?: string;
}

export default function Quest(props: QuestProps) {
  const { questTitle, questDescription, styles } = props;

  return (
    <article
      className={`flex flex-col gap-y-4 items-center p-4 border-b-2 border-white w-screen ${styles}`}
    >
      <div className="flex gap-x-8 items-center px-4">
        <h2 className="order-1 h2-font-size text-center font-semibold">
          {questTitle}
        </h2>
        {/* <FontAwesomeIcon icon={faHammer} className="size-20" /> */}
      </div>
      <p className="text-md text-center">{questDescription}</p>
      <nav
        aria-label="Actions"
        role="toolbar"
        className="w-full flex items-baseline gap-x-2 justify-center"
      >
        <button className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">
            Segna come fallita
          </span>
          <FontAwesomeIcon
            className="text-white hover:text-gray-300 focus:text-gray-300 active:text-gray-300 cursor-pointer"
            icon={faX}
          />
        </button>
        <button className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">
            Segna come completata
          </span>
          <FontAwesomeIcon
            className="text-white hover:text-gray-300 focus:text-gray-300 active:text-gray-300 cursor-pointer"
            icon={faCheck}
          />
        </button>
        <button className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">Elimina</span>
          <FontAwesomeIcon
            className="text-white hover:text-gray-300 focus:text-gray-300 active:text-gray-300 cursor-pointer"
            icon={faTrash}
          />
        </button>
        <button className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">Modifica</span>
          <FontAwesomeIcon
            className="text-white hover:text-gray-300 focus:text-gray-300 active:text-gray-300 cursor-pointer"
            icon={faPencil}
          />
        </button>
        <button className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">Dettagli</span>
          <FontAwesomeIcon
            className="text-white hover:text-gray-300 focus:text-gray-300 active:text-gray-300 cursor-pointer"
            icon={faInfo}
          />
        </button>
      </nav>

      {/* <h3 className="text-center medium-font-size">3 sotto-missioni</h3> */}
    </article>
  );
}
