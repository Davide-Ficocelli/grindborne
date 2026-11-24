import { Link } from "react-router-dom";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type BackLinkProps = {
  to: string;
  label: string;
};

// "Back to ..." link shown at the top of every inner page.
// `group` lets the label (not the whole link) show the underline on hover/focus.
export default function BackLink(props: BackLinkProps) {
  return (
    <Link to={props.to} className="back-link group">
      <span className="back-link__label">{props.label}</span>
      <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
    </Link>
  );
}
