import { lazy, Suspense } from "react";
// import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";

export default function QuestLogPage() {
  // const { t } = useTranslation();

  // Lazy load components
  const Quest = lazy(() => import("../components/Quest"));
  const QuestDetails = lazy(() => import("../components/QuestDetails"));

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
        <section aria-label="quest-log-list" className="lg:grid lg:grid-cols-2">
          {/* Quest details (large screens only) */}
          <section
            aria-label="quest-details"
            className={`hidden ${
              quests.length === 0 ? "lg:hidden" : "lg:block"
            } lg:col-start-1`}
          >
            <Suspense fallback={<LoadingFallback />}>
              <QuestDetails variant="side-view" />
            </Suspense>
          </section>
          <section aria-label="quests-list">
            {/* Render quests from array and removes bottom border to the last one */}
            {quests.map((q, _, qs) => {
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
        </section>
      </Suspense>
    </>
  );
}
