import { Trash2 } from "lucide-react"
import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { formatDateByLanguage } from "@/i18n/constants"
import { TimelineTopPanel } from "@/media-editor"
import { Sector } from "@/media-editor/browser"
import { usePlayerContext } from "@/media-editor/media-player"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile, Track } from "@/types/media"

import { TimelineChat } from "./chat"
import { SectionHeader } from "./layout/section-header"
import { TimelineBar } from "./layout/timeline-bar"
import { TimelineResources } from "./resources"
import { TimelineScale } from "./timeline-scale/timeline-scale"
import { VideoTrack } from "./track"

// Функция для форматирования даты секции с учетом локализации
// Используем замыкание для доступа к i18n
const createFormatSectionDate =
  (i18n: any) =>
    (dateString: string): string => {
      try {
      // Если дата в формате ISO (YYYY-MM-DD), добавляем время
        const date = new Date(dateString + "T00:00:00")
        if (isNaN(date.getTime())) {
          return "Неверный формат даты"
        }

        // Получаем текущий язык из i18n
        let currentLanguage = "ru"

        // Безопасно получаем язык из i18n
        if (i18n && typeof i18n.language === "string") {
          currentLanguage = i18n.language
        }

        // Используем универсальный метод форматирования даты
        return formatDateByLanguage(date, currentLanguage, {
          includeYear: true,
          longFormat: true,
          addYearSuffix: false, // Не добавляем суффикс "г." вручную, он добавляется автоматически
        })
      } catch (e) {
        console.error("Error formatting section date:", e)
        return "Ошибка форматирования даты"
      }
    }

