import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  GalleryThumbnails,
  LayoutPanelTop,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  StepBack,
  StepForward,
  TvMinimalPlay,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"
import {
  findTemplateContainer,
  takeScreenshot,
} from "@/media-editor/media-player/components/take-screenshot"
import { VolumeSlider } from "@/media-editor/media-player/components/volume-slider"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import { AppliedTemplate } from "@/media-editor/media-player/services/template-service"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile } from "@/types/media"

import { usePlayerContext } from ".."

interface PlayerControlsProps {
  currentTime: number
  videoSources?: Record<string, "media" | "timeline">
}

export function PlayerControls({ currentTime, videoSources }: PlayerControlsProps) {
  const { t } = useTranslation()
  const { tracks, activeTrackId } = useTimeline()
  const { screenshotsPath } = useUserSettings()
  const { displayTime, setDisplayTime } = useDisplayTime()

  // Состояние для отслеживания источника видео (медиа машина или таймлайн)
  const [localVideoSources, setLocalVideoSources] = useState<Record<string, "media" | "timeline">>(
    {},
  )

  const {
    isPlaying,
    setIsPlaying,
    video,
    setVideo,
    setCurrentTime,
    volume,
    setVolume,
    isRecording,
    setIsRecording,
    setIsSeeking,
    isChangingCamera,
    setIsChangingCamera,
    parallelVideos,
    videoRefs,
    appliedTemplate,
    setAppliedTemplate,
    setActiveVideoId,
    isResizableMode,
    setIsResizableMode,
    preferredSource,
    setPreferredSource,
    lastAppliedTemplate,
    setLastAppliedTemplate,
  } = usePlayerContext()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lastSaveTime = useRef(0)
  const SAVE_INTERVAL = 5000 // Сохраняем каждые 3 секунды

  // Временно отключаем сохранение состояния периодически
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveTime.current >= SAVE_INTERVAL) {
        lastSaveTime.current = now
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [video])

  // Переписываем handleSkipBackward: используем currentTime, вызываем setCurrentTime
  const handleSkipBackward = useCallback(() => {
    if (!video) return

    // Определяем размер шага (один кадр)
    let frameTime = 1 / 25 // По умолчанию 25 кадров в секунду

    // Определяем минимальное время (начало видео или трека)
    let minTime = video.startTime || 0
    let currentVideoOrTrack = video

    // Пытаемся получить точное значение FPS из метаданных видео
    if (video?.probeData?.streams?.[0]?.r_frame_rate) {
      const fpsStr = video.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      try {
        const fps = fpsMatch
          ? parseInt(fpsMatch[1], 10) / parseInt(fpsMatch[2], 10)
          : parseFloat(fpsStr)

        if (!isNaN(fps) && fps > 0) {
          frameTime = 1 / fps
          console.log(
            `[handleSkipBackward] Используем FPS из метаданных: ${fps}, frameTime: ${frameTime}`,
          )
        }
      } catch (e) {
        console.error("[handleSkipBackward] Ошибка при вычислении fps:", e)
      }
    }

    // Если есть активный трек, используем его для определения минимального времени
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        // Находим видео в треке, которое содержит текущее время
        const currentTrackVideo = activeTrack.videos.find((v) => {
          const videoStart = v.startTime || 0
          const videoEnd = videoStart + (v.duration || 0)
          return currentTime >= videoStart && currentTime <= videoEnd
        })

        if (currentTrackVideo) {
          currentVideoOrTrack = currentTrackVideo
          const videoStart = currentTrackVideo.startTime || 0

          // Проверяем, есть ли предыдущее видео в треке
          const currentIndex = activeTrack.videos.indexOf(currentTrackVideo)
          if (currentIndex > 0 && Math.abs(currentTime - videoStart) < 0.01) {
            // Если мы в начале текущего видео и есть предыдущее, используем конец предыдущего
            const prevVideo = activeTrack.videos[currentIndex - 1]
            const prevVideoEnd = (prevVideo.startTime || 0) + (prevVideo.duration || 0)
            minTime = prevVideoEnd - frameTime // Устанавливаем на последний кадр предыдущего видео
            console.log(
              `[handleSkipBackward] Переход к предыдущему видео в треке: ${prevVideo.id}, endTime: ${minTime}`,
            )
          } else {
            // Иначе используем начало текущего видео
            minTime = videoStart
            console.log(
              `[handleSkipBackward] Используем видео из трека: ${currentTrackVideo.id}, minTime: ${minTime}`,
            )
          }
        } else {
          // Если не нашли видео, содержащее текущее время, используем первое видео в треке
          const firstVideo = activeTrack.videos[0]
          minTime = firstVideo.startTime || 0
          console.log(
            `[handleSkipBackward] Используем первое видео из трека: ${firstVideo.id}, minTime: ${minTime}`,
          )
        }
      }
    }

    // Проверяем, не находимся ли мы уже в начале видео или трека
    if (Math.abs(currentTime - minTime) < 0.01) {
      console.log(`[handleSkipBackward] Уже в начале видео/трека: ${currentTime} ≈ ${minTime}`)
      return
    }

    // Обновляем frameTime для текущего видео, если оно изменилось
    if (
      currentVideoOrTrack !== video &&
      currentVideoOrTrack?.probeData?.streams?.[0]?.r_frame_rate
    ) {
      const fpsStr = currentVideoOrTrack.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      try {
        const fps = fpsMatch
          ? parseInt(fpsMatch[1], 10) / parseInt(fpsMatch[2], 10)
          : parseFloat(fpsStr)

        if (!isNaN(fps) && fps > 0) {
          frameTime = 1 / fps
          console.log(
            `[handleSkipBackward] Обновлен FPS для текущего видео: ${fps}, frameTime: ${frameTime}`,
          )
        }
      } catch (e) {
        console.error("[handleSkipBackward] Ошибка при вычислении fps:", e)
      }
    }

    // Вычисляем новое время
    const newTime = Math.max(minTime, currentTime - frameTime)
    console.log(`[handleSkipBackward] Перемещение на один кадр назад: ${currentTime} -> ${newTime}`)

    // Устанавливаем новое время и останавливаем воспроизведение
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying, activeTrackId, tracks])

  // Переписываем handleSkipForward: используем currentTime, вызываем setCurrentTime
  const handleSkipForward = useCallback(() => {
    if (!video) return

    // Определяем размер шага (один кадр)
    let frameTime = 1 / 25 // По умолчанию 25 кадров в секунду

    // Определяем максимальное время (конец видео или трека)
    let maxTime = (video.startTime || 0) + (video.duration || 0)
    let currentVideoOrTrack = video

    // Пытаемся получить точное значение FPS из метаданных видео
    if (video?.probeData?.streams?.[0]?.r_frame_rate) {
      const fpsStr = video.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      try {
        const fps = fpsMatch
          ? parseInt(fpsMatch[1], 10) / parseInt(fpsMatch[2], 10)
          : parseFloat(fpsStr)

        if (!isNaN(fps) && fps > 0) {
          frameTime = 1 / fps
          console.log(
            `[handleSkipForward] Используем FPS из метаданных: ${fps}, frameTime: ${frameTime}`,
          )
        }
      } catch (e) {
        console.error("[handleSkipForward] Ошибка при вычислении fps:", e)
      }
    }

    // Если есть активный трек, используем его для определения максимального времени
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        // Находим видео в треке, которое содержит текущее время
        const currentTrackVideo = activeTrack.videos.find((v) => {
          const videoStart = v.startTime || 0
          const videoEnd = videoStart + (v.duration || 0)
          return currentTime >= videoStart && currentTime <= videoEnd
        })

        if (currentTrackVideo) {
          currentVideoOrTrack = currentTrackVideo
          const videoEnd = (currentTrackVideo.startTime || 0) + (currentTrackVideo.duration || 0)

          // Проверяем, есть ли следующее видео в треке
          const currentIndex = activeTrack.videos.indexOf(currentTrackVideo)
          if (
            currentIndex < activeTrack.videos.length - 1 &&
            Math.abs(currentTime - videoEnd) < 0.01
          ) {
            // Если мы в конце текущего видео и есть следующее, используем начало следующего
            const nextVideo = activeTrack.videos[currentIndex + 1]
            maxTime = nextVideo.startTime || 0
            console.log(
              `[handleSkipForward] Переход к следующему видео в треке: ${nextVideo.id}, startTime: ${maxTime}`,
            )
          } else {
            // Иначе используем конец текущего видео
            maxTime = videoEnd
            console.log(
              `[handleSkipForward] Используем видео из трека: ${currentTrackVideo.id}, maxTime: ${maxTime}`,
            )
          }
        } else {
          // Если не нашли видео, содержащее текущее время, используем последнее видео в треке
          const lastVideo = activeTrack.videos[activeTrack.videos.length - 1]
          maxTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)
          console.log(
            `[handleSkipForward] Используем последнее видео из трека: ${lastVideo.id}, maxTime: ${maxTime}`,
          )
        }
      }
    }

    // Проверяем, не находимся ли мы уже в конце видео или трека
    if (Math.abs(currentTime - maxTime) < 0.01) {
      console.log(`[handleSkipForward] Уже в конце видео/трека: ${currentTime} ≈ ${maxTime}`)
      return
    }

    // Обновляем frameTime для текущего видео, если оно изменилось
    if (
      currentVideoOrTrack !== video &&
      currentVideoOrTrack?.probeData?.streams?.[0]?.r_frame_rate
    ) {
      const fpsStr = currentVideoOrTrack.probeData.streams[0].r_frame_rate
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      try {
        const fps = fpsMatch
          ? parseInt(fpsMatch[1], 10) / parseInt(fpsMatch[2], 10)
          : parseFloat(fpsStr)

        if (!isNaN(fps) && fps > 0) {
          frameTime = 1 / fps
          console.log(
            `[handleSkipForward] Обновлен FPS для текущего видео: ${fps}, frameTime: ${frameTime}`,
          )
        }
      } catch (e) {
        console.error("[handleSkipForward] Ошибка при вычислении fps:", e)
      }
    }

    // Вычисляем новое время
    const newTime = Math.min(maxTime, currentTime + frameTime)
    console.log(`[handleSkipForward] Перемещение на один кадр вперед: ${currentTime} -> ${newTime}`)

    // Устанавливаем новое время и останавливаем воспроизведение
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [video, currentTime, setCurrentTime, setIsPlaying, activeTrackId, tracks])

  // Используем useRef для хранения последнего значения громкости и предотвращения лишних рендеров
  const volumeRef = useRef(volume)
  const volumeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isVolumeChangingRef = useRef(false)
  const lastVolumeUpdateTimeRef = useRef(0)

  // Функция для применения громкости к видео элементам без обновления состояния
  const applyVolumeToVideoElements = useCallback(
    (newVolume: number) => {
      // Применяем громкость напрямую к активному видео
      if (video?.id && videoRefs[video.id]) {
        videoRefs[video.id].volume = newVolume
      }

      // Если используется шаблон с несколькими видео, применяем громкость ко всем видео
      if (appliedTemplate?.template && parallelVideos.length > 0) {
        // Создаем массив уникальных видео для обновления громкости
        const uniqueVideos = parallelVideos.filter(
          (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
        )

        uniqueVideos.forEach((parallelVideo) => {
          if (parallelVideo.id && videoRefs[parallelVideo.id]) {
            // Устанавливаем громкость для всех видео в шаблоне
            videoRefs[parallelVideo.id].volume = newVolume
            videoRefs[parallelVideo.id].muted = false
          }
        })
      }
    },
    [video, videoRefs, appliedTemplate, parallelVideos],
  )

  // Оптимизированная функция изменения громкости с дебаунсингом
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0]
      const now = performance.now()

      // Устанавливаем флаг, что громкость меняется
      isVolumeChangingRef.current = true

      // Обновляем значение в ref без вызова setVolume на каждое изменение
      volumeRef.current = newVolume

      // Применяем громкость напрямую к видео элементам для мгновенной обратной связи
      applyVolumeToVideoElements(newVolume)

      // Используем дебаунсинг и троттлинг для обновления состояния
      // Обновляем состояние только если прошло достаточно времени с последнего обновления
      if (now - lastVolumeUpdateTimeRef.current > 200) {
        lastVolumeUpdateTimeRef.current = now

        // Очищаем предыдущий таймаут, если он был
        if (volumeChangeTimeoutRef.current) {
          clearTimeout(volumeChangeTimeoutRef.current)
        }

        // Устанавливаем новый таймаут для обновления состояния
        volumeChangeTimeoutRef.current = setTimeout(() => {
          // Обновляем состояние только если все еще меняется громкость
          if (isVolumeChangingRef.current) {
            setVolume(newVolume)
          }
          volumeChangeTimeoutRef.current = null
        }, 100) // Обновляем состояние не чаще чем раз в 100мс
      }
    },
    [applyVolumeToVideoElements, setVolume],
  )

  // Функция, которая вызывается при завершении изменения громкости (отпускании слайдера)
  const handleVolumeChangeEnd = useCallback(() => {
    // Сбрасываем флаг изменения громкости
    isVolumeChangingRef.current = false

    // Очищаем таймаут, если он был установлен
    if (volumeChangeTimeoutRef.current) {
      clearTimeout(volumeChangeTimeoutRef.current)
      volumeChangeTimeoutRef.current = null
    }

    // Обновляем состояние сразу при отпускании слайдера
    // Используем setTimeout с нулевой задержкой, чтобы отделить обновление от события UI
    setTimeout(() => {
      setVolume(volumeRef.current)

      // Сохраняем значение громкости в localStorage только при отпускании слайдера
      if (typeof window !== "undefined") {
        localStorage.setItem("player-volume", volumeRef.current.toString())
        console.log(`[PlayerControls] Сохранен уровень звука: ${volumeRef.current}`)
      }
    }, 0)
  }, [setVolume])

  const handleToggleMute = useCallback(() => {
    const newVolume = volume === 0 ? 1 : 0

    // Сохраняем текущее значение громкости в ref
    volumeRef.current = newVolume

    // Применяем громкость напрямую к видео элементам для мгновенной обратной связи
    applyVolumeToVideoElements(newVolume)

    // Обновляем состояние с небольшой задержкой, чтобы избежать лагов
    setTimeout(() => {
      setVolume(newVolume)

      // При переключении mute сразу сохраняем значение в localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("player-volume", newVolume.toString())
        console.log(`[PlayerControls] Сохранен уровень звука при переключении: ${newVolume}`)
      }
    }, 0)
  }, [volume, setVolume, applyVolumeToVideoElements])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Функция для создания и сохранения скриншота
  const handleTakeSnapshot = useCallback(async () => {
    try {
      console.log("[handleTakeSnapshot] Создаем скриншот")

      // Проверяем, используется ли шаблон
      if (appliedTemplate) {
        console.log("[handleTakeSnapshot] Создаем скриншот для шаблона")

        // Находим контейнер с шаблоном
        const templateContainer = findTemplateContainer()
        if (!templateContainer) return

        // Создаем и сохраняем скриншот шаблона
        await takeScreenshot({
          isTemplate: true,
          templateContainer,
          screenshotsPath,
        })
      } else if (video && videoRefs[video.id]) {
        console.log("[handleTakeSnapshot] Создаем скриншот для видео:", video.id)

        // Получаем видеоэлемент
        const videoElement = videoRefs[video.id]

        // Создаем и сохраняем скриншот видео
        await takeScreenshot({
          isTemplate: false,
          videoElement,
          screenshotsPath,
        })
      } else {
        console.log("[handleTakeSnapshot] Нет активного видео или шаблона для скриншота")
      }
    } catch (error) {
      console.error("[handleTakeSnapshot] Ошибка при создании скриншота:", error)
    }
  }, [video, videoRefs, screenshotsPath, appliedTemplate])

  // Функция для применения последнего шаблона
  const handleApplyLastTemplate = useCallback(() => {
    console.log("[handleApplyLastTemplate] Вызвана функция применения последнего шаблона")

    // Проверяем, есть ли сохраненный шаблон в контексте плеера
    if (lastAppliedTemplate) {
      console.log(
        "[handleApplyLastTemplate] Применяем шаблон из контекста плеера:",
        lastAppliedTemplate.template?.id,
      )

      // Создаем копию шаблона для безопасного применения
      const templateCopy = JSON.parse(JSON.stringify(lastAppliedTemplate))

      // Проверяем, нужно ли заполнить шаблон видео в зависимости от предпочтительного источника
      if (templateCopy.videos.length === 0) {
        console.log("[handleApplyLastTemplate] Шаблон не содержит видео, пытаемся заполнить его")

        // Если текущий источник - браузер, ищем видео из браузера
        if (preferredSource === "media") {
          const browserVideos = parallelVideos.filter(
            (v) =>
              v.id &&
              ((videoSources && videoSources[v.id] === "media") ||
                (localVideoSources && localVideoSources[v.id] === "media")),
          )

          if (browserVideos.length > 0) {
            console.log(
              `[handleApplyLastTemplate] Найдено ${browserVideos.length} видео из браузера`,
            )

            // Заполняем шаблон видео из браузера
            templateCopy.videos = browserVideos.slice(0, templateCopy.template?.screens || 1)

            console.log(
              `[handleApplyLastTemplate] Добавлено ${templateCopy.videos.length} видео из браузера в шаблон`,
            )
          }
        }
        // Если текущий источник - таймлайн, ищем видео из таймлайна
        else if (preferredSource === "timeline") {
          const timelineVideos = parallelVideos.filter(
            (v) =>
              v.id &&
              ((videoSources && videoSources[v.id] === "timeline") ||
                (localVideoSources && localVideoSources[v.id] === "timeline")),
          )

          if (timelineVideos.length > 0) {
            console.log(
              `[handleApplyLastTemplate] Найдено ${timelineVideos.length} видео из таймлайна`,
            )

            // Заполняем шаблон видео из таймлайна
            templateCopy.videos = timelineVideos.slice(0, templateCopy.template?.screens || 1)

            console.log(
              `[handleApplyLastTemplate] Добавлено ${templateCopy.videos.length} видео из таймлайна в шаблон`,
            )
          }
        }
      }

      // Применяем шаблон
      setAppliedTemplate(templateCopy)

      // Если в шаблоне есть видео, устанавливаем первое как активное
      if (templateCopy.videos && templateCopy.videos.length > 0) {
        setActiveVideoId(templateCopy.videos[0].id)
        setVideo(templateCopy.videos[0])
        console.log(
          `[handleApplyLastTemplate] Установлено активное видео: ${templateCopy.videos[0].id}`,
        )
      }
      // Если в шаблоне нет видео, но выбран источник "media", пытаемся показать любое видео из браузера
      else if (preferredSource === "media") {
        // Находим любое видео из браузера
        const anyBrowserVideo = parallelVideos.find(
          (v) =>
            v.id &&
            ((videoSources && videoSources[v.id] === "media") ||
              (localVideoSources && localVideoSources[v.id] === "media")),
        )

        if (anyBrowserVideo) {
          console.log(
            `[handleApplyLastTemplate] Нет видео в шаблоне, но найдено видео из браузера: ${anyBrowserVideo.id}`,
          )
          setActiveVideoId(anyBrowserVideo.id)
          setVideo(anyBrowserVideo)
        }
      }
    }
    // Если нет сохраненного шаблона в контексте плеера
    else {
      console.log("[handleApplyLastTemplate] Нет сохраненного шаблона в контексте плеера")

      // Если выбран источник "media", пытаемся показать любое видео из браузера
      if (preferredSource === "media") {
        // Находим любое видео из браузера
        const anyBrowserVideo = parallelVideos.find(
          (v) =>
            v.id &&
            ((videoSources && videoSources[v.id] === "media") ||
              (localVideoSources && localVideoSources[v.id] === "media")),
        )

        if (anyBrowserVideo) {
          console.log(
            `[handleApplyLastTemplate] Нет шаблона, но найдено видео из браузера: ${anyBrowserVideo.id}`,
          )
          setActiveVideoId(anyBrowserVideo.id)
          setVideo(anyBrowserVideo)
        }
      }
    }
  }, [
    lastAppliedTemplate,
    preferredSource,
    parallelVideos,
    videoSources,
    localVideoSources,
    setAppliedTemplate,
    setActiveVideoId,
    setVideo,
  ])

  // Функция для сброса шаблона
  const handleResetTemplate = useCallback(() => {
    console.log("[handleResetTemplate] Вызвана функция сброса шаблона")
    console.log("[handleResetTemplate] Текущий шаблон:", appliedTemplate)

    if (appliedTemplate) {
      console.log("[handleResetTemplate] Сбрасываем шаблон:", appliedTemplate.template?.id)

      // Создаем копию текущего шаблона перед сбросом
      const templateToSave = JSON.parse(JSON.stringify(appliedTemplate))

      // Сохраняем текущий шаблон перед сбросом в контексте плеера
      setLastAppliedTemplate(templateToSave)
      console.log(
        "[handleResetTemplate] Шаблон сохранен в контексте плеера:",
        templateToSave.template?.id,
      )

      // Принудительно устанавливаем null для сброса шаблона
      setAppliedTemplate(null)

      // Добавляем проверку через setTimeout
      setTimeout(() => {
        console.log("[handleResetTemplate] Проверка после сброса:", appliedTemplate)
      }, 100)
    } else {
      console.log("[handleResetTemplate] Нет активного шаблона для сброса")
    }
  }, [appliedTemplate, setAppliedTemplate, setLastAppliedTemplate])

  // Улучшенная функция для переключения между камерами
  const handleSwitchCamera = useCallback(() => {
    // Если нет параллельных видео или их меньше 2, ничего не делаем
    if (!parallelVideos || parallelVideos.length < 2) {
      console.log("[handleSwitchCamera] Нет доступных камер для переключения")
      return
    }

    // Находим индекс текущей активной камеры
    const currentIndex = parallelVideos.findIndex((v) => v.id === video?.id)
    if (currentIndex === -1) {
      console.log("[handleSwitchCamera] Текущая камера не найдена в списке параллельных видео")
      // Если текущая камера не найдена, используем первую камеру из списка
      const nextVideo = parallelVideos[0]
      console.log(`[handleSwitchCamera] Используем первую камеру из списка: ${nextVideo.id}`)
      setVideo(nextVideo)
      setActiveVideoId(nextVideo.id)
      return
    }

    // Вычисляем индекс следующей камеры
    const nextIndex = (currentIndex + 1) % parallelVideos.length
    const nextVideo = parallelVideos[nextIndex]

    console.log(`[handleSwitchCamera] Переключение с камеры ${video?.id} на камеру ${nextVideo.id}`)

    // Проверяем, не находимся ли мы уже в процессе переключения
    if (isChangingCamera) {
      console.log("[handleSwitchCamera] Уже идет процесс переключения камеры, пропускаем")
      return
    }

    // Сохраняем текущее время воспроизведения и вычисляем относительную позицию (в процентах)
    const currentVideoTime = video?.id && videoRefs[video.id] ? videoRefs[video.id].currentTime : 0
    const currentVideoDuration = video?.duration || 1
    const relativePosition = currentVideoTime / currentVideoDuration

    console.log(
      `[handleSwitchCamera] Текущее время: ${currentVideoTime}, относительная позицию: ${relativePosition.toFixed(3)}`,
    )

    // Сохраняем состояние записи
    const wasRecording = isRecording

    // Временно останавливаем запись, если она активна
    if (wasRecording) {
      console.log(
        "[handleSwitchCamera] Временно приостанавливаем запись для безопасного переключения",
      )
      setIsRecording(false)
    }

    // Устанавливаем флаг переключения камеры
    setIsChangingCamera(true)

    // Устанавливаем новое активное видео и ID
    console.log(`[handleSwitchCamera] Устанавливаем новое активное видео: ${nextVideo.id}`)
    setVideo(nextVideo)
    setActiveVideoId(nextVideo.id)

    // Сбрасываем флаг переключения камеры через небольшую задержку
    setTimeout(() => {
      try {
        // Вычисляем новое время на основе относительной позиции
        if (videoRefs[nextVideo.id]) {
          const nextVideoDuration = nextVideo.duration || 1
          // Используем относительную позицию для вычисления нового времени
          const newTime = relativePosition * nextVideoDuration

          // Устанавливаем новое время для следующего видео
          videoRefs[nextVideo.id].currentTime = newTime
          console.log(
            `[handleSwitchCamera] Установлено время ${newTime.toFixed(3)} для видео ${nextVideo.id} (длительность: ${nextVideoDuration})`,
          )

          // Сбрасываем флаг переключения камеры
          setIsChangingCamera(false)

          // Принудительно обновляем слайдер, устанавливая isSeeking
          setIsSeeking(true)
          setTimeout(() => {
            setIsSeeking(false)

            // Возобновляем запись, если она была активна
            if (wasRecording) {
              console.log("[handleSwitchCamera] Возобновляем запись после переключения камеры")
              setIsRecording(true)

              // Если видео было на паузе, запускаем воспроизведение для записи
              if (!isPlaying) {
                console.log(
                  "[handleSwitchCamera] Автоматически запускаем воспроизведение для записи",
                )
                setIsPlaying(true)
              }
            }
          }, 50)
        } else {
          console.log(`[handleSwitchCamera] Видео элемент для ${nextVideo.id} не найден`)
          setIsChangingCamera(false)

          // Возобновляем запись, если она была активна, даже при ошибке
          if (wasRecording) {
            console.log("[handleSwitchCamera] Возобновляем запись после ошибки")
            setIsRecording(true)
          }
        }
      } catch (error) {
        console.error("[handleSwitchCamera] Ошибка при переключении камеры:", error)
        setIsChangingCamera(false)

        // Возобновляем запись, если она была активна, даже при ошибке
        if (wasRecording) {
          console.log("[handleSwitchCamera] Возобновляем запись после ошибки")
          setIsRecording(true)
        }
      }
    }, 300)
  }, [
    parallelVideos,
    video,
    videoRefs,
    setVideo,
    setIsChangingCamera,
    setIsSeeking,
    isChangingCamera,
    isRecording,
    setIsRecording,
    isPlaying,
    setIsPlaying,
    setActiveVideoId,
  ])

  // Функция для переключения между источниками видео (браузер/таймлайн)
  const handleToggleSource = useCallback(() => {
    // Переключаем предпочтительный источник
    const newSource = preferredSource === "media" ? "timeline" : "media"
    console.log(`[handleToggleSource] Переключаем источник: ${preferredSource} -> ${newSource}`)

    // Устанавливаем новый предпочтительный источник в контексте плеера
    setPreferredSource(newSource)

    // Если переключаемся на источник "timeline"
    if (newSource === "timeline") {
      // Проверяем, есть ли активное видео из таймлайна
      const hasTimelineVideo =
        video?.id &&
        ((videoSources && videoSources[video.id] === "timeline") ||
          (localVideoSources && localVideoSources[video.id] === "timeline"))

      if (!hasTimelineVideo) {
        console.log(
          `[handleToggleSource] Нет активного видео из таймлайна, показываем черный экран`,
        )

        // Если есть примененный шаблон, сохраняем его, но очищаем видео
        if (appliedTemplate) {
          console.log(
            `[handleToggleSource] Есть примененный шаблон, сохраняем его, но очищаем видео`,
          )
          // Создаем копию шаблона
          const templateCopy = { ...appliedTemplate }
          // Очищаем список видео в шаблоне
          templateCopy.videos = []
          // Применяем обновленный шаблон
          setAppliedTemplate(templateCopy)
        }

        // Сбрасываем активное видео, чтобы показать черный экран
        setActiveVideoId(null)
        // Используем undefined вместо null для совместимости с типом
        setVideo(undefined as any)
      }
    }
    // Если переключаемся на источник "media" (браузер)
    else {
      console.log(`[handleToggleSource] Переключаемся на источник "media" (браузер)`)

      // Сначала помечаем все параллельные видео как видео из браузера
      if (parallelVideos.length > 0) {
        console.log(
          `[handleToggleSource] Помечаем все параллельные видео (${parallelVideos.length}) как видео из браузера`,
        )

        // Создаем объект с источниками видео
        const newVideoSources: Record<string, "media" | "timeline"> = {}

        // Помечаем все параллельные видео как видео из браузера
        parallelVideos.forEach((v) => {
          if (v.id) {
            newVideoSources[v.id] = "media"
          }
        })

        // Обновляем состояние videoSources
        setLocalVideoSources(newVideoSources)
      }

      // Теперь все параллельные видео считаются видео из браузера
      const browserVideos = parallelVideos

      console.log(`[handleToggleSource] Найдено ${browserVideos.length} видео из браузера`)

      // Если есть видео из браузера
      if (browserVideos.length > 0) {
        // Если есть примененный шаблон
        if (appliedTemplate) {
          console.log(
            `[handleToggleSource] Есть примененный шаблон, заполняем его видео из браузера`,
          )

          // Создаем копию шаблона
          const templateCopy = { ...appliedTemplate }

          // Заполняем шаблон видео из браузера
          templateCopy.videos = browserVideos.slice(0, appliedTemplate.template?.screens || 1)

          console.log(
            `[handleToggleSource] Добавлено ${templateCopy.videos.length} видео из браузера в шаблон`,
          )

          // Применяем обновленный шаблон
          setAppliedTemplate(templateCopy)

          // Устанавливаем первое видео из браузера как активное
          setActiveVideoId(browserVideos[0].id)
          setVideo(browserVideos[0])
          console.log(
            `[handleToggleSource] Установлено активное видео из браузера: ${browserVideos[0].id}`,
          )
        }
        // Если нет примененного шаблона, но есть последний примененный шаблон
        else if (lastAppliedTemplate) {
          console.log(
            `[handleToggleSource] Нет активного шаблона, но есть последний примененный шаблон: ${lastAppliedTemplate.template?.id}`,
          )

          // Создаем копию последнего шаблона
          const templateCopy = JSON.parse(JSON.stringify(lastAppliedTemplate))

          // Заполняем шаблон видео из браузера
          templateCopy.videos = browserVideos.slice(0, templateCopy.template?.screens || 1)

          console.log(
            `[handleToggleSource] Добавлено ${templateCopy.videos.length} видео из браузера в последний шаблон`,
          )

          // Применяем обновленный шаблон
          setAppliedTemplate(templateCopy)

          // Устанавливаем первое видео из браузера как активное
          setActiveVideoId(browserVideos[0].id)
          setVideo(browserVideos[0])
          console.log(
            `[handleToggleSource] Установлено активное видео из браузера: ${browserVideos[0].id}`,
          )
        }
        // Если нет ни активного, ни последнего шаблона
        else {
          console.log(`[handleToggleSource] Нет шаблонов, просто показываем видео из браузера`)

          // Устанавливаем первое видео из браузера как активное
          setActiveVideoId(browserVideos[0].id)
          setVideo(browserVideos[0])
          console.log(
            `[handleToggleSource] Установлено активное видео из браузера: ${browserVideos[0].id}`,
          )
        }
      }
      // Если нет видео из браузера
      else {
        console.log(`[handleToggleSource] Нет доступных видео из браузера`)

        // Если есть примененный шаблон, очищаем его
        if (appliedTemplate) {
          console.log(`[handleToggleSource] Есть примененный шаблон, очищаем его`)

          // Создаем копию шаблона
          const templateCopy = { ...appliedTemplate }
          // Очищаем список видео в шаблоне
          templateCopy.videos = []
          // Применяем обновленный шаблон
          setAppliedTemplate(templateCopy)
        }
        // Если есть последний примененный шаблон, применяем его с пустыми видео
        else if (lastAppliedTemplate) {
          console.log(`[handleToggleSource] Применяем последний шаблон без видео`)

          // Создаем копию последнего шаблона
          const templateCopy = JSON.parse(JSON.stringify(lastAppliedTemplate))
          // Очищаем список видео в шаблоне
          templateCopy.videos = []
          // Применяем обновленный шаблон
          setAppliedTemplate(templateCopy)
        }

        // Сбрасываем активное видео
        setActiveVideoId(null)
        setVideo(undefined as any)
      }
    }
  }, [
    preferredSource,
    video,
    videoSources,
    setVideo,
    setActiveVideoId,
    appliedTemplate,
    lastAppliedTemplate,
    setAppliedTemplate,
    parallelVideos,
    setLocalVideoSources,
  ])

  // Улучшенный handleRecordToggle для корректной работы с параллельными видео
  const handleRecordToggle = useCallback(() => {
    // Если идет процесс переключения камеры, игнорируем нажатие
    if (isChangingCamera) {
      console.log("[handleRecordToggle] Игнорируем переключение записи во время смены камеры")
      return
    }

    if (isRecording) {
      console.log("[handleRecordToggle] Останавливаем запись")
      setIsRecording(false)
    } else {
      const trackId = activeTrackId || video?.id || ""
      if (trackId) {
        console.log("[handleRecordToggle] Начинаем запись для трека:", trackId)

        // Если видео на паузе, запускаем воспроизведение
        if (!isPlaying && video?.id && videoRefs[video.id]) {
          console.log("[handleRecordToggle] Автоматически запускаем воспроизведение для записи")
          setIsPlaying(true)
        }

        setIsRecording(true)
      } else {
        console.warn("Не удалось начать запись: отсутствует активный трек и активное видео")
      }
    }
  }, [
    isRecording,
    setIsRecording,
    activeTrackId,
    video,
    isChangingCamera,
    isPlaying,
    videoRefs,
    setIsPlaying,
  ])

  // Функция для получения видео для отображения (первое видео в шаблоне или текущее видео)
  const getDisplayVideo = useCallback(() => {
    return appliedTemplate?.videos && appliedTemplate.videos.length > 0
      ? appliedTemplate.videos[0]
      : video
  }, [appliedTemplate, video])

  // Улучшенный handleTimeChange для корректной работы с параллельными видео и шаблонами
  const handleTimeChange = useCallback(
    (value: number[]) => {
      // Определяем, какое видео использовать для изменения времени
      const videoToUse = getDisplayVideo()

      if (!videoToUse) return

      // Если идет процесс переключения камеры, игнорируем изменение времени
      if (isChangingCamera) {
        console.log("[handleTimeChange] Игнорируем изменение времени во время переключения камеры")
        return
      }

      const videoDuration = videoToUse.duration || 0
      const sliderValue = value[0]

      // Проверка валидности значения
      if (!isFinite(sliderValue) || sliderValue < 0) return

      // Ограничиваем время в пределах длительности видео
      const clampedTime = Math.min(videoDuration, Math.max(0, sliderValue))

      // Определяем, короткое ли у нас видео (меньше 10 секунд)
      const isShortVideo = videoDuration < 10

      // Для коротких видео используем меньший порог изменения
      const timeChangeThreshold = isShortVideo ? 0.001 : 0.01

      // Вычисляем локальное время для сравнения
      const localTime =
        currentTime > 365 * 24 * 60 * 60 && videoToUse.startTime
          ? Math.max(0, currentTime - (videoToUse.startTime || 0))
          : currentTime

      // Проверяем, существенно ли изменилось время
      if (Math.abs(clampedTime - localTime) < timeChangeThreshold) return

      // Логируем только при значительных изменениях времени
      if (Math.abs(clampedTime - localTime) > 0.5) {
        console.log("[handleTimeChange] Значительное изменение времени:", {
          currentTime: localTime.toFixed(3),
          clampedTime: clampedTime.toFixed(3),
          delta: (clampedTime - localTime).toFixed(3),
        })
      }

      // Устанавливаем seeking перед изменением времени, чтобы избежать
      // конфликтов с обновлениями от timeupdate
      setIsSeeking(true)

      try {
        // Если текущее время - Unix timestamp, обрабатываем особым образом
        if (currentTime > 365 * 24 * 60 * 60) {
          // Устанавливаем относительный прогресс для текущего видео
          console.log(
            `[handleTimeChange] Установка относительного прогресса: ${clampedTime.toFixed(3)}`,
          )

          // Определяем, какие видео нужно обновить
          let videosToUpdate: MediaFile[] = []

          // Если применен шаблон, обновляем все видео в шаблоне
          if (appliedTemplate?.videos && appliedTemplate.videos.length > 0) {
            videosToUpdate = appliedTemplate.videos
            console.log(`[handleTimeChange] Обновляем ${videosToUpdate.length} видео в шаблоне`)
          }
          // Если есть параллельные видео, обновляем их
          else if (parallelVideos && parallelVideos.length > 0) {
            videosToUpdate = parallelVideos
            console.log(`[handleTimeChange] Обновляем ${videosToUpdate.length} параллельных видео`)
          }
          // Иначе обновляем только текущее видео
          else if (videoToUse) {
            videosToUpdate = [videoToUse]
            console.log(`[handleTimeChange] Обновляем только текущее видео: ${videoToUse.id}`)
          }

          // Вычисляем относительную позицию для текущего видео
          const relativePosition = clampedTime / (videoToUse.duration || 1)
          console.log(`[handleTimeChange] Относительная позиция: ${relativePosition.toFixed(3)}`)

          // Обновляем время для всех видео
          videosToUpdate.forEach((updateVideo) => {
            if (updateVideo?.id && videoRefs[updateVideo.id]) {
              // Если это первое видео (или единственное), устанавливаем точное время
              if (updateVideo.id === videoToUse.id) {
                videoRefs[updateVideo.id].currentTime = clampedTime
                console.log(
                  `[handleTimeChange] Установлено точное время ${clampedTime.toFixed(3)} для видео ${updateVideo.id}`,
                )

                // Обновляем локальное отображаемое время по первому видео
                setLocalDisplayTime(clampedTime)
              }
              // Для остальных видео вычисляем пропорциональное время
              else {
                const updateVideoDuration = updateVideo.duration || 1
                const newTime = relativePosition * updateVideoDuration
                videoRefs[updateVideo.id].currentTime = newTime
                console.log(
                  `[handleTimeChange] Синхронизировано время ${newTime.toFixed(3)} для видео ${updateVideo.id}`,
                )
              }
            }
          })

          // Сбрасываем флаг seeking после небольшой задержки
          setTimeout(() => {
            setIsSeeking(false)
          }, 50)

          return
        }

        // Для обычного времени преобразуем относительное время в абсолютное
        let newTime = clampedTime
        if (videoToUse.startTime) {
          newTime = videoToUse.startTime + clampedTime
          console.log(`[handleTimeChange] Преобразование времени: ${clampedTime} -> ${newTime}`)
        }

        // Устанавливаем новое время с пометкой, что источник - пользователь
        setCurrentTime(newTime)
      } catch (error) {
        console.error("[handleTimeChange] Ошибка при изменении времени:", error)
        setIsSeeking(false)
      }
    },
    [
      video,
      videoRefs,
      setCurrentTime,
      setIsSeeking,
      currentTime,
      isChangingCamera,
      parallelVideos,
      appliedTemplate,
      setLocalDisplayTime,
    ],
  )

  // Переписываем handleChevronFirst: используем currentTime, вызываем setCurrentTime
  const handleChevronFirst = useCallback(() => {
    if (!video) return

    // Если есть активный трек, используем его
    if (activeTrackId) {
      // Находим активный трек
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack) {
        // Находим первое видео в треке
        const firstVideo = activeTrack.videos?.[0]
        if (firstVideo) {
          const startTime = firstVideo.startTime || 0
          if (Math.abs(currentTime - startTime) < 0.01) return

          console.log(`[handleChevronFirst] Перемещение в начало трека: ${startTime}`)
          setCurrentTime(startTime)
          setIsPlaying(false)
          return
        }
      }
    }

    // Если нет активного трека или в треке нет видео, используем текущее видео
    const videoStartTime = video.startTime || 0
    if (Math.abs(currentTime - videoStartTime) < 0.01) return

    console.log(`[handleChevronFirst] Перемещение в начало видео: ${videoStartTime}`)
    setCurrentTime(videoStartTime)
    setIsPlaying(false)
  }, [video, activeTrackId, tracks, currentTime, setCurrentTime, setIsPlaying])

  // Переписываем handleChevronLast: используем currentTime, вызываем setCurrentTime
  const handleChevronLast = useCallback(() => {
    if (!video) return

    // Если есть активный трек, используем его
    if (activeTrackId) {
      // Находим активный трек
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        // Находим последнее видео в треке
        const lastVideo = activeTrack.videos[activeTrack.videos.length - 1]
        if (lastVideo) {
          const startTime = lastVideo.startTime || 0
          const duration = lastVideo.duration || 0
          const endTime = startTime + duration

          if (Math.abs(currentTime - endTime) < 0.01) return

          console.log(`[handleChevronLast] Перемещение в конец трека: ${endTime}`)
          setCurrentTime(endTime)
          setIsPlaying(false)
          return
        }
      }
    }

    // Если нет активного трека или в треке нет видео, используем текущее видео
    const videoStartTime = video.startTime || 0
    const videoDuration = video.duration || 0
    const videoEndTime = videoStartTime + videoDuration

    if (Math.abs(currentTime - videoEndTime) < 0.01) return

    console.log(`[handleChevronLast] Перемещение в конец видео: ${videoEndTime}`)
    setCurrentTime(videoEndTime)
    setIsPlaying(false)
  }, [video, activeTrackId, tracks, currentTime, setCurrentTime, setIsPlaying])

  // Используем currentTime для isFirstFrame / isLastFrame
  // Безопасно вычисляем fps из строки формата "num/den"
  const fpsStr = video?.probeData?.streams?.[0]?.r_frame_rate || ""
  let frameTime = 1 / 25 // По умолчанию 25 кадров в секунду
  try {
    if (fpsStr) {
      const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
      const fps = fpsMatch
        ? parseInt(fpsMatch[1], 10) / parseInt(fpsMatch[2], 10)
        : parseFloat(fpsStr)

      if (!isNaN(fps) && fps > 0) {
        frameTime = 1 / fps
        console.log(
          `[PlayerControls] Используем FPS из метаданных: ${fps}, frameTime: ${frameTime}`,
        )
      }
    }
  } catch (e) {
    console.error("[PlayerControls] Ошибка при вычислении fps:", e)
  }

  // Функция форматирования относительного времени
  const formatRelativeTime = (time: number): string => {
    // Добавим проверку на конечность числа
    if (!isFinite(time)) {
      console.warn("[formatRelativeTime] Received non-finite time:", time)
      return "00:00:00.000"
    }
    // Используем Math.max для гарантии неотрицательного значения
    const absTime = Math.max(0, time)
    const hours = Math.floor(absTime / 3600)
    const minutes = Math.floor((absTime % 3600) / 60)
    const seconds = Math.floor(absTime % 60)
    const milliseconds = Math.floor((absTime % 1) * 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  // Функция форматирования абсолютного времени сектора
  const formatSectorTime = (time: number, startTime?: number): string => {
    // Если нет startTime или это не Unix timestamp, используем относительное время
    if (!startTime || startTime < 365 * 24 * 60 * 60) {
      return formatRelativeTime(time)
    }

    // Преобразуем Unix timestamp в объект Date
    const date = new Date((startTime + time) * 1000)

    // Форматируем время в формате HH:MM:SS.mmm
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0")

    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  // videoRefs уже получен выше

  // Обновляем локальное время при воспроизведении
  useEffect(() => {
    // Определяем, какое видео использовать для отслеживания времени
    const videoToTrack = getDisplayVideo()

    // Если нет активного видео или его ID, выходим
    if (!videoToTrack?.id) return

    // Получаем элемент видео для отслеживания
    const videoElementToTrack = videoRefs[videoToTrack.id]

    // Если нет элемента видео для отслеживания, выходим
    if (!videoElementToTrack) {
      console.log(
        `[PlayerControls] Нет элемента видео для отслеживания времени: ${videoToTrack.id}`,
      )
      return
    }

    console.log(`[PlayerControls] Отслеживаем время по видео: ${videoToTrack.id}`)

    // Функция обновления времени
    const updateTime = () => {
      const newTime = videoElementToTrack.currentTime

      // Всегда обновляем localDisplayTime и displayTime при каждом событии timeupdate
      // Это необходимо для плавного движения таймлайн бара
      setLocalDisplayTime(newTime)

      // Всегда обновляем displayTime в контексте для синхронизации с TimelineBar
      // Это необходимо для корректного движения бара при воспроизведении видео из сектора
      setDisplayTime(newTime)

      // Логируем только при существенном изменении времени, чтобы не засорять консоль
      if (Math.abs(newTime - localDisplayTime) > 0.1) {
        console.log(`[PlayerControls] Обновлено localDisplayTime: ${newTime.toFixed(3)}`)
        console.log(
          `[PlayerControls] Обновлен displayTime в контексте: ${newTime.toFixed(3)}, currentTime: ${currentTime}`,
        )
      }
    }

    // Добавляем обработчик события timeupdate
    if (isPlaying) {
      videoElementToTrack.addEventListener("timeupdate", updateTime)
      console.log(`[PlayerControls] Добавлен обработчик timeupdate для видео: ${videoToTrack.id}`)
    }

    return () => {
      videoElementToTrack.removeEventListener("timeupdate", updateTime)
      console.log(`[PlayerControls] Удален обработчик timeupdate для видео: ${videoToTrack.id}`)
    }
  }, [
    video?.id,
    videoRefs,
    isPlaying,
    appliedTemplate,
    getDisplayVideo,
    currentTime,
    setDisplayTime,
  ])

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const calculatedDisplayTime = useMemo(() => {
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return localDisplayTime
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  // Обновляем контекст при изменении calculatedDisplayTime
  // Но только если не воспроизводится видео, чтобы избежать конфликта с updateTime
  useEffect(() => {
    if (!isPlaying) {
      setDisplayTime(calculatedDisplayTime)
      console.log(
        `[PlayerControls] Обновлен displayTime в контексте (из useEffect): ${calculatedDisplayTime.toFixed(3)}`,
      )
    }
  }, [calculatedDisplayTime, setDisplayTime, isPlaying])

  // Эффект для обновления иконки источника после гидратации
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    // Устанавливаем флаг гидратации после монтирования компонента
    setIsHydrated(true)
  }, [])

  // Эффект для логирования изменений preferredSource
  useEffect(() => {
    if (isHydrated) {
      console.log(`[PlayerControls] preferredSource изменен на: ${preferredSource}`)
    }
  }, [preferredSource, isHydrated])

  // Создаем мемоизированные значения для начального и конечного времени
  const startTimeForFirstFrame = useMemo(() => {
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        const firstVideo = activeTrack.videos[0]
        if (firstVideo) {
          return firstVideo.startTime || 0
        }
      }
    }
    return video?.startTime || 0
  }, [activeTrackId, tracks, video])

  const endTimeForLastFrame = useMemo(() => {
    if (activeTrackId) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId)
      if (activeTrack && activeTrack.videos && activeTrack.videos.length > 0) {
        const lastVideo = activeTrack.videos[activeTrack.videos.length - 1]
        if (lastVideo) {
          return (lastVideo.startTime || 0) + (lastVideo.duration || 0)
        }
      }
    }
    return (video?.startTime || 0) + (video?.duration || 0)
  }, [activeTrackId, tracks, video])

  // Определяем isFirstFrame и isLastFrame на основе мемоизированных значений
  const isFirstFrame = useMemo(() => {
    return Math.abs(currentTime - startTimeForFirstFrame) < frameTime
  }, [currentTime, startTimeForFirstFrame, frameTime])

  const isLastFrame = useMemo(() => {
    return Math.abs(currentTime - endTimeForLastFrame) < frameTime
  }, [currentTime, endTimeForLastFrame, frameTime])

  // Ограничиваем логирование, чтобы не перегружать консоль
  useEffect(() => {
    console.log(
      "[PlayerControls] Rendering with currentTime:",
      currentTime,
      "displayTime:",
      displayTime,
      "isFirstFrame:",
      isFirstFrame,
      "isLastFrame:",
      isLastFrame,
      "startTimeForFirstFrame:",
      startTimeForFirstFrame,
      "endTimeForLastFrame:",
      endTimeForLastFrame,
    )
  }, [
    currentTime,
    displayTime,
    isFirstFrame,
    isLastFrame,
    startTimeForFirstFrame,
    endTimeForLastFrame,
  ])

  // Улучшаем handlePlayPause: НЕ устанавливаем флаг isChangingCamera при переключении
  const handlePlayPause = useCallback(() => {
    // Проверяем, есть ли активное видео или видео в шаблоне или параллельные видео
    const hasActiveVideo = !!video
    const hasTemplateVideos = appliedTemplate?.videos && appliedTemplate.videos.length > 0
    const hasParallelVideos = parallelVideos && parallelVideos.length > 0

    // Если нет ни активного видео, ни видео в шаблоне, ни параллельных видео, выходим
    if (!hasActiveVideo && !hasTemplateVideos && !hasParallelVideos) {
      console.log("[handlePlayPause] Нет видео для воспроизведения")
      return
    }

    // Не устанавливаем флаг isChangingCamera при переключении между паузой и воспроизведением,
    // так как это приводит к сбросу времени
    console.log("[handlePlayPause] Переключение воспроизведения")

    // Если начинаем воспроизведение и есть активное видео, устанавливаем текущее время видео в displayTime
    if (!isPlaying && hasActiveVideo && video.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]

      // Если currentTime - это Unix timestamp, используем displayTime
      if (currentTime > 365 * 24 * 60 * 60) {
        console.log(
          `[handlePlayPause] Установка времени видео в calculatedDisplayTime: ${calculatedDisplayTime.toFixed(3)}`,
        )
        videoElement.currentTime = calculatedDisplayTime

        // Сохраняем это время для текущего видео
        console.log(
          `[handlePlayPause] Сохраняем calculatedDisplayTime ${calculatedDisplayTime.toFixed(3)} для видео ${video.id}`,
        )
      }
    }

    // Проверяем готовность видео перед началом воспроизведения
    if (!isPlaying && hasActiveVideo && video.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]

      // Проверяем готовность видео
      if (videoElement.readyState < 3) {
        console.log(`[handlePlayPause] Видео ${video.id} не готово, ожидаем загрузку...`)

        // Показываем индикатор загрузки
        // Это можно реализовать через состояние в контексте плеера, если нужно
      }
    }

    // В любом случае переключаем состояние воспроизведения
    setIsPlaying(!isPlaying)
  }, [
    isPlaying,
    setIsPlaying,
    video,
    videoRefs,
    currentTime,
    displayTime,
    appliedTemplate,
    parallelVideos,
  ])

  return (
    <div className="flex w-full flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative h-1 w-full rounded-full border border-white bg-gray-800">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-white"
                style={{
                  width: `${(Math.max(0, calculatedDisplayTime) / (getDisplayVideo()?.duration || 100)) * 100}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full border border-white bg-white"
                style={{
                  left: `calc(${(Math.max(0, calculatedDisplayTime) / (getDisplayVideo()?.duration || 100)) * 100}% - 6px)`,
                }}
              />
              <Slider
                value={[Math.max(0, calculatedDisplayTime)]}
                min={0}
                max={getDisplayVideo()?.duration || 100}
                step={0.001}
                onValueChange={handleTimeChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isChangingCamera} // Отключаем слайдер во время переключения камеры
              />
            </div>
          </div>
          <span className="rounded-md bg-white px-1 text-xs text-black dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(Math.max(0, calculatedDisplayTime), getDisplayVideo()?.startTime)
              : formatRelativeTime(Math.max(0, calculatedDisplayTime))}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="rounded-md bg-white px-1 text-xs text-black dark:bg-black dark:text-white">
            {currentTime > 365 * 24 * 60 * 60
              ? formatSectorTime(getDisplayVideo()?.duration || 0, getDisplayVideo()?.startTime)
              : formatRelativeTime(getDisplayVideo()?.duration || 0)}
          </span>

          {/* Скрытый элемент для обновления компонента при воспроизведении */}
          {currentTime > 365 * 24 * 60 * 60 && (
            <span className="hidden">
              {localDisplayTime.toFixed(3)} - {calculatedDisplayTime.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="h-full w-full p-1">
        <div className="flex items-center justify-between px-2 py-0" style={{ minWidth: "1000px" }}>
          {/* Левая часть: индикатор источника, кнопки для камер и шаблонов */}
          <div className="flex items-center gap-2" style={{ minWidth: "150px" }}>
            {/* Индикатор источника видео - всегда отображается и работает как переключатель */}
            <Button
              className={`h-8 w-8 cursor-pointer ${!isHydrated || preferredSource === "timeline" ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                !isHydrated
                  ? "Timeline"
                  : preferredSource === "timeline"
                    ? t("timeline.source.timeline", "Таймлайн")
                    : t("timeline.source.browser", "Браузер")
              }
              onClick={handleToggleSource}
            >
              {/* Используем isHydrated для условного рендеринга иконки */}
              {!isHydrated || preferredSource === "timeline" ? (
                <TvMinimalPlay className="h-8 w-8" />
              ) : (
                <GalleryThumbnails className="h-8 w-8" />
              )}
            </Button>
            {/* Кнопка переключения режима resizable - показываем только если применен шаблон */}
            <Button
              className={`h-8 w-8 cursor-pointer ${isResizableMode ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isResizableMode
                    ? t("timeline.controlsMain.fixedSizeMode")
                    : t("timeline.controlsMain.resizableMode")
                  : "Fixed Size Mode"
              }
              onClick={() => setIsResizableMode(!isResizableMode)}
              disabled={!appliedTemplate}
            >
              {<UnfoldHorizontal className="h-8 w-8" />}
            </Button>

            {/* Кнопка шаблона - всегда активна, переключает режим шаблона */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? appliedTemplate
                    ? t("timeline.controlsMain.resetTemplate")
                    : t("timeline.controlsMain.applyTemplate") || "Применить шаблон"
                  : "Apply Template"
              }
              onClick={appliedTemplate ? handleResetTemplate : handleApplyLastTemplate}
            >
              {appliedTemplate ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="4" y1="4" x2="20" y2="20" />
                </svg>
              ) : (
                <LayoutPanelTop className="h-8 w-8" />
              )}
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? t("timeline.controls.takeSnapshot")
                  : "Take snapshot"
              }
              onClick={handleTakeSnapshot}
            >
              <Camera className="h-8 w-8" />
            </Button>

            {/* Кнопка переключения между камерами - показываем только если есть параллельные видео */}
            {parallelVideos && parallelVideos.length > 1 && (
              <Button
                className={`h-8 w-8 cursor-pointer ${isChangingCamera ? "animate-pulse" : ""}`}
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? `${t("timeline.controlsMain.switchCamera")} (${parallelVideos.findIndex((v) => v.id === video?.id) + 1}/${parallelVideos.length})`
                    : "Switch Camera"
                }
                onClick={handleSwitchCamera}
                disabled={isChangingCamera}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 17a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
                  <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                  <path d="M10 13H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
                  <path d="M10 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                  <path d="M12 17v-9" />
                </svg>
              </Button>
            )}
          </div>

          {/* Центральная часть: кнопки управления воспроизведением */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ flex: "1", marginLeft: "auto", marginRight: "auto" }}
          >
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined" ? t("timeline.controls.firstFrame") : "First frame"
              }
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <ChevronFirst className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? t("timeline.controls.previousFrame")
                  : "Previous frame"
              }
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <StepBack className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isPlaying
                    ? t("timeline.controls.pause")
                    : t("timeline.controls.play")
                  : "Play"
              }
              onClick={handlePlayPause}
              disabled={isChangingCamera}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined" ? t("timeline.controls.nextFrame") : "Next frame"
              }
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <StepForward className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined" ? t("timeline.controls.lastFrame") : "Last frame"
              }
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <ChevronLast className="h-8 w-8" />
            </Button>

            <Button
              className={"h-8 w-8 cursor-pointer"}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isRecording
                    ? t("timeline.controls.stopRecord")
                    : t("timeline.controls.record")
                  : "Record"
              }
              onClick={handleRecordToggle}
              disabled={isChangingCamera} // Отключаем кнопку во время переключения камеры
            >
              <CircleDot
                className={cn(
                  "h-8 w-8",
                  isRecording
                    ? "animate-pulse text-red-500 hover:text-red-600"
                    : "text-white hover:text-gray-300",
                )}
              />
            </Button>
          </div>

          {/* Правая часть: кнопки управления звуком и полноэкранным режимом */}
          <div
            className="flex items-center gap-2"
            style={{ minWidth: "150px", justifyContent: "flex-end" }}
          >
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 cursor-pointer"
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? volume === 0
                      ? t("timeline.controls.unmuteAudio")
                      : t("timeline.controls.muteAudio")
                    : "Mute audio"
                }
                onClick={handleToggleMute}
              >
                {volume === 0 ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
              </Button>
              <div className="w-20">
                <VolumeSlider
                  volume={volume}
                  volumeRef={volumeRef}
                  onValueChange={handleVolumeChange}
                  onValueCommit={handleVolumeChangeEnd}
                />
              </div>
            </div>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isFullscreen
                    ? t("timeline.controls.exitFullscreen")
                    : t("timeline.controls.fullscreen")
                  : "Fullscreen"
              }
              onClick={handleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
