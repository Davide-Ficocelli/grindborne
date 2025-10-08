import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: "en",
    returnObjects: true,
    resources: {
      en: {
        translation: {
          headerNavigation: {
            grinds: "Grinds",
            status: "Status",
            quests: "Quests",
          },
        },
      },
      it: {
        translation: {
          headerNavigation: {
            grinds: "Abitudini",
            status: "Stato",
            quests: "Missioni",
          },
        },
      },
    },
  });
