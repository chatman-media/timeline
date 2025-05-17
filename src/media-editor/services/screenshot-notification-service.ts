import { io, Socket } from "socket.io-client"
import { toast } from "sonner"

import { Screenshot } from "./screenshots-machine"
import { screenshotsService } from "./screenshots-service"

/**
 * Сервис для обработки уведомлений о генерации скриншотов и распознавании объектов
 */
class ScreenshotNotificationService {
  private static instance: ScreenshotNotificationService
  private socket: Socket | null = null
  private isInitialized = false
  private videoProcessingStatus: Record<
    string,
    {
      screenshotsGenerated: boolean
      objectsDetected: boolean
      screenshotCount: number
      detectionCount: number
    }
  > = {}

  /**
   * Получает экземпляр сервиса (Singleton)
   */
  public static get(): ScreenshotNotificationService {
    if (!ScreenshotNotificationService.instance) {
      ScreenshotNotificationService.instance = new ScreenshotNotificationService()
    }
    return ScreenshotNotificationService.instance
  }

  /**
   * Инициализирует сервис и подключается к Socket.IO серверу
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log("[ScreenshotNotificationService] Сервис уже инициализирован")
      return
    }

    try {
      // Инициализируем Socket.IO
      this.socket = io({
        path: "/api/socketio",
        autoConnect: true,
      })

      // Обрабатываем подключение
      this.socket.on("connect", () => {
        console.log("[ScreenshotNotificationService] Подключено к Socket.IO серверу")
        this.isInitialized = true
      })

      // Обрабатываем отключение
      this.socket.on("disconnect", () => {
        console.log("[ScreenshotNotificationService] Отключено от Socket.IO сервера")
        this.isInitialized = false
      })

      // Обрабатываем ошибки подключения
      this.socket.on("connect_error", (error) => {
        console.error(
          "[ScreenshotNotificationService] Ошибка подключения к Socket.IO серверу:",
          error,
        )
        this.isInitialized = false
      })

      // Регистрируем обработчики событий
      this.registerEventHandlers()
    } catch (error) {
      console.error("[ScreenshotNotificationService] Ошибка при инициализации сервиса:", error)
    }
  }

  /**
   * Регистрирует обработчики событий Socket.IO
   */
  private registerEventHandlers(): void {
    if (!this.socket) return

    // Обработчик начала генерации скриншотов
    this.socket.on("screenshot_generation_start", (data) => {
      console.log("[ScreenshotNotificationService] Начало генерации скриншотов:", data)

      // Обновляем статус видео
      this.videoProcessingStatus[data.videoId] = {
        ...(this.videoProcessingStatus[data.videoId] || {}),
        screenshotsGenerated: false,
        screenshotCount: 0,
      }

      // Сохраняем информацию в машине состояний
      screenshotsService.notifyScreenshotGenerationStart(
        data.videoId,
        data.videoName,
        data.videoPath,
      )

      // Показываем уведомление
      toast("Генерация скриншотов", {
        description: `Начата генерация скриншотов для видео ${data.videoName}`,
        duration: 3000,
      })
    })

    // Обработчик завершения генерации скриншотов
    this.socket.on("screenshot_generation_complete", (data) => {
      console.log("[ScreenshotNotificationService] Завершение генерации скриншотов:", data)

      // Обновляем статус видео
      this.videoProcessingStatus[data.videoId] = {
        ...(this.videoProcessingStatus[data.videoId] || {}),
        screenshotsGenerated: true,
        screenshotCount: data.screenshotCount,
      }

      // Преобразуем скриншоты в нужный формат
      const screenshots: Screenshot[] = data.screenshots.map((screenshot: any) => ({
        path: screenshot.path,
        timestamp: screenshot.timestamp,
        frame: screenshot.frame,
        type: screenshot.type || "regular",
      }))

      // Сохраняем информацию в машине состояний
      screenshotsService.notifyScreenshotGenerationComplete(
        data.videoId,
        screenshots,
        data.videoName,
        data.duration,
        data.fps,
        data.frameCount,
      )

      // Показываем уведомление
      toast.success("Генерация скриншотов завершена", {
        description: `Сгенерировано ${data.screenshotCount} скриншотов для видео ${data.videoName}`,
        duration: 5000,
      })

      // Проверяем, нужно ли запустить распознавание объектов
      this.checkAndStartObjectDetection(data.videoId, data.screenshots)
    })

    // Обработчик ошибки генерации скриншотов
    this.socket.on("screenshot_generation_error", (data) => {
      console.error("[ScreenshotNotificationService] Ошибка генерации скриншотов:", data)

      // Сохраняем информацию об ошибке в машине состояний
      screenshotsService.notifyScreenshotGenerationError(data.videoId, data.error)

      // Показываем уведомление об ошибке
      toast.error("Ошибка генерации скриншотов", {
        description: `Произошла ошибка при генерации скриншотов для видео: ${data.error}`,
        duration: 5000,
      })
    })

    // Обработчик начала распознавания объектов
    this.socket.on("object_detection_start", (data) => {
      console.log("[ScreenshotNotificationService] Начало распознавания объектов:", data)

      // Обновляем статус видео
      this.videoProcessingStatus[data.videoId] = {
        ...(this.videoProcessingStatus[data.videoId] || {}),
        objectsDetected: false,
        detectionCount: 0,
      }

      // Сохраняем информацию в машине состояний
      screenshotsService.notifyObjectDetectionStart(data.videoId, data.screenshotCount)

      // Показываем уведомление
      toast("Распознавание объектов", {
        description: `Начато распознавание объектов на ${data.screenshotCount} скриншотах`,
        duration: 3000,
      })
    })

    // Обработчик завершения распознавания объектов
    this.socket.on("object_detection_complete", (data) => {
      console.log("[ScreenshotNotificationService] Завершение распознавания объектов:", data)

      // Подсчитываем общее количество распознанных объектов
      const totalDetections =
        data.detectionResults?.results?.reduce(
          (sum, result) => sum + (result.detections?.length || 0),
          0,
        ) || 0

      // Обновляем статус видео
      this.videoProcessingStatus[data.videoId] = {
        ...(this.videoProcessingStatus[data.videoId] || {}),
        objectsDetected: true,
        detectionCount: totalDetections,
      }

      // Сохраняем информацию в машине состояний
      screenshotsService.notifyObjectDetectionComplete(data.videoId, data.detectionResults)

      // Показываем уведомление
      toast.success("Распознавание объектов завершено", {
        description: `Распознано ${totalDetections} объектов на скриншотах`,
        duration: 5000,
      })
    })

    // Обработчик ошибки распознавания объектов
    this.socket.on("object_detection_error", (data) => {
      console.error("[ScreenshotNotificationService] Ошибка распознавания объектов:", data)

      // Сохраняем информацию об ошибке в машине состояний
      screenshotsService.notifyObjectDetectionError(data.videoId, data.error)

      // Показываем уведомление об ошибке
      toast.error("Ошибка распознавания объектов", {
        description: `Произошла ошибка при распознавании объектов: ${data.error}`,
        duration: 5000,
      })
    })
  }

