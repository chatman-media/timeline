import { get, set } from "idb-keyval"

import { YoloVideoData } from "./yolo-data-service"

// Ключи для хранения данных в IndexedDB
const YOLO_DATA_KEY_PREFIX = "yolo-data-"
const YOLO_DATA_TIMESTAMP_KEY_PREFIX = "yolo-data-timestamp-"
const YOLO_NONEXISTENT_FILES_KEY = "yolo-nonexistent-files"

/**
 * Сервис для работы с IndexedDB для хранения данных YOLO
 */
export class YoloIndexedDBService {
  private static instance: YoloIndexedDBService

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): YoloIndexedDBService {
    if (!YoloIndexedDBService.instance) {
      YoloIndexedDBService.instance = new YoloIndexedDBService()
    }
    return YoloIndexedDBService.instance
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
   * Сохраняет данные YOLO в IndexedDB
   * @param videoId ID видео
   * @param data Данные YOLO
   */
  public async saveYoloData(videoId: string, data: YoloVideoData): Promise<void> {
    try {
      // Удаляем функции из объекта перед сохранением
      const safeData = this.removeFunctions(data)

      // Сохраняем данные
      await set(`${YOLO_DATA_KEY_PREFIX}${videoId}`, safeData)
      // Сохраняем временную метку
      await set(`${YOLO_DATA_TIMESTAMP_KEY_PREFIX}${videoId}`, Date.now())
      
      // Логируем только в режиме отладки
      if (process.env.NODE_ENV === "development") {
        console.log(`[YoloIndexedDBService] Данные YOLO для видео ${videoId} сохранены в IndexedDB`)
      }
    } catch (error) {
      console.error(`[YoloIndexedDBService] Ошибка при сохранении данных YOLO для видео ${videoId}:`, error)
    }
  }

  /**
   * Загружает данные YOLO из IndexedDB
   * @param videoId ID видео
   * @returns Данные YOLO или null, если данных нет
   */
  public async loadYoloData(videoId: string): Promise<YoloVideoData | null> {
    try {
      const data = await get<YoloVideoData>(`${YOLO_DATA_KEY_PREFIX}${videoId}`)
      if (data) {
        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development") {
          console.log(`[YoloIndexedDBService] Данные YOLO для видео ${videoId} загружены из IndexedDB`)
        }
        return data
      }
      
      // Логируем только в режиме отладки
      if (process.env.NODE_ENV === "development") {
        console.log(`[YoloIndexedDBService] В IndexedDB нет данных YOLO для видео ${videoId}`)
      }
      return null
    } catch (error) {
      console.error(`[YoloIndexedDBService] Ошибка при загрузке данных YOLO для видео ${videoId}:`, error)
      return null
    }
  }

  /**
   * Сохраняет список видео, для которых нет данных YOLO
   * @param nonExistentFiles Список видео, для которых нет данных YOLO
   */
  public async saveNonExistentFiles(nonExistentFiles: Record<string, boolean>): Promise<void> {
    try {
      await set(YOLO_NONEXISTENT_FILES_KEY, nonExistentFiles)
      
      // Логируем только в режиме отладки
      if (process.env.NODE_ENV === "development") {
        console.log(`[YoloIndexedDBService] Список видео без данных YOLO сохранен в IndexedDB (${Object.keys(nonExistentFiles).length} видео)`)
      }
    } catch (error) {
      console.error(`[YoloIndexedDBService] Ошибка при сохранении списка видео без данных YOLO:`, error)
    }
  }

  /**
   * Загружает список видео, для которых нет данных YOLO
   * @returns Список видео, для которых нет данных YOLO, или пустой объект, если данных нет
   */
  public async loadNonExistentFiles(): Promise<Record<string, boolean>> {
    try {
      const nonExistentFiles = await get<Record<string, boolean>>(YOLO_NONEXISTENT_FILES_KEY)
      if (nonExistentFiles) {
        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development") {
          console.log(`[YoloIndexedDBService] Список видео без данных YOLO загружен из IndexedDB (${Object.keys(nonExistentFiles).length} видео)`)
        }
        return nonExistentFiles
      }
      
      // Логируем только в режиме отладки
      if (process.env.NODE_ENV === "development") {
        console.log(`[YoloIndexedDBService] В IndexedDB нет списка видео без данных YOLO`)
      }
      return {}
    } catch (error) {
      console.error(`[YoloIndexedDBService] Ошибка при загрузке списка видео без данных YOLO:`, error)
      return {}
    }
  }

  /**
   * Получает временную метку последнего сохранения данных YOLO для видео
   * @param videoId ID видео
   * @returns Временная метка или null, если данных нет
   */
  public async getLastSaveTimestamp(videoId: string): Promise<number | null> {
    try {
      const timestamp = await get<number>(`${YOLO_DATA_TIMESTAMP_KEY_PREFIX}${videoId}`)
      return timestamp || null
    } catch (error) {
      console.error(`[YoloIndexedDBService] Ошибка при получении временной метки для видео ${videoId}:`, error)
      return null
    }
  }
}

// Экспортируем экземпляр сервиса
export const yoloIndexedDBService = YoloIndexedDBService.getInstance()
