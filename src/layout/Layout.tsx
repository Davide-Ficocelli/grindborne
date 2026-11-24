import { Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingFallback from "../components/LoadingFallback";

// Lazy load components
// Declared at module level on purpose: inside `Layout` they would be new
// components on every render, so the header and footer would remount (and
// flash the loader) on every navigation.
const Header = lazy(() => import("./Header"));
const Footer = lazy(() => import("./Footer"));

export default function Layout() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Header />
      </Suspense>
      <main>
        {/* The lazy pages suspend HERE, so header and footer stay visible. */}
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Suspense fallback={<LoadingFallback />}>
        <Footer />
      </Suspense>
    </>
  );
}
