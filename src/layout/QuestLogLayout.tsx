import { Suspense, useState, useEffect } from "react";
import LoadingFallback from "../components/LoadingFallback";
import { Outlet, useSearchParams } from "react-router-dom";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddQuestBtn from "../components/AddQuestBtn";
import NavTabLink from "../components/NavTabLink";
import PageHeading from "../components/PageHeading";
import { createLazyIcon } from "../lib/createLazyIcon";
import { useTranslation } from "react-i18next";

// Declared at module level on purpose: a `lazy()` created inside the component
// is a brand new component on every render, so React remounts it (and shows
// the Suspense fallback) each time the layout re-renders.
const QuestLogIcon = createLazyIcon(
  () => import("../assets/icons/quest-log-2.png"),
  { hasBorder: true },
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

  return (
    <section aria-labelledby="quest-log-heading" className="pb-20 lg:pb-0">
      <section className="flex flex-col gap-y-4 items-center w-screen">
        <PageHeading
          id="quest-log-heading"
          title={t("questLog.title")}
          icon={<QuestLogIcon />}
          breakAll
          className="px-4 py-16"
        />

        <form className="relative" onSubmit={handleSearchSubmit}>
          <input
            className="bg-white rounded-lg text-black py-1 pr-3 pl-9"
            type="text"
            name="search-quests"
            aria-label={t("questLog.searchButtonLabel")}
            placeholder={t("questLog.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            aria-label={t("questLog.searchButtonLabel")}
            className="absolute left-1 bottom-2 text-black cursor-pointer hover:opacity-70"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
          </button>
        </form>
        <nav className="py-4 w-screen flex justify-around text-center">
          <NavTabLink to="list">{t("questLog.list")}</NavTabLink>
          <NavTabLink to="calendar">{t("questLog.calendar")}</NavTabLink>
        </nav>
      </section>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
      <AddQuestBtn positionClasses="fixed bottom-4 right-4" />
    </section>
  );
}
