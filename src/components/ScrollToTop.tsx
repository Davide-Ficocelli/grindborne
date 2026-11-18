import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls the window back to the top every time the URL changes (a new page
// or a new search in the quest log). The browser does not do it by itself,
// because a client-side router swaps the content without reloading the page.
//
// It reacts to BOTH `pathname` (page changes) and `search` (e.g. ?q=...
// from the quest log search), as required: every navigation goes back to the
// top. `hash` is ignored on purpose, as the app does not use anchors.
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  // This component only has a side effect: it renders nothing.
  return null;
}
