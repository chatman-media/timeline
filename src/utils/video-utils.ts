import type { MediaFile } from "@/types/media"
import type { TimeRange } from "@/types/time-range"

// Константы для работы с временными промежутками
const TIME_CONSTANTS = {
  MILLISECONDS_IN_SECOND: 1000,
  MAX_GAP_SECONDS: 3600, // Максимальный промежуток между видео в секундах
} as const

/**
 * Вычисляет временные диапазоны для массива видео
 * @param videos - Массив медиафайлов
 * @returns Массив временных диапазонов
 * @example
 * const videos = [
 *   { startTime: 0, duration: 10 },
 *   { startTime: 15, duration: 5 }
 * ];
 * const ranges = calculateTimeRanges(videos);
 */
export const calculateTimeRanges = (videos: MediaFile[]): TimeRange[] => {
  const times = videos.flatMap((v: MediaFile) => {
    const startTime = (v.startTime || 0) * TIME_CONSTANTS.MILLISECONDS_IN_SECOND
    const duration = v.duration || 0
    const endTime = startTime + duration * TIME_CONSTANTS.MILLISECONDS_IN_SECOND
    return [startTime, endTime]
  })

  if (times.length === 0) return []

  const sortedTimes = times.sort((a: number, b: number) => a - b)
  const ranges: TimeRange[] = []
  let currentRange = {
    start: Math.floor(sortedTimes[0] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND),
    end: Math.floor(sortedTimes[0] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND),
    duration:
      Math.floor(sortedTimes[1] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND) -
      Math.floor(sortedTimes[0] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND),
  }

  for (let i = 1; i < sortedTimes.length; i++) {
    const currentTime = Math.floor(sortedTimes[i] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND)
    const gap = currentTime - currentRange.end

    if (gap > TIME_CONSTANTS.MAX_GAP_SECONDS) {
      ranges.push(currentRange)
      currentRange = {
        start: currentTime,
        end: currentTime,
        duration: 0,
      }
    } else {
      currentRange.end = currentTime
    }
  }
  ranges.push(currentRange)

  return ranges
}

/**
 * Вычисляет соотношение сторон видео
 * @param stream - Объект с параметрами видеопотока
 * @returns Строка с соотношением сторон (например, "16:9") или null
 * @example
 * const ratio = getAspectRatio({ width: 1920, height: 1080 }); // "16:9"
 */
export const getAspectRatio = (stream?: {
  display_aspect_ratio?: string
  width?: number
  height?: number
}): string | null => {
  if (!stream) return null

  // Если есть display_aspect_ratio и он не "N/A"
  if (stream.display_aspect_ratio && stream.display_aspect_ratio !== "N/A") {
    return stream.display_aspect_ratio
  }

  // Если есть width и height, вычисляем соотношение
  if (stream.width && stream.height) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
    const divisor = gcd(stream.width, stream.height)
    return `${stream.width / divisor}:${stream.height / divisor}`
  }

  return null
}

/**
 * Получает частоту кадров из строки r_frame_rate
 * @param stream - Объект с параметром r_frame_rate
 * @returns Число кадров в секунду или null
 * @example
 * const fps = getFps({ r_frame_rate: "30/1" }); // 30
 */
export const getFps = (stream?: { r_frame_rate?: string }): number | null => {
  if (!stream?.r_frame_rate) return null

  try {
    return Math.round(eval(stream.r_frame_rate))
  } catch {
    return null
  }
}

/**
 * Состояния громкости звука
 */
export enum VolumeState {
  FULL = 1, // Полная громкость
  HALF = 0.5, // Половина громкости
  MUTED = 0, // Без звука
}

/**
 * Получает следующее состояние громкости в цикле FULL -> HALF -> MUTED -> FULL
 * @param currentVolume - Текущее значение громкости
 * @returns Следующее состояние громкости
 * @example
 * const nextVolume = getNextVolumeState(VolumeState.FULL); // VolumeState.HALF
 */
export const getNextVolumeState = (currentVolume: number): VolumeState => {
  if (currentVolume === VolumeState.FULL) return VolumeState.HALF
  if (currentVolume === VolumeState.HALF) return VolumeState.MUTED
  return VolumeState.FULL
}

/**
 * Вычисляет ширину контейнера с учетом ограничений соотношения сторон
 * @param widthValue - Ширина видео
 * @param heightValue - Высота видео
 * @param size - Размер контейнера
 * @param rotation - Поворот видео
 * @returns Ширину контейнера
 */
export const calculateWidth = (
  widthValue: number,
  heightValue: number,
  size: number,
  rotation?: number | string | undefined | null,
): number => {
  // Для режима миниатюр рассчитываем с учетом реальных пропорций, но с ограничением
  const maxAspectRatio = 2.35 // Максимальное соотношение 2.35:1 (широкоэкранное кино)
  const defaultAspectRatio = 16 / 9 // По умолчанию 16:9

  // Учитываем поворот
  const rotationNum = typeof rotation === "string" ? parseFloat(rotation) : rotation || 0
  const isRotated = Math.abs(rotationNum) === 90 || Math.abs(rotationNum) === 270

  // Если повернуто на 90 или 270 градусов, меняем местами ширину и высоту
  const actualWidth = isRotated ? heightValue : widthValue
  const actualHeight = isRotated ? widthValue : heightValue

  if (!actualWidth || !actualHeight) {
    return size * defaultAspectRatio
  }

  const aspectRatio = actualWidth / actualHeight

  // Ограничиваем соотношение сторон максимальным значением
  const limitedRatio = Math.min(aspectRatio, maxAspectRatio)

  return size * limitedRatio
}

/**
 * Парсит поворот
 * @param rotation - Поворот
 * @returns Поворот
 */
export const parseRotation = (rotation?: string | number): number | undefined => {
  if (rotation === undefined) return undefined
  if (typeof rotation === "number") return rotation
  const parsed = parseInt(rotation, 10)
  return isNaN(parsed) ? undefined : parsed
}
