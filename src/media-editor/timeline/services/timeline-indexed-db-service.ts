import { get, set } from "idb-keyval"
import { TimelineContext } from "./timeline-machine"

// Ключи для хранения данных в IndexedDB
const TIMELINE_STATE_KEY = "timeline-state"
const TIMELINE_STATE_TIMESTAMP_KEY = "timeline-state-timestamp"

/**
 * Сервис для работы с IndexedDB для таймлайна
 * Предоставляет методы для сохранения и загрузки состояния таймлайна
 */
export class TimelineIndexedDBService {
  private static instance: TimelineIndexedDBService

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): TimelineIndexedDBService {
    if (!TimelineIndexedDBService.instance) {
      TimelineIndexedDBService.instance = new TimelineIndexedDBService()
    }
    return TimelineIndexedDBService.instance
  }

  /**
   * Сохраняет состояние таймлайна в IndexedDB
   * @param state Состояние таймлайна
   */
  public async saveTimelineState(state: Partial<TimelineContext>): Promise<void> {
    try {
      // Создаем копию состояния для сохранения, исключая videoRefs, которые нельзя сериализовать
      const stateToSave = {
        ...state,
        // Исключаем videoRefs, так как они содержат DOM-элементы, которые нельзя сериализовать
        videoRefs: {},
      }

      // Сохраняем состояние
      await set(TIMELINE_STATE_KEY, stateToSave)
      // Сохраняем временную метку
      await set(TIMELINE_STATE_TIMESTAMP_KEY, Date.now())
      console.log(`[TimelineIndexedDBService] Состояние таймлайна сохранено в IndexedDB`)
    } catch (error) {
      console.error("[TimelineIndexedDBService] Ошибка при сохранении состояния таймлайна:", error)
    }
  }

  /**
   * Загружает состояние таймлайна из IndexedDB
   * @returns Состояние таймлайна или null, если данных нет
   */
  public async loadTimelineState(): Promise<Partial<TimelineContext> | null> {
    try {
      const state = await get<Partial<TimelineContext>>(TIMELINE_STATE_KEY)
      if (state && Object.keys(state).length > 0) {
        console.log(`[TimelineIndexedDBService] Состояние таймлайна загружено из IndexedDB`)
        return state
      }
      console.log("[TimelineIndexedDBService] В IndexedDB нет сохраненного состояния таймлайна")
      return null
    } catch (error) {
      console.error("[TimelineIndexedDBService] Ошибка при загрузке состояния таймлайна:", error)
      return null
    }
  }

  /**
   * Получает временную метку последнего сохранения состояния таймлайна
   * @returns Временная метка или null, если данных нет
   */
  public async getLastSaveTimestamp(): Promise<number | null> {
    try {
      const timestamp = await get<number>(TIMELINE_STATE_TIMESTAMP_KEY)
      return timestamp || null
    } catch (error) {
      console.error("[TimelineIndexedDBService] Ошибка при получении временной метки:", error)
      return null
    }
  }

  /**
   * Проверяет, нужно ли обновить данные
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
export const timelineIndexedDBService = TimelineIndexedDBService.getInstance()
