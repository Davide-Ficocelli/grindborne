import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ActionButtonProps = {
  label: string;
  icon: IconDefinition;
  onClick?: () => void;
};

export default function ActionButton(props: ActionButtonProps) {
  return (
    <button type="button" className="action-item" onClick={props.onClick}>
      <span className="action-item__label">{props.label}</span>
      <FontAwesomeIcon
        icon={props.icon}
        className="action-item__icon"
        aria-hidden="true"
      />
    </button>
  );
}
