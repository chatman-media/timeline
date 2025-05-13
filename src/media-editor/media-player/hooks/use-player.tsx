import { useTranslation } from "react-i18next"

import { usePlayerContext } from ".."

export function usePlayer() {
  const { t } = useTranslation()
  const { video, isVideoLoading, isVideoReady, parallelVideos, setVideoReady } = usePlayerContext()

  // Проверяем наличие видео в контексте
  console.log(
    `[usePlayer] video=${video?.id}, isVideoLoading=${isVideoLoading}, isVideoReady=${isVideoReady}, parallelVideos=${parallelVideos?.length}`,
  )

  // Если видео из таймлайна (имеет startTime), всегда считаем его готовым
  // Эту проверку делаем в первую очередь
  if (video && video.startTime && video.startTime > 0) {
    console.log(
      `[usePlayer] Видео ${video.id} из таймлайна (startTime=${video.startTime}), считаем его готовым`,
    )
    // Принудительно устанавливаем флаг готовности
    if (typeof setVideoReady === "function") {
      setVideoReady(true)
    }
    return null // Возвращаем null, чтобы компонент MediaPlayer мог отобразить видео
  }

  // Проверяем, есть ли видео в контексте (основное или параллельные)
  const hasVideo = !!video || (parallelVideos && parallelVideos.length > 0)

  // Если видео не готово, но есть параллельные видео, пробуем использовать их
  if (!isVideoReady && parallelVideos && parallelVideos.length > 0) {
    console.log(
      `[usePlayer] Основное видео не готово, но есть ${parallelVideos.length} параллельных видео`,
    )
    // Проверяем, есть ли среди параллельных видео видео из таймлайна
    const timelineVideos = parallelVideos.filter((v) => v.startTime && v.startTime > 0)
    if (timelineVideos.length > 0) {
      console.log(
        `[usePlayer] Найдено ${timelineVideos.length} видео из таймлайна среди параллельных`,
      )
      // Принудительно устанавливаем флаг готовности
      if (typeof setVideoReady === "function") {
        setVideoReady(true)
      }
    }
    return null // Возвращаем null, чтобы компонент MediaPlayer мог отобразить видео
  }

  if (!hasVideo) {
    console.log(`[usePlayer] Нет видео для отображения`)
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">
          {t("timeline.player.noVideoSelected", "Select a video to play")}
        </p>
      </div>
    )
  }

  if (isVideoLoading) {
    console.log(`[usePlayer] Видео загружается...`)
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!isVideoReady) {
    console.log(`[usePlayer] Ошибка загрузки видео`)
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">{t("timeline.player.videoLoadError", "Video loading error")}</p>
      </div>
    )
  }

  // Если все проверки пройдены, возвращаем null, чтобы компонент MediaPlayer мог отобразить видео
  return null
}
