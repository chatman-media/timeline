import { screenshotsIndexedDBService } from "./screenshots-indexeddb-service"
import { Screenshot, ScreenshotsMachineContext,VideoScreenshotData } from "./screenshots-machine"

/**
 * Сервис для работы с данными о скриншотах и детекциях объектов
 */
export class ScreenshotsService {
  private state: ScreenshotsMachineContext = { videos: {} }
  private listeners: ((state: ScreenshotsMachineContext) => void)[] = []

  constructor() {
    // Загружаем начальное состояние из IndexedDB
    this.loadState()
  }

  /**
   * Загрузить состояние из IndexedDB
   */
  private async loadState(): Promise<void> {
    try {
      const state = await screenshotsIndexedDBService.loadScreenshotsState()
      if (state && state.videos) {
        this.state = state
        this.notifyListeners()
      }
    } catch (error) {
      console.error("[ScreenshotsService] Ошибка при загрузке состояния:", error)
    }
  }

  /**
   * Сохранить состояние в IndexedDB
   */
  private saveState(): void {
    screenshotsIndexedDBService.saveScreenshotsState(this.state).catch((error) => {
      console.error("[ScreenshotsService] Ошибка при сохранении состояния:", error)
    })
  }

  /**
   * Уведомить слушателей об изменении состояния
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state)
      } catch (error) {
        console.error("[ScreenshotsService] Ошибка в слушателе:", error)
      }
    })
  }

  /**
   * Получить данные о всех видео
   */
  getAllVideosData(): Record<string, VideoScreenshotData> {
    return this.state.videos
  }

  /**
   * Получить данные о конкретном видео
   * @param videoId ID видео
   */
  getVideoData(videoId: string): VideoScreenshotData | undefined {
    return this.state.videos[videoId]
  }

  /**
   * Получить скриншоты для конкретного видео
   * @param videoId ID видео
   */
  getVideoScreenshots(videoId: string): Screenshot[] {
    return this.state.videos[videoId]?.screenshots || []
  }

  /**
   * Проверить, сгенерированы ли скриншоты для видео
   * @param videoId ID видео
   */
  hasScreenshots(videoId: string): boolean {
    const videoData = this.state.videos[videoId]
    return !!videoData?.screenshotsGenerated && videoData.screenshotCount > 0
  }

  /**
   * Проверить, выполнено ли распознавание объектов для видео
   * @param videoId ID видео
   */
  hasObjectDetections(videoId: string): boolean {
    const videoData = this.state.videos[videoId]
    return !!videoData?.objectsDetected && videoData.detectionCount > 0
  }

  /**
   * Уведомить о начале генерации скриншотов
   * @param videoId ID видео
   * @param videoName Имя видео
   * @param videoPath Путь к видео
   */
  notifyScreenshotGenerationStart(videoId: string, videoName?: string, videoPath?: string): void {
    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {}),
          videoId,
          videoName,
          videoPath,
          screenshotsGenerated: false,
          objectsDetected: false,
          screenshotCount: 0,
          detectionCount: 0,
          screenshots: this.state.videos[videoId]?.screenshots || [],
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Уведомить о завершении генерации скриншотов
   * @param videoId ID видео
   * @param screenshots Информация о скриншотах
   * @param videoName Имя видео
   * @param duration Длительность видео
   * @param fps Частота кадров
   * @param frameCount Количество кадров
   */
  notifyScreenshotGenerationComplete(
    videoId: string,
    screenshots: Screenshot[],
    videoName?: string,
    duration?: number,
    fps?: number,
    frameCount?: number,
  ): void {
    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {}),
          videoId,
          videoName,
          duration,
          fps,
          frameCount,
          screenshotsGenerated: true,
          screenshotCount: screenshots.length,
          screenshots,
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Уведомить об ошибке генерации скриншотов
   * @param videoId ID видео
   * @param error Сообщение об ошибке
   */
  notifyScreenshotGenerationError(videoId: string, error: string): void {
    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {}),
          videoId,
          screenshotsGenerated: false,
          error,
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Уведомить о начале распознавания объектов
   * @param videoId ID видео
   * @param screenshotCount Количество скриншотов
   */
  notifyObjectDetectionStart(videoId: string, screenshotCount: number): void {
    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {}),
          videoId,
          objectsDetected: false,
          screenshotCount,
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Уведомить о завершении распознавания объектов
   * @param videoId ID видео
   * @param detectionResults Результаты распознавания
   */
  notifyObjectDetectionComplete(videoId: string, detectionResults: any): void {
    // Получаем текущие скриншоты
    const currentScreenshots = this.state.videos[videoId]?.screenshots || []

    // Обновляем скриншоты с информацией о детекциях
    const updatedScreenshots = currentScreenshots.map((screenshot) => {
      // Находим соответствующий результат детекции по пути к скриншоту
      const detectionResult = detectionResults.results?.find(
        (result: any) => result.image_path === screenshot.path,
      )

      if (detectionResult) {
        return {
          ...screenshot,
          detections: detectionResult.detections || [],
        }
      }

      return screenshot
    })

    // Подсчитываем общее количество детекций
    const detectionCount = updatedScreenshots.reduce(
      (sum, screenshot) => sum + (screenshot.detections?.length || 0),
      0,
    )

    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {}),
          videoId,
          objectsDetected: true,
          detectionCount,
          screenshots: updatedScreenshots,
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Уведомить об ошибке распознавания объектов
   * @param videoId ID видео
   * @param error Сообщение об ошибке
   */
  notifyObjectDetectionError(videoId: string, error: string): void {
    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {}),
          videoId,
          objectsDetected: false,
          error,
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Загрузить данные о видео
   * @param videoId ID видео
   * @param data Данные о видео
   */
  loadVideoData(videoId: string, data: Partial<VideoScreenshotData>): void {
    // Обновляем состояние
    this.state = {
      videos: {
        ...this.state.videos,
        [videoId]: {
          ...(this.state.videos[videoId] || {
            videoId,
            screenshotsGenerated: false,
            objectsDetected: false,
            screenshotCount: 0,
            detectionCount: 0,
            screenshots: [],
          }),
          ...data,
        },
      },
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Очистить данные о видео
   * @param videoId ID видео
   */
  clearVideoData(videoId: string): void {
    // Создаем копию состояния без указанного видео
    const { [videoId]: _, ...restVideos } = this.state.videos

    // Обновляем состояние
    this.state = {
      videos: restVideos,
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Очистить все данные
   */
  clearAllData(): void {
    // Обновляем состояние
    this.state = {
      videos: {},
    }

    // Сохраняем состояние и уведомляем слушателей
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Сохранить состояние
   */
  persistState(): void {
    this.saveState()
  }

  /**
   * Восстановить состояние
   * @param state Состояние
   */
  restoreState(state: Partial<ScreenshotsMachineContext>): void {
    if (state && typeof state === "object") {
      // Обновляем состояние
      this.state = {
        videos: state.videos || {},
      }

      // Сохраняем состояние и уведомляем слушателей
      this.saveState()
      this.notifyListeners()
    }
  }

  /**
   * Подписаться на изменения состояния
   * @param callback Функция обратного вызова
   */
  subscribe(callback: (state: ScreenshotsMachineContext) => void): () => void {
    this.listeners.push(callback)

    // Возвращаем функцию для отписки
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

// Создаем экземпляр сервиса
export const screenshotsService = new ScreenshotsService()
