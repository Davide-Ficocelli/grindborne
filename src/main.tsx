import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./utils/i18next/index.ts";
import LoadingFallback from "./components/LoadingFallback.tsx";

const App = lazy(() => import("./App"));

console.log(App);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </StrictMode>
);
