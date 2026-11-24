import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type NavTabLinkProps = {
  to: string;
  children: ReactNode;
};

// Navigation link with the "active tab" underline, shared by the main header
// and the quest-log sub-navigation. Styles: `.nav-tab` in index.css.
export default function NavTabLink(props: NavTabLinkProps) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        isActive ? "nav-tab nav-tab--active" : "nav-tab"
      }
    >
      {props.children}
    </NavLink>
  );
}
