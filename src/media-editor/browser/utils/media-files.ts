import { nanoid } from "nanoid"

import i18n from "@/i18n"
import i18next from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import { getCameraModel } from "@/lib/utils"
import { calculateTimeRanges } from "@/lib/video-utils"
import type { MediaFile, Track } from "@/types/media"
import type { TimeRange } from "@/types/time-range"

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
  id: string
  name: string
  tracks: Track[]
  timeRanges: TimeRange[]
  zoomLevel?: number
  scrollPosition?: number
  startTime: number
  endTime: number
}

export function hasAudioStream(file: MediaFile): boolean {
  const hasAudio = file.probeData?.streams?.some((stream) => stream.codec_type === "audio") ?? false
  // console.log(`[hasAudioStream] ${file.name}:`, hasAudio)
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
    // const hasAudio = file.probeData?.streams?.some((s) => s.codec_type === "audio")
    // console.log(`[getTopDateWithRemainingFiles] ${file.name}: video=${hasVideo}, audio=${hasAudio}`)
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

  return result
}

/**
 * Группирует файлы по дате создания
 * @param media - Массив медиафайлов
 * @returns Массив групп файлов по датам
 */
export const groupFilesByDate = (media: MediaFile[]): DateGroup[] => {
  // Получаем текущий язык из i18next
  const currentLanguage = i18next.language || "ru"
  const noDateText = i18next.t("dates.noDate", { defaultValue: "No date" })

  const videoFilesByDate = media.reduce<Record<string, MediaFile[]>>((acc, file) => {
    // Форматируем дату с помощью универсального метода
    const date = file.startTime
      ? formatDateByLanguage(new Date(file.startTime * 1000), currentLanguage, {
        includeYear: true,
        longFormat: true,
      })
      : noDateText

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  return Object.entries(videoFilesByDate)
    .sort(([a], [b]) => {
      if (a === noDateText) return 1
      if (b === noDateText) return -1
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
 * Проверяет, пересекаются ли два временных интервала
 * @param start1 - Начало первого интервала
 * @param end1 - Конец первого интервала
 * @param start2 - Начало второго интервала
 * @param end2 - Конец второго интервала
 * @returns true, если интервалы пересекаются, иначе false
 */
const doTimeRangesOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean => {
  // Если интервалы пересекаются, то начало одного должно быть меньше конца другого
  // и начало другого должно быть меньше конца первого
  const overlap = start1 < end2 && start2 < end1

  // Добавим небольшой зазор (1 секунда) между видео, чтобы они не считались пересекающимися,
  // если конец одного видео совпадает с началом другого
  const overlapWithGap = start1 < end2 - 1 && start2 < end1 - 1

  // Отключаем логирование для уменьшения количества сообщений
  // console.log(
  //   `Time ranges overlap check: [${start1}-${end1}] and [${start2}-${end2}]: ${overlap}, with gap: ${overlapWithGap}`,
  // )

  // Проверяем, пересекаются ли временные интервалы
  // Если видео записаны в одно и то же время (с перекрытием), они должны быть на разных дорожках
  return overlapWithGap
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
  console.log(
    "createTracksFromFiles called with files:",
    files.map((f) => f.name),
  )
  console.log(
    "existingTracks:",
    existingTracks.map((t) => t.name),
  )

  // Разделяем файлы на видео и аудио
  const videoFiles = files.filter((file) =>
    file.probeData?.streams?.some((stream) => stream.codec_type === "video"),
  )
  const audioFiles = files.filter(
    (file) =>
      !file.probeData?.streams?.some((stream) => stream.codec_type === "video") &&
      file.probeData?.streams?.some((stream) => stream.codec_type === "audio"),
  )

  console.log(
    "videoFiles:",
    videoFiles.map((f) => f.name),
  )
  console.log(
    "audioFiles:",
    audioFiles.map((f) => f.name),
  )

  // Сортируем файлы по времени начала
  const sortedVideoFiles = [...videoFiles].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
  const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

  const sectors: Sector[] = []

  // Получаем текущий язык из i18n
  const currentLanguage = i18n.language || "ru"

  // Группируем видео по дням
  const videoFilesByDay = sortedVideoFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    const startTime = file.startTime || Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]
    // Отключаем логирование для уменьшения количества сообщений
    // console.log(`File ${file.name} has date ${date} from startTime ${startTime}`)

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  console.log(
    "videoFilesByDay:",
    Object.entries(videoFilesByDay).map(([date, files]) => ({
      date,
      filesCount: files.length,
      files: files.map((f) => f.name),
    })),
  )

  // Получаем существующие секторы и треки по дням
  const existingSectorsByDay = existingTracks.reduce<
    Record<string, { sector: Sector | null; tracks: Track[] }>
  >((acc, track) => {
    if (!track.videos || track.videos.length === 0) return acc

    const startTime = track.videos[0].startTime || Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]

    if (!acc[date]) {
      acc[date] = { sector: null, tracks: [] }
    }

    acc[date].tracks.push(track)
    return acc
  }, {})

  // Обрабатываем видео файлы по дням
  Object.entries(videoFilesByDay).forEach(([date, dayFiles]) => {
    console.log(`Processing ${dayFiles.length} video files for date ${date}`)

    // Получаем существующие треки для этого дня или создаем новый сектор
    // Ищем существующий сектор по дате или по имени, содержащему дату
    let existingSector = existingSectorsByDay[date]?.sector

    // Если сектор не найден по дате, ищем по имени в существующих секторах
    if (!existingSector) {
      // Форматируем дату для поиска в имени сектора
      const dateObj = new Date(date)
      const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
        includeYear: true,
        longFormat: true,
      })

      // Ищем сектор по имени в списке всех существующих секторов
      for (const sectorDate in existingSectorsByDay) {
        const sectorInfo = existingSectorsByDay[sectorDate]
        if (sectorInfo && sectorInfo.sector && sectorInfo.sector.name.includes(formattedDate)) {
          existingSector = sectorInfo.sector
          break
        }
      }
    }

    const existingDayTracks = existingSectorsByDay[date]?.tracks || []

    console.log(`Existing sector for date ${date}: ${existingSector ? "yes" : "no"}`)
    console.log(`Existing tracks for date ${date}: ${existingDayTracks.length}`)

    // Форматируем дату для отображения с помощью универсального метода
    const dateObj = new Date(date)
    const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
      includeYear: true,
      longFormat: true,
    })

    // Создаем или используем существующий сектор для всех файлов дня
    const sector: Sector = existingSector || {
      // Используем дату в формате YYYY-MM-DD как ID сектора для лучшей совместимости
      id: date,
      name: i18n.t("timeline.section.sectorName", {
        date: formattedDate,
        defaultValue: `Section ${formattedDate}`,
      }),
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
      zoomLevel: 1,
      scrollPosition: 0,
    }

    console.log(`Using sector ${sector.name} with ${sector.tracks.length} tracks`)

    // Обрабатываем каждый файл и добавляем его на подходящую дорожку
    for (const file of dayFiles) {
      const fileStartTime = file.startTime || 0
      const fileDuration = file.duration || 0
      const fileEndTime = fileStartTime + fileDuration

      // Ищем подходящую дорожку среди существующих
      let trackFound = false

      // Создаем идентификатор камеры на основе разрешения
      // Это более надежный способ определить, что видео сняты одной и той же камерой
      let cameraId = null
      let cameraName = null

      // Получаем видеопоток из probeData
      const videoStream = file.probeData?.streams?.find((stream) => stream.codec_type === "video")

      // Пытаемся получить название модели камеры из метаданных
      if (file.probeData) {
        cameraName = getCameraModel(file.probeData)
        // Отключаем логирование для уменьшения количества сообщений
        // console.log(`Extracted camera model for ${file.name}: ${cameraName || "unknown"}`)
      }

      // Используем разрешение как идентификатор камеры, если доступно
      if (videoStream && videoStream.width && videoStream.height) {
        // Используем только разрешение для определения камеры
        cameraId = `${videoStream.width}x${videoStream.height}`
        // Отключаем логирование для уменьшения количества сообщений
        // console.log(`Using resolution as camera ID for ${file.name}: ${cameraId}`)
      } else {
        // Если разрешение не определено, используем уникальный идентификатор
        cameraId = `camera-${nanoid(6)}`
        console.log(`Using generated camera ID for ${file.name}: ${cameraId}`)
      }

      // Отключаем логирование для уменьшения количества сообщений
      // console.log(`Extracted camera ID for file ${file.name}: ${cameraId || "unknown"}`)

      // Сначала проверяем существующие дорожки в порядке их индекса (сверху вниз)
      const sortedTracks = [...existingDayTracks, ...sector.tracks]
        .filter((track) => track.type === "video")
        .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0))

      // Логируем все дорожки с их ID камер для отладки
      // Отключаем логирование для уменьшения количества сообщений
      // console.log("Available tracks with camera IDs:")
      for (const track of sortedTracks) {
        if (track.videos && track.videos.length > 0) {
          let trackCameraId = null

          // Проверяем имя дорожки
          const trackNameMatch = track.name?.match(/Camera (\d+)/)
          if (trackNameMatch) {
            trackCameraId = trackNameMatch[1]
          }

          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   `Track ${track.name}: Camera ID = ${trackCameraId || "unknown"}, Videos = ${track.videos.length}`,
          // )
        }
      }

      for (const track of sortedTracks) {
        // Проверяем, пересекается ли новый файл с существующими видео на этой дорожке
        let hasOverlap = false

        if (track.videos && track.videos.length > 0) {
          // Проверяем, с какой камеры видео на этой дорожке
          let trackCameraId = null
          const trackVideo = track.videos[0]

          // Сначала проверяем имя дорожки, если оно в формате "Camera X"
          // Это имеет приоритет над другими методами определения ID камеры
          const trackNameMatch = track.name?.match(/Camera (\d+)/)
          if (trackNameMatch) {
            // Используем номер камеры из имени дорожки
            trackCameraId = trackNameMatch[1]
            // Отключаем логирование для уменьшения количества сообщений
            // console.log(
            //   `Using track name to determine camera ID for ${track.name}: ${trackCameraId}`,
            // )
          }

          // Если trackCameraId не был определен по имени дорожки,
          // используем разрешение или генерируем уникальный ID
          if (!trackCameraId) {
            // Получаем видеопоток из probeData
            const trackVideoStream = trackVideo.probeData?.streams?.find(
              (stream) => stream.codec_type === "video",
            )

            // Используем разрешение как идентификатор камеры
            if (trackVideoStream && trackVideoStream.width && trackVideoStream.height) {
              // Используем только разрешение для определения камеры
              trackCameraId = `${trackVideoStream.width}x${trackVideoStream.height}`
              // Отключаем логирование для уменьшения количества сообщений
              // console.log(
              //   `Using resolution as track camera ID for ${trackVideo.name}: ${trackCameraId}`,
              // )
            } else {
              // Если разрешение не определено, используем уникальный идентификатор
              trackCameraId = `camera-${nanoid(6)}`
              console.log(
                `Using generated camera ID for track with video ${trackVideo.name}: ${trackCameraId}`,
              )
            }
          }

          // Сначала проверяем временное перекрытие для всех видео
          // Если видео не пересекаются по времени, они могут быть на одной дорожке
          let hasTimeOverlap = false

          for (const video of track.videos) {
            const videoStartTime = video.startTime || 0
            const videoDuration = video.duration || 0
            const videoEndTime = videoStartTime + videoDuration

            const overlap = doTimeRangesOverlap(
              fileStartTime,
              fileEndTime,
              videoStartTime,
              videoEndTime,
            )
            // Отключаем логирование для уменьшения количества сообщений
            // console.log(
            //   `Checking overlap between file ${file.name} (${fileStartTime}-${fileEndTime}) and video ${video.name} (${videoStartTime}-${videoEndTime}): ${overlap}`,
            // )

            if (overlap) {
              hasTimeOverlap = true
              break
            }
          }

          // Если нет временного перекрытия, можно использовать эту дорожку
          if (!hasTimeOverlap) {
            hasOverlap = false
            // Отключаем логирование для уменьшения количества сообщений
            // console.log(
            //   `No time overlap for file ${file.name} on track ${track.name}, can use this track`,
            // )
            break
          }

          // Если есть временное перекрытие, но это та же камера, все равно используем эту дорожку
          // Видео с одной камеры всегда должны быть на одной дорожке
          if (cameraId && trackCameraId && cameraId === trackCameraId) {
            // Отключаем логирование для уменьшения количества сообщений
            // console.log(
            //   `Same camera ID ${cameraId}, using track ${track.name} for file ${file.name} despite time overlap`,
            // )
            hasOverlap = false // Нет перекрытия, используем ту же дорожку
            break
          }

          // Если есть временное перекрытие и это разные камеры, нельзя использовать эту дорожку
          hasOverlap = true
        }

        // Если нет пересечений, добавляем файл на эту дорожку
        if (!hasOverlap) {
          // Если это дорожка из существующего сектора, добавляем ее в текущий сектор
          if (!sector.tracks.includes(track)) {
            const updatedVideos = [...(track.videos || []), file]
            sector.tracks.push({
              ...track,
              videos: updatedVideos,
              startTime: Math.min(track.startTime || Infinity, fileStartTime),
              endTime: Math.max(track.endTime || 0, fileEndTime),
              combinedDuration: (track.combinedDuration || 0) + fileDuration,
              timeRanges: calculateTimeRanges(updatedVideos),
            })
          } else {
            // Обновляем существующую дорожку в текущем секторе
            const trackIndex = sector.tracks.findIndex((t) => t.id === track.id)
            if (trackIndex !== -1) {
              const updatedVideos = [...(sector.tracks[trackIndex].videos || []), file]
              sector.tracks[trackIndex] = {
                ...sector.tracks[trackIndex],
                videos: updatedVideos,
                startTime: Math.min(sector.tracks[trackIndex].startTime || Infinity, fileStartTime),
                endTime: Math.max(sector.tracks[trackIndex].endTime || 0, fileEndTime),
                combinedDuration: (sector.tracks[trackIndex].combinedDuration || 0) + fileDuration,
                timeRanges: calculateTimeRanges(updatedVideos),
              }
            }
          }

          trackFound = true
          break
        }
      }

      // Если не нашли подходящую дорожку, ищем самую раннюю дорожку без временного перекрытия
      if (!trackFound) {
        // Отключаем логирование для уменьшения количества сообщений
        // console.log(
        //   `Track not found for file ${file.name}, looking for the earliest track without time overlap`,
        // )

        // Сортируем дорожки по индексу (сверху вниз)
        const tracksWithoutOverlap = []

        // Проверяем все дорожки на временное перекрытие
        for (const track of sortedTracks) {
          if (track.videos && track.videos.length > 0) {
            let hasOverlap = false

            // Проверяем временное перекрытие со всеми видео на дорожке
            for (const video of track.videos) {
              const videoStartTime = video.startTime || 0
              const videoDuration = video.duration || 0
              const videoEndTime = videoStartTime + videoDuration

              if (doTimeRangesOverlap(fileStartTime, fileEndTime, videoStartTime, videoEndTime)) {
                hasOverlap = true
                break
              }
            }

            // Если нет перекрытия, добавляем дорожку в список подходящих
            if (!hasOverlap) {
              tracksWithoutOverlap.push(track)
            }
          }
        }

        // Если нашли дорожки без перекрытия, используем самую раннюю (с наименьшим индексом)
        if (tracksWithoutOverlap.length > 0) {
          // Сортируем по индексу и берем первую дорожку
          const track = tracksWithoutOverlap.sort(
            (a, b) => (Number(a.index) || 0) - (Number(b.index) || 0),
          )[0]

          // Отключаем логирование для уменьшения количества сообщений
          // console.log(`Found track without time overlap: ${track.name} for file ${file.name}`)

          // Если это дорожка из существующего сектора, добавляем ее в текущий сектор
          if (!sector.tracks.includes(track)) {
            sector.tracks.push({
              ...track,
              videos: [...(track.videos || []), file],
              startTime: Math.min(track.startTime || Infinity, fileStartTime),
              endTime: Math.max(track.endTime || 0, fileEndTime),
              combinedDuration: (track.combinedDuration || 0) + fileDuration,
              timeRanges: calculateTimeRanges([...(track.videos || []), file]),
            })
          } else {
            // Обновляем существующую дорожку в текущем секторе
            const trackIndex = sector.tracks.findIndex((t) => t.id === track.id)
            if (trackIndex !== -1) {
              const updatedVideos = [...(sector.tracks[trackIndex].videos || []), file]
              sector.tracks[trackIndex] = {
                ...sector.tracks[trackIndex],
                videos: updatedVideos,
                startTime: Math.min(sector.tracks[trackIndex].startTime || Infinity, fileStartTime),
                endTime: Math.max(sector.tracks[trackIndex].endTime || 0, fileEndTime),
                combinedDuration: (sector.tracks[trackIndex].combinedDuration || 0) + fileDuration,
                timeRanges: calculateTimeRanges(updatedVideos),
              }
            }
          }

          trackFound = true
        }
      }

      // Если все еще не нашли подходящую дорожку, создаем новую
      if (!trackFound) {
        // Отключаем логирование для уменьшения количества сообщений
        // console.log(
        //   `No suitable track found for file ${file.name} with camera ID ${cameraId || "unknown"}, creating a new track`,
        // )

        // Определяем максимальный номер видеодорожки для этого дня
        const maxVideoIndex = Math.max(
          0,
          ...sector.tracks
            .filter((track) => track.type === "video")
            .map((track) => Number(track.index) || 0),
          ...existingDayTracks
            .filter((track) => track.type === "video")
            .map((track) => Number(track.index) || 0),
        )

        // Отключаем логирование для уменьшения количества сообщений
        // console.log(
        //   `Creating new video track for file ${file.name} with index ${maxVideoIndex + 1}`,
        // )

        // Находим максимальный номер камеры в текущем секторе
        let maxCameraNumber = 0

        // Ищем дорожки с названием "Camera X" и находим максимальный номер
        for (const track of sector.tracks) {
          const cameraMatch = track.name?.match(/Camera (\d+)/)
          if (cameraMatch) {
            const cameraNumber = parseInt(cameraMatch[1], 10)
            if (cameraNumber > maxCameraNumber) {
              maxCameraNumber = cameraNumber
            }
          }
        }

        // Всегда используем формат "Camera X" для видео треков
        const nextCameraNumber = maxCameraNumber + 1
        const trackName = i18n.t("timeline.tracks.cameraWithNumber", {
          number: nextCameraNumber,
          defaultValue: `Camera ${nextCameraNumber}`,
        })
        // Всегда устанавливаем cameraName в формате "Camera X"
        const trackCameraName = trackName

        // Отключаем логирование для уменьшения количества сообщений
        // console.log(`Creating new track with name: ${trackName} for camera ID: ${cameraId}`)
        // console.log(`Using camera name: ${trackCameraName}`)

        // Создаем новую дорожку
        sector.tracks.push({
          id: nanoid(),
          name: trackName,
          type: "video",
          isActive: false,
          videos: [file],
          startTime: fileStartTime,
          endTime: fileEndTime,
          combinedDuration: fileDuration,
          timeRanges: calculateTimeRanges([file]),
          index: maxVideoIndex + 1,
          volume: 1,
          isMuted: false,
          isLocked: false,
          isVisible: true,
          cameraId: cameraId || undefined,
          cameraName: trackCameraName || undefined,
        })

        // Отключаем логирование для уменьшения количества сообщений
        // console.log(`Sector ${sector.name} now has ${sector.tracks.length} tracks`)
      }
    }

    // Обновляем timeRanges сектора
    sector.timeRanges = calculateTimeRanges(dayFiles)

    // Обновляем время начала и конца секции
    if (sector.tracks.length > 0) {
      const allVideos = sector.tracks.flatMap((track) => track.videos || [])
      if (allVideos.length > 0) {
        const minStartTime = Math.min(...allVideos.map((video) => video.startTime || 0))
        const maxEndTime = Math.max(
          ...allVideos.map((video) => (video.startTime || 0) + (video.duration || 0)),
        )
        sector.startTime = minStartTime
        sector.endTime = maxEndTime
      }
    }

    // Добавляем сектор в список, если он новый
    if (!existingSector) {
      sectors.push(sector)
    } else {
      // Обновляем существующий сектор в списке
      const sectorIndex = sectors.findIndex((s) => s.id === existingSector?.id)
      if (sectorIndex !== -1) {
        sectors[sectorIndex] = sector
      } else {
        sectors.push(sector)
      }
    }
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
    // Получаем существующие треки для этого дня или создаем новый сектор
    // Ищем существующий сектор по дате или по имени, содержащему дату
    let existingSector = existingSectorsByDay[date]?.sector

    // Если сектор не найден по дате, ищем по имени в существующих секторах
    if (!existingSector) {
      // Форматируем дату для поиска в имени сектора
      const dateObj = new Date(date)
      const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
        includeYear: true,
        longFormat: true,
      })

      // Ищем сектор по имени в списке всех существующих секторов
      for (const sectorDate in existingSectorsByDay) {
        const sectorInfo = existingSectorsByDay[sectorDate]
        if (sectorInfo && sectorInfo.sector && sectorInfo.sector.name.includes(formattedDate)) {
          existingSector = sectorInfo.sector
          break
        }
      }
    }

    const existingDayTracks = existingSectorsByDay[date]?.tracks || []

    // Форматируем дату для отображения с помощью универсального метода
    const dateObj = new Date(date)
    const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
      includeYear: true,
      longFormat: true,
    })

    // Создаем или используем существующий сектор для всех файлов дня
    const sector: Sector = existingSector || {
      // Используем дату в формате YYYY-MM-DD как ID сектора для лучшей совместимости
      id: date,
      name: i18n.t("timeline.section.sectorName", {
        date: formattedDate,
        defaultValue: `Section ${formattedDate}`,
      }),
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
      zoomLevel: 1,
      scrollPosition: 0,
    }

    // Обрабатываем каждый файл и добавляем его на подходящую дорожку
    for (const file of dayFiles) {
      const fileStartTime = file.startTime || 0
      const fileDuration = file.duration || 0
      const fileEndTime = fileStartTime + fileDuration

      // Ищем подходящую дорожку среди существующих
      let trackFound = false

      // Сначала проверяем существующие дорожки в порядке их индекса (сверху вниз)
      const sortedTracks = [...existingDayTracks, ...sector.tracks]
        .filter((track) => track.type === "audio")
        .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0))

      for (const track of sortedTracks) {
        // Проверяем, пересекается ли новый файл с существующими аудио на этой дорожке
        let hasOverlap = false

        if (track.videos) {
          for (const audio of track.videos) {
            const audioStartTime = audio.startTime || 0
            const audioDuration = audio.duration || 0
            const audioEndTime = audioStartTime + audioDuration

            if (doTimeRangesOverlap(fileStartTime, fileEndTime, audioStartTime, audioEndTime)) {
              hasOverlap = true
              break
            }
          }
        }

        // Если нет пересечений, добавляем файл на эту дорожку
        if (!hasOverlap) {
          // Если это дорожка из существующего сектора, добавляем ее в текущий сектор
          if (!sector.tracks.includes(track)) {
            const updatedVideos = [...(track.videos || []), file]
            sector.tracks.push({
              ...track,
              videos: updatedVideos,
              startTime: Math.min(track.startTime || Infinity, fileStartTime),
              endTime: Math.max(track.endTime || 0, fileEndTime),
              combinedDuration: (track.combinedDuration || 0) + fileDuration,
              timeRanges: calculateTimeRanges(updatedVideos),
            })
          } else {
            // Обновляем существующую дорожку в текущем секторе
            const trackIndex = sector.tracks.findIndex((t) => t.id === track.id)
            if (trackIndex !== -1) {
              const updatedVideos = [...(sector.tracks[trackIndex].videos || []), file]
              sector.tracks[trackIndex] = {
                ...sector.tracks[trackIndex],
                videos: updatedVideos,
                startTime: Math.min(sector.tracks[trackIndex].startTime || Infinity, fileStartTime),
                endTime: Math.max(sector.tracks[trackIndex].endTime || 0, fileEndTime),
                combinedDuration: (sector.tracks[trackIndex].combinedDuration || 0) + fileDuration,
                timeRanges: calculateTimeRanges(updatedVideos),
              }
            }
          }

          trackFound = true
          break
        }
      }

      // Если не нашли подходящую дорожку, создаем новую
      if (!trackFound) {
        // Определяем максимальный номер аудиодорожки для этого дня
        const maxAudioIndex = Math.max(
          0,
          ...sector.tracks
            .filter((track) => track.type === "audio")
            .map((track) => Number(track.index) || 0),
          ...existingDayTracks
            .filter((track) => track.type === "audio")
            .map((track) => Number(track.index) || 0),
        )

        // Создаем новую дорожку
        const nextAudioNumber = maxAudioIndex + 1
        const audioTrackName = i18n.t("timeline.tracks.audioWithNumber", {
          number: nextAudioNumber,
          defaultValue: `Audio ${nextAudioNumber}`,
        })

        sector.tracks.push({
          id: nanoid(),
          name: audioTrackName,
          type: "audio",
          isActive: false,
          videos: [file],
          startTime: fileStartTime,
          endTime: fileEndTime,
          combinedDuration: fileDuration,
          timeRanges: calculateTimeRanges([file]),
          index: nextAudioNumber,
          volume: 1,
          isMuted: false,
          isLocked: false,
          isVisible: true,
          cameraName: audioTrackName, // Устанавливаем cameraName для совместимости
        })
      }
    }

    // Обновляем timeRanges сектора
    sector.timeRanges = calculateTimeRanges(dayFiles)

    // Обновляем время начала и конца секции
    if (sector.tracks.length > 0) {
      const allVideos = sector.tracks.flatMap((track) => track.videos || [])
      if (allVideos.length > 0) {
        const minStartTime = Math.min(...allVideos.map((video) => video.startTime || 0))
        const maxEndTime = Math.max(
          ...allVideos.map((video) => (video.startTime || 0) + (video.duration || 0)),
        )
        sector.startTime = minStartTime
        sector.endTime = maxEndTime
      }
    }

    // Добавляем сектор в список, если он новый
    if (!existingSector) {
      sectors.push(sector)
    } else {
      // Обновляем существующий сектор в списке
      const sectorIndex = sectors.findIndex((s) => s.id === existingSector?.id)
      if (sectorIndex !== -1) {
        sectors[sectorIndex] = sector
      } else {
        sectors.push(sector)
      }
    }
  })

  // Отключаем логирование для уменьшения количества сообщений
  // console.log(
  //   "Created sectors:",
  //   sectors.map((s) => ({
  //     name: s.name,
  //     tracksCount: s.tracks.length,
  //     tracks: s.tracks.map((t) => ({
  //       name: t.name,
  //       type: t.type,
  //       videosCount: t.videos?.length || 0,
  //       videos: t.videos?.map((v) => v.name),
  //     })),
  //   })),
  // )

  return sectors
}
