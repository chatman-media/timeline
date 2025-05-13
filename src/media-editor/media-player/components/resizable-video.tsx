import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { usePlayerContext } from "@/media-editor/media-player"
import { MediaFile } from "@/types/media"

// Расширяем глобальный интерфейс Window для добавления нашего кэша
declare global {
  interface Window {
    videoElementCache?: Map<string, HTMLVideoElement>;
  }
}

// Функция для определения источника видео
const getVideoSource = (video: MediaFile): "media" | "timeline" => {
  // Если видео имеет startTime, то это видео из таймлайна
  return video.startTime !== undefined ? "timeline" : "media"
}

interface ResizableVideoProps {
  video: MediaFile
  isActive: boolean
  videoRefs?: Record<string, HTMLVideoElement>
  index?: number // Индекс видео в шаблоне
  hideLabel?: boolean // Флаг для скрытия надписи с названием камеры
  labelPosition?: "left" | "right" | "center" // Позиция надписи с названием камеры
}

/**
 * Компонент для отображения видео с возможностью масштабирования
 * Используем React.memo для предотвращения лишних рендеров
 */
export const ResizableVideo = React.memo(
  function ResizableVideo({
    video,
    isActive,
    videoRefs,
    index = 0,
    hideLabel = false,
    labelPosition = "center",
  }: ResizableVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isReady, setIsReady] = useState(false)

    // Для локализации
    const { t } = useTranslation()

    // Удалены неиспользуемые переменные для ограничения частоты обновлений

    // Получаем состояние воспроизведения из контекста плеера
    const { isPlaying } = usePlayerContext()

    // Проверяем, что видео существует и имеет путь
    if (!video || !video.path) {
      console.error(`[ResizableVideo] Ошибка: видео не определено или не имеет пути`, video)
      return (
        <div className={`relative flex h-full w-full items-center justify-center bg-black ${isActive ? 'border border-blue-500' : ''}`}>
          <span className="text-white">
            {t("timeline.player.videoUnavailable", "Video unavailable")}
          </span>
        </div>
      )
    }

    // Дополнительная проверка пути к видео
    if (video.path && !video.path.startsWith("/")) {
      console.error(`[ResizableVideo] Ошибка: некорректный путь к видео ${video.id}: ${video.path}`)
    }

    // Убираем логирование для улучшения производительности

    // Глобальный кэш для хранения загруженных видео элементов
    // Используем window для доступа из любого компонента
    if (typeof window !== 'undefined' && !window.videoElementCache) {
      window.videoElementCache = new Map();
    }

    // Эффект для быстрого доступа к уже загруженным видео
    useEffect(() => {
      // Если нет ID видео или videoRefs, выходим
      if (!video?.id || !videoRefs) return;

      // Получаем текущий элемент видео
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const videoStreamId = `${video.id}-stream-${index}`
      const mountTime = new Date().toISOString()

      console.log(`[VIDEO_LOG] ${mountTime} | MOUNT | ID: ${videoStreamId} | Монтирование видео | readyState: ${videoElement.readyState}`)

      // Проверяем, есть ли видео уже в videoRefs
      if (videoRefs[video.id]) {
        // Если видео уже загружено, устанавливаем флаг готовности
        if (videoRefs[video.id].readyState >= 2) {
          setIsReady(true);
          console.log(`[VIDEO_LOG] ${mountTime} | REFS_HIT | ID: ${videoStreamId} | Видео найдено в videoRefs | readyState: ${videoRefs[video.id].readyState}`)
        }
      } else if (videoElement) {
        // Если видео нет в videoRefs, добавляем текущий элемент
        videoRefs[video.id] = videoElement;
        console.log(`[VIDEO_LOG] ${mountTime} | REFS_ADD | ID: ${videoStreamId} | Видео добавлено в videoRefs`)

        // Если видео уже загружено, устанавливаем флаг готовности
        if (videoElement.readyState >= 2) {
          setIsReady(true);
          console.log(`[VIDEO_LOG] ${mountTime} | READY | ID: ${videoStreamId} | Видео готово к воспроизведению | readyState: ${videoElement.readyState}`)
        }
      }

      // Добавляем в глобальный кэш для быстрого доступа
      if (window.videoElementCache && video.id && !window.videoElementCache.has(video.id) && videoElement) {
        window.videoElementCache.set(video.id, videoElement);
        console.log(`[VIDEO_LOG] ${mountTime} | GLOBAL_CACHE_ADD | ID: ${videoStreamId} | Видео добавлено в глобальный кэш`)
      }

      // Определяем источник видео
      const source = getVideoSource(video);
      console.log(`[VIDEO_LOG] ${mountTime} | SOURCE | ID: ${videoStreamId} | Источник видео: ${source}`)

      // Проверяем, есть ли видео в глобальном кэше (из браузера)
      let usedCachedVideo = false;
      if (window.videoElementCache && window.videoElementCache.has(video.id)) {
        const cachedVideo = window.videoElementCache.get(video.id);
        const cacheTime = new Date().toISOString();

        if (cachedVideo && cachedVideo.readyState >= 2) {
          console.log(`[VIDEO_LOG] ${cacheTime} | CACHE_HIT | ID: ${videoStreamId} | Найдено видео в глобальном кэше | readyState: ${cachedVideo.readyState}`);

          // Копируем свойства из кэшированного видео
          videoElement.src = cachedVideo.src;
          videoElement.currentTime = cachedVideo.currentTime;

          // Отмечаем, что используем кэшированное видео
          usedCachedVideo = true;

          console.log(`[VIDEO_LOG] ${cacheTime} | CACHE_USED | ID: ${videoStreamId} | Использовано видео из кэша | src: ${cachedVideo.src}`);
        }
      }

      // Если не использовали кэш, устанавливаем src обычным способом
      if (!usedCachedVideo) {
        // Проверяем, что src установлен правильно
        const srcNeedsUpdate =
          video.path && (!videoElement.src || !videoElement.src.includes(video.id));

        if (srcNeedsUpdate) {
          try {
            const srcUpdateTime = new Date().toISOString()
            console.log(`[VIDEO_LOG] ${srcUpdateTime} | SRC_UPDATE | ID: ${videoStreamId} | Обновление источника видео | Путь: ${video.path}`)

            // Проверяем, что путь к видео корректный
            if (!video.path.startsWith("/")) {
              // Пытаемся исправить путь
              const correctedPath = `/${video.path.replace(/^\.\//, "")}`;
              videoElement.src = correctedPath;
              console.log(`[VIDEO_LOG] ${srcUpdateTime} | PATH_CORRECTED | ID: ${videoStreamId} | Путь исправлен: ${correctedPath}`)
            } else {
              videoElement.src = video.path;
            }

            // Загружаем видео
            videoElement.load();
            console.log(`[VIDEO_LOG] ${srcUpdateTime} | LOAD | ID: ${videoStreamId} | Запущена загрузка видео`)
          } catch (err) {
            const errorTime = new Date().toISOString()
            console.error(`[ResizableVideo] Ошибка при установке src для видео ${video.id}:`, err);
            console.log(`[VIDEO_LOG] ${errorTime} | SRC_ERROR | ID: ${videoStreamId} | Ошибка установки источника: ${err}`)
          }
        }
      }

      // Оптимизированная функция для проверки состояния видео элемента
      const checkVideoState = () => {
        // Получаем актуальный элемент
        const currentElement = videoRef.current;

        // Если элемент существует и находится в DOM
        if (currentElement && document.body.contains(currentElement) && video.id) {
          // Проверяем, что элемент в videoRefs
          if (videoRefs[video.id] !== currentElement) {
            videoRefs[video.id] = currentElement;
          }

          // Проверяем, готово ли видео к воспроизведению
          if (currentElement.readyState >= 2) {
            // Если видео уже готово, просто устанавливаем флаг готовности
            setIsReady(true);
            return;
          }

          // Проверяем, есть ли видео в глобальном кэше
          const cachedVideo = window.videoElementCache && window.videoElementCache.has(video.id) ?
            window.videoElementCache.get(video.id) : null;

          // Если видео есть в кэше и оно уже загружено, используем его
          if (cachedVideo && cachedVideo.readyState >= 2) {
            // Копируем свойства из кэшированного видео
            currentElement.src = cachedVideo.src;

            // Устанавливаем флаг готовности
            setIsReady(true);

            // Если плеер в состоянии воспроизведения, запускаем видео немедленно
            if (isPlaying && currentElement.paused) {
              // Запускаем воспроизведение с небольшой задержкой
              setTimeout(() => {
                if (currentElement && document.body.contains(currentElement) && isPlaying) {
                  currentElement.play().catch(err => {
                    if (err.name !== "AbortError") {
                      console.error(`[ResizableVideo] Ошибка при воспроизведении видео из кэша в checkVideoState: ${err}`);
                    }
                  });
                }
              }, 50);
            }
          } else {
            // Проверяем, что элемент в кэше
            if (window.videoElementCache && !window.videoElementCache.has(video.id)) {
              window.videoElementCache.set(video.id, currentElement);
            }

            // Проверяем, что src установлен правильно
            if (video.path && (!currentElement.src || !currentElement.src.includes(video.id))) {
              currentElement.src = video.path;
              currentElement.load();
            }
          }
        }
      };

      // Запускаем проверку через 50мс после монтирования для более быстрого запуска
      const checkTimer = setTimeout(checkVideoState, 50);

      return () => {
        // Очищаем таймер при размонтировании
        clearTimeout(checkTimer);

        const unmountTime = new Date().toISOString()
        console.log(`[VIDEO_LOG] ${unmountTime} | UNMOUNT | ID: ${videoStreamId} | Размонтирование видео`)

        // При размонтировании компонента не удаляем элемент из videoRefs и кэша,
        // так как он может использоваться в других местах
      };
    }, [video?.id, videoRefs, video?.path, setIsReady, index])

    // Эффект для установки готовности видео и настройки обработчиков событий
    useEffect(() => {
      const videoElement = videoRef.current
      if (!videoElement) return

      const videoStreamId = `${video.id}-stream-${index}`
      const initTime = new Date().toISOString()

      console.log(`[VIDEO_LOG] ${initTime} | INIT | ID: ${videoStreamId} | Инициализация видео | readyState: ${videoElement.readyState}`)

      // Проверяем, есть ли видео в кэше и уже загружено
      if (video?.id && window.videoElementCache?.has(video.id)) {
        const cachedVideo = window.videoElementCache.get(video.id);
        if (cachedVideo && cachedVideo.readyState >= 3) {
          setIsReady(true);
          console.log(`[VIDEO_LOG] ${initTime} | CACHE_HIT | ID: ${videoStreamId} | Видео найдено в кэше | readyState: ${cachedVideo.readyState}`)
        }
      }

      const handleMetadataLoaded = () => {
        const metadataTime = new Date().toISOString()
        console.log(`[VIDEO_LOG] ${metadataTime} | METADATA | ID: ${videoStreamId} | Метаданные загружены | Размеры: ${videoElement.videoWidth}x${videoElement.videoHeight}`)

        setIsReady(true)

        // Добавляем в кэш при загрузке метаданных
        if (video?.id && window.videoElementCache && !window.videoElementCache.has(video.id)) {
          window.videoElementCache.set(video.id, videoElement);
          console.log(`[VIDEO_LOG] ${metadataTime} | CACHE_ADD | ID: ${videoStreamId} | Видео добавлено в кэш`)
        }
      }

      // Обработчик события окончания видео
      const handleEnded = () => {
        const endedTime = new Date().toISOString()
        console.log(`[VIDEO_LOG] ${endedTime} | ENDED_EVENT | ID: ${videoStreamId} | Событие окончания видео`)

        // Если видео закончилось, но проигрывание продолжается,
        // устанавливаем currentTime на последний кадр (длительность - 0.1 секунда)
        if (isPlaying && videoElement.duration > 0) {
          console.log(`[ResizableVideo] Видео ${video.id} закончилось, показываем последний кадр`)
          videoElement.currentTime = Math.max(0, videoElement.duration - 0.1)

          // Останавливаем воспроизведение этого видео, но не останавливаем плеер
          videoElement.pause()

          const pauseTime = new Date().toISOString()
          console.log(`[VIDEO_LOG] ${pauseTime} | END_EVENT_PAUSE | ID: ${videoStreamId} | Видео остановлено после события окончания`)
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

        const cleanupTime = new Date().toISOString()
        console.log(`[VIDEO_LOG] ${cleanupTime} | CLEANUP | ID: ${videoStreamId} | Удаление обработчиков событий`)
      }
    }, [video?.path, video?.id, isPlaying, index])

    // Эффект для установки objectFit и objectPosition
    useEffect(() => {
      if (!videoRef.current) return

      // Получаем видео элемент
      const videoElement = videoRef.current

      // Всегда используем "cover" для всех видео, включая портретные
      const objectFit = "cover"

      // Устанавливаем стили только если они еще не установлены или изменились
      if (videoElement.style.objectFit !== objectFit) {
        videoElement.style.objectFit = objectFit
      }

      // Устанавливаем objectPosition по центру, если еще не установлено
      if (videoElement.style.objectPosition !== "center") {
        videoElement.style.objectPosition = "center"
      }

      // Устанавливаем флаг, что стили применены
      if (isReady && !videoElement.dataset.stylesApplied) {
        videoElement.dataset.stylesApplied = "true"
      }
    }, [isReady, video?.id])

    // Эффект для синхронизации воспроизведения с состоянием плеера - оптимизированная версия
    useEffect(() => {
      if (!videoRef.current) return

      const videoElement = videoRef.current

      // Всегда устанавливаем muted в зависимости от индекса
      // Звук только у первого видео (index === 0)
      videoElement.muted = index !== 0

      // Используем requestAnimationFrame для более эффективного запуска видео
      // Это позволит браузеру оптимизировать запуск нескольких видео в одном кадре
      if (isPlaying) {
        // Если плеер играет и видео на паузе - запускаем воспроизведение
        if (videoElement.paused) {
          // Проверяем, готово ли видео к воспроизведению
          const isVideoReady = videoElement.readyState >= 2;

          // Если видео готово, запускаем его немедленно
          if (isVideoReady) {
            // Используем requestAnimationFrame для запуска в следующем кадре отрисовки
            requestAnimationFrame(() => {
              if (videoElement && document.body.contains(videoElement) && isPlaying) {
                videoElement.play().catch((err) => {
                  // Игнорируем ошибки AbortError
                  if (err.name !== "AbortError") {
                    console.error(`[ResizableVideo] Ошибка при воспроизведении видео ${video.id}:`, err)
                  }
                });
              }
            });
          } else {
            // Если видео не готово, проверяем кэш
            const cachedVideo = window.videoElementCache && window.videoElementCache.has(video.id) ?
              window.videoElementCache.get(video.id) : null;

            if (cachedVideo && cachedVideo.readyState >= 2) {
              // Копируем свойства из кэшированного видео
              videoElement.src = cachedVideo.src;

              // Запускаем воспроизведение с минимальной задержкой
              requestAnimationFrame(() => {
                if (videoElement && document.body.contains(videoElement) && isPlaying) {
                  videoElement.play().catch((err) => {
                    // Игнорируем ошибки AbortError
                    if (err.name !== "AbortError") {
                      console.error(`[ResizableVideo] Ошибка при воспроизведении видео из кэша ${video.id}:`, err)
                    }
                  });
                }
              });
            } else {
              // Если видео не готово и нет в кэше, пробуем запустить его напрямую
              // Браузер сам решит, когда его можно будет запустить
              videoElement.play().catch((err) => {
                // Игнорируем ошибки AbortError и ошибки, связанные с тем, что видео не готово
                if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
                  console.error(`[ResizableVideo] Ошибка при воспроизведении видео ${video.id}:`, err)
                }
              });
            }
          }
        }
      } else {
        // Если плеер на паузе, но видео играет - останавливаем воспроизведение
        if (!videoElement.paused) {
          videoElement.pause()
        }
      }
    }, [isPlaying, video.id, index])

    // Эффект для синхронизации текущего времени видео - оптимизированная версия
    useEffect(() => {
      // Пропускаем для первого видео (оно является эталоном)
      if (!videoRef.current || !videoRefs || index === 0) return

      const videoElement = videoRef.current
      const mainVideoElement = videoRefs[Object.keys(videoRefs)[0]]

      // Синхронизируем время только при начале воспроизведения и если оба видео играют
      if (isPlaying && mainVideoElement && !videoElement.paused && !mainVideoElement.paused) {
        try {
          // Синхронизируем только если разница больше 0.5 секунды
          const timeDifference = Math.abs(videoElement.currentTime - mainVideoElement.currentTime)
          if (timeDifference > 0.5) {
            // Используем requestAnimationFrame для более эффективной синхронизации
            requestAnimationFrame(() => {
              try {
                // Проверяем, что элементы все еще существуют
                if (videoElement && document.body.contains(videoElement) &&
                    mainVideoElement && document.body.contains(mainVideoElement)) {
                  // Синхронизируем время
                  videoElement.currentTime = mainVideoElement.currentTime
                }
              } catch (err) {
                // Игнорируем ошибки при установке currentTime
              }
            });
          }
        } catch (err) {
          // Игнорируем ошибки при установке currentTime
        }
      }
    }, [isPlaying, videoRefs, index, video.id])

    return (
      <div className="relative h-full w-full" style={{ overflow: "visible" }}>
        <div
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            overflow: "visible",
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
              objectPosition: "center",
            }}
            playsInline
            preload="auto" // Используем auto для быстрой загрузки
            controls={false}
            autoPlay={false}
            loop={false}
            disablePictureInPicture
            muted={index !== 0} // Звук только из первого видео в шаблоне
            data-video-id={video.id} // Добавляем ID видео для быстрого поиска в DOM
            onEnded={(e) => {
              // Если видео закончилось, но проигрывание продолжается,
              // устанавливаем currentTime на последний кадр
              const videoStreamId = `${video.id}-stream-${index}`
              const endedTime = new Date().toISOString()

              // Логируем окончание видео
              console.log(`[VIDEO_LOG] ${endedTime} | ENDED | ID: ${videoStreamId} | Видео достигло конца`)

              if (isPlaying) {
                const target = e.target as HTMLVideoElement
                if (target.duration > 0) {
                  console.log(
                    `[ResizableVideo] Видео ${video.id} закончилось, показываем последний кадр`,
                  )
                  target.currentTime = Math.max(0, target.duration - 0.1)

                  // Останавливаем воспроизведение этого видео, но не останавливаем плеер
                  target.pause()

                  // Логируем остановку видео после окончания
                  const pauseTime = new Date().toISOString()
                  console.log(`[VIDEO_LOG] ${pauseTime} | END_PAUSE | ID: ${videoStreamId} | Видео остановлено после окончания | Длительность: ${target.duration.toFixed(2)}с`)
                }
              }
            }}

            onLoadedData={() => {
              // Проверяем, что видео действительно загружено
              const target = videoRef.current
              if (target) {
                const videoStreamId = `${video.id}-stream-${index}`
                const loadedTime = new Date().toISOString()

                // Проверяем, было ли это видео загружено из кэша
                const cachedVideo = window.videoElementCache && window.videoElementCache.has(video.id) ?
                  window.videoElementCache.get(video.id) : null;
                const wasLoadedFromCache = cachedVideo && cachedVideo.src === target.src;

                if (target.videoWidth === 0 || target.videoHeight === 0) {
                  console.error(
                    `[ResizableVideo] Видео ${video.id} загружено, но имеет нулевые размеры: ${target.videoWidth}x${target.videoHeight}`,
                  )
                  console.log(`[VIDEO_LOG] ${loadedTime} | LOAD_ERROR | ID: ${videoStreamId} | Видео загружено с нулевыми размерами`)
                } else {
                  // Логируем успешную загрузку видео
                  if (wasLoadedFromCache) {
                    console.log(`[VIDEO_LOG] ${loadedTime} | LOADED_FROM_CACHE | ID: ${videoStreamId} | Видео успешно загружено из кэша | Размеры: ${target.videoWidth}x${target.videoHeight}`)
                  } else {
                    console.log(`[VIDEO_LOG] ${loadedTime} | LOADED | ID: ${videoStreamId} | Видео успешно загружено | Размеры: ${target.videoWidth}x${target.videoHeight}`)
                  }

                  // Добавляем видео в кэш, если его там еще нет
                  if (window.videoElementCache && video.id && !window.videoElementCache.has(video.id)) {
                    window.videoElementCache.set(video.id, target);
                    console.log(`[VIDEO_LOG] ${loadedTime} | CACHE_ADD_AFTER_LOAD | ID: ${videoStreamId} | Видео добавлено в кэш после загрузки`)
                  }

                  // Устанавливаем флаг готовности
                  setIsReady(true);

                  // Если плеер уже в состоянии воспроизведения, сразу запускаем видео
                  // Это поможет синхронизировать запуск всех видео
                  if (isPlaying && target.paused) {
                    console.log(`[VIDEO_LOG] ${loadedTime} | AUTO_PLAY | ID: ${videoStreamId} | Автоматический запуск видео после загрузки | Из кэша: ${wasLoadedFromCache}`)

                    target.play().then(() => {
                      // Логируем успешный автозапуск
                      const autoPlayTime = new Date().toISOString()
                      console.log(`[VIDEO_LOG] ${autoPlayTime} | AUTO_PLAY_SUCCESS | ID: ${videoStreamId} | Видео успешно автозапущено | Из кэша: ${wasLoadedFromCache}`)
                    }).catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error(
                          `[ResizableVideo] Ошибка при автозапуске видео ${video.id}:`,
                          err,
                        )
                        // Логируем ошибку автозапуска
                        const errorTime = new Date().toISOString()
                        console.log(`[VIDEO_LOG] ${errorTime} | AUTO_PLAY_ERROR | ID: ${videoStreamId} | Ошибка автозапуска: ${err.name}`)
                      }
                    })
                  }
                }
              }
            }}
            onError={(e) => {
              const target = e.target as HTMLVideoElement
              const videoStreamId = `${video.id}-stream-${index}`
              const errorTime = new Date().toISOString()

              console.error(`[ResizableVideo] Ошибка загрузки видео ${video.id}:`, e)
              console.error(
                `[ResizableVideo] Детали ошибки для ${video.id}: networkState=${target.networkState}, readyState=${target.readyState}, error=${target.error?.code}`,
              )

              // Логируем ошибку загрузки видео с подробностями
              console.log(
                `[VIDEO_LOG] ${errorTime} | ERROR | ID: ${videoStreamId} | Ошибка загрузки видео | networkState=${target.networkState}, readyState=${target.readyState}, errorCode=${target.error?.code}`
              )
            }}
          />
        </div>

        {/* Подпись с названием камеры (поверх видео) - не отображаем если hideLabel=true */}
        {!hideLabel && (
          <div
            className={`bg-opacity-50 absolute rounded-xs bg-black/68 px-1.5 py-0.5 text-xs font-medium text-white ${
              labelPosition === "center"
                ? "bottom-1 left-1/2 -translate-x-1/2 transform text-center"
                : labelPosition === "left"
                  ? "top-1/2 left-[2%] -translate-y-1/2 transform"
                  : "top-1/2 right-[2%] -translate-y-1/2 transform"
            }`}
            style={{ zIndex: 10 }}
          >
            {t("timeline.player.camera", "Camera")} {index + 1}
          </div>
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Функция сравнения для React.memo
    // Возвращает true, если компонент НЕ должен перерендериваться

    // Добавляем проверку на существование video перед доступом к его свойствам
    if (!prevProps.video || !nextProps.video) {
      return prevProps.video === nextProps.video;
    }

    // Проверяем только важные свойства, которые влияют на отображение
    const sameVideo = prevProps.video.id === nextProps.video.id &&
                      prevProps.video.path === nextProps.video.path;
    const sameActive = prevProps.isActive === nextProps.isActive;
    const sameIndex = prevProps.index === nextProps.index;
    const sameLabel = prevProps.hideLabel === nextProps.hideLabel &&
                      prevProps.labelPosition === nextProps.labelPosition;

    // Не сравниваем videoRefs, так как это объект, который может меняться по ссылке
    // Но проверяем, что оба либо null/undefined, либо оба существуют
    const sameRefsExistence = (!prevProps.videoRefs && !nextProps.videoRefs) ||
                             (!!prevProps.videoRefs && !!nextProps.videoRefs);

    return sameVideo && sameActive && sameIndex && sameLabel && sameRefsExistence;
  },
)
