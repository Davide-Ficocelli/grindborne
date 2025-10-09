import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./utils/i18next/index.ts";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </StrictMode>
);
