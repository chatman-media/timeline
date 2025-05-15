/**
 * Типы для анализа видео
 * Включает распознавание объектов, субтитры и анализ звуковой волны
 */

/**
 * Распознанный объект в кадре
 */
export interface DetectedObject {
  id: string // Уникальный ID объекта
  label: string // Метка объекта (человек, машина, дерево и т.д.)
  confidence: number // Уверенность распознавания (0-1)
  boundingBox: {
    x: number // Координата X левого верхнего угла (0-1)
    y: number // Координата Y левого верхнего угла (0-1)
    width: number // Ширина (0-1)
    height: number // Высота (0-1)
  }
  attributes?: Record<string, any> // Дополнительные атрибуты объекта
  trackId?: string // ID трека объекта (для отслеживания объекта между кадрами)
}

/**
 * Анализ кадра видео
 */
export interface FrameAnalysis {
  frameNumber: number // Номер кадра
  timestamp: number // Временная метка в секундах
  objects: DetectedObject[] // Распознанные объекты
  sceneType?: string // Тип сцены (крупный план, общий план и т.д.)
  dominantColors?: string[] // Доминирующие цвета
  brightness?: number // Яркость кадра (0-1)
  sharpness?: number // Резкость кадра (0-1)
  motion?: number // Уровень движения (0-1)
  tags?: string[] // Теги, описывающие кадр
}

/**
 * Трек объекта (отслеживание объекта между кадрами)
 */
export interface ObjectTrack {
  id: string // Уникальный ID трека
  label: string // Метка объекта
  appearances: {
    frameNumber: number // Номер кадра
    timestamp: number // Временная метка в секундах
    boundingBox: {
      x: number
      y: number
      width: number
      height: number
    }
    confidence: number // Уверенность распознавания
  }[]
  firstAppearance: number // Временная метка первого появления (в секундах)
  lastAppearance: number // Временная метка последнего появления (в секундах)
  duration: number // Длительность присутствия объекта (в секундах)
  importance?: number // Важность объекта (0-1)
}

/**
 * Субтитр
 */
export interface Subtitle {
  id: string // Уникальный ID субтитра
  startTime: number // Время начала (в секундах)
  endTime: number // Время окончания (в секундах)
  text: string // Текст субтитра
  speaker?: string // Говорящий (если известно)
  confidence?: number // Уверенность распознавания (0-1)
  language?: string // Язык субтитра
  sentiment?: {
    // Эмоциональная окраска
    type: "positive" | "negative" | "neutral"
    score: number // Оценка (0-1)
  }
  keywords?: string[] // Ключевые слова в субтитре
}

/**
 * Анализ звуковой волны
 */
export interface AudioAnalysis {
  timestamp: number // Временная метка в секундах
  duration: number // Длительность анализируемого фрагмента (в секундах)
  volume: number // Громкость (0-1)
  beats?: {
    // Обнаруженные биты
    timestamp: number // Временная метка бита (в секундах)
    strength: number // Сила бита (0-1)
  }[]
  speechProbability?: number // Вероятность наличия речи (0-1)
  musicProbability?: number // Вероятность наличия музыки (0-1)
  noiseProbability?: number // Вероятность наличия шума (0-1)
  silenceProbability?: number // Вероятность наличия тишины (0-1)
}

/**
 * Полный анализ видео
 */
export interface VideoAnalysis {
  videoId: string // ID видео
  duration: number // Длительность видео (в секундах)
  frameRate: number // Частота кадров
  resolution: {
    width: number
    height: number
  }
  frames: FrameAnalysis[] // Анализ кадров
  objects: ObjectTrack[] // Треки объектов
  subtitles: Subtitle[] // Субтитры
  audio?: AudioAnalysis[] // Анализ звука
  scenes?: {
    // Обнаруженные сцены
    startTime: number // Время начала сцены (в секундах)
    endTime: number // Время окончания сцены (в секундах)
    type: string // Тип сцены
    keyFrames: number[] // Ключевые кадры (номера кадров)
    description?: string // Описание сцены
  }[]
  summary?: {
    // Общее описание видео
    title?: string // Предлагаемое название
    description?: string // Краткое описание
    tags?: string[] // Теги
    keyMoments?: {
      // Ключевые моменты
      timestamp: number // Временная метка (в секундах)
      description: string // Описание момента
    }[]
  }
}

/**
 * Упрощенный анализ видео (для экономии вычислительных ресурсов)
 */
export interface SimpleVideoAnalysis {
  videoId: string // ID видео
  duration: number // Длительность видео (в секундах)
  keyFrames: {
    // Анализ ключевых кадров (например, каждые 5 секунд)
    timestamp: number // Временная метка в секундах
    objects: {
      label: string // Метка объекта
      count: number // Количество объектов данного типа
    }[]
    sceneType?: string // Тип сцены
    tags?: string[] // Теги, описывающие кадр
  }[]
  subtitles: {
    startTime: number // Время начала (в секундах)
    endTime: number // Время окончания (в секундах)
    text: string // Текст субтитра
  }[]
  audioBeats?: number[] // Временные метки битов (в секундах)
  scenes?: {
    // Обнаруженные сцены
    startTime: number // Время начала сцены (в секундах)
    endTime: number // Время окончания сцены (в секундах)
    type: string // Тип сцены
  }[]
}

/**
 * Создает пустой анализ видео
 */
export function createEmptyVideoAnalysis(
  videoId: string,
  duration: number,
  frameRate: number,
  width: number,
  height: number,
): VideoAnalysis {
  return {
    videoId,
    duration,
    frameRate,
    resolution: {
      width,
      height,
    },
    frames: [],
    objects: [],
    subtitles: [],
    audio: [],
    scenes: [],
  }
}

/**
 * Создает пустой упрощенный анализ видео
 */
export function createEmptySimpleVideoAnalysis(
  videoId: string,
  duration: number,
): SimpleVideoAnalysis {
  return {
    videoId,
    duration,
    keyFrames: [],
    subtitles: [],
    audioBeats: [],
    scenes: [],
  }
}