export function Timeline() {
  const { t, i18n } = useTranslation()

  // Создаем функцию форматирования даты с доступом к i18n
  const formatSectionDate = createFormatSectionDate(i18n)
  const context = useTimeline()
  if (!context) {
    throw new Error("Timeline must be used within a TimelineProvider")
  }

  const {
    tracks,
    activeTrackId,
    seek,
    setActiveTrack,
    setActiveSector,
    setTracks,
    removeFiles,
    zoomLevel,
    zoom,
    fitToScreen,
  } = context

  // Функция для синхронизации громкости параллельных видео
  const syncParallelVideosVolume = (activeVideoId: string) => {
    if (!window.playerContext) return

    const { videoRefs, parallelVideos, volume } = window.playerContext

    // Если нет параллельных видео, выходим
    if (!parallelVideos || parallelVideos.length < 2) return

    console.log(
      `[Timeline] Синхронизация громкости для ${parallelVideos.length} параллельных видео, активное: ${activeVideoId}`,
    )

    // Устанавливаем громкость для всех параллельных видео
    parallelVideos.forEach((video) => {
      if (!video.id || !videoRefs[video.id]) return

      const videoElement = videoRefs[video.id]
      const isActive = video.id === activeVideoId

      // Устанавливаем громкость (звук только для активного видео)
      if (isActive) {
        videoElement.volume = volume
        videoElement.muted = false
        console.log(`[Timeline] Включен звук для активного видео ${video.id}`)
      } else {
        videoElement.volume = 0
        videoElement.muted = true
        console.log(`[Timeline] Отключен звук для неактивного видео ${video.id}`)
      }
    })

    // Отправляем событие для синхронизации воспроизведения всех видео
    window.dispatchEvent(
      new CustomEvent("sync-parallel-videos-playback", {
        detail: { activeVideoId },
      }),
    )
  }

  // Функция для синхронизации воспроизведения параллельных видео
  const syncParallelVideosPlayback = (activeVideoId: string, currentDisplayTime: number) => {
    if (!window.playerContext) return

    const { videoRefs, parallelVideos, isPlaying } = window.playerContext

    // Если нет параллельных видео, выходим
    if (!parallelVideos || parallelVideos.length < 2) return

    console.log(
      `[Timeline] Синхронизация воспроизведения для ${parallelVideos.length} параллельных видео, активное: ${activeVideoId}`,
    )

    // Синхронизируем воспроизведение для всех параллельных видео
    parallelVideos.forEach((video) => {
      if (!video.id || !videoRefs[video.id]) return

      const videoElement = videoRefs[video.id]
      const isActive = video.id === activeVideoId

      // Получаем startTime и endTime видео
      const videoStartTime = video.startTime || 0
      const videoEndTime = videoStartTime + (video.duration || 0)

      // Проверяем, находится ли текущее время в диапазоне видео
      const isTimeInRange =
        currentDisplayTime >= videoStartTime && currentDisplayTime <= videoEndTime

      if (isTimeInRange) {
        // Если время в диапазоне, устанавливаем локальное время видео
        const localTime = Math.max(0, currentDisplayTime - videoStartTime)

        // Устанавливаем время видео
        if (Math.abs(videoElement.currentTime - localTime) > 0.3) {
          console.log(
            `[Timeline] Устанавливаем время ${localTime.toFixed(2)} для видео ${video.id}`,
          )
          videoElement.currentTime = localTime
        }

        // Воспроизводим видео, если нужно
        if (isPlaying && videoElement.paused) {
          console.log(`[Timeline] Запускаем воспроизведение видео ${video.id}`)
          videoElement.play().catch((err) => {
            console.error(`[Timeline] Ошибка при воспроизведении видео ${video.id}:`, err)
          })
        } else if (!isPlaying && !videoElement.paused) {
          console.log(`[Timeline] Ставим на паузу видео ${video.id}`)
          videoElement.pause()
        }
      } else {
        // Если время вне диапазона
        if (currentDisplayTime < videoStartTime) {
          // Если время меньше начала видео, показываем первый кадр
          console.log(
            `[Timeline] Показываем первый кадр для видео ${video.id} (время ${currentDisplayTime.toFixed(2)} < ${videoStartTime.toFixed(2)})`,
          )
          videoElement.currentTime = 0
          videoElement.pause()
        } else if (currentDisplayTime > videoEndTime) {
          // Если время больше конца видео, показываем последний кадр
          console.log(
            `[Timeline] Показываем последний кадр для видео ${video.id} (время ${currentDisplayTime.toFixed(2)} > ${videoEndTime.toFixed(2)})`,
          )
          videoElement.currentTime = video.duration || 0
          videoElement.pause()
        }
      }
    })
  }

  // Состояние для редактирования названия трека
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingTrackName, setEditingTrackName] = useState<string>("")

  // Состояние для хранения масштаба каждой секции
  const [sectionZoomLevels, setSectionZoomLevels] = useState<Record<string, number>>({})

  // Отображаем треки и видео на таймлайне
  const {
    isRecording,
    setIsRecording,
    setVideo,
    video,
    currentTime,
    isPlaying,
    setIsChangingCamera,
  } = usePlayerContext()
  const activeVideo = video

  // Состояние для хранения текущего времени воспроизведения
  const [displayTime, setDisplayTime] = useState<number>(0)

  // Получаем контекст таймлайна
  const timelineContext = useTimeline()

  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [deletingSectionDate, setDeletingSectionDate] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // Используем ширину контейнера для расчетов
  const [, setContainerWidth] = useState(1000) // Начальное значение по умолчанию

  // Реф для контейнера таймлайна
  const timelineContainerRef = React.useRef<HTMLDivElement>(null)

  // Реф для контейнера горизонтального скролла
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const sections = useMemo(() => {
    const videosByDay = new Map<
      string,
      {
        videos: MediaFile[]
        tracks: Track[]
        startTime: number
        endTime: number
      }
    >()

    tracks.forEach((track) => {
      // console.log(`Processing track ${track.name} with ${track.videos?.length || 0} videos`)

      track.videos?.forEach((video) => {
        const videoStart = video.startTime || 0
        const videoEnd = videoStart + (video.duration || 0)
        const date = new Date(videoStart * 1000).toISOString().split("T")[0]

        // console.log(`Video ${video.name}: date=${date}, start=${videoStart}, end=${videoEnd}`)

        if (!videosByDay.has(date)) {
          // console.log(`Creating new day entry for date ${date}`)
          videosByDay.set(date, {
            videos: [],
            tracks: [],
            startTime: videoStart,
            endTime: videoEnd,
          })
        }

        const dayData = videosByDay.get(date)!
        dayData.videos.push(video)
        if (!dayData.tracks.includes(track)) {
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(`Adding track ${track.name} to day ${date}`)
          dayData.tracks.push(track)
        }
        dayData.startTime = Math.min(dayData.startTime, videoStart)
        dayData.endTime = Math.max(dayData.endTime, videoEnd)
      })
    })

    const result = Array.from(videosByDay.entries()).map(([date, data]) => ({
      date,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.endTime - data.startTime,
      tracks: data.tracks,
    }))

    // Отключаем логирование для уменьшения количества сообщений
    // console.log(
    //   "Created sections:",
    //   result.map((s) => ({
    //     date: s.date,
    //     tracksCount: s.tracks.length,
    //     tracks: s.tracks.map((t) => t.name),
    //   })),
    // )

    return result
  }, [tracks])

  // Функция для прокрутки к видимой области с видео
  const scrollToVisibleVideos = () => {
    if (!scrollContainerRef.current || !activeVideo) return

    const videoStartTime = activeVideo.startTime || 0
    const videoDuration = activeVideo.duration || 0

    // Находим середину видео
    const videoMiddleTime = videoStartTime + videoDuration / 2

    // Находим активный сектор, содержащий видео
    const activeSection = sections.find((section) =>
      section.tracks.some((track) => track.videos?.some((video) => video.id === activeVideo.id)),
    )

    if (!activeSection) return

    // Находим минимальное время начала видео в секторе
    const minStartTime = Math.min(
      ...activeSection.tracks.flatMap((t) => (t.videos || []).map((v) => v.startTime || 0)),
      activeSection.startTime, // Используем startTime сектора как запасной вариант
    )

    // Рассчитываем позицию в пикселях относительно начала сектора
    // Используем масштаб сектора, если он задан, иначе используем общий масштаб
    const sectorZoomLevel = activeSection.date
      ? sectionZoomLevels[activeSection.date] || zoomLevel
      : zoomLevel
    const pixelPosition = (videoMiddleTime - minStartTime) * 2 * sectorZoomLevel

    // Прокручиваем к позиции
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        pixelPosition - scrollContainerRef.current.clientWidth / 2
    }
  }

  // Функция для подгонки масштаба секции под ширину экрана
  const fitSectionToScreen = (sectionDate: string): void => {
    if (!scrollContainerRef.current) return

    // Находим секцию по дате
    const section = sections.find((s) => s.date === sectionDate)
    if (!section) return

    // Находим минимальное время начала видео в секторе
    const minStartTime = Math.min(
      ...section.tracks.flatMap((t) => (t.videos || []).map((v) => v.startTime || 0)),
      section.startTime, // Используем startTime сектора как запасной вариант
    )

    // Для каждого трека находим максимальное время окончания видео
    const trackEndTimes = section.tracks.map((t) => {
      if (!t.videos || t.videos.length === 0) return 0
      return Math.max(...t.videos.map((v) => (v.startTime || 0) + (v.duration || 0)))
    })

    // Находим максимальное время окончания среди всех треков
    const maxEndTime = Math.max(
      ...trackEndTimes,
      section.endTime, // Используем endTime сектора как запасной вариант
    )

    // Вычисляем длительность секции
    const sectionDuration = maxEndTime - minStartTime

    // Вычисляем ширину контейнера для скролла
    const containerWidth = scrollContainerRef.current.clientWidth

    // Вычисляем новый масштаб, чтобы секция поместилась в контейнер
    // Формула: containerWidth = sectionDuration * 2 * newZoomLevel
    // Отсюда: newZoomLevel = containerWidth / (sectionDuration * 2)
    // Добавляем небольшой отступ (90%), чтобы видео не занимало всю ширину контейнера
    const newZoomLevel = (containerWidth * 0.9) / (sectionDuration * 2)

    // Обновляем масштаб для секции
    setSectionZoomLevels((prev) => ({
      ...prev,
      [sectionDate]: newZoomLevel,
    }))

    // Принудительно обновляем компонент для пересчета ширины контейнера
    setTimeout(() => {
      // Обновляем ширину контейнера, чтобы вызвать перерисовку
      setContainerWidth(window.innerWidth)

      // Прокручиваем к началу секции
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0
      }
    }, 100)
  }

  // Обработчик изменения значения слайдера масштаба
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Получаем значение слайдера из события
    const value = parseFloat(e.target.value)

    // Преобразуем значение слайдера (0-100) в zoomLevel (0.005-200)
    // Используем логарифмическую шкалу для более плавного изменения
    const minZoom = 0.005
    const maxZoom = 200
    const logMin = Math.log(minZoom)
    const logMax = Math.log(maxZoom)
    const scale = (logMax - logMin) / 100
    const newZoomLevel = Math.exp(logMin + scale * value)

    zoom(newZoomLevel)

    // Принудительно обновляем компонент для пересчета ширины контейнера
    setTimeout(() => {
      // Обновляем ширину контейнера, чтобы вызвать перерисовку
      setContainerWidth(window.innerWidth)

      // После изменения масштаба прокручиваем к видимой области
      scrollToVisibleVideos()
    }, 100)
  }

  // Обработчик для редактирования названия трека
  const handleEditTrackName = (track: Track) => {
    setEditingTrackId(track.id)
    setEditingTrackName(track.cameraName || track.name || "")
  }

  // Обработчик для сохранения названия трека
  const handleSaveTrackName = () => {
    if (editingTrackId) {
      const updatedTracks = tracks.map((track) => {
        if (track.id === editingTrackId) {
          return {
            ...track,
            cameraName: editingTrackName,
          }
        }
        return track
      })

      setTracks(updatedTracks)
      setEditingTrackId(null)
    }
  }

  // Обработчик для клавиш при редактировании названия трека
  const handleTrackNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTrackName()
    } else if (e.key === "Escape") {
      setEditingTrackId(null)
    }
  }

  // Обработчик для удаления секции
  const handleDeleteSection = (date: string) => {
    setDeletingSectionDate(date)
    setDeleteDialogOpen(true)
  }

  // Подтверждение удаления секции
  const confirmDeleteSection = () => {
    if (deletingSectionDate) {
      // Находим секцию по дате
      const sectionToDelete = sections.find((s) => s.date === deletingSectionDate)
      if (sectionToDelete) {
        // Собираем все видео из секции
        const videosToRemove = sectionToDelete.tracks.flatMap((t) => t.videos || [])

        // Удаляем видео
        removeFiles(videosToRemove.map((v) => v.id))

        // Если активный трек был в удаленной секции, сбрасываем его
        if (activeTrackId) {
          const activeTrackInDeletedSection = sectionToDelete.tracks.some(
            (t) => t.id === activeTrackId,
          )
          if (activeTrackInDeletedSection) {
            setActiveTrack("")
          }
        }
      }
    }

    setDeleteDialogOpen(false)
    setDeletingSectionDate(null)
  }

  // Обработчики для кнопок масштабирования
  const handleScaleIncrease = () => {
    // Максимальное приближение: примерно 2 секунды на всю ширину таймлайна
    // При базовом масштабе 2px за секунду, для 2 секунд на 800px нужен zoomLevel = 200
    const newZoomLevel = Math.min(zoomLevel * 1.5, 200)
    zoom(newZoomLevel)

    // Принудительно обновляем компонент для пересчета ширины контейнера
    setTimeout(() => {
      // Обновляем ширину контейнера, чтобы вызвать перерисовку
      setContainerWidth(window.innerWidth)

      // После изменения масштаба прокручиваем к видимой области
      scrollToVisibleVideos()
    }, 100)
  }

  const handleScaleDecrease = () => {
    // Минимальное приближение: 24 часа (86400 секунд) на всю ширину таймлайна
    // При базовом масштабе 2px за секунду, для 86400 секунд на 800px нужен zoomLevel = 0.005
    const newZoomLevel = Math.max(zoomLevel * 0.67, 0.005)
    zoom(newZoomLevel)

    // Принудительно обновляем компонент для пересчета ширины контейнера
    setTimeout(() => {
      // Обновляем ширину контейнера, чтобы вызвать перерисовку
      setContainerWidth(window.innerWidth)

      // После изменения масштаба прокручиваем к видимой области
      scrollToVisibleVideos()
    }, 100)
  }

  // Эффекты для обработки событий

  // Обработчик нажатия клавиш 1-5 для переключения между камерами
  React.useEffect(() => {
    const handleCameraSwitch = (e: KeyboardEvent) => {
      // Проверяем, что нажата клавиша 1-5
      if (e.key >= "1" && e.key <= "5") {
        // Получаем номер камеры (0-4)
        const cameraIndex = parseInt(e.key) - 1

        // Получаем активный сектор
        const activeSector = timelineContext?.activeSector
        if (!activeSector) return

        // Получаем все дорожки с параллельными видео
        const parallelTracks = activeSector.tracks.filter(
          (track: any) => track.type === "parallel" || track.isParallel,
        )

        // Если нет параллельных дорожек, выходим
        if (parallelTracks.length === 0) return

        // Получаем дорожку по индексу (с циклическим переходом)
        const trackIndex = cameraIndex % parallelTracks.length
        const track = parallelTracks[trackIndex]

        // Если нет дорожки или видео, выходим
        if (!track || !track.videos || track.videos.length === 0) {
          console.log(`[Timeline] Нет видео на дорожке ${trackIndex + 1}`)
          return
        }

        // Получаем первое видео на дорожке
        const video = track.videos[0]

        // Если нет видео, выходим
        if (!video) return

        // Проверяем, содержит ли видео текущее время
        const videoStartTime = video.startTime || 0
        const videoDuration = video.duration || 0
        const videoEndTime = videoStartTime + videoDuration

        // Получаем текущее время воспроизведения
        const currentTime = displayTime || 0

        // Проверяем, находится ли текущее время в диапазоне видео
        // Для абсолютного времени (Unix timestamp) проверяем, что текущее время находится в диапазоне видео
        if (videoStartTime > 0 && currentTime > 0) {
          const isTimeInRange = currentTime >= videoStartTime && currentTime <= videoEndTime

          if (!isTimeInRange) {
            console.log(
              `[Timeline] Видео ${video.id} не содержит текущее время ${currentTime.toFixed(2)}. Диапазон видео: ${videoStartTime.toFixed(2)} - ${videoEndTime.toFixed(2)}`,
            )
            // Показываем сообщение пользователю через событие
            window.dispatchEvent(
              new CustomEvent("show-toast", {
                detail: {
                  message: `Видео на дорожке ${trackIndex + 1} не содержит текущий кадр`,
                  type: "warning",
                  duration: 3000,
                },
              }),
            )
            return
          }
        }

        console.log(`[Timeline] Переключение на камеру ${cameraIndex + 1}: ${video.id}`)

        // Устанавливаем флаг, что меняем камеру, но не скрываем бар
        // Вместо этого сохраняем его видимость и позицию
        setIsChangingCamera(true)

        // Используем уже полученное текущее время воспроизведения
        // Сохраняем текущую позицию бара, чтобы она не исчезала при переключении
        // Отправляем событие для сохранения позиции бара только для активного сектора
        window.dispatchEvent(
          new CustomEvent("preserve-bar-position", {
            detail: {
              position: currentTime, // Используем уже определенное currentTime
              videoId: video.id,
              sectorId: activeSector.id, // Добавляем ID сектора, чтобы обрабатывать событие только для нужного сектора
            },
          }),
        )

        // Сохраняем текущее время для сектора перед переключением камеры
        // Это предотвратит сброс времени сектора на 0
        if (timelineContext && activeSector.id) {
          // Получаем абсолютное время для сектора
          const absoluteTime = video.startTime ? video.startTime + currentTime : currentTime

          // Сохраняем время для сектора (только для активного сектора)
          timelineContext.setSectorTime(activeSector.id, absoluteTime, true)
          console.log(
            `[Timeline] Сохраняем абсолютное время ${absoluteTime.toFixed(2)} для сектора ${activeSector.id} перед переключением камеры`,
          )
        }

        // Устанавливаем активную дорожку
        setActiveTrack(track.id)

        // Устанавливаем активное видео
        setVideo(video)

        // Плавно обновляем отображаемое время для предотвращения скачков
        // Сначала сохраняем текущее время
        const prevDisplayTime = displayTime || 0

        // Вычисляем целевое время для новой камеры
        const targetDisplayTime = currentTime

        // Создаем анимацию для плавного перехода времени
        let startTime: number | null = null
        const duration = 200 // Длительность анимации в мс

        const animateTimeTransition = (timestamp: number) => {
          if (!startTime) startTime = timestamp
          const elapsed = timestamp - startTime
          const progress = Math.min(elapsed / duration, 1)

          // Используем функцию плавности для более естественного перехода
          const easeOutProgress = 1 - Math.pow(1 - progress, 2)

          // Вычисляем промежуточное значение времени
          const intermediateTime =
            prevDisplayTime + (targetDisplayTime - prevDisplayTime) * easeOutProgress

          // Используем локальную функцию setDisplayTime из хука useDisplayTime
          // Это обеспечит плавное обновление времени
          setDisplayTime(intermediateTime)

          // Продолжаем анимацию, если она не завершена
          if (progress < 1) {
            requestAnimationFrame(animateTimeTransition)
          } else {
            // Синхронизируем воспроизведение всех параллельных видео после завершения анимации
            syncParallelVideosPlayback(video.id, targetDisplayTime)

            // Сбрасываем флаг изменения камеры
            setIsChangingCamera(false)
          }
        }

        // Запускаем анимацию
        requestAnimationFrame(animateTimeTransition)
      }
    }

    // Добавляем обработчик события
    window.addEventListener("keydown", handleCameraSwitch)

    // Удаляем обработчик при размонтировании
    return () => {
      window.removeEventListener("keydown", handleCameraSwitch)
    }
  }, [
    timelineContext?.activeSector,
    setActiveTrack,
    setVideo,
    setIsChangingCamera,
    displayTime,
    syncParallelVideosPlayback,
    timelineContext,
  ])

  // Эффект для обработки нажатий клавиш
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Backspace" && activeTrackId) {
        const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
        setTracks(updatedTracks)
        return
      }

      const key = e.key.toLowerCase()
      if (key >= "1" && key <= "9") {
        const trackNumber = parseInt(key)
        const currentSection = sections.find((section) => section.date === activeDate)
        if (!currentSection) {
          console.log(`[Timeline] Не найдена активная секция для даты ${activeDate}`)
          return
        }

        const tracksInCurrentSection = currentSection.tracks
        const targetTrack = tracksInCurrentSection.find((track) => {
          const trackIndex = typeof track.index === "string" ? parseInt(track.index) : track.index
          return trackIndex === trackNumber
        })

        if (targetTrack) {
          console.log(
            `[Timeline] Нажата клавиша ${key}, выбран трек ${targetTrack.id} с индексом ${targetTrack.index} в текущей секции (${activeDate})`,
          )

          if (isRecording && activeTrackId) {
            const currentTrack = tracks.find((track) => track.id === activeTrackId)
            if (currentTrack) {
              // Останавливаем запись
              setIsRecording(false)

              setTimeout(() => {
                setActiveTrack(targetTrack.id)

                // Берем первое видео из трека, но сохраняем текущее время воспроизведения
                if (targetTrack.videos?.length) {
                  const firstVideo = targetTrack.videos[0]

                  // Получаем текущее время воспроизведения
                  const currentVideoTime = window.playerContext?.currentTime || 0
                  console.log(
                    `[Timeline] Сохраняем текущее время воспроизведения при записи: ${currentVideoTime}`,
                  )

                  // Устанавливаем видео
                  setVideo(firstVideo)

                  // Используем текущее время воспроизведения вместо начала видео
                  console.log(
                    `[Timeline] Устанавливаем сохраненное время при записи: ${currentVideoTime}`,
                  )
                  seek(currentVideoTime)

                  // Управляем громкостью и синхронизируем воспроизведение для всех параллельных видео
                  setTimeout(() => {
                    syncParallelVideosVolume(firstVideo.id)
                    syncParallelVideosPlayback(firstVideo.id, currentVideoTime)
                  }, 100)
                }

                // Возобновляем запись
                setIsRecording(true)
              }, 100)
              return
            }
          }

          setActiveTrack(targetTrack.id)

          // Берем первое видео из трека, но сохраняем текущее время воспроизведения
          if (targetTrack.videos?.length) {
            const firstVideo = targetTrack.videos[0]

            // Получаем текущее время воспроизведения из контекста
            const currentVideoTime = window.playerContext?.currentTime || 0
            console.log(`[Timeline] Сохраняем текущее время воспроизведения: ${currentVideoTime}`)

            // Устанавливаем видео
            setVideo(firstVideo)

            // Используем текущее время воспроизведения вместо начала видео
            console.log(`[Timeline] Устанавливаем сохраненное время: ${currentVideoTime}`)
            seek(currentVideoTime)

            // Управляем громкостью и синхронизируем воспроизведение для всех параллельных видео
            setTimeout(() => {
              syncParallelVideosVolume(firstVideo.id)
              syncParallelVideosPlayback(firstVideo.id, currentVideoTime)
            }, 100)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    activeTrackId,
    tracks,
    setTracks,
    setActiveTrack,
    setIsRecording,
    isPlaying,
    isRecording,
    currentTime,
    setVideo,
    seek,
    activeDate,
    sections,
  ])

  // Эффект для установки активной даты при первой загрузке
  React.useEffect(() => {
    if (sections.length > 0 && !activeDate) {
      const latestSection = sections[sections.length - 1]
      setActiveDate(latestSection.date)

      if (latestSection.tracks.length > 0) {
        const firstTrack = latestSection.tracks[0]
        if (firstTrack.videos?.length) {
          const firstVideo = firstTrack.videos[0]
          const videoStartTime = firstVideo.startTime || 0
          seek(videoStartTime)
        }
      }
    }
  }, [sections, setActiveDate, activeDate, seek])

  // Эффект для прокрутки к активному видео
  React.useEffect(() => {
    if (activeVideo) {
      const videoStartTime = activeVideo.startTime || 0
      // Используем формат ISO (YYYY-MM-DD) вместо toDateString()
      const videoDate = new Date(videoStartTime * 1000).toISOString().split("T")[0]
      // Отключаем логирование для уменьшения количества сообщений
      // console.log(
      //   `[Timeline] Устанавливаем активную дату: ${videoDate} для видео ${activeVideo.id}`,
      // )
      setActiveDate(videoDate)

      // Прокручиваем к активному видео при его изменении
      setTimeout(scrollToVisibleVideos, 100)
    }
  }, [activeVideo])

  // Эффект для обновления ширины контейнера
  React.useEffect(() => {
    const updateContainerWidth = () => {
      // Проверяем, что мы на клиенте (а не на сервере)
      if (typeof window !== "undefined") {
        // Используем ширину окна для расчетов
        setContainerWidth(window.innerWidth)
      }
    }

    // Обновляем ширину при монтировании
    updateContainerWidth()

    // Обновляем ширину при изменении размера окна
    window.addEventListener("resize", updateContainerWidth)

    // Обработчик события fit-to-screen
    const handleFitToScreenEvent = (event: CustomEvent) => {
      const { width } = event.detail
      console.log(`Received fit-to-screen event with width: ${width}`)

      // Используем переданную ширину
      if (width) {
        console.log(`Fitting to screen with width: ${width}px`)

        // Вычитаем ширину левой панели (200px)
        const contentWidth = width - 200

        fitToScreen(contentWidth)

        // Принудительно обновляем компонент для пересчета ширины контейнера
        setTimeout(() => {
          // Обновляем ширину контейнера, чтобы вызвать перерисовку
          if (typeof window !== "undefined") {
            setContainerWidth(window.innerWidth)
          }

          // Прокручиваем к видимой области с видео
          scrollToVisibleVideos()
        }, 100)
      }
    }

    // Добавляем обработчик события fit-to-screen
    window.addEventListener("fit-to-screen", handleFitToScreenEvent as EventListener)

    return () => {
      window.removeEventListener("resize", updateContainerWidth)
      window.removeEventListener("fit-to-screen", handleFitToScreenEvent as EventListener)
    }
  }, [])

  // Эффект для обновления ширины контейнера при изменении масштаба
  React.useEffect(() => {
    // Обновляем ширину контейнера при изменении масштаба
    // Используем небольшую задержку, чтобы DOM успел обновиться
    setTimeout(() => {
      if (typeof window !== "undefined") {
        setContainerWidth(window.innerWidth)
      }
    }, 10)
  }, [zoomLevel])

  // Эффект для обработки события sector-fit-to-screen, sector-zoom-change и activate-sector
  React.useEffect(() => {
    const handleSectorFitToScreen = (e: CustomEvent) => {
      const { sectorDate } = e.detail || {}
      if (sectorDate) {
        fitSectionToScreen(sectorDate)
      }
    }

    // Обработчик события sector-zoom-change
    const handleSectorZoomChange = (e: CustomEvent) => {
      const { sectorDate, zoomLevel: newZoomLevel } = e.detail || {}
      if (sectorDate && newZoomLevel) {
        console.log(`Changing zoom level for sector ${sectorDate} to ${newZoomLevel}`)
        // Обновляем масштаб для конкретного сектора
        setSectionZoomLevels((prev) => ({
          ...prev,
          [sectorDate]: newZoomLevel,
        }))

        // Принудительно обновляем компонент для пересчета ширины контейнера
        setTimeout(() => {
          if (typeof window !== "undefined") {
            setContainerWidth(window.innerWidth)
          }
        }, 100)
      }
    }

    // Обработчик события activate-sector
    const handleActivateSector = (e: CustomEvent) => {
      const { sectorDate, preserveOtherSectors } = e.detail || {}
      if (sectorDate) {
        console.log(
          `[Timeline] Активируем сектор ${sectorDate}, preserveOtherSectors=${preserveOtherSectors}`,
        )

        // Устанавливаем preferredSource в "timeline" при активации сектора
        if (typeof window !== "undefined" && window.playerContext) {
          console.log(
            `[Timeline] Устанавливаем preferredSource в "timeline" при активации сектора ${sectorDate}`,
          )
          window.playerContext.setPreferredSource("timeline")
        }

        // Сохраняем текущее состояние активного сектора перед переключением
        if (activeDate) {
          // Сохраняем текущее состояние в sectorTimes
          const currentSector = sections.find((s) => s.date === activeDate)
          if (currentSector) {
            console.log(`[Timeline] Сохраняем состояние сектора ${activeDate}`)

            // Если нужно сохранить состояние других секторов, отправляем событие
            if (preserveOtherSectors) {
              console.log(`[Timeline] Сохраняем состояние всех секторов`)

              // Отправляем событие для сохранения состояния всех секторов
              window.dispatchEvent(
                new CustomEvent("preserve-sectors-state", {
                  detail: {
                    currentSectorDate: activeDate,
                    newSectorDate: sectorDate,
                  },
                }),
              )
            }
          }
        }

        // Устанавливаем активный сектор
        setActiveDate(sectorDate)

        // Находим сектор по дате
        const sector = sections.find((s) => s.date === sectorDate)
        if (sector) {
          // Устанавливаем активный сектор в контексте таймлайна
          setActiveSector(sector.date) // Используем date как ID сектора
          console.log(`[Timeline] Установлен активный сектор в контексте: ${sector.date}`)

          // Если есть видео в секторе, устанавливаем первое видео из первого трека
          if (sector.tracks && sector.tracks.length > 0) {
            const firstTrack = sector.tracks[0]

            // Устанавливаем активный трек
            if (firstTrack && firstTrack.id) {
              setActiveTrack(firstTrack.id)

              // Если у трека есть видео, устанавливаем первое видео
              if (firstTrack.videos && firstTrack.videos.length > 0) {
                const firstVideo = firstTrack.videos[0]

                // Устанавливаем видео
                if (firstVideo) {
                  setVideo(firstVideo)
                  console.log(
                    `[Timeline] Установлен активный трек ${firstTrack.id} и видео ${firstVideo.id}`,
                  )
                }
              }
            }
          }
        }
      }
    }

    window.addEventListener("sector-fit-to-screen", handleSectorFitToScreen as EventListener)
    window.addEventListener("sector-zoom-change", handleSectorZoomChange as EventListener)
    window.addEventListener("activate-sector", handleActivateSector as EventListener)

    return () => {
      window.removeEventListener("sector-fit-to-screen", handleSectorFitToScreen as EventListener)
      window.removeEventListener("sector-zoom-change", handleSectorZoomChange as EventListener)
      window.removeEventListener("activate-sector", handleActivateSector as EventListener)
    }
  }, [sections, setActiveDate, setActiveTrack, setVideo, fitSectionToScreen, activeDate])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="timeline-container flex-1 overflow-hidden" ref={timelineContainerRef}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Левая панель - Ресурсы */}
          <ResizablePanel defaultSize={15} minSize={5} maxSize={30}>
            <TimelineResources />
          </ResizablePanel>

          <ResizableHandle />

          {/* Средняя панель (основная часть) */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="flex h-full w-full flex-col">
              {/* Фиксированная верхняя панель */}
              <div className="flex-shrink-0">
                <TimelineTopPanel
                  tracks={[]}
                  deleteTrack={() => {}}
                  cutTrack={() => {}}
                  handleScaleDecrease={() => {}}
                  handleScaleIncrease={() => {}}
                  handleSliderChange={() => {}}
                  sliderValue={50}
                  maxScale={200}
                />
                <div className="min-h-[50px] flex-shrink-0 border-b">
                  <div className="h-full p-4">{/* Скомбинированная дорожка */}</div>
                </div>
              </div>

              {/* Основная часть - скроллируемая область с секторами и нижней панелью */}
              <div className="w-full flex-grow overflow-y-auto">
                <div className="min-h-full">
                  {sections
                    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((sector, index) => {
                      // Находим минимальное время начала видео в секторе
                      const minStartTime = Math.min(
                        ...sector.tracks.flatMap((t) =>
                          (t.videos || []).map((v) => v.startTime || 0),
                        ),
                        sector.startTime, // Используем startTime сектора как запасной вариант
                      )

                      // Для каждого трека находим максимальное время окончания видео
                      const trackEndTimes = sector.tracks.map((t) => {
                        if (!t.videos || t.videos.length === 0) return 0
                        return Math.max(
                          ...t.videos.map((v) => (v.startTime || 0) + (v.duration || 0)),
                        )
                      })

                      // Находим максимальное время окончания среди всех треков
                      const maxEndTime = Math.max(
                        ...trackEndTimes,
                        sector.endTime, // Используем endTime сектора как запасной вариант
                      )

                      // Константа для расчета высоты
                      const TRACK_HEIGHT = 75 // высота одной дорожки в пикселях

                      return (
                        <div key={index} className="relative mb-4 flex-shrink-0">
                          {/* Заголовок секции и элементы управления - фиксированные */}
                          <SectionHeader
                            date={sector.date}
                            formattedDate={formatSectionDate(sector.date)}
                            onFitToScreen={fitSectionToScreen}
                            minScale={0.005}
                            maxScale={200}
                          />

                          {/* Общий контейнер со скроллом для шкалы и треков */}
                          <div
                            className=""
                            ref={(el) => {
                              // Сохраняем ссылку на контейнер скролла
                              if (sector.date === activeDate) {
                                scrollContainerRef.current = el
                              }
                              // Для совместимости также сохраняем первый сектор
                              if (index === 0 && !scrollContainerRef.current) {
                                scrollContainerRef.current = el
                              }
                            }}
                            style={{
                              position: "relative",
                            }}
                          >
                            <div className="w-full">
                              {/* Шкала времени - скроллится вместе с дорожками */}
                              <TimelineScale
                                startTime={sector.startTime}
                                endTime={sector.endTime}
                                duration={sector.endTime - sector.startTime}
                                sectorDate={sector.date}
                                sectorZoomLevel={sectionZoomLevels[sector.date]}
                              />

                              {/* Контейнер для дорожек */}
                              <div
                                className="relative"
                                style={{
                                  height: `${sector.tracks.length * TRACK_HEIGHT}px`,
                                }}
                              >
                                {/* TimelineBar поверх всех дорожек */}
                                <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0">
                                  <TimelineBar
                                    startTime={minStartTime}
                                    endTime={maxEndTime}
                                    height={sector.tracks.length * TRACK_HEIGHT + 33 + 15}
                                    sectionStartTime={minStartTime}
                                    sectionDuration={maxEndTime - minStartTime}
                                    isActive={sector.date === activeDate} // Передаем флаг активного сектора
                                  />
                                </div>

                                {/* Дорожки */}
                                <div className="flex w-full flex-col">
                                  {sector.tracks.map((track: Track, trackIndex: number) => {
                                    // Рассчитываем координаты для VideoTrack
                                    const trackStartTime = track.startTime || 0

                                    // Рассчитываем координаты для каждого видео
                                    const videoCoordinates: Record<
                                      string,
                                      { left: number; width: number }
                                    > = {}

                                    // Находим минимальное время начала видео в секторе
                                    const minStartTime = Math.min(
                                      ...sector.tracks.flatMap((t) =>
                                        (t.videos || []).map((v) => v.startTime || 0),
                                      ),
                                      sector.startTime, // Используем startTime сектора как запасной вариант
                                    )

                                    // Находим максимальное время окончания видео в секторе
                                    const maxEndTime = Math.max(
                                      ...sector.tracks.flatMap((t) =>
                                        (t.videos || []).map(
                                          (v) => (v.startTime || 0) + (v.duration || 0),
                                        ),
                                      ),
                                      sector.endTime, // Используем endTime сектора как запасной вариант
                                    )

                                    // Общая длительность секции уже рассчитана выше

                                    // Для каждого трека находим минимальное время начала видео
                                    const trackMinStartTime =
                                      track.videos && track.videos.length > 0
                                        ? Math.min(...track.videos.map((v) => v.startTime || 0))
                                        : trackStartTime

                                    // Для каждого трека находим максимальное время окончания видео
                                    const trackMaxEndTime: number =
                                      track.videos && track.videos.length > 0
                                        ? Math.max(
                                          ...track.videos.map(
                                            (v) => (v.startTime || 0) + (v.duration || 0),
                                          ),
                                        )
                                        : trackStartTime

                                    // Рассчитываем координаты трека
                                    // Используем масштаб сектора, если он задан, иначе используем общий масштаб
                                    const sectorZoomLevel =
                                      sectionZoomLevels[sector.date] || zoomLevel

                                    // Рассчитываем относительные координаты в процентах
                                    // Позиция трека относительно начала секции
                                    const trackRelativeStart = trackMinStartTime - minStartTime
                                    // Длительность трека
                                    const trackDuration = trackMaxEndTime - trackMinStartTime
                                    // Общая длительность секции
                                    const sectionTotalDuration = maxEndTime - minStartTime

                                    // Координаты в процентах от общей ширины
                                    const coordinates = {
                                      left: (trackRelativeStart / sectionTotalDuration) * 100,
                                      width: (trackDuration / sectionTotalDuration) * 100,
                                      videos: videoCoordinates,
                                    }

                                    return (
                                      <VideoTrack
                                        key={track.id || trackIndex}
                                        track={track}
                                        index={trackIndex}
                                        sectionStartTime={minStartTime} // Используем минимальное время начала видео в секторе
                                        sectionDuration={maxEndTime - minStartTime} // Используем общую длительность секции
                                        coordinates={coordinates}
                                        sectorZoomLevel={sectorZoomLevel}
                                      />
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Правая панель (20% ширины) - Чат */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40} className="flex-shrink-0">
            <TimelineChat />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("timeline.section.delete")}</DialogTitle>
            <DialogDescription>
              {t("timeline.section.deleteConfirmation", {
                section: deletingSectionDate ? formatSectionDate(deletingSectionDate) : "",
                defaultValue: `Are you sure you want to delete the section {{section}}? This action cannot be undone.`,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSection}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
