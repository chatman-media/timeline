import { nanoid } from "nanoid"

import type { FileGroup, MediaFile, Track } from "@/types/videos"

import { calculateTimeRanges } from "./video-utils"

// Типы для улучшения типизации
interface VideoStream {
  codec_type: string
  rotation?: string
  width?: number
  height?: number
}

interface Dimensions {
  width: number
  height: number
  style: string
}

interface DateGroup {
  date: string
  files: MediaFile[]
}

/**
 * Вычисляет реальные размеры видео с учетом поворота
 * @param stream - Видеопоток с информацией о размерах и повороте
 * @returns Объект с реальными размерами и стилями
 * @example
 * const dimensions = calculateRealDimensions({
 *   width: 1920,
 *   height: 1080,
 *   rotation: "90"
 * });
 */
export const calculateRealDimensions = (
  stream: VideoStream & { width: number; height: number },
): Dimensions => {
  const rotation = stream.rotation ? parseInt(stream.rotation) : 0
  const { width, height } = stream

  if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
    return {
      width: height,
      height: width,
      style: "",
    }
  }

  return { width, height, style: "" }
}

/**
 * Определяет, является ли видео горизонтальным с учетом поворота
 * @param width - Ширина видео
 * @param height - Высота видео
 * @param rotation - Угол поворота (опционально)
 * @returns true если видео горизонтальное
 */
export const isHorizontalVideo = (width: number, height: number, rotation?: number): boolean => {
  if (rotation && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
    return height > width
  }
  return width > height
}

/**
 * Группирует файлы по базовому имени
 * @param files - Массив медиафайлов
 * @returns Объект с сгруппированными файлами
 */
export const getGroupedFiles = (files: MediaFile[]): Record<string, MediaFile[]> => {
  const groups: Record<string, MediaFile[]> = {}

  files.forEach((file) => {
    const match = file.name.match(/(.+?)(?:_(\d+))?\.([^.]+)$/)
    if (match) {
      const baseName = match[1]
      if (!groups[baseName]) {
        groups[baseName] = []
      }
      groups[baseName].push(file)
    }
  })

  return Object.fromEntries(
    Object.entries(groups).map(([key, groupFiles]) => [
      key,
      groupFiles.sort((a, b) => (a.startTime || 0) - (b.startTime || 0)),
    ]),
  )
}

/**
 * Создает треки из медиафайлов
 * @param files - Массив медиафайлов
 * @param currentTracksLength - Текущее количество треков
 * @returns Массив созданных треков
 */
