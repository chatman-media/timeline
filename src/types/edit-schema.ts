/**
 * Типы для схемы монтажа
 * Схема монтажа состоит из последовательности сегментов,
 * каждый из которых содержит одну или несколько дорожек.
 * К дорожкам могут быть применены ресурсы (эффекты, фильтры, переходы).
 */

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
}

/**
 * Дорожка в сегменте
 */
export interface EditTrack {
  id: string
  name: string
  type: "video" | "audio" | "title"
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
): EditSegment {
  return {
    id: `segment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    startTime,
    duration,
    tracks,
  }
}

/**
 * Создает новую дорожку в сегменте
 */
export function createEditTrack(
  name: string,
  type: "video" | "audio" | "title",
  sourceId: string,
  startTime: number = 0,
  duration: number = 0,
  position?: { x: number; y: number; width: number; height: number },
  volume: number = 1,
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
