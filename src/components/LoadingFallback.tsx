import { useTranslation } from "react-i18next";

export default function LoadingFallback() {
  const { t } = useTranslation();

  const loadingText = t("loading");

  return (
    <div className="flex justify-center items-center min-h-20">
      <div className="animate-pulse text-gray-400">{loadingText}</div>
    </div>
  );
}
