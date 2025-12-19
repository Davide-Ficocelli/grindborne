import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

export default function AddQuestBtn(props: { positionClasses?: string }) {
  return (
    <>
      <Link to="/quest-log/action/add">
        <button
          className={`flex items-center justify-center gap-x-2 btn-primary ${props.positionClasses}`}
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="border-2 rounded-xl p-1 order-1"
          />
          <span>Aggiungi</span>
        </button>
      </Link>
    </>
  );
}
