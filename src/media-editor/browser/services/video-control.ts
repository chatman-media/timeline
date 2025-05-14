/**
 * Функция для остановки всех видео в браузере, кроме активного
 * @param activeVideoId ID активного видео, которое не нужно останавливать
 */
export function stopAllVideosExceptActive(activeVideoId: string | null): void {
  // Проверяем, что мы в браузере
  if (typeof window === "undefined") return

  // Получаем все видео элементы на странице
  const videoElements = document.querySelectorAll("video")

  console.log(`[VideoControl] Останавливаем все видео, кроме активного (${activeVideoId})`)

  // Останавливаем все видео, кроме активного
  videoElements.forEach((video) => {
    // Проверяем, что видео не является активным
    // Для этого проверяем, что у родительского элемента нет data-video-id, равного activeVideoId
    const videoId =
      video.getAttribute("data-video-id") || video.parentElement?.getAttribute("data-video-id")

    if (videoId !== activeVideoId) {
      // Если видео воспроизводится, останавливаем его
      if (!video.paused) {
        console.log(`[VideoControl] Останавливаем видео: ${videoId || "unknown"}`)
        video.pause()
      }
    }
  })
}

/**
 * Функция для остановки всех видео в браузере
 * @param excludeTemplateVideos Если true, не останавливает видео в шаблоне
 */
export function stopAllVideos(excludeTemplateVideos: boolean = false): void {
  // Проверяем, что мы в браузере
  if (typeof window === "undefined") return

  // Получаем все видео элементы на странице
  const videoElements = document.querySelectorAll("video")

  console.log(`[VideoControl] Останавливаем все видео (найдено ${videoElements.length} элементов)`)

  // Останавливаем все видео
  videoElements.forEach((video) => {
    // Если нужно исключить видео в шаблоне и это видео находится в шаблоне, пропускаем его
    const isTemplateVideo = video.closest(".video-panel-template") !== null

    if (excludeTemplateVideos && isTemplateVideo) {
      console.log(`[VideoControl] Пропускаем видео в шаблоне`)
      return
    }

    // Если видео воспроизводится, останавливаем его
    if (!video.paused) {
      console.log(`[VideoControl] Останавливаем видео`)
      video.pause()
    }
  })
}