export const createTracksFromFiles = (
  files: MediaFile[],
  currentTracksLength: number,
  existingTracks: Track[] = [],
): Track[] => {
  // Разделяем файлы на видео и аудио
  const videoFiles = files.filter((file) =>
    file.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )
  const audioFiles = files.filter(
    (file) => !file.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )

  const tracks: Track[] = []

  // Группируем видео по дням для правильной нумерации
  const videoFilesByDay = videoFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    if (!file.startTime) return acc

    const date = new Date(file.startTime * 1000).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  // Обрабатываем видео файлы по дням
  Object.entries(videoFilesByDay).forEach(([date, dayFiles]) => {
    // Определяем максимальный номер видеодорожки для этого дня (включая существующие треки)
    const maxVideoIndex = Math.max(
      0,
      ...tracks
        .filter(
          (track) =>
            track.type === "video" &&
            track.videos.some(
              (v) => v.startTime && new Date(v.startTime * 1000).toDateString() === date,
            ),
        )
        .map((track) => Number(track.index) || 0),
      ...existingTracks
        .filter(
          (track) =>
            track.type === "video" &&
            track.videos.some(
              (v) => v.startTime && new Date(v.startTime * 1000).toDateString() === date,
            ),
        )
        .map((track) => Number(track.index) || 0),
    )

    const groupedVideoFiles = getGroupedFiles(dayFiles)
    Object.values(groupedVideoFiles).forEach((groupFiles, index) => {
      tracks.push({
        id: nanoid(),
        name: `Видео ${maxVideoIndex + index + 1}`,
        type: "video",
        isActive: false,
        videos: groupFiles,
        startTime: groupFiles[0].startTime || 0,
        endTime:
          (groupFiles[groupFiles.length - 1].startTime || 0) +
          (groupFiles[groupFiles.length - 1].duration || 0),
        combinedDuration: groupFiles.reduce((total, file) => total + (file.duration || 0), 0),
        timeRanges: calculateTimeRanges(groupFiles),
        index: maxVideoIndex + index + 1,
      })
    })
  })

  // Аналогично для аудио файлов
  const audioFilesByDay = audioFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    if (!file.startTime) return acc

    const date = new Date(file.startTime * 1000).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  // Обрабатываем аудио файлы по дням
  Object.entries(audioFilesByDay).forEach(([date, dayFiles]) => {
    // Определяем максимальный номер аудиодорожки для этого дня (включая существующие треки)
    const maxAudioIndex = Math.max(
      0,
      ...tracks
        .filter(
          (track) =>
            track.type === "audio" &&
            track.videos.some(
              (v) => v.startTime && new Date(v.startTime * 1000).toDateString() === date,
            ),
        )
        .map((track) => Number(track.index) || 0),
      ...existingTracks
        .filter(
          (track) =>
            track.type === "audio" &&
            track.videos.some(
              (v) => v.startTime && new Date(v.startTime * 1000).toDateString() === date,
            ),
        )
        .map((track) => Number(track.index) || 0),
    )

    const groupedAudioFiles = getGroupedFiles(dayFiles)
    Object.values(groupedAudioFiles).forEach((groupFiles, index) => {
      tracks.push({
        id: nanoid(),
        name: `Аудио ${maxAudioIndex + index + 1}`,
        type: "audio",
        isActive: false,
        videos: groupFiles,
        startTime: groupFiles[0].startTime || 0,
        endTime:
          (groupFiles[groupFiles.length - 1].startTime || 0) +
          (groupFiles[groupFiles.length - 1].duration || 0),
        combinedDuration: groupFiles.reduce((total, file) => total + (file.duration || 0), 0),
        timeRanges: calculateTimeRanges(groupFiles),
        index: maxAudioIndex + index + 1,
      })
    })
  })

  return tracks
}

/**
 * Получает последовательные файлы из группы
 * @param files - Массив медиафайлов
 * @returns Массив последовательных файлов
 */
export const getSequentialFiles = (files: MediaFile[]): MediaFile[] => {
  const groups = getGroupedFiles(files)
  return Object.values(groups)
    .filter((group) => group.length >= 2)
    .flat()
}

/**
 * Группирует файлы по дате создания
 * @param media - Массив медиафайлов
 * @returns Массив групп файлов по датам
 */
export const groupFilesByDate = (media: MediaFile[]): DateGroup[] => {
  const videoFilesByDate = media.reduce<Record<string, MediaFile[]>>((acc, file) => {
    if (!file.startTime || file.probeData?.streams?.[0]?.codec_type !== "video") return acc

    const date = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  return Object.entries(videoFilesByDate)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([date, files]) => ({ date, files }))
}

/**
 * Определяет тип медиафайла
 * @param file - Медиафайл
 * @returns "video" или "audio"
 */
export const getFileType = (file: MediaFile): "video" | "audio" => {
  const hasVideoStream = file.probeData?.streams?.some((stream) => stream.codec_type === "video")
  return hasVideoStream ? "video" : "audio"
}

/**
 * Подготавливает группы файлов для интерфейса
 * @param files - Массив медиафайлов
 * @returns Объект с группами файлов
 */
export const prepareFileGroups = (files: MediaFile[]): Record<string, FileGroup> => {
  const groups: Record<string, FileGroup> = {
    videos: {
      id: "all-videos",
      fileIds: files.filter((f) => getFileType(f) === "video").map((f) => f.id),
      type: "video",
    },
    audio: {
      id: "all-audio",
      fileIds: files.filter((f) => getFileType(f) === "audio").map((f) => f.id),
      type: "audio",
    },
  }

  const sequentialGroups = getGroupedFiles(files)

  Object.entries(sequentialGroups)
    .filter(([, groupFiles]) => groupFiles.length > 1)
    .forEach(([key, groupFiles]) => {
      groups[`sequential-${key}`] = {
        id: `sequential-${key}`,
        fileIds: groupFiles.map((f) => f.id),
        type: "sequential",
        count: groupFiles.length,
        videosPerSeries: groupFiles.length,
      }
    })

  return groups
}
