import { get, set } from "idb-keyval"

import { ScreenshotsMachineContext } from "./screenshots-machine"

// Ключи для хранения данных в IndexedDB
const SCREENSHOTS_STATE_KEY = "screenshots-state"
const SCREENSHOTS_STATE_TIMESTAMP_KEY = "screenshots-state-timestamp"

/**
 * Сервис для работы с IndexedDB для хранения данных о скриншотах и детекциях объектов
 */
export class ScreenshotsIndexedDBService {
  private static instance: ScreenshotsIndexedDBService

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): ScreenshotsIndexedDBService {
    if (!ScreenshotsIndexedDBService.instance) {
      ScreenshotsIndexedDBService.instance = new ScreenshotsIndexedDBService()
    }
    return ScreenshotsIndexedDBService.instance
  }

  /**
   * Рекурсивно удаляет функции из объекта для безопасной сериализации
   * @param obj Объект для обработки
   * @returns Объект без функций
   */
  private removeFunctions(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === "function") {
      // Для функций возвращаем строку с описанием
      return "[Function]"
    }

    if (typeof obj !== "object") {
      return obj
    }

    // Для массивов
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeFunctions(item))
    }

    // Для объектов
    const result: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.removeFunctions(obj[key])
      }
    }
    return result
  }

  /**
   * Сохраняет состояние скриншотов в IndexedDB
   * @param state Состояние скриншотов
   */
  public async saveScreenshotsState(state: Partial<ScreenshotsMachineContext>): Promise<void> {
    try {
      // Удаляем функции из объекта перед сохранением
      const safeState = this.removeFunctions(state)

      // Сохраняем состояние
      await set(SCREENSHOTS_STATE_KEY, safeState)
      // Сохраняем временную метку
      await set(SCREENSHOTS_STATE_TIMESTAMP_KEY, Date.now())
      console.log(`[ScreenshotsIndexedDBService] Состояние скриншотов сохранено в IndexedDB`)
    } catch (error) {
      console.error(
        "[ScreenshotsIndexedDBService] Ошибка при сохранении состояния скриншотов:",
        error,
      )
    }
  }

  /**
   * Загружает состояние скриншотов из IndexedDB
   * @returns Состояние скриншотов или пустой объект, если данных нет
   */
  public async loadScreenshotsState(): Promise<Partial<ScreenshotsMachineContext>> {
    try {
      const state = await get<Partial<ScreenshotsMachineContext>>(SCREENSHOTS_STATE_KEY)
      if (state && typeof state === "object" && Object.keys(state).length > 0) {
        console.log(`[ScreenshotsIndexedDBService] Состояние скриншотов загружено из IndexedDB`)
        // Проверяем, что структура данных корректна
        if (!state.videos) {
          state.videos = {}
        }
        return state
      }
      console.log("[ScreenshotsIndexedDBService] В IndexedDB нет сохраненного состояния скриншотов")
      return { videos: {} }
    } catch (error) {
      console.error(
        "[ScreenshotsIndexedDBService] Ошибка при загрузке состояния скриншотов:",
        error,
      )
      return { videos: {} }
    }
  }

  /**
   * Получает временную метку последнего сохранения состояния скриншотов
   * @returns Временная метка или 0, если данных нет
   */
  public async getLastSaveTimestamp(): Promise<number> {
    try {
      const timestamp = await get<number>(SCREENSHOTS_STATE_TIMESTAMP_KEY)
      return timestamp || 0
    } catch (error) {
      console.error("[ScreenshotsIndexedDBService] Ошибка при получении временной метки:", error)
      return 0
    }
  }

  /**
   * Проверяет, нужно ли обновить данные
   * @param maxAgeMs Максимальный возраст данных в миллисекундах (по умолчанию 1 час)
   * @returns true, если данные устарели и нужно обновить
   */
  public async shouldRefreshData(maxAgeMs: number = 3600000): Promise<boolean> {
    const timestamp = await this.getLastSaveTimestamp()
    // Если timestamp равен 0, значит данных нет или произошла ошибка
    if (timestamp === 0) return true

    const now = Date.now()
    const age = now - timestamp
    return age > maxAgeMs
  }
}

// Экспортируем экземпляр сервиса
export const screenshotsIndexedDBService = ScreenshotsIndexedDBService.getInstance()
