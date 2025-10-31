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

export default function Quest() {
  return (
    <article className="flex flex-col gap-y-4 items-center p-4 border-b-2 border-white w-screen">
      <div className="flex gap-x-8 items-center px-4">
        <h2 className="order-1 h2-font-size">Titolo missione</h2>
        <FontAwesomeIcon icon={faHammer} className="size-20" />
      </div>
      <p className="medium-font-size">Descrizione missione</p>
      <nav
        aria-label="Actions"
        role="toolbar"
        className="w-full flex items-baseline gap-x-2 justify-center"
      >
        <div className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">
            Segna come fallita
          </span>
          <FontAwesomeIcon icon={faX} />
        </div>
        <div className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">
            Segna come completata
          </span>
          <FontAwesomeIcon icon={faCheck} />
        </div>
        <div className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">Elimina</span>
          <FontAwesomeIcon icon={faTrash} />
        </div>
        <div className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">Modifica</span>
          <FontAwesomeIcon icon={faPencil} />
        </div>
        <div className="flex flex-col justify-center items-center gap-y-2">
          <span className="order-1 text-center small-font-size">Dettagli</span>
          <FontAwesomeIcon icon={faInfo} />
        </div>
      </nav>

      <h3 className="text-center medium-font-size">3 sotto-missioni</h3>
    </article>
  );
}
