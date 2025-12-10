// import { useTranslation } from "react-i18next";
import { lazy, Suspense } from "react";
import LoadingFallback from "../components/LoadingFallback";
import { NavLink, Outlet } from "react-router-dom";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddQuestBtn from "../components/AddQuestBtn";

export default function QuestLogLayout() {
  //   const { t } = useTranslation();

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

  const normalStyles =
    "medium-font-size text-orange-200 hover:text-yellow-500 focus:text-yellow-500 hover:border-b-yellow-500 focus:border-b-yellow-500 hover:border-b-2 focus:border-b-2 transition-[border] duration-100 ease-in";
  const activeStyles = `${normalStyles} border-b-orange-200 border-b-2`;

  return (
    <>
      <section aria-labelledby="quest-log-page" className="pb-20 lg:pb-0">
        <section className="flex flex-col gap-y-4 items-center w-screen">
          <div className="flex flex-wrap gap-x-8 gap-y-8 items-center justify-center py-16 px-4">
            <h1
              aria-labelledby="quest-log-heading"
              className="h1-font-size order-1 break-all"
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
              className="absolute left-1 bottom-2 text-black cursor-pointer hover:opacity-70"
            />
          </form>
          <nav className="py-4 w-screen flex justify-around text-center">
            <NavLink
              to="list"
              className={({ isActive }) =>
                isActive ? activeStyles : normalStyles
              }
            >
              Lista
            </NavLink>
            <NavLink
              to="calendar"
              className={({ isActive }) =>
                isActive ? activeStyles : normalStyles
              }
            >
              Calendario
            </NavLink>
          </nav>
        </section>
        <Outlet />
        <AddQuestBtn positionClasses="fixed bottom-4 right-4" />
      </section>
    </>
  );
}
