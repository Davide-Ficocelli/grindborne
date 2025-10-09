import { useTranslation } from "react-i18next";

export default function Header() {
  const { t } = useTranslation();

  const tHeaderNavigation = t("header.navigation", {
    returnObjects: true,
  }) as { grinds: string; status: string; quests: string };

  const { grinds, status, quests } = tHeaderNavigation;

  return (
    <header className="py-4">
      <nav>
        <menu className="flex w-screen justify-around text-center">
          <li className="medium-font-size text-orange-200">{grinds}</li>
          <li className="medium-font-size text-orange-200">{status}</li>
          <li className="medium-font-size text-orange-200">{quests}</li>
        </menu>
      </nav>
    </header>
  );
}
