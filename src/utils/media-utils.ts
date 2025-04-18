import { nanoid } from "nanoid"

import type { FileGroup, MediaFile, Track } from "@/types/media"

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

  // Сортируем файлы по времени начала
  const sortedVideoFiles = [...videoFiles].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
  const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

  // Группируем видео по дням для правильной нумерации
  const videoFilesByDay = sortedVideoFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    // Если нет startTime, используем текущее время
    const startTime = file.startTime || Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  // Обрабатываем видео файлы по дням
  Object.entries(videoFilesByDay).forEach(([date, dayFiles]) => {
    // Определяем максимальный номер видеодорожки для этого дня
    const maxVideoIndex = Math.max(
      0,
      ...tracks
        .filter(
          (track) =>
            track.type === "video" &&
            track.videos?.some(
              (v) =>
                v.startTime && new Date(v.startTime * 1000).toISOString().split("T")[0] === date,
            ),
        )
        .map((track) => Number(track.index) || 0),
      ...existingTracks
        .filter(
          (track) =>
            track.type === "video" &&
            track.videos?.some(
              (v) =>
                v.startTime && new Date(v.startTime * 1000).toISOString().split("T")[0] === date,
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
        volume: 1,
        isMuted: false,
        isLocked: false,
        isVisible: true,
      })
    })
  })

  // Аналогично для аудио файлов
  const audioFilesByDay = sortedAudioFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    const startTime = file.startTime || Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  // Обрабатываем аудио файлы по дням
  Object.entries(audioFilesByDay).forEach(([date, dayFiles]) => {
    const maxAudioIndex = Math.max(
      0,
      ...tracks
        .filter(
          (track) =>
            track.type === "audio" &&
            track.videos?.some(
              (v) =>
                v.startTime && new Date(v.startTime * 1000).toISOString().split("T")[0] === date,
            ),
        )
        .map((track) => Number(track.index) || 0),
      ...existingTracks
        .filter(
          (track) =>
            track.type === "audio" &&
            track.videos?.some(
              (v) =>
                v.startTime && new Date(v.startTime * 1000).toISOString().split("T")[0] === date,
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
        volume: 1,
        isMuted: false,
        isLocked: false,
        isVisible: true,
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
    const date = file.startTime
      ? new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      : "Без даты"

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  return Object.entries(videoFilesByDate)
    .sort(([a], [b]) => {
      if (a === "Без даты") return 1
      if (b === "Без даты") return -1
      return new Date(b).getTime() - new Date(a).getTime()
    })
    .map(([date, files]) => ({ date, files }))
}

/**
 * Определяет тип медиафайла
 * @param file - Медиафайл
 * @returns "video" или "audio" или "image"
 */
export const getFileType = (file: MediaFile): "video" | "audio" | "image" => {
  const hasVideoStream = file.probeData?.streams?.some((stream) => stream.codec_type === "video")
  if (file.isImage) return "image"
  if (hasVideoStream) return "video"
  return "audio"
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
      title: "Все видео",
      fileIds: files.filter((f) => getFileType(f) === "video").map((f) => f.id),
      type: "video",
      count: files.filter((f) => getFileType(f) === "video").length,
      totalDuration: 0,
      totalSize: 0,
    },
    audio: {
      id: "all-audio",
      title: "Все аудио",
      fileIds: files.filter((f) => getFileType(f) === "audio").map((f) => f.id),
      type: "audio",
      count: files.filter((f) => getFileType(f) === "audio").length,
      totalDuration: 0,
      totalSize: 0,
    },
    images: {
      id: "all-images",
      title: "Все изображения",
      fileIds: files.filter((f) => getFileType(f) === "image").map((f) => f.id),
      type: "image",
      count: files.filter((f) => getFileType(f) === "image").length,
      totalDuration: 0,
      totalSize: 0,
    },
  }

  const sequentialGroups = getGroupedFiles(files)

  Object.entries(sequentialGroups)
    .filter(([, groupFiles]) => groupFiles.length > 1)
    .forEach(([key, groupFiles]) => {
      groups[`sequential-${key}`] = {
        id: `sequential-${key}`,
        title: `Группа ${key}`,
        fileIds: groupFiles.map((f) => f.id),
        type: "sequential",
        count: groupFiles.length,
        totalDuration: 0,
        totalSize: 0,
        videosPerSeries: groupFiles.length,
      }
    })

  return groups
}
