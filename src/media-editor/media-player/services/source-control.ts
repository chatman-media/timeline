import { MediaFile, Track } from "@/types/media"

import { AppliedTemplate } from "./template-service"

/**
 * Функция для получения видео из треков таймлайна
 * @param tracks Треки таймлайна
 * @param activeTrackId ID активного трека
 * @returns Массив видео из треков
 */
export function getVideosFromTimeline(tracks: Track[], activeTrackId: string | null): MediaFile[] {
  // Если есть активный трек, получаем видео из него
  if (activeTrackId) {
    const activeTrack = tracks.find((track) => track.id === activeTrackId)
    if (activeTrack?.videos && activeTrack.videos.length > 0) {
      console.log(
        `[SourceControl] Найдено ${activeTrack.videos.length} видео в активном треке ${activeTrackId}`,
      )
      return activeTrack.videos
    }
  }

  // Если нет видео в активном треке, получаем видео из всех треков
  const allVideos = tracks.flatMap((track) => track.videos || [])
  console.log(`[SourceControl] Найдено ${allVideos.length} видео во всех треках`)
  return allVideos
}

/**
 * Функция для создания пустого видео
 * @param index Индекс видео
 * @returns Пустое видео
 */
export function createEmptyVideo(index: number): MediaFile {
  return {
    id: `empty-${index}`,
    name: `Empty Video ${index + 1}`,
    path: "",
    duration: 0,
    isVideo: true,
    isAudio: false,
    isImage: false,
  }
}

/**
 * Функция для обновления видео в шаблоне при переключении на таймлайн
 * @param appliedTemplate Примененный шаблон
 * @param timelineVideos Видео из таймлайна
 * @returns Обновленный шаблон
 */
export function updateTemplateWithTimelineVideos(
  appliedTemplate: AppliedTemplate | null,
  timelineVideos: MediaFile[],
): AppliedTemplate | null {
  if (!appliedTemplate) return null

  // Создаем копию шаблона
  const templateCopy = { ...appliedTemplate }

  // Заполняем шаблон видео из таймлайна
  const requiredVideos = appliedTemplate.template?.screens || 1

  // Если видео из таймлайна достаточно для шаблона
  if (timelineVideos.length >= requiredVideos) {
    templateCopy.videos = timelineVideos.slice(0, requiredVideos)
    console.log(
      `[SourceControl] Добавлено ${templateCopy.videos.length} видео из таймлайна в шаблон`,
    )
  }
  // Если видео из таймлайна недостаточно для шаблона
  else {
    // Добавляем все доступные видео
    templateCopy.videos = [...timelineVideos]

    // Добавляем пустые видео для оставшихся слотов
    for (let i = timelineVideos.length; i < requiredVideos; i++) {
      templateCopy.videos.push(createEmptyVideo(i))
    }

    console.log(
      `[SourceControl] Добавлено ${timelineVideos.length} видео из таймлайна и ${requiredVideos - timelineVideos.length} пустых видео в шаблон`,
    )
  }

  return templateCopy
}

/**
 * Функция для обновления источников видео
 * @param timelineVideos Видео из таймлайна
 * @returns Объект с источниками видео
 */
export function updateVideoSources(
  timelineVideos: MediaFile[],
): Record<string, "media" | "timeline"> {
  const newVideoSources: Record<string, "media" | "timeline"> = {}

  // Помечаем все видео из таймлайна
  timelineVideos.forEach((v) => {
    if (v.id) {
      newVideoSources[v.id] = "timeline"
      console.log(`[SourceControl] Видео ${v.id} помечено как видео из таймлайна`)
    }
  })

  return newVideoSources
}
