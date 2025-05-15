import { MediaFile, Track } from "@/types/media"

import { AppliedTemplate } from "./template-service"

/**
 * Функция для получения видео из треков таймлайна
 * @param tracks Треки таймлайна
 * @param activeTrackId ID активного трека
 * @returns Массив видео из треков
 */
export function getVideosFromTimeline(tracks: Track[], activeTrackId: string | null): MediaFile[] {
  console.log(
    `[SourceControl] getVideosFromTimeline: tracks=${tracks.length}, activeTrackId=${activeTrackId}`,
  )

  // Если есть активный трек, получаем видео из него
  if (activeTrackId) {
    const activeTrack = tracks.find((track) => track.id === activeTrackId)
    if (activeTrack?.videos && activeTrack.videos.length > 0) {
      console.log(
        `[SourceControl] Найдено ${activeTrack.videos.length} видео в активном треке ${activeTrackId}`,
      )
      // Выводим детали каждого видео для отладки
      activeTrack.videos.forEach((video, index) => {
        console.log(
          `[SourceControl] Видео ${index + 1}/${activeTrack.videos.length}: id=${video.id}, path=${video.path}, startTime=${video.startTime}`,
        )
      })
      return activeTrack.videos
    } else {
      console.log(`[SourceControl] Активный трек ${activeTrackId} не содержит видео или не найден`)
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
  console.log(
    `[SourceControl] updateTemplateWithTimelineVideos: timelineVideos=${timelineVideos.length}`,
  )

  if (!appliedTemplate) {
    console.log(`[SourceControl] Нет примененного шаблона для обновления`)
    return null
  }

  // Создаем глубокую копию шаблона
  const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))
  console.log(
    `[SourceControl] Текущий шаблон: id=${templateCopy.template?.id}, screens=${templateCopy.template?.screens}`,
  )

  // Заполняем шаблон видео из таймлайна
  const requiredVideos = appliedTemplate.template?.screens || 1
  console.log(`[SourceControl] Требуется видео для шаблона: ${requiredVideos}`)

  // Фильтруем видео из таймлайна, чтобы убедиться, что у них есть ID и путь
  const validTimelineVideos = timelineVideos.filter((video) => video.id && video.path)

  console.log(`[SourceControl] Найдено ${validTimelineVideos.length} валидных видео из таймлайна`)
  // Выводим детали каждого валидного видео
  validTimelineVideos.forEach((video, index) => {
    console.log(
      `[SourceControl] Валидное видео ${index + 1}/${validTimelineVideos.length}: id=${video.id}, path=${video.path}, startTime=${video.startTime}`,
    )
  })

  // Если видео из таймлайна достаточно для шаблона
  if (validTimelineVideos.length >= requiredVideos) {
    // Создаем копии видео и устанавливаем source = "timeline"
    templateCopy.videos = validTimelineVideos.slice(0, requiredVideos).map((video) => {
      // Создаем глубокую копию видео
      const videoCopy = JSON.parse(JSON.stringify(video))

      // Явно устанавливаем источник как timeline
      videoCopy.source = "timeline"

      // Убеждаемся, что startTime существует (это признак видео из таймлайна)
      if (!videoCopy.startTime && videoCopy.startTime !== 0) {
        console.log(
          `[SourceControl] Видео ${videoCopy.id} не имеет startTime, устанавливаем значение по умолчанию`,
        )
        videoCopy.startTime = Date.now() / 1000 // Текущее время в секундах
      }

      console.log(
        `[SourceControl] Подготовлено видео для шаблона: id=${videoCopy.id}, source=${videoCopy.source}, startTime=${videoCopy.startTime}`,
      )
      return videoCopy
    })

    console.log(
      `[SourceControl] Добавлено ${templateCopy.videos.length} видео из таймлайна в шаблон`,
    )
  }
  // Если видео из таймлайна недостаточно для шаблона
  else {
    // Добавляем все доступные видео с установленным source = "timeline"
    templateCopy.videos = validTimelineVideos.map((video) => {
      // Создаем глубокую копию видео
      const videoCopy = JSON.parse(JSON.stringify(video))

      // Явно устанавливаем источник как timeline
      videoCopy.source = "timeline"

      // Убеждаемся, что startTime существует (это признак видео из таймлайна)
      if (!videoCopy.startTime && videoCopy.startTime !== 0) {
        console.log(
          `[SourceControl] Видео ${videoCopy.id} не имеет startTime, устанавливаем значение по умолчанию`,
        )
        videoCopy.startTime = Date.now() / 1000 // Текущее время в секундах
      }

      console.log(
        `[SourceControl] Подготовлено видео для шаблона: id=${videoCopy.id}, source=${videoCopy.source}, startTime=${videoCopy.startTime}`,
      )
      return videoCopy
    })

    // Добавляем пустые видео для оставшихся слотов
    for (let i = validTimelineVideos.length; i < requiredVideos; i++) {
      const emptyVideo = createEmptyVideo(i)
      templateCopy.videos.push(emptyVideo)
      console.log(`[SourceControl] Добавлено пустое видео ${i + 1}: id=${emptyVideo.id}`)
    }

    console.log(
      `[SourceControl] Добавлено ${validTimelineVideos.length} видео из таймлайна и ${requiredVideos - validTimelineVideos.length} пустых видео в шаблон`,
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
  console.log(`[SourceControl] updateVideoSources: timelineVideos=${timelineVideos.length}`)

  const newVideoSources: Record<string, "media" | "timeline"> = {}

  // Помечаем все видео из таймлайна
  timelineVideos.forEach((v, index) => {
    if (v.id) {
      newVideoSources[v.id] = "timeline"
      console.log(
        `[SourceControl] Видео ${index + 1}/${timelineVideos.length}: ${v.id} помечено как видео из таймлайна, path=${v.path}, startTime=${v.startTime}`,
      )
    } else {
      console.log(
        `[SourceControl] Видео ${index + 1}/${timelineVideos.length} не имеет ID, пропускаем`,
      )
    }
  })

  console.log(
    `[SourceControl] Обновлены источники для ${Object.keys(newVideoSources).length} видео`,
  )
  return newVideoSources
}
