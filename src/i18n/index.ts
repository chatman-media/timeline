import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

// Импорт констант для языков
import { DEFAULT_LANGUAGE, isSupportedLanguage, LanguageCode } from "./constants"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined"

// Импорт ресурсов переводов
import translationDE from "./locales/de.json"
import translationEN from "./locales/en.json"
import translationES from "./locales/es.json"
import translationFR from "./locales/fr.json"
import translationRU from "./locales/ru.json"

// Ресурсы переводов
const resources = {
  ru: {
    translation: translationRU,
  },
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  fr: {
    translation: translationFR,
  },
  de: {
    translation: translationDE,
  },
}

// Инициализация i18next
const initI18n = () => {
  // Используем LanguageDetector только в браузере
  const instance = i18n.use(initReactI18next)

  if (isBrowser) {
    instance.use(LanguageDetector)
  }

  // Получаем сохраненный язык из localStorage
  let savedLanguage = DEFAULT_LANGUAGE
  if (isBrowser) {
    try {
      const storedLanguage = localStorage.getItem("app-language")
      if (storedLanguage && isSupportedLanguage(storedLanguage)) {
        savedLanguage = storedLanguage as LanguageCode
        console.log("i18n: Using saved language from localStorage:", savedLanguage)
      }
    } catch (error) {
      console.error("i18n: Error reading language from localStorage:", error)
    }
  }

  instance.init({
    resources,
    lng: savedLanguage, // Используем сохраненный язык
    fallbackLng: "ru", // Язык по умолчанию, если сохраненный недоступен
    debug: process.env.NODE_ENV === "development", // Включаем отладку только в режиме разработки

    interpolation: {
      escapeValue: false, // Не экранировать HTML
    },

    // Настройки определения языка (только для браузера)
    ...(isBrowser && {
      detection: {
        // Изменяем порядок определения языка, чтобы localStorage имел приоритет
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "app-language", // Ключ в localStorage
        caches: ["localStorage"],
      },
    }),
  })

  // Дополнительно логируем текущий язык после инициализации
  if (isBrowser) {
    console.log("i18n: Current language after initialization:", i18n.language)
    console.log("i18n: Languages from localStorage:", localStorage.getItem("app-language"))
  }

  return instance
}

// Инициализируем i18n
initI18n()

// Добавляем обработчик события загрузки страницы для проверки языка
if (isBrowser) {
  window.addEventListener("load", () => {
    // Проверяем текущий язык в i18next и localStorage
    const currentI18nLang = i18n.language
    const storedLang = localStorage.getItem("app-language")

    console.log("i18n: Window load event - current i18n language:", currentI18nLang)
    console.log("i18n: Window load event - localStorage language:", storedLang)

    // Если язык в localStorage отличается от текущего языка i18next, применяем его
    if (storedLang && isSupportedLanguage(storedLang) && storedLang !== currentI18nLang) {
      console.log("i18n: Window load event - changing language to match localStorage:", storedLang)
      i18n.changeLanguage(storedLang)
    }
  })
}

export default i18n
