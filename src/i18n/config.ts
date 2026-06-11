import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uzLatn from "./locales/uz-Latn.json";
import uzCyrl from "./locales/uz-Cyrl.json";
import ru from "./locales/ru.json";

export const LANGUAGES = [
  { code: "uz-Latn", label: "O'zbekcha" },
  { code: "uz-Cyrl", label: "Ўзбекча" },
  { code: "ru", label: "Русский" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANG: LangCode = "uz-Latn";
export const LANG_STORAGE_KEY = "shopscan-lang";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      "uz-Latn": { translation: uzLatn },
      "uz-Cyrl": { translation: uzCyrl },
      ru: { translation: ru },
    },
    lng: DEFAULT_LANG,
    fallbackLng: DEFAULT_LANG,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
