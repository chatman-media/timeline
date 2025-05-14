import { FfprobeStream } from "@/types/ffprobe"
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
  console.log(
    "calculateTimeRanges called with videos:",
    videos.map((v) => v.name),
  )

  const times = videos.flatMap((v: MediaFile) => {
    const startTime = (v.startTime || 0) * TIME_CONSTANTS.MILLISECONDS_IN_SECOND
    const duration = v.duration || 0
    const endTime = startTime + duration * TIME_CONSTANTS.MILLISECONDS_IN_SECOND
    console.log(
      `Video ${v.name}: startTime=${startTime / 1000}s, duration=${duration}s, endTime=${endTime / 1000}s`,
    )
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

  console.log("Calculated time ranges:", ranges)

  return ranges
}

/**
 * Вычисляет соотношение сторон видео
 * @param stream - Объект с параметрами видеопотока
 * @returns Строка с соотношением сторон (например, "16:9") или null
 * @example
 * const ratio = getAspectRatio({ width: 1920, height: 1080 }); // "16:9"
 */
export const getAspectRatio = (stream?: FfprobeStream): string | null => {
  if (!stream) return null

  console.log("[getAspectRatio] stream:", stream)

  if (stream.display_aspect_ratio === "960:409") {
    return "2.35:1"
  }

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
    // Безопасный парсинг строки формата "num/den"
    const fpsStr = stream.r_frame_rate
    const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)

    if (fpsMatch) {
      // Если строка в формате "num/den", вычисляем деление
      const numerator = parseInt(fpsMatch[1], 10)
      const denominator = parseInt(fpsMatch[2], 10)

      if (denominator === 0) return null

      return numerator / denominator
    } else {
      // Если строка просто число, парсим его
      const fps = parseFloat(fpsStr)
      return isNaN(fps) ? null : fps
    }
  } catch {
    return null
  }
}

/**
 * Получает время кадра (в секундах) из объекта потока или MediaFile
 * @param videoOrStream - Объект MediaFile или FfprobeStream с параметром r_frame_rate
 * @param defaultFps - Значение FPS по умолчанию, если не удалось получить из метаданных
 * @returns Время одного кадра в секундах
 * @example
 * const frameTime = getFrameTime(video); // 0.033333... (для 30 fps)
 */
export const getFrameTime = (
  videoOrStream?: MediaFile | { r_frame_rate?: string },
  defaultFps: number = 25,
): number => {
  if (!videoOrStream) return 1 / defaultFps

  // Если передан MediaFile, извлекаем поток
  const stream =
    "probeData" in videoOrStream ? videoOrStream.probeData?.streams?.[0] : videoOrStream

  // Получаем FPS
  const fps = getFps(stream)

  // Если не удалось получить FPS, используем значение по умолчанию
  if (!fps || fps <= 0) return 1 / defaultFps

  return 1 / fps
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
export function calculateWidth(
  width: number,
  height: number,
  containerHeight: number,
  rotation?: number,
): number {
  // Если нет размеров, возвращаем высоту контейнера
  if (!width || !height) return containerHeight

  // Для повернутого видео меняем местами ширину и высоту
  let aspectRatio = width / height
  if (rotation === 90 || rotation === 270) {
    aspectRatio = height / width
  }

  // Базовая ширина на основе соотношения сторон
  const baseWidth = containerHeight * aspectRatio

  return baseWidth
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

/**
 * Рассчитывает адаптивную ширину для видео с учетом соотношения сторон и режима отображения
 */
export function calculateAdaptiveWidth(
  width: number,
  isMultipleStreams: boolean,
  displayAspectRatio?: string,
): string {
  if (isMultipleStreams) {
    return `${(width / 9) * 8}px`
  }

  // Если нет соотношения сторон, возвращаем обычную ширину
  if (!displayAspectRatio) {
    return `${width}px`
  }

  const [w, h] = displayAspectRatio.split(":").map(Number)
  const ratio = w / h

  // Для широкоформатного видео (2.35:1 или близко к этому)
  if (ratio > 2) {
    return `${(width * (16 / 9)) / ratio}px`
  }

  // Для вертикального видео (например, 9:16)
  if (w < h) {
    return `${(width * 16 * 16) / 9 / 9}px`
  }

  return `${width}px`
}
