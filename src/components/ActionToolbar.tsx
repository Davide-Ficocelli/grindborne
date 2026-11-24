import type { ReactNode } from "react";

type ActionToolbarProps = {
  label: string; // accessible name of the toolbar
  className?: string; // layout/spacing decided by the page
  children: ReactNode;
};

export default function ActionToolbar(props: ActionToolbarProps) {
  return (
    <nav
      aria-label={props.label}
      role="toolbar"
      className={props.className}
      // A toolbar is never a "select" area: a click on one of its buttons must
      // not reach a clickable parent (e.g. the quest card that selects the quest).
      onClick={(event) => event.stopPropagation()}
    >
      {props.children}
    </nav>
  );
}
