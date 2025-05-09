import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"

import enTranslations from "./en"
import ruTranslations from "./ru"
import { Language, Translations } from "./types"

// Словарь переводов
const translations: Record<Language, Translations> = {
  ru: ruTranslations,
  en: enTranslations,
}

// Хук для получения переводов
export function useTranslations() {
  const { language } = useUserSettings()
  return translations[language]
}

// Функция для получения переводов по языку
export function getTranslations(language: Language): Translations {
  return translations[language]
}

export * from "./types"
