import { lazy, Suspense } from "react";
// import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";

export default function QuestLogPage() {
  // const { t } = useTranslation();

  // Lazy load components
  const Quest = lazy(() => import("../components/Quest"));

  const quests = [
    {
      key: "quest-1",
      questTitle: "Esercizi in palestra",
      questDescription: "Solleva dei pesi per migliorare la massa muscolare",
    },
    {
      key: "quest-2",
      questTitle: "Raccogli la legna",
      questDescription: "Raccogli 10 pezzi di legna nella foresta.",
    },
    {
      key: "quest-3",
      questTitle: "Colloquio di lavoro",
      questDescription:
        "Partecipa al colloquio di lavoro presso l'azienda locale.",
    },
  ];

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <section>
          {/* Render quests from array and removes bottom border to the last one */}
          {quests.map((quest, _, quests) => {
            if (quests.indexOf(quest) === quests.length - 1)
              return <Quest {...quest} styles="border-none" />;
            else return <Quest {...quest} />;
          })}
        </section>
      </Suspense>
    </>
  );
}
