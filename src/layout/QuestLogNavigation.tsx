// import { useTranslation } from "react-i18next";

export default function QuestLogNavigation() {
  //   const { t } = useTranslation();

  return (
    <nav className="py-4 w-screen">
      <ul className="flex w-full justify-around text-center">
        <li className="medium-font-size text-orange-200">Lista</li>
        <li className="medium-font-size text-orange-200">Calendario</li>
      </ul>
    </nav>
  );
}
