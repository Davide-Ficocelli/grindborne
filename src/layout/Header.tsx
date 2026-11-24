import { useTranslation } from "react-i18next";
import NavTabLink from "../components/NavTabLink";

export default function Header() {
  const { t } = useTranslation();

  const tHeaderNavigation = t("header.navigation", {
    returnObjects: true,
  }) as { grinds: string; status: string; quests: string };

  const { grinds, status, quests } = tHeaderNavigation;

  return (
    <header className="py-4 w-screen">
      <nav className="flex w-full justify-around text-center">
        {/* 
          GRINDS TAB COMMENTED OUT:
          The backend endpoint for grinds is currently empty, and the frontend
          has no route for it. Clicking this link would lead to a blank page.
          We keep the UI cleaner by hiding it until the feature is developed.
          Re-enable when the /grinds route and logic are ready.
          
          <NavTabLink to="grinds">{grinds}</NavTabLink>
        */}
        <NavTabLink to="/">{status}</NavTabLink>
        <NavTabLink to="quest-log/list">{quests}</NavTabLink>
      </nav>
    </header>
  );
}
