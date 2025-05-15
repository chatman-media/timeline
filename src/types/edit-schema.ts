/**
 * Типы для схемы монтажа
 * Схема монтажа состоит из последовательности сегментов,
 * каждый из которых содержит одну или несколько дорожек.
 * К дорожкам могут быть применены ресурсы (эффекты, фильтры, переходы).
 *
 * Схема также может включать данные анализа видео: распознанные объекты,
 * субтитры и анализ звуковой волны для интеллектуального монтажа.
 */

import { ObjectTrack, SimpleVideoAnalysis, Subtitle } from "./video-analysis"

/**
 * Сегмент видео (участок финального монтажа)
 */
export interface EditSegment {
  id: string
  name: string
  startTime: number // Начало сегмента в финальном видео
  duration: number // Длительность сегмента
  tracks: EditTrack[] // Дорожки в сегменте
  template?: string // ID шаблона, если применен
  templateParams?: Record<string, any> // Параметры шаблона

  // Данные анализа видео
  detectedObjects?: ObjectTrack[] // Распознанные объекты в сегменте
  subtitles?: Subtitle[] // Субтитры в сегменте
  audioBeats?: number[] // Временные метки битов в сегменте (относительно начала сегмента)
  sceneType?: string // Тип сцены (крупный план, общий план и т.д.)
  tags?: string[] // Теги, описывающие сегмент
  importance?: number // Важность сегмента (0-1)
  narrative?: {
    // Нарративная информация
    role: string // Роль в повествовании (вступление, кульминация, заключение и т.д.)
    description: string // Описание роли в повествовании
  }
}

/**
 * Дорожка в сегменте
 */
export interface EditTrack {
  id: string
  name: string
  type: "video" | "audio" | "title" | "subtitle"
  sourceId: string // ID исходного медиафайла
  startTime: number // Начало фрагмента в исходном файле
  duration: number // Длительность фрагмента
  position?: {
    // Позиция на экране (для видео при использовании шаблона)
    x: number
    y: number
    width: number
    height: number
  }
  volume?: number // Громкость (для аудио и видео)
  resources: EditResource[] // Примененные ресурсы

  // Данные анализа для дорожки
  focusObjects?: string[] // Объекты, на которых фокусируется дорожка
  subtitleData?: {
    // Данные субтитров (для дорожек типа "subtitle")
    text: string
    speaker?: string
    language?: string
  }
  audioAnalysis?: {
    // Анализ звука (для дорожек типа "audio")
    volume: number // Средняя громкость (0-1)
    beats: number[] // Временные метки битов (относительно начала дорожки)
    speechProbability?: number // Вероятность наличия речи (0-1)
    musicProbability?: number // Вероятность наличия музыки (0-1)
  }
  videoAnalysis?: {
    // Анализ видео (для дорожек типа "video")
    brightness: number // Средняя яркость (0-1)
    motion: number // Средний уровень движения (0-1)
    dominantColors: string[] // Доминирующие цвета
    objectCount: Record<string, number> // Количество объектов каждого типа
  }
}

/**
 * Ресурс, примененный к дорожке
 */
export interface EditResource {
  id: string
  type: "effect" | "filter" | "transition"
  resourceId: string // ID ресурса из библиотеки
  startTime?: number // Начало применения ресурса (относительно дорожки)
  duration?: number // Длительность применения ресурса
  params: Record<string, any> // Параметры ресурса
}

/**
 * Вспомогательные функции для работы со схемой монтажа
 */

/**
 * Создает новый сегмент монтажа
 */
export function createEditSegment(
  name: string,
  startTime: number = 0,
  duration: number = 0,
  tracks: EditTrack[] = [],
  options?: {
    detectedObjects?: ObjectTrack[]
    subtitles?: Subtitle[]
    audioBeats?: number[]
    sceneType?: string
    tags?: string[]
    importance?: number
    narrative?: { role: string; description: string }
  },
): EditSegment {
  return {
    id: `segment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    startTime,
    duration,
    tracks,
    ...(options || {}),
  }
}

/**
 * Создает новую дорожку в сегменте
 */
export function createEditTrack(
  name: string,
  type: "video" | "audio" | "title" | "subtitle",
  sourceId: string,
  startTime: number = 0,
  duration: number = 0,
  position?: { x: number; y: number; width: number; height: number },
  volume: number = 1,
  options?: {
    focusObjects?: string[]
    subtitleData?: {
      text: string
      speaker?: string
      language?: string
    }
    audioAnalysis?: {
      volume: number
      beats: number[]
      speechProbability?: number
      musicProbability?: number
    }
    videoAnalysis?: {
      brightness: number
      motion: number
      dominantColors: string[]
      objectCount: Record<string, number>
    }
  },
): EditTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    type,
    sourceId,
    startTime,
    duration,
    position,
    volume,
    resources: [],
    ...(options || {}),
  }
}

/**
 * Создает новый ресурс для дорожки
 */
export function createEditResource(
  type: "effect" | "filter" | "transition",
  resourceId: string,
  startTime?: number,
  duration?: number,
  params: Record<string, any> = {},
): EditResource {
  return {
    id: `resource-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    resourceId,
    startTime,
    duration,
    params,
  }
}
