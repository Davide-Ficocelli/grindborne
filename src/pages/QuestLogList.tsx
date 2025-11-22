import { lazy, Suspense } from "react";
// import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";

export default function QuestLogPage() {
  // const { t } = useTranslation();

  // Lazy load components
  const Quest = lazy(() => import("../components/Quest"));

  const quests = [
    {
      id: 1,
      questTitle: "Esercizi in palestra",
      questDescription: "Solleva dei pesi per migliorare la massa muscolare",
    },
    {
      id: 2,
      questTitle: "Raccogli la legna",
      questDescription: "Raccogli 10 pezzi di legna nella foresta.",
    },
    {
      id: 3,
      questTitle: "Colloquio di lavoro",
      questDescription:
        "Partecipa al colloquio di lavoro presso l'azienda locale.",
    },
  ];

  // Omit function - removes specific keys from an object
  const omit = (obj: {}, keys: string[]): {} =>
    Object.fromEntries(
      Object.entries(obj).filter(([key]) => !keys.includes(key))
    );

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <section>
          {/* Render quests from array and removes bottom border to the last one */}
          {quests.map((q, _, qs) => {
            console.log(omit(q, ["key", "styles"]));
            if (qs.indexOf(q) === qs.length - 1)
              return (
                <Quest
                  key={q.id}
                  styles="border-none"
                  questData={omit(q, ["key", "styles"])}
                />
              );
            else
              return (
                <Quest key={q.id} questData={omit(q, ["key", "styles"])} />
              );
          })}
        </section>
      </Suspense>
    </>
  );
}
