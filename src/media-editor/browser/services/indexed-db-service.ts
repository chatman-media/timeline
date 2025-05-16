import { get, set } from "idb-keyval"
import { MediaFile } from "@/types/media"

// Ключи для хранения данных в IndexedDB
const MEDIA_FILES_KEY = "media-files"
const MEDIA_FILES_TIMESTAMP_KEY = "media-files-timestamp"

/**
 * Сервис для работы с IndexedDB
 * Предоставляет методы для сохранения и загрузки медиафайлов
 */
export class IndexedDBService {
  private static instance: IndexedDBService

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService()
    }
    return IndexedDBService.instance
  }

  /**
   * Сохраняет медиафайлы в IndexedDB
   * @param files Массив медиафайлов
   */
  public async saveMediaFiles(files: MediaFile[]): Promise<void> {
    try {
      // Сохраняем файлы
      await set(MEDIA_FILES_KEY, files)
      // Сохраняем временную метку
      await set(MEDIA_FILES_TIMESTAMP_KEY, Date.now())
      console.log(`[IndexedDBService] Сохранено ${files.length} файлов в IndexedDB`)
    } catch (error) {
      console.error("[IndexedDBService] Ошибка при сохранении файлов:", error)
    }
  }

  /**
   * Загружает медиафайлы из IndexedDB
   * @returns Массив медиафайлов или null, если данных нет
   */
  public async loadMediaFiles(): Promise<MediaFile[] | null> {
    try {
      const files = await get<MediaFile[]>(MEDIA_FILES_KEY)
      if (files && files.length > 0) {
        console.log(`[IndexedDBService] Загружено ${files.length} файлов из IndexedDB`)
        return files
      }
      console.log("[IndexedDBService] В IndexedDB нет сохраненных файлов")
      return null
    } catch (error) {
      console.error("[IndexedDBService] Ошибка при загрузке файлов:", error)
      return null
    }
  }

  /**
   * Получает временную метку последнего сохранения файлов
   * @returns Временная метка или null, если данных нет
   */
  public async getLastSaveTimestamp(): Promise<number | null> {
    try {
      const timestamp = await get<number>(MEDIA_FILES_TIMESTAMP_KEY)
      return timestamp || null
    } catch (error) {
      console.error("[IndexedDBService] Ошибка при получении временной метки:", error)
      return null
    }
  }

  /**
   * Обновляет временную метку проверки для указанных файлов
   * @param files Массив медиафайлов
   * @returns Обновленный массив медиафайлов
   */
  public updateLastCheckedTimestamp(files: MediaFile[]): MediaFile[] {
    const now = Date.now()
    return files.map(file => ({
      ...file,
      lastCheckedAt: now
    }))
  }

  /**
   * Проверяет, нужно ли обновить данные из API
   * @param maxAgeMs Максимальный возраст данных в миллисекундах (по умолчанию 1 час)
   * @returns true, если данные устарели и нужно обновить
   */
  public async shouldRefreshData(maxAgeMs: number = 3600000): Promise<boolean> {
    const timestamp = await this.getLastSaveTimestamp()
    if (!timestamp) return true
    
    const now = Date.now()
    const age = now - timestamp
    return age > maxAgeMs
  }
}

// Экспортируем экземпляр сервиса
export const indexedDBService = IndexedDBService.getInstance()
