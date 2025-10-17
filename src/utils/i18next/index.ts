import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import enLang from "./locales/en/en.json";
import itLang from "./locales/it/it.json";

const resources = {
  en: {
    translation: enLang,
  },
  it: {
    translation: itLang,
  },
};

i18n.use(LanguageDetector).use(initReactI18next).use(Backend).init({
  debug: true,
  lng: "it",
  fallbackLng: "en",
  resources,
  returnObjects: true,
});
