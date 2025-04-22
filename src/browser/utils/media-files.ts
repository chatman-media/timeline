import { MediaFile, Track } from "@/types/media"
import { TimeRange } from "@/types/time-range"
import { calculateTimeRanges } from "@/utils/video-utils"
import { nanoid } from "nanoid"

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

export interface Sector {
  tracks: Track[]
  timeRanges: TimeRange[]
}

export function hasAudioStream(file: MediaFile): boolean {
  const hasAudio = file.probeData?.streams?.some((stream) => stream.codec_type === "audio") ?? false
  console.log(`[hasAudioStream] ${file.name}:`, hasAudio)
  return hasAudio
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

export function getRemainingMediaCounts(
  media: MediaFile[],
  addedFiles: Set<string>,
): {
  remainingVideoCount: number
  remainingAudioCount: number
  allFilesAdded: boolean
} {
  const remainingVideoCount = media.filter(
    (f) => getFileType(f) === "video" && f.path && !addedFiles.has(f.path) && hasAudioStream(f),
  ).length

  const remainingAudioCount = media.filter(
    (f) => getFileType(f) === "audio" && f.path && !addedFiles.has(f.path) && hasAudioStream(f),
  ).length

  const allFilesAdded =
    media.length > 0 &&
    media.filter(hasAudioStream).every((file) => file.path && addedFiles.has(file.path))

  return {
    remainingVideoCount,
    remainingAudioCount,
    allFilesAdded,
  }
}

export function getTopDateWithRemainingFiles(
  sortedDates: { date: string; files: MediaFile[] }[],
  addedFiles: Set<string>,
): { date: string; files: MediaFile[]; remainingFiles: MediaFile[] } | undefined {
  const isVideoWithAudio = (file: MediaFile): boolean => {
    const hasVideo = file.probeData?.streams?.some((s) => s.codec_type === "video")
    const hasAudio = file.probeData?.streams?.some((s) => s.codec_type === "audio")
    console.log(`[getTopDateWithRemainingFiles] ${file.name}: video=${hasVideo}, audio=${hasAudio}`)
    return !!hasVideo
  }

  const datesByFileCount = [...sortedDates].sort((a, b) => {
    const aCount = a.files.filter((f) => !addedFiles.has(f.path) && isVideoWithAudio(f)).length
    const bCount = b.files.filter((f) => !addedFiles.has(f.path) && isVideoWithAudio(f)).length
    return bCount - aCount
  })

  const result = datesByFileCount
    .map((dateInfo) => ({
      ...dateInfo,
      remainingFiles: dateInfo.files.filter(
        (file) => !addedFiles.has(file.path) && isVideoWithAudio(file),
      ),
    }))
    .find((dateInfo) => dateInfo.remainingFiles.length > 0)

  console.log("[getTopDateWithRemainingFiles] Result:", {
    date: result?.date,
    remainingFilesCount: result?.remainingFiles.length,
    files: result?.remainingFiles.map((f) => f.name),
  })

  return result
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
export function isHorizontalVideo(width: number, height: number, rotation?: number): boolean {
  // Если видео повернуто на 90 или 270 градусов, меняем местами ширину и высоту
  if (rotation === 90 || rotation === -90 || rotation === 270) {
    ;[width, height] = [height, width]
  }

  // Видео считается горизонтальным, если его ширина больше высоты
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
 * @returns Массив созданных треков
 */
export const createTracksFromFiles = (
  files: MediaFile[],
  existingTracks: Track[] = [],
): Sector[] => {
  // Разделяем файлы на видео и аудио
  const videoFiles = files.filter((file) =>
    file.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )
  const audioFiles = files.filter(
    (file) => !file.probeData?.streams?.some((stream) => stream.codec_type === "audio"),
  )
  const tracks: Track[] = []

  // Сортируем файлы по времени начала
  const sortedVideoFiles = [...videoFiles].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
  const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

  const sectors: Sector[] = []

  // Группируем видео по дням
  const videoFilesByDay = sortedVideoFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
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

    // Создаем один сектор для всех файлов дня
    const sector: Sector = {
      tracks: [],
      timeRanges: [],
    }

    // Группируем файлы и создаем треки
    const groupedVideoFiles = getGroupedFiles(dayFiles)
    Object.values(groupedVideoFiles).forEach((groupFiles, index) => {
      sector.tracks.push({
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

    // Обновляем timeRanges сектора
    sector.timeRanges = calculateTimeRanges(dayFiles)
    sectors.push(sector)
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

    // Создаем один сектор для всех аудио файлов дня
    const sector: Sector = {
      tracks: [],
      timeRanges: [],
    }

    const groupedAudioFiles = getGroupedFiles(dayFiles)
    Object.values(groupedAudioFiles).forEach((groupFiles, index) => {
      sector.tracks.push({
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
        index: maxAudioIndex + index + 1,
        volume: 1,
        isMuted: false,
        isLocked: false,
        isVisible: true,
      })
    })

    // Обновляем timeRanges сектора
    sector.timeRanges = calculateTimeRanges(dayFiles)
    sectors.push(sector)
  })

  return sectors
}
