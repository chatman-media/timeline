/**
 * Сервис для работы с данными YOLO
 */
import { yoloIndexedDBService } from "./yolo-indexeddb-service";

// Типы данных
export interface YoloDetection {
  class_id: number
  class_name: string
  confidence: number
  bbox: [number, number, number, number] // [x1, y1, x2, y2]
}

export interface YoloFrame {
  timestamp: number
  detections: YoloDetection[]
}

export interface YoloVideoData {
  videoId: string
  videoName?: string
  frames: YoloFrame[]
}

export interface YoloVideoSummary {
  videoId: string
  videoName: string
  totalFrames: number
  uniqueClasses: string[]
  classCounts: Record<string, number>
  totalDetections: number
}

/**
 * Сервис для работы с данными YOLO
 */
export class YoloDataService {
  // Кэш для хранения данных YOLO
  private yoloDataCache: Record<string, YoloVideoData> = {}

  // Кэш для отслеживания видео, для которых нет данных
  private nonExistentFiles: Record<string, boolean> = {}

  // Счетчик для отслеживания количества сообщений о ненайденных данных YOLO
  private missingDataCount: number = 0

  constructor() {
    // Загружаем список видео без данных YOLO из IndexedDB при инициализации
    this.loadNonExistentFiles()
  }

  /**
   * Загружает список видео без данных YOLO из IndexedDB
   */
  private async loadNonExistentFiles(): Promise<void> {
    try {
      const nonExistentFiles = await yoloIndexedDBService.loadNonExistentFiles()
      if (nonExistentFiles && Object.keys(nonExistentFiles).length > 0) {
        this.nonExistentFiles = nonExistentFiles
        this.missingDataCount = Object.keys(nonExistentFiles).length

        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development") {
          console.debug(`[YoloDataService] Загружен список видео без данных YOLO из IndexedDB (${this.missingDataCount} видео)`)
        }
      }
    } catch (error) {
      console.error("[YoloDataService] Ошибка при загрузке списка видео без данных YOLO:", error)
    }
  }

  /**
   * Загрузить данные YOLO для видео
   * @param videoId ID видео
   * @returns Данные YOLO или null, если данные не найдены
   */
  public async loadYoloData(videoId: string): Promise<YoloVideoData | null> {
    // Логируем только в режиме отладки и с низкой вероятностью
    if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
      console.debug(`[YoloDataService] Запрос на загрузку данных YOLO для видео ${videoId}`)
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      // Логируем только в режиме отладки и с низкой вероятностью
      if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
        console.debug(
          `[YoloDataService] Данные YOLO для видео ${videoId} загружены из кэша:`,
          `${this.yoloDataCache[videoId].frames?.length || 0} кадров`,
        )
      }
      return this.yoloDataCache[videoId]
    }

    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      // Логируем только в режиме отладки и с очень низкой вероятностью
      if (process.env.NODE_ENV === "development" && Math.random() < 0.01) {
        console.debug(
          `[YoloDataService] Пропускаем запрос для видео ${videoId}, данные отсутствуют (из кэша)`,
        )
      }
      return null
    }

    // Пытаемся загрузить данные из IndexedDB
    try {
      // Логируем только в режиме отладки и с низкой вероятностью
      if (process.env.NODE_ENV === "development" && Math.random() < 0.1) {
        console.debug(
          `[YoloDataService] Пытаемся загрузить данные YOLO из IndexedDB для видео ${videoId}`,
        )
      }

      // Загружаем данные из IndexedDB
      const data = await yoloIndexedDBService.loadYoloData(videoId)

      // Если данные найдены, сохраняем их в кэш и возвращаем
      if (data) {
        this.yoloDataCache[videoId] = data

        // Логируем только в режиме отладки и с низкой вероятностью
        if (process.env.NODE_ENV === "development" && Math.random() < 0.1) {
          console.debug(
            `[YoloDataService] Данные YOLO для видео ${videoId} загружены из IndexedDB: ${data.frames?.length || 0} кадров`,
          )
        }

        return data
      }

      // Если данные не найдены, увеличиваем счетчик ненайденных данных
      this.missingDataCount += 1

      // Логируем предупреждение только для первых 5 видео или с вероятностью 1%
      if (this.missingDataCount <= 5 || Math.random() < 0.01) {
        console.debug(
          `[YoloDataService] Данные YOLO для видео ${videoId} не найдены (${this.missingDataCount} видео без данных)`,
        )
      }

      // Отмечаем, что данные для этого видео отсутствуют
      // Это предотвратит повторные запросы
      this.nonExistentFiles[videoId] = true

      // Сохраняем список видео без данных в IndexedDB
      yoloIndexedDBService.saveNonExistentFiles(this.nonExistentFiles)

      // Возвращаем null, так как данные не найдены
      return null
    } catch (error) {
      console.error(
        `[YoloDataService] Ошибка при загрузке данных YOLO из IndexedDB для видео ${videoId}:`,
        error,
      )

      // Отмечаем, что данные для этого видео отсутствуют
      this.nonExistentFiles[videoId] = true

      return null
    }
  }

  /**
   * Сохранить данные YOLO в кэш и IndexedDB
   * @param videoId ID видео
   * @param data Данные YOLO
   */
  public async saveYoloData(videoId: string, data: YoloVideoData): Promise<void> {
    // Сохраняем данные в кэш
    this.yoloDataCache[videoId] = data

    // Удаляем видео из списка несуществующих
    if (this.nonExistentFiles[videoId]) {
      delete this.nonExistentFiles[videoId]

      // Обновляем список видео без данных в IndexedDB
      await yoloIndexedDBService.saveNonExistentFiles(this.nonExistentFiles)
    }

    // Сохраняем данные в IndexedDB
    await yoloIndexedDBService.saveYoloData(videoId, data)

    console.log(`[YoloDataService] Данные YOLO для видео ${videoId} сохранены в кэш и IndexedDB`)
  }

  /**
   * Найти ближайший кадр к указанной временной метке
   * @param frames Массив кадров
   * @param timestamp Временная метка
   * @returns Ближайший кадр или null, если кадры не найдены
   */
  private findClosestFrame(frames: YoloFrame[], timestamp: number): YoloFrame | null {
    if (!frames || frames.length === 0) {
      return null
    }

    // Если только один кадр, возвращаем его
    if (frames.length === 1) {
      return frames[0]
    }

    // Находим ближайший кадр
    let closestFrame = frames[0]
    let minDiff = Math.abs(closestFrame.timestamp - timestamp)

    for (let i = 1; i < frames.length; i++) {
      const diff = Math.abs(frames[i].timestamp - timestamp)
      if (diff < minDiff) {
        minDiff = diff
        closestFrame = frames[i]
      }
    }

    return closestFrame
  }

  /**
   * Получить данные YOLO для конкретного момента времени
   * @param videoId ID видео
   * @param timestamp Временная метка (в секундах от начала видео)
   * @returns Массив обнаруженных объектов или пустой массив, если данные не найдены
   */
  public async getYoloDataAtTimestamp(
    videoId: string,
    timestamp: number,
  ): Promise<YoloDetection[]> {
    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return []
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      const yoloData = this.yoloDataCache[videoId]

      if (!yoloData.frames || yoloData.frames.length === 0) {
        return []
      }

      // Находим ближайший кадр к указанной временной метке
      const closestFrame = this.findClosestFrame(yoloData.frames, timestamp)

      if (!closestFrame) {
        return []
      }

      return closestFrame.detections
    }

    // Отмечаем, что данные для этого видео отсутствуют
    this.nonExistentFiles[videoId] = true

    return []
  }

  /**
   * Создать сводную информацию о распознанных объектах в видео
   * @param videoId ID видео
   * @returns Сводная информация или null, если данные не найдены
   */
  public async createVideoSummary(videoId: string): Promise<YoloVideoSummary | null> {
    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return null
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      const yoloData = this.yoloDataCache[videoId]

      if (!yoloData.frames || yoloData.frames.length === 0) {
        return null
      }

      // Собираем статистику
      const detectedClasses = new Set<string>()
      const classCounts: Record<string, number> = {}

      // Обрабатываем все кадры
      yoloData.frames.forEach((frame) => {
        frame.detections.forEach((detection) => {
          const className = detection.class_name || `${detection.class_id}`
          detectedClasses.add(className)

          if (!classCounts[className]) {
            classCounts[className] = 0
          }

          classCounts[className]++
        })
      })

      // Создаем сводную информацию
      return {
        videoId: videoId,
        videoName: yoloData.videoName || videoId,
        totalFrames: yoloData.frames.length,
        uniqueClasses: Array.from(detectedClasses),
        classCounts: classCounts,
        totalDetections: Object.values(classCounts).reduce((sum, count) => sum + count, 0),
      }
    }

    // Отмечаем, что данные для этого видео отсутствуют
    this.nonExistentFiles[videoId] = true

    return null
  }
}

// Создаем экземпляр сервиса
export const yoloDataService = new YoloDataService()
