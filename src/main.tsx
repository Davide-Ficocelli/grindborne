import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./utils/i18next/index.ts";
import LoadingFallback from "./components/LoadingFallback.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import DebugPanel from "./components/DebugPanel.tsx";

const App = lazy(() => import("./App"));

console.log(App);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <DebugPanel />
        {/* <App /> */}
      </AuthProvider>
    </Suspense>
  </StrictMode>,
);
