import { lazy, Suspense, useState, useEffect } from "react";
import LoadingFallback from "../components/LoadingFallback";
import { NavLink, Outlet, useSearchParams } from "react-router-dom";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddQuestBtn from "../components/AddQuestBtn";
import { useTranslation } from "react-i18next";

// Declared at module level on purpose: a `lazy()` created inside the component
// is a brand new component on every render, so React remounts it (and shows
// the Suspense fallback) each time the layout re-renders.
const QuestLogIcon = lazy(() =>
  import("../assets/icons/quest-log-2.png").then((module) => ({
    default: () => (
      <img
        src={module.default}
        alt="Quest log icon"
        className="size-20 rounded-lg border border-[#FFD6A7]"
      />
    ),
  })),
);

export default function QuestLogLayout() {
  const { t } = useTranslation();

  // Manage search state via URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  // What the user is typing. It is kept in local state and applied to the URL
  // only on submit (Enter or click on the search icon): this avoids filtering
  // and updating the URL on every keystroke, and keeps the input from being
  // driven by the URL while typing.
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Keep the input in sync when the URL changes from outside (browser Back /
  // Forward, or a link with ?q=...).
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  function handleSearchSubmit(e: React.FormEvent) {
    // Prevent the browser from reloading the page on form submit.
    e.preventDefault();
    const trimmedSearch = searchInput.trim();
    if (trimmedSearch) {
      setSearchParams({ q: trimmedSearch }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

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
              {t("questLog.title")}
            </h1>
            <Suspense fallback={<LoadingFallback />}>
              <QuestLogIcon />
            </Suspense>
          </div>

          <form className="relative" onSubmit={handleSearchSubmit}>
            <input
              className="bg-white rounded-lg text-black py-1 pr-3 pl-9"
              type="text"
              name="search-quests"
              placeholder={t("questLog.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              aria-label={t("questLog.searchButtonLabel")}
              className="absolute left-1 bottom-2 text-black cursor-pointer hover:opacity-70"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
          </form>
          <nav className="py-4 w-screen flex justify-around text-center">
            <NavLink
              to="list"
              className={({ isActive }) =>
                isActive ? activeStyles : normalStyles
              }
            >
              {t("questLog.list")}
            </NavLink>
            <NavLink
              to="calendar"
              className={({ isActive }) =>
                isActive ? activeStyles : normalStyles
              }
            >
              {t("questLog.calendar")}
            </NavLink>
          </nav>
        </section>
        <Outlet />
        <AddQuestBtn positionClasses="fixed bottom-4 right-4" />
      </section>
    </>
  );
}
