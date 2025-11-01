import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export default function Header() {
  const { t } = useTranslation();

  const tHeaderNavigation = t("header.navigation", {
    returnObjects: true,
  }) as { grinds: string; status: string; quests: string };

  const { grinds, status, quests } = tHeaderNavigation;

  return (
    <header className="py-4 w-screen">
      <nav className="flex w-full justify-around text-center">
        <NavLink className="medium-font-size text-orange-200" to="grinds">
          {grinds}
        </NavLink>
        <NavLink className="medium-font-size text-orange-200" to="/">
          {status}
        </NavLink>
        <NavLink className="medium-font-size text-orange-200" to="quest-log">
          {quests}
        </NavLink>
      </nav>
    </header>
  );
}
