/**
 * Сервис для работы с localStorage
 * Предоставляет методы для чтения и записи данных в localStorage с кэшированием
 */
export class StorageService {
  private static instance: StorageService
  private cache: Record<string, any> = {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  /**
   * Получить значение из localStorage
   * @param key - Ключ для получения значения
   * @param defaultValue - Значение по умолчанию, если ключ не найден
   * @returns Значение из localStorage или значение по умолчанию
   */
  public get<T>(key: string, defaultValue: T): T {
    // Если localStorage недоступен (SSR), возвращаем значение по умолчанию
    if (typeof window === "undefined") {
      return defaultValue
    }

    // Для ключа app-language всегда читаем напрямую из localStorage
    if (key === "app-language") {
      try {
        const value = localStorage.getItem(key)
        if (value === null) {
          return defaultValue
        }

        // Обновляем кэш
        this.cache[key] = value
        return value as unknown as T
      } catch (error) {
        console.error(`[StorageService] Error reading language from localStorage:`, error)
        return defaultValue
      }
    }

    // Для остальных ключей используем кэш
    if (this.cache[key] !== undefined) {
      return this.cache[key]
    }

    try {
      const value = localStorage.getItem(key)
      if (value === null) {
        return defaultValue
      }

      // Пытаемся распарсить значение как JSON
      try {
        const parsedValue = JSON.parse(value)
        this.cache[key] = parsedValue
        return parsedValue
      } catch {
        // Если не удалось распарсить как JSON, возвращаем как строку
        this.cache[key] = value
        return value as unknown as T
      }
    } catch (error) {
      console.error(`[StorageService] Error reading from localStorage for ${key}:`, error)
      return defaultValue
    }
  }

  /**
   * Сохранить значение в localStorage
   * @param key - Ключ для сохранения значения
   * @param value - Значение для сохранения
   */
  public set<T>(key: string, value: T): void {
    // Если localStorage недоступен (SSR), просто выходим
    if (typeof window === "undefined") {
      return
    }

    try {
      // Сохраняем значение в кэше
      this.cache[key] = value

      // Сохраняем значение в localStorage
      if (typeof value === "string") {
        localStorage.setItem(key, value)

        // Для ключа app-language выводим дополнительную информацию
        if (key === "app-language") {
          console.log(`[StorageService] Language saved to localStorage: ${value}`)
          console.log(
            `[StorageService] Verified language in localStorage:`,
            localStorage.getItem(key),
          )
        }
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error(`[StorageService] Error saving to localStorage for ${key}:`, error)
    }
  }

  /**
   * Удалить значение из localStorage
   * @param key - Ключ для удаления
   */
  public remove(key: string): void {
    // Если localStorage недоступен (SSR), просто выходим
    if (typeof window === "undefined") {
      return
    }

    try {
      // Удаляем значение из кэша
      delete this.cache[key]

      // Удаляем значение из localStorage
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[StorageService] Error removing from localStorage for ${key}:`, error)
    }
  }

  /**
   * Очистить весь localStorage
   */
  public clear(): void {
    // Если localStorage недоступен (SSR), просто выходим
    if (typeof window === "undefined") {
      return
    }

    try {
      // Очищаем кэш
      this.cache = {}

      // Очищаем localStorage
      localStorage.clear()
    } catch (error) {
      console.error("[StorageService] Error clearing localStorage:", error)
    }
  }

  /**
   * Получить все ключи из localStorage
   * @returns Массив ключей
   */
  public keys(): string[] {
    // Если localStorage недоступен (SSR), возвращаем пустой массив
    if (typeof window === "undefined") {
      return []
    }

    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error("[StorageService] Error getting keys from localStorage:", error)
      return []
    }
  }
}

// Экспортируем экземпляр сервиса
export const storageService = StorageService.getInstance()
