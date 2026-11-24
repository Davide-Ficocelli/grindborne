import { Link } from "react-router-dom";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ActionLinkProps = {
  label: string;
  icon: IconDefinition;
  to: string;
};

// Same look as ActionButton, for actions that navigate to another page.
export default function ActionLink(props: ActionLinkProps) {
  return (
    <Link to={props.to} className="action-item">
      <span className="action-item__label">{props.label}</span>
      <FontAwesomeIcon
        icon={props.icon}
        className="action-item__icon"
        aria-hidden="true"
      />
    </Link>
  );
}
