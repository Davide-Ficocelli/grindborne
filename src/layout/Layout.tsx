import { Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingFallback from "../components/LoadingFallback";

export default function Layout() {
  // Lazy load components
  const Header = lazy(() => import("./Header"));
  const Footer = lazy(() => import("./Footer"));

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Header />
      </Suspense>
      <main>
        <Outlet />
      </main>
      <Suspense fallback={<LoadingFallback />}>
        <Footer />
      </Suspense>
    </>
  );
}
