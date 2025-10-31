import { lazy, Suspense } from "react";
// import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
export default function QuestLogPage() {
  // const { t } = useTranslation();

  // Lazy load components
  const Header = lazy(() => import("../layout/Header"));
  const QuestLogNavigation = lazy(() => import("../layout/QuestLogNavigation"));
  const Quest = lazy(() => import("../components/Quest"));

  // Lazy Load the image
  const QuestLogIcon = lazy(() =>
    import("../assets/icons/quest-log-2.png").then((module) => ({
      default: () => (
        <img
          src={module.default}
          alt="Quest log icon"
          className="size-20 rounded-lg border border-[#FFD6A7]"
        />
      ),
    }))
  );

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Header />
      </Suspense>
      <main>
        <section
          aria-labelledby="quest-log-page"
          className="flex flex-col items-center w-screen"
        >
          <div className="flex gap-x-8 items-center py-16 px-4">
            <h1
              aria-labelledby="quest-log-heading"
              className="text-5xl order-1"
            >
              Missioni
            </h1>
            <Suspense fallback={<LoadingFallback />}>
              <QuestLogIcon />
            </Suspense>
          </div>

          <form className="relative">
            <input
              className="bg-white rounded-lg text-black py-1 pr-3 pl-9"
              type="text"
              name="search-quests"
              placeholder="Cerca..."
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-1 bottom-2 text-black"
            />
          </form>

          <Suspense fallback={<LoadingFallback />}>
            <QuestLogNavigation />
          </Suspense>

          <Suspense fallback={<LoadingFallback />}>
            <section>
              <Quest />
            </section>
          </Suspense>
        </section>
      </main>
    </>
  );
}