  /**
   * Проверяет, нужно ли запустить распознавание объектов, и запускает его при необходимости
   * @param videoId ID видео
   * @param screenshots Информация о скриншотах
   */
  private checkAndStartObjectDetection(videoId: string, screenshots: any[]): void {
    // Проверяем, включено ли распознавание объектов в настройках
    try {
      const settingsStr = localStorage.getItem("timeline-screenshot-settings")
      if (settingsStr) {
        const settings = JSON.parse(settingsStr)
        if (settings.enableObjectDetection) {
          // Запускаем распознавание объектов
          this.startObjectDetection(videoId, screenshots, settings.confidenceThreshold)
        }
      }
    } catch (error) {
      console.error("[ScreenshotNotificationService] Ошибка при проверке настроек:", error)
    }
  }

  /**
   * Запускает распознавание объектов на скриншотах
   * @param videoId ID видео
   * @param screenshots Информация о скриншотах
   * @param confidenceThreshold Порог уверенности для детекций
   */
  private startObjectDetection(
    videoId: string,
    screenshots: any[],
    confidenceThreshold: number,
  ): void {
    // Получаем пути к скриншотам
    const screenshotPaths = screenshots.map((screenshot) => screenshot.path)

    // Формируем данные для запроса
    const requestData = {
      videoId,
      screenshotPaths,
      confidenceThreshold,
    }

    // Отправляем запрос на распознавание объектов
    fetch("/api/detect-objects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка при отправке запроса: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log(
          "[ScreenshotNotificationService] Запрос на распознавание объектов отправлен:",
          data,
        )
      })
      .catch((error) => {
        console.error(
          "[ScreenshotNotificationService] Ошибка при отправке запроса на распознавание объектов:",
          error,
        )
      })
  }

  /**
   * Получает статус обработки видео
   * @param videoId ID видео
   * @returns Статус обработки видео
   */
  public getVideoProcessingStatus(videoId: string) {
    // Сначала проверяем данные в машине состояний
    const storedData = screenshotsService.getVideoData(videoId)

    if (storedData) {
      return {
        screenshotsGenerated: storedData.screenshotsGenerated,
        objectsDetected: storedData.objectsDetected,
        screenshotCount: storedData.screenshotCount,
        detectionCount: storedData.detectionCount,
      }
    }

    // Если данных в машине состояний нет, используем локальный статус
    return (
      this.videoProcessingStatus[videoId] || {
        screenshotsGenerated: false,
        objectsDetected: false,
        screenshotCount: 0,
        detectionCount: 0,
      }
    )
  }
}

// Экспортируем экземпляр сервиса
export const screenshotNotificationService = ScreenshotNotificationService.get()
