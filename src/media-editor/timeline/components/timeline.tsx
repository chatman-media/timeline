import { MoveHorizontal, Trash2 } from "lucide-react"
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
import { formatDateByLanguage } from "@/i18n/constants"
import { TimelineTopPanel } from "@/media-editor"
import { usePlayerContext } from "@/media-editor/media-player"
import { useTimeline } from "@/media-editor/timeline/services"
import { MediaFile, Track } from "@/types/media"

import { TimelineBar } from "./layout/timeline-bar"
import { TimelineControls } from "./layout/timeline-controls"
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
          addYearSuffix: currentLanguage === "ru",
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
    setTracks,
    removeFiles,
    zoomLevel,
    zoom,
    fitToScreen,
  } = context

  // Состояние для редактирования названия трека
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingTrackName, setEditingTrackName] = useState<string>("")

  // Состояние для хранения масштаба каждой секции
  const [sectionZoomLevels, setSectionZoomLevels] = useState<Record<string, number>>({})

  // Отображаем треки и видео на таймлайне
  const { isRecording, setIsRecording, setVideo, video, currentTime, isPlaying } =
    usePlayerContext()
  const activeVideo = video

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
    if (!tracks || tracks.length === 0) {
      console.log("No tracks available for sections")
      return []
    }

    console.log(
      "Creating sections from tracks:",
      tracks.map((t) => ({
        name: t.name,
        videosCount: t.videos?.length || 0,
      })),
    )

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
      console.log(`Processing track ${track.name} with ${track.videos?.length || 0} videos`)

      track.videos?.forEach((video) => {
        const videoStart = video.startTime || 0
        const videoEnd = videoStart + (video.duration || 0)
        const date = new Date(videoStart * 1000).toISOString().split("T")[0]

        console.log(`Video ${video.name}: date=${date}, start=${videoStart}, end=${videoEnd}`)

        if (!videosByDay.has(date)) {
          console.log(`Creating new day entry for date ${date}`)
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
          console.log(`Adding track ${track.name} to day ${date}`)
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

    console.log(
      "Created sections:",
      result.map((s) => ({
        date: s.date,
        tracksCount: s.tracks.length,
        tracks: s.tracks.map((t) => t.name),
      })),
    )

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

                // Всегда берем первое видео из трека и устанавливаем время на его начало
                if (targetTrack.videos?.length) {
                  const firstVideo = targetTrack.videos[0]
                  setVideo(firstVideo)
                  const videoStartTime = firstVideo.startTime ?? 0
                  console.log(
                    `[Timeline] Устанавливаем время на начало видео при записи: ${videoStartTime}`,
                  )
                  seek(videoStartTime)
                }

                // Возобновляем запись
                setIsRecording(true)
              }, 100)
              return
            }
          }

          setActiveTrack(targetTrack.id)

          // Всегда берем первое видео из трека и устанавливаем время на его начало
          if (targetTrack.videos?.length) {
            const firstVideo = targetTrack.videos[0]
            setVideo(firstVideo)
            const videoStartTime = firstVideo.startTime ?? 0
            console.log(`[Timeline] Устанавливаем время на начало видео: ${videoStartTime}`)
            seek(videoStartTime)
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
      console.log(
        `[Timeline] Устанавливаем активную дату: ${videoDate} для видео ${activeVideo.id}`,
      )
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

  // Эффект для обработки события sector-fit-to-screen и sector-zoom-change
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

    window.addEventListener("sector-fit-to-screen", handleSectorFitToScreen as EventListener)
    window.addEventListener("sector-zoom-change", handleSectorZoomChange as EventListener)

    return () => {
      window.removeEventListener("sector-fit-to-screen", handleSectorFitToScreen as EventListener)
      window.removeEventListener("sector-zoom-change", handleSectorZoomChange as EventListener)
    }
  }, [sections])

  return (
    <div className="flex h-full w-full flex-col">
      <TimelineTopPanel
        tracks={tracks}
        deleteTrack={() => {}}
        cutTrack={() => {}}
        handleScaleDecrease={handleScaleDecrease}
        handleScaleIncrease={handleScaleIncrease}
        handleSliderChange={handleSliderChange}
        sliderValue={
          // Обратное преобразование из zoomLevel в значение слайдера (0-100)
          // Используем ту же логарифмическую шкалу
          (() => {
            const minZoom = 0.005
            const maxZoom = 200
            const logMin = Math.log(minZoom)
            const logMax = Math.log(maxZoom)
            const scale = (logMax - logMin) / 100
            return Math.max(0, Math.min(100, (Math.log(zoomLevel) - logMin) / scale))
          })()
        }
        maxScale={20000} // Увеличиваем максимальное значение слайдера
        isAbleToScale={true}
        isAbleToScaleUp={zoomLevel < 200} // Максимальное приближение
        isAbleToScaleDown={zoomLevel > 0.005} // Минимальное отдаление
        isAbleToFitToTracks={true}
      />

      {/* Скроллируемый контент с разделением на левую и правую части */}
      <div className="timeline-container flex-1 overflow-y-auto" ref={timelineContainerRef}>
        <div className="flex h-full w-full overflow-x-hidden">
          {/* Правая часть - каждый сектор имеет свой собственный скролл */}
          <div
            className="flex h-full w-full flex-col"
            style={{
              height: `${sections?.reduce(
                (acc, sector) => acc + 31 + 30 + sector.tracks.length * 72, // PADDING + SCALE_HEIGHT + tracks
                0,
              )}px`,
            }}
          >
            <div className="h-full w-full flex-1">
              {sections?.map((sector, index) => {
                // Находим минимальное время начала видео в секторе
                const minStartTime = Math.min(
                  ...sector.tracks.flatMap((t) => (t.videos || []).map((v) => v.startTime || 0)),
                  sector.startTime, // Используем startTime сектора как запасной вариант
                )

                // Для каждого трека находим максимальное время окончания видео
                const trackEndTimes = sector.tracks.map((t) => {
                  if (!t.videos || t.videos.length === 0) return 0
                  return Math.max(...t.videos.map((v) => (v.startTime || 0) + (v.duration || 0)))
                })

                // Находим максимальное время окончания среди всех треков
                const maxEndTime = Math.max(
                  ...trackEndTimes,
                  sector.endTime, // Используем endTime сектора как запасной вариант
                )

                // Общая длительность секции
                // const sectionTotalDuration = maxEndTime - minStartTime

                // Константы для расчета высоты
                const TRACK_HEIGHT = 72 // высота одной дорожки в пикселях
                const SCALE_HEIGHT = 30 // высота шкалы времени
                const PADDING = 31 // дополнительная высота (отступы и т.д.)

                // Расчет общей высоты сектора
                const sectorHeight = PADDING + SCALE_HEIGHT + sector.tracks.length * TRACK_HEIGHT

                return (
                  <div
                    key={index}
                    className="relative mb-4 flex-shrink-0"
                    style={{
                      width: "100%",
                      height: `${sectorHeight}px`,
                    }}
                  >
                    {/* Шкала времени - фиксированная, не скроллится */}
                    <div
                      className="sticky top-0 right-0 left-0 h-[30px] w-full flex-shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      style={{ zIndex: 300 }}
                    >
                      <div className="flex items-center justify-between">
                        <TimelineScale
                          startTime={sector.startTime}
                          endTime={sector.endTime}
                          duration={sector.endTime - sector.startTime}
                          sectorDate={sector.date}
                          sectorZoomLevel={sectionZoomLevels[sector.date]}
                        />

                        {/* Элементы управления масштабом для сектора */}
                        <div className="mr-2 ml-2 flex items-center gap-2" style={{ zIndex: 300 }}>
                          {/* Двунаправленная стрелка */}
                          <button
                            onClick={() => fitSectionToScreen(sector.date)}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm hover:bg-[#dddbdd] dark:hover:bg-[#45444b]"
                            title={t("timeline.toolbar.fitToScreen")}
                          >
                            <MoveHorizontal size={14} />
                          </button>

                          <TimelineControls
                            minScale={0.005}
                            maxScale={200}
                            sectorDate={sector.date}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Контейнер со скроллом только для треков */}
                    <div
                      className="overflow-x-auto"
                      ref={(el) => {
                        // Сохраняем ссылку на первый сектор для совместимости
                        if (index === 0) scrollContainerRef.current = el
                      }}
                    >
                      <div
                        className="relative"
                        style={{
                          width: `${Math.max(1000, (maxEndTime - minStartTime) * 2 * (sectionZoomLevels[sector.date] || zoomLevel))}px`,
                          height: "100%",
                        }}
                      >
                        {/* TimelineBar поверх всех дорожек */}
                        <div
                          className="pointer-events-none absolute top-0 right-0 bottom-0 left-0"
                          style={{ zIndex: 1000 }}
                        >
                          <TimelineBar
                            startTime={minStartTime}
                            endTime={maxEndTime}
                            height={sectorHeight - SCALE_HEIGHT - PADDING}
                            sectionStartTime={minStartTime}
                            sectionDuration={maxEndTime - minStartTime}
                            isActive={sector.date === activeDate} // Передаем флаг активного сектора
                          />
                        </div>

                        {/* Дорожки */}
                        <div className="flex w-full flex-col gap-1 pl-[10px]">
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
                                (t.videos || []).map((v) => (v.startTime || 0) + (v.duration || 0)),
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
                            const sectorZoomLevel = sectionZoomLevels[sector.date] || zoomLevel

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
                )
              })}
            </div>
          </div>
        </div>
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
