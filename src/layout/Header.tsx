import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export default function Header() {
  const { t } = useTranslation();

  const tHeaderNavigation = t("header.navigation", {
    returnObjects: true,
  }) as { grinds: string; status: string; quests: string };

  const { grinds, status, quests } = tHeaderNavigation;

  const normalStyles =
    "medium-font-size text-orange-200 hover:text-yellow-500 focus:text-yellow-500 hover:border-b-yellow-500 focus:border-b-yellow-500 hover:border-b-2 focus:border-b-2 transition-[border] duration-100 ease-in";
  const activeStyles = `${normalStyles} border-b-orange-200 border-b-2`;

  return (
    <header className="py-4 w-screen">
      <nav className="flex w-full justify-around text-center">
        {/* 
          GRINDS TAB COMMENTED OUT:
          The backend endpoint for grinds is currently empty, and the frontend
          has no route for it. Clicking this link would lead to a blank page.
          We keep the UI cleaner by hiding it until the feature is developed.
          Re-enable when the /grinds route and logic are ready.
          
          <NavLink
            className={({ isActive }) => (isActive ? activeStyles : normalStyles)}
            to="grinds"
          >
            {grinds}
          </NavLink>
        */}
        <NavLink
          className={({ isActive }) => (isActive ? activeStyles : normalStyles)}
          to="/"
        >
          {status}
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? activeStyles : normalStyles)}
          to="quest-log/list"
        >
          {quests}
        </NavLink>
      </nav>
    </header>
  );
}
