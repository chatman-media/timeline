import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { MediaFile } from "@/types/media"

import { usePlayerContext } from "@/media-editor/media-player"

interface ResizableVideoProps {
  video: MediaFile
  isActive: boolean
  videoRefs?: Record<string, HTMLVideoElement>
  index?: number // Индекс видео в шаблоне
  hideLabel?: boolean // Флаг для скрытия надписи с названием камеры
  labelPosition?: 'left' | 'right' | 'center' // Позиция надписи с названием камеры
}

/**
 * Компонент для отображения видео с возможностью масштабирования
 */
export function ResizableVideo({ video, isActive, videoRefs, index = 0, hideLabel = false, labelPosition = 'center' }: ResizableVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)

  // Для локализации
  const { t } = useTranslation()

  // Для ограничения частоты обновлений
  const lastUpdateTimeRef = useRef<number>(0)
  const updateIntervalMs = 100 // Обновляем не чаще чем раз в 100 мс

  // Получаем состояние воспроизведения из контекста плеера
  const { isPlaying } = usePlayerContext()

  // Проверяем, что видео существует и имеет путь
  if (!video || !video.path) {
    console.error(`[ResizableVideo] Ошибка: видео не определено или не имеет пути`, video)
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <span className="text-white">{t('timeline.player.videoUnavailable', 'Видео недоступно')}</span>
      </div>
    )
  }

  // Дополнительная проверка пути к видео
  if (video.path && !video.path.startsWith('/')) {
    console.error(`[ResizableVideo] Ошибка: некорректный путь к видео ${video.id}: ${video.path}`)
  }

  // Логируем информацию о видео для отладки только при первом рендере или изменении состояния
  const isLoggedRef = useRef(false)
  if (!isLoggedRef.current) {
    console.log(`[ResizableVideo] Рендеринг видео ${video.id}, isActive: ${isActive}, path: ${video.path}`)
    isLoggedRef.current = true
  }



  // Эффект для добавления видео элемента в videoRefs
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !videoRefs) return

    // Добавляем видео элемент в videoRefs
    if (video.id && (!videoRefs[video.id] || videoRefs[video.id] !== videoElement)) {
      console.log(`[ResizableVideo] Добавляем видео элемент ${video.id} в videoRefs`)
      videoRefs[video.id] = videoElement

      // Проверяем, что src установлен правильно
      if (video.path && (!videoElement.src || !videoElement.src.includes(video.path))) {
        console.log(`[ResizableVideo] Устанавливаем src для видео ${video.id}: ${video.path}`)

        try {
          // Проверяем, что путь к видео корректный
          if (!video.path.startsWith('/')) {
            console.error(`[ResizableVideo] Некорректный путь к видео ${video.id}: ${video.path}`)
            // Пытаемся исправить путь
            const correctedPath = `/${video.path.replace(/^\.\//, '')}`
            console.log(`[ResizableVideo] Пытаемся исправить путь для ${video.id}: ${correctedPath}`)
            videoElement.src = correctedPath
          } else {
            videoElement.src = video.path
          }

          // Загружаем видео
          videoElement.load()

          // Проверяем, что видео загружается
          setTimeout(() => {
            if (videoElement.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
              console.error(`[ResizableVideo] Не удалось загрузить видео ${video.id}: источник недоступен`)
            }
          }, 1000)
        } catch (err) {
          console.error(`[ResizableVideo] Ошибка при установке src для видео ${video.id}:`, err)
        }
      }
    }

    return () => {
      // При размонтировании компонента не удаляем элемент из videoRefs,
      // так как он может использоваться в других местах
    }
  }, [video.id, videoRefs, video.path])

  // Эффект для установки готовности видео и настройки обработчиков событий
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleMetadataLoaded = () => {
      setIsReady(true)
    }

    // Обработчик события окончания видео
    const handleEnded = () => {
      // Если видео закончилось, но проигрывание продолжается,
      // устанавливаем currentTime на последний кадр (длительность - 0.1 секунда)
      if (isPlaying && videoElement.duration > 0) {
        console.log(`[ResizableVideo] Видео ${video.id} закончилось, показываем последний кадр`)
        videoElement.currentTime = Math.max(0, videoElement.duration - 0.1)

        // Останавливаем воспроизведение этого видео, но не останавливаем плеер
        videoElement.pause()
      }
    }

    videoElement.addEventListener("loadedmetadata", handleMetadataLoaded)
    videoElement.addEventListener("ended", handleEnded)

    // Если метаданные уже загружены
    if (videoElement.readyState >= 1) {
      handleMetadataLoaded()
    }

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleMetadataLoaded)
      videoElement.removeEventListener("ended", handleEnded)
    }
  }, [video.path, video.id, isPlaying])

  // Эффект для установки objectFit и objectPosition
  useEffect(() => {
    if (!isReady || !videoRef.current) return

    // Получаем видео элемент
    const videoElement = videoRef.current

    // Всегда используем "cover" для всех видео, включая портретные
    const objectFit = "cover"
    videoElement.style.objectFit = objectFit

    // Устанавливаем objectPosition по центру
    videoElement.style.objectPosition = "center"

    console.log(`[ResizableVideo] Применяем настройки отображения для видео ${video.id}: ${objectFit}`)
  }, [isReady, video.id])

  // Эффект для синхронизации воспроизведения с состоянием плеера
  useEffect(() => {
    if (!isReady || !videoRef.current) return

    const videoElement = videoRef.current

    // Всегда устанавливаем muted в зависимости от индекса
    // Звук только у первого видео (index === 0)
    videoElement.muted = index !== 0

    // Проверяем, что видео действительно готово к воспроизведению
    const isVideoReady = videoElement.readyState >= 3 // HAVE_FUTURE_DATA или HAVE_ENOUGH_DATA

    if (isPlaying && isVideoReady) {
      // Если плеер играет, видео готово и на паузе - запускаем воспроизведение
      if (videoElement.paused) {
        console.log(`[ResizableVideo] Запускаем воспроизведение для видео ${video.id}`)

        // Используем Promise для синхронизации воспроизведения
        videoElement.play().catch(err => {
          // Игнорируем ошибки AbortError, которые возникают при удалении видео из DOM
          if (err.name !== 'AbortError') {
            console.error(`[ResizableVideo] Ошибка при воспроизведении видео ${video.id}:`, err)
          }
        })
      }
    } else {
      // Если плеер на паузе, но видео играет - останавливаем воспроизведение
      if (!videoElement.paused) {
        console.log(`[ResizableVideo] Останавливаем воспроизведение для видео ${video.id}`)
        videoElement.pause()
      }
    }

  }, [isReady, isPlaying, video.id, index])

  // Эффект для синхронизации текущего времени видео
  useEffect(() => {
    if (!isReady || !videoRef.current) return

    const videoElement = videoRef.current

    // Обработчик события timeupdate
    const handleTimeUpdate = () => {
      // Если это первое видео (index === 0), то его время считается основным
      // Остальные видео синхронизируются с ним
      if (index === 0 && videoRefs) {
        // Ограничиваем частоту обновлений
        const now = Date.now()
        if (now - lastUpdateTimeRef.current < updateIntervalMs) {
          return
        }
        lastUpdateTimeRef.current = now

        // Получаем текущее время первого видео
        const currentTime = videoElement.currentTime

        // Синхронизируем время всех остальных видео
        Object.entries(videoRefs).forEach(([id, element]) => {
          if (id !== video.id && element && !element.paused && Math.abs(element.currentTime - currentTime) > 0.1) {
            try {
              element.currentTime = currentTime
            } catch (err) {
              // Игнорируем ошибки при установке currentTime
              console.warn(`[ResizableVideo] Не удалось синхронизировать время для видео ${id}:`, err)
            }
          }
        })
      }
    }

    // Добавляем обработчик события timeupdate
    videoElement.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      // Удаляем обработчик при размонтировании
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [isReady, video.id, videoRefs, index, lastUpdateTimeRef, updateIntervalMs])

  return (
    <div className="relative h-full w-full" style={{ overflow: "visible" }}>
      <div
        className="absolute inset-0"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible"
        }}
      >
        <video
          ref={videoRef}
          src={video.path}
          className="absolute"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center"
          }}

          playsInline
          preload="auto"
          controls={false}
          autoPlay={false}
          loop={false}
          disablePictureInPicture
          muted={index !== 0} // Звук только из первого видео в шаблоне
          onEnded={(e) => {
            // Если видео закончилось, но проигрывание продолжается,
            // устанавливаем currentTime на последний кадр
            if (isPlaying) {
              const target = e.target as HTMLVideoElement;
              if (target.duration > 0) {
                console.log(`[ResizableVideo] Видео ${video.id} закончилось, показываем последний кадр`);
                target.currentTime = Math.max(0, target.duration - 0.1);

                // Останавливаем воспроизведение этого видео, но не останавливаем плеер
                target.pause();
              }
            }
          }}
          data-video-id={video.id}
          onLoadedData={() => {
            console.log(`[ResizableVideo] Видео ${video.id} загружено и готово к воспроизведению`);
            // Проверяем, что видео действительно загружено
            const target = videoRef.current;
            if (target) {
              if (target.videoWidth === 0 || target.videoHeight === 0) {
                console.error(`[ResizableVideo] Видео ${video.id} загружено, но имеет нулевые размеры: ${target.videoWidth}x${target.videoHeight}`);
              } else {
                console.log(`[ResizableVideo] Видео ${video.id} имеет размеры: ${target.videoWidth}x${target.videoHeight}`);
              }
            }
          }}
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            console.error(`[ResizableVideo] Ошибка загрузки видео ${video.id}:`, e);
            console.error(`[ResizableVideo] Детали ошибки для ${video.id}: networkState=${target.networkState}, readyState=${target.readyState}, error=${target.error?.code}`);
          }}
        />
      </div>

      {/* Подпись с названием камеры (поверх видео) - не отображаем если hideLabel=true */}
      {!hideLabel && (
        <div
          className={`absolute px-1.5 py-0.5 rounded-sm bg-black bg-opacity-50 text-white text-xs font-medium ${
            labelPosition === 'center'
              ? 'bottom-1 left-1/2 transform -translate-x-1/2 text-center'
              : labelPosition === 'left'
                ? 'top-1/2 left-[2%] transform -translate-y-1/2'
                : 'top-1/2 right-[2%] transform -translate-y-1/2'
          }`}
          style={{ zIndex: 10 }}
        >
          {t('timeline.player.camera', 'Камера')} {index + 1}
        </div>
      )}
    </div>
  )
}
