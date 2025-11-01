import { lazy, Suspense } from "react";
// import { useTranslation } from "react-i18next";
import LoadingFallback from "../components/LoadingFallback";

export default function QuestLogPage() {
  // const { t } = useTranslation();

  // Lazy load components
  const Quest = lazy(() => import("../components/Quest"));

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <section>
          <Quest />
        </section>
      </Suspense>
    </>
  );
}
