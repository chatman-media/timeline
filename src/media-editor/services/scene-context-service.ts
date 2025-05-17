import { YoloDetection } from "@/types/yolo"

import { yoloDataService } from "./yolo-data-service"

/**
 * Интерфейс для контекста сцены, предоставляемого ИИ
 */
export interface AISceneContext {
  /** Информация о текущем видео */
  currentVideo: {
    id: string
    name: string
    timestamp: number
  }
  /** Обнаруженные объекты в текущей сцене */
  detectedObjects: {
    class: string
    confidence: number
    position: string // "left", "center", "right", etc.
    size: string // "small", "medium", "large"
  }[]
  /** Основные объекты в сцене */
  dominantObjects: string[]
  /** Текстовое описание сцены */
  sceneDescription: string
}

/**
 * Сервис для генерации контекста сцены на основе данных YOLO
 */
export class SceneContextService {
  private static instance: SceneContextService
  private yoloService

  private constructor() {
    this.yoloService = yoloDataService
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): SceneContextService {
    if (!SceneContextService.instance) {
      SceneContextService.instance = new SceneContextService()
    }
    return SceneContextService.instance
  }

  /**
   * Генерировать контекст сцены для ИИ
   * @param videoId ID видео
   * @param videoName Название видео
   * @param timestamp Временная метка (в секундах от начала видео)
   * @returns Контекст сцены или null, если данные не найдены
   */
  public async generateSceneContext(
    videoId: string,
    videoName: string,
    timestamp: number,
  ): Promise<AISceneContext | null> {
    try {
      // Получаем данные YOLO для указанного момента времени
      const detections = await this.yoloService.getYoloDataAtTimestamp(videoId, timestamp)

      if (!detections || detections.length === 0) {
        // Логируем только в режиме отладки и с низкой вероятностью
        if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
          console.debug(
            `[SceneContextService] Нет данных YOLO для видео ${videoId} в момент времени ${timestamp}`,
          )
        }
        return null
      }

      // Преобразуем технические данные в понятный для ИИ формат
      const detectedObjects = detections.map((detection) => ({
        class: detection.class_name || detection.class || `Class ${detection.class_id}`,
        confidence: detection.confidence,
        position: this.calculatePosition(detection),
        size: this.calculateSize(detection),
      }))

      // Определяем доминирующие объекты
      const dominantObjects = this.calculateDominantObjects(detections)

      // Генерируем текстовое описание
      const sceneDescription = this.generateSceneDescription(detectedObjects, dominantObjects)

      return {
        currentVideo: {
          id: videoId,
          name: videoName,
          timestamp,
        },
        detectedObjects,
        dominantObjects,
        sceneDescription,
      }
    } catch (error) {
      console.error(`[SceneContextService] Ошибка при генерации контекста сцены:`, error)
      return null
    }
  }

  /**
   * Рассчитать позицию объекта в кадре
   * @param detection Информация об обнаруженном объекте
   * @returns Текстовое описание позиции
   */
  private calculatePosition(detection: any): string {
    // Проверяем формат bbox
    if (Array.isArray(detection.bbox)) {
      // Формат [x1, y1, x2, y2]
      const [x1, y1, x2, y2] = detection.bbox

      // Рассчитываем центр объекта
      const centerX = (x1 + x2) / 2
      const centerY = (y1 + y2) / 2

      // Определяем горизонтальную позицию (предполагаем, что координаты нормализованы от 0 до 1)
      let horizontalPosition: string
      if (centerX < 0.33) {
        horizontalPosition = "left"
      } else if (centerX < 0.66) {
        horizontalPosition = "center"
      } else {
        horizontalPosition = "right"
      }

      // Определяем вертикальную позицию
      let verticalPosition: string
      if (centerY < 0.33) {
        verticalPosition = "top"
      } else if (centerY < 0.66) {
        verticalPosition = "middle"
      } else {
        verticalPosition = "bottom"
      }

      // Возвращаем комбинированную позицию
      return `${verticalPosition}-${horizontalPosition}`
    } else if (typeof detection.bbox === "object") {
      // Формат {x, y, width, height}
      const { x, y, width, height } = detection.bbox

      // Рассчитываем центр объекта
      const centerX = x + width / 2

      // Определяем горизонтальную позицию
      let horizontalPosition: string
      if (centerX < 0.33) {
        horizontalPosition = "left"
      } else if (centerX < 0.66) {
        horizontalPosition = "center"
      } else {
        horizontalPosition = "right"
      }

      // Рассчитываем вертикальную позицию
      const centerY = y + height / 2
      let verticalPosition: string
      if (centerY < 0.33) {
        verticalPosition = "top"
      } else if (centerY < 0.66) {
        verticalPosition = "middle"
      } else {
        verticalPosition = "bottom"
      }

      // Возвращаем комбинированную позицию
      return `${verticalPosition}-${horizontalPosition}`
    }

    // Если формат не распознан, возвращаем значение по умолчанию
    return "middle-center"
  }

  /**
   * Рассчитать размер объекта в кадре
   * @param detection Информация об обнаруженном объекте
   * @returns Текстовое описание размера
   */
  private calculateSize(detection: any): string {
    let area: number

    // Проверяем формат bbox
    if (Array.isArray(detection.bbox)) {
      // Формат [x1, y1, x2, y2]
      const [x1, y1, x2, y2] = detection.bbox

      // Рассчитываем площадь объекта относительно всего кадра
      area = (x2 - x1) * (y2 - y1)
    } else if (typeof detection.bbox === "object") {
      // Формат {x, y, width, height}
      const { width, height } = detection.bbox

      // Рассчитываем площадь объекта относительно всего кадра
      area = width * height
    } else {
      // Если формат не распознан, возвращаем значение по умолчанию
      return "medium"
    }

    // Определяем размер
    if (area < 0.05) {
      return "small"
    } else if (area < 0.15) {
      return "medium"
    } else {
      return "large"
    }
  }

  /**
   * Определить доминирующие объекты в сцене
   * @param detections Массив обнаруженных объектов
   * @returns Массив названий доминирующих классов объектов
   */
  private calculateDominantObjects(detections: any[]): string[] {
    // Если объектов нет, возвращаем пустой массив
    if (!detections || detections.length === 0) {
      return []
    }

    // Считаем количество объектов каждого класса
    const classCounts: Record<string, number> = {}
    detections.forEach((detection) => {
      const className = detection.class_name || detection.class || `Class ${detection.class_id}`
      classCounts[className] = (classCounts[className] || 0) + 1
    })

    // Считаем общую площадь объектов каждого класса
    const classAreas: Record<string, number> = {}
    detections.forEach((detection) => {
      const className = detection.class_name || detection.class || `Class ${detection.class_id}`
      let area: number

      // Проверяем формат bbox
      if (Array.isArray(detection.bbox)) {
        // Формат [x1, y1, x2, y2]
        const [x1, y1, x2, y2] = detection.bbox
        area = (x2 - x1) * (y2 - y1)
      } else if (typeof detection.bbox === "object") {
        // Формат {x, y, width, height}
        const { width, height } = detection.bbox
        area = width * height
      } else {
        // Если формат не распознан, используем значение по умолчанию
        area = 0.01
      }

      classAreas[className] = (classAreas[className] || 0) + area
    })

    // Сортируем классы по площади (от большей к меньшей)
    const sortedClasses = Object.keys(classAreas).sort((a, b) => classAreas[b] - classAreas[a])

    // Возвращаем до 3 доминирующих классов
    return sortedClasses.slice(0, 3)
  }

  /**
   * Генерировать текстовое описание сцены
   * @param detectedObjects Обнаруженные объекты
   * @param dominantObjects Доминирующие объекты
   * @returns Текстовое описание сцены
   */
  private generateSceneDescription(
    detectedObjects: {
      class: string
      confidence: number
      position: string
      size: string
    }[],
    dominantObjects: string[],
  ): string {
    // Если объектов нет, возвращаем соответствующее сообщение
    if (!detectedObjects || detectedObjects.length === 0) {
      return "На сцене не обнаружено объектов."
    }

    // Группируем объекты по классам
    const classCounts: Record<string, number> = {}
    detectedObjects.forEach((obj) => {
      classCounts[obj.class] = (classCounts[obj.class] || 0) + 1
    })

    // Формируем описание
    let description = "На сцене "

    // Добавляем информацию о доминирующих объектах
    if (dominantObjects.length > 0) {
      const dominantDescriptions = dominantObjects.map((className) => {
        const count = classCounts[className]
        return `${count} ${this.pluralize(className, count)}`
      })

      if (dominantDescriptions.length === 1) {
        description += `преобладает ${dominantDescriptions[0]}`
      } else {
        const lastDescription = dominantDescriptions.pop()
        description += `преобладают ${dominantDescriptions.join(", ")} и ${lastDescription}`
      }
    } else {
      description += "нет явно преобладающих объектов"
    }

    // Добавляем общее количество объектов
    const totalObjects = detectedObjects.length
    description += `. Всего обнаружено ${totalObjects} ${this.pluralize("объект", totalObjects)}.`

    return description
  }

  /**
   * Склонять существительное в зависимости от числа
   * @param word Слово в именительном падеже единственного числа
   * @param count Количество
   * @returns Слово в правильном падеже
   */
  private pluralize(word: string, count: number): string {
    // Простая реализация для некоторых английских слов
    // В реальном приложении здесь должна быть более сложная логика или использование библиотеки
    if (word === "person") {
      return count === 1 ? "person" : "people"
    }

    // Для русских слов (очень упрощенно)
    if (word === "человек") {
      if (count === 1) return "человек"
      if (count >= 2 && count <= 4) return "человека"
      return "человек"
    }

    if (word === "объект") {
      if (count === 1) return "объект"
      if (count >= 2 && count <= 4) return "объекта"
      return "объектов"
    }

    // Для остальных слов просто добавляем 's' (для английских слов)
    return count === 1 ? word : `${word}s`
  }
}
