import { MediaFile } from "@/types/media"

// Интерфейс для настроек генерации скриншотов
export interface ScreenshotGenerationSettings {
  interval: number // Интервал между скриншотами в секундах
  maxScreenshots: number | null // Максимальное количество скриншотов (null - без ограничений)
  initialCount: number // Количество скриншотов для начальной генерации
}

// Интерфейс для настроек распознавания объектов
export interface ObjectDetectionSettings {
  confidenceThreshold: number // Порог уверенности для детекций
  modelName: string // Имя модели для использования
}

// Интерфейс для информации о скриншоте
export interface ScreenshotInfo {
  path: string // Путь к скриншоту
  timestamp: number // Временная метка в секундах
  frame: number // Номер кадра
  type: "initial" | "regular" // Тип скриншота
}

// Интерфейс для результатов генерации скриншотов
export interface ScreenshotGenerationResult {
  videoId: string // ID видео
  videoPath: string // Путь к видеофайлу
  videoName: string // Имя видеофайла
  duration: number // Длительность видео в секундах
  fps: number // Частота кадров
  frameCount: number // Количество кадров
  screenshotCount: number // Количество сгенерированных скриншотов
  screenshots: ScreenshotInfo[] // Информация о скриншотах
  error?: string // Ошибка, если есть
}

// Интерфейс для информации о детекции
export interface DetectionInfo {
  classId: number // ID класса
  className: string // Название класса
  confidence: number // Уверенность
  bbox: [number, number, number, number] // Координаты ограничивающей рамки [x1, y1, x2, y2]
}

// Интерфейс для результатов распознавания объектов на одном изображении
export interface ImageDetectionResult {
  imagePath: string // Путь к изображению
  detections: DetectionInfo[] // Информация о детекциях
  detectionCount: number // Количество детекций
  error?: string // Ошибка, если есть
}

// Интерфейс для результатов распознавания объектов
export interface ObjectDetectionResult {
  videoId: string // ID видео
  model: string // Имя модели
  confThreshold: number // Порог уверенности
  imageCount: number // Количество обработанных изображений
  results: ImageDetectionResult[] // Результаты для каждого изображения
}

/**
 * Сервис для управления процессом генерации скриншотов и распознавания объектов
 */
class ScreenshotService {
  private static instance: ScreenshotService
  private defaultSettings: ScreenshotGenerationSettings = {
    interval: 1.0,
    maxScreenshots: null,
    initialCount: 10,
  }
  private defaultDetectionSettings: ObjectDetectionSettings = {
    confidenceThreshold: 0.25,
    modelName: "yolov10s.pt",
  }

  /**
   * Получает экземпляр сервиса (Singleton)
   */
  public static get(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService()
    }
    return ScreenshotService.instance
  }

  /**
   * Генерирует скриншоты для видеофайлов
   * @param videoFiles Массив видеофайлов
   * @param screenshotsPath Путь для сохранения скриншотов
   * @param settings Настройки генерации скриншотов
   * @returns Promise с результатами генерации скриншотов
   */
  public async generateScreenshots(
    videoFiles: MediaFile[],
    screenshotsPath: string = "public/screenshots",
    settings: Partial<ScreenshotGenerationSettings> = {},
  ): Promise<ScreenshotGenerationResult[]> {
    try {
      console.log(
        "[ScreenshotService] Генерация скриншотов для видеофайлов:",
        videoFiles.map((v) => v.name),
      )

      // Объединяем настройки по умолчанию с переданными
      const finalSettings = { ...this.defaultSettings, ...settings }

      // Формируем данные для запроса
      const requestData = {
        videoFiles,
        screenshotsPath,
        interval: finalSettings.interval,
        maxScreenshots: finalSettings.maxScreenshots,
        initialCount: finalSettings.initialCount,
      }

      // Отправляем запрос на генерацию скриншотов
      const response = await fetch("/api/generate-screenshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка при генерации скриншотов: ${response.status} ${errorText}`)
      }

      // Получаем результаты
      const data = await response.json()
      return data.results
    } catch (error) {
      console.error("[ScreenshotService] Ошибка при генерации скриншотов:", error)
      throw error
    }
  }

  /**
   * Распознает объекты на скриншотах
   * @param videoId ID видео
   * @param screenshotPaths Массив путей к скриншотам
   * @param outputDir Директория для сохранения результатов
   * @param settings Настройки распознавания объектов
   * @returns Promise с результатами распознавания объектов
   */
  public async detectObjects(
    videoId: string,
    screenshotPaths: string[],
    outputDir: string = `public/screenshots/detected/${videoId}`,
    settings: Partial<ObjectDetectionSettings> = {},
  ): Promise<ObjectDetectionResult> {
    try {
      console.log(
        `[ScreenshotService] Распознавание объектов для видео ${videoId}, количество скриншотов: ${screenshotPaths.length}`,
      )

      // Объединяем настройки по умолчанию с переданными
      const finalSettings = { ...this.defaultDetectionSettings, ...settings }

      // Формируем данные для запроса
      const requestData = {
        videoId,
        screenshotPaths,
        outputDir,
        confidenceThreshold: finalSettings.confidenceThreshold,
        modelName: finalSettings.modelName,
      }

      // Отправляем запрос на распознавание объектов
      const response = await fetch("/api/detect-objects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка при распознавании объектов: ${response.status} ${errorText}`)
      }

      // Получаем результаты
      const data = await response.json()
      return data.result
    } catch (error) {
      console.error(
        `[ScreenshotService] Ошибка при распознавании объектов для видео ${videoId}:`,
        error,
      )
      throw error
    }
  }
}

// Экспортируем экземпляр сервиса
export const screenshotService = ScreenshotService.get()
