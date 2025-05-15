// Типы для языков
export type LanguageCode = "ru" | "en" | "es" | "fr" | "de"

// Список поддерживаемых языков
export const SUPPORTED_LANGUAGES: LanguageCode[] = ["ru", "en", "es", "fr", "de"]

// Язык по умолчанию
export const DEFAULT_LANGUAGE: LanguageCode = "ru"

// Соответствие языков и локалей
export const LANGUAGE_LOCALES: Record<LanguageCode, string> = {
  ru: "ru-RU",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
}

// Функция для получения локали по коду языка
export function getLocaleByLanguage(language: string): string {
  return LANGUAGE_LOCALES[language as LanguageCode] || LANGUAGE_LOCALES[DEFAULT_LANGUAGE]
}

// Функция для проверки, является ли язык поддерживаемым
export function isSupportedLanguage(language: string): boolean {
  return SUPPORTED_LANGUAGES.includes(language as LanguageCode)
}

// Интерфейс для опций форматирования даты
export interface DateFormatOptions {
  includeYear?: boolean
  longFormat?: boolean
  addYearSuffix?: boolean
}

/**
 * Универсальный метод форматирования даты с учетом языка
 * @param date Дата для форматирования
 * @param language Код языка
 * @param options Опции форматирования
 * @returns Отформатированная строка даты
 */
export function formatDateByLanguage(
  date: Date,
  language: string = DEFAULT_LANGUAGE,
  options: DateFormatOptions = {},
): string {
  const locale = getLocaleByLanguage(language)

  // Опции по умолчанию
  const { includeYear = true, longFormat = true, addYearSuffix = language === "ru" } = options

  // Базовые опции форматирования
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: longFormat ? "numeric" : "2-digit",
    month: longFormat ? "long" : "2-digit",
  }

  // Добавляем год, если нужно
  if (includeYear) {
    // Для русского языка используем "numeric", чтобы избежать проблем с форматом "г."
    formatOptions.year = language === "ru" || language === "es" ? "numeric" : "2-digit"
  }

  // Форматируем дату
  let formattedDate = date.toLocaleDateString(locale, formatOptions)

  // Для русского языка заменяем "г." на пустую строку, если не нужен суффикс года
  if (language === "ru" && !addYearSuffix) {
    formattedDate = formattedDate.replace(/ г\.$/, "")
  }

  return formattedDate
}
