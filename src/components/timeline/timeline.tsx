import { Redo2, Scissors, Split, Trash2, Undo2 } from "lucide-react"
import React, { useMemo, useState } from "react"

import { useRootStore } from "@/hooks/use-root-store"
import { rootStore } from "@/stores/root-store"
import { TimeRange } from "@/types/time-range"
import { MediaFile, Track } from "@/types/videos"

import { TimelineBar } from "./timeline/timeline-bar"
import { TimelineControls } from "./timeline/timeline-controls"
import { TimelineScale } from "./timeline/timeline-scale"
import { VideoTrack } from "./track/video-track"

// Добавим функцию для форматирования даты из ISO строки в удобный вид
function formatCreationDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return "Неверный формат даты";
    
    // Форматируем дату как "31 марта 25 г." (как на скриншоте)
    const day = date.getDate();
    
    // Месяцы на русском
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const month = months[date.getMonth()];
    
    // Год (последние 2 цифры)
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day} ${month} ${year} г.`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Ошибка форматирования даты";
  }
}

// Добавляю функцию для форматирования даты секции
function formatSectionDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Неверный формат даты";
    
    // Форматируем дату как "31 марта 25 г." (как на скриншоте)
    const day = date.getDate();
    
    // Месяцы на русском
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const month = months[date.getMonth()];
    
    // Год (последние 2 цифры)
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day} ${month} ${year} г.`;
  } catch (e) {
    console.error("Error formatting section date:", e);
    return "Ошибка форматирования даты";
  }
}

export function Timeline() {
  const {
    tracks,
    activeVideo,
    setCurrentTime: updateTime,
    scale,
    setScale,
    setTracks,
    activeTrackId,
    undo,
    redo,
    canUndo,
    canRedo,
    setActiveTrack,
    isPlaying,
    setIsPlaying,
    isRecordingSchema,
    currentTime,
    setActiveVideo,
    currentLayout,
  } = useRootStore()
  const [activeDate, setActiveDate] = useState<string | null>(null)

  // Обработчик нажатия клавиш
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Удаление трека
      if (e.key === "Backspace" && activeTrackId) {
        const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
        setTracks(updatedTracks)
        return
      }

      // Переключение дорожек
      const key = e.key.toLowerCase()
      const isVideoTrack = key.startsWith("v")
      const trackNumber = isVideoTrack ? parseInt(key.slice(1)) : parseInt(key)

      if (
        (isVideoTrack && trackNumber >= 1 && trackNumber <= 9) ||
        (!isVideoTrack && trackNumber >= 1 && trackNumber <= 9)
      ) {
        const targetTrack = tracks.find((track) => track.index === trackNumber - 1)
        if (targetTrack) {
          // Если идет запись, останавливаем её на текущей дорожке
          if (isRecordingSchema && activeTrackId) {
            const currentTrack = tracks.find((track) => track.id === activeTrackId)
            if (currentTrack) {
              // Останавливаем запись на текущей дорожке
              rootStore.send({ type: "stopRecordingSchema" })

              // Начинаем запись на новой дорожке
              setTimeout(() => {
                rootStore.send({
                  type: "startRecordingSchema",
                  trackId: targetTrack.id,
                  startTime: currentTime,
                })
              }, 50)
            }
          }

          // Переключаемся на новую дорожку
          setActiveTrack(targetTrack.id)

          // Если идет воспроизведение, сохраняем текущее время
          if (isPlaying) {
            const video = targetTrack.videos.find((v) => {
              const startTime = v.startTime ?? 0
              const duration = v.duration ?? 0
              return startTime <= currentTime && startTime + duration >= currentTime
            })

            if (video) {
              setActiveVideo(video.id)
              updateTime(currentTime)
            }
          }

          // Обновляем макет, сохраняя текущий тип и добавляя новую дорожку
          const newLayout = {
            ...currentLayout,
            activeTracks: [targetTrack.id],
          }
          rootStore.send({ type: "setScreenLayout", layout: newLayout })
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
    isPlaying,
    isRecordingSchema,
    currentTime,
    setActiveVideo,
    updateTime,
    currentLayout,
  ])

  const sections = useMemo(() => {
    if (!tracks || tracks.length === 0) return []

    // Создаем мапу для группировки видео по дням
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
      track.videos.forEach((video) => {
        const videoStart = video.startTime || 0
        const videoEnd = videoStart + (video.duration || 0)
        const date = new Date(videoStart * 1000).toDateString()

        if (!videosByDay.has(date)) {
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
          dayData.tracks.push(track)
        }
        dayData.startTime = Math.min(dayData.startTime, videoStart)
        dayData.endTime = Math.max(dayData.endTime, videoEnd)
      })
    })

    // Преобразуем мапу в массив секций
    return Array.from(videosByDay.entries())
      .map(([date, data]) => ({
        date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.endTime - data.startTime,
        tracks: data.tracks.map((track) => ({
          ...track,
          videos: track.videos.filter((video) => {
            const videoStart = video.startTime || 0
            return new Date(videoStart * 1000).toDateString() === date
          }),
        })),
      }))
      .sort((a, b) => a.startTime - b.startTime)
  }, [tracks])

  // Set initial active section when sections change
  React.useEffect(() => {
    if (sections.length > 0 && !activeDate) {
      const latestSection = sections[sections.length - 1]
      setActiveDate(latestSection.date)

      // Устанавливаем время на первый кадр первой дорожки
      if (latestSection.tracks.length > 0) {
        const firstTrack = latestSection.tracks[0]
        if (firstTrack.videos.length > 0) {
          const firstVideo = firstTrack.videos[0]
          const videoStartTime = firstVideo.startTime || 0
          updateTime(videoStartTime)
        }
      }
    }
  }, [sections])

  // Update active section when active video changes
  React.useEffect(() => {
    if (activeVideo) {
      const videoStartTime = activeVideo.startTime || 0
      const videoDate = new Date(videoStartTime * 1000).toDateString()
      setActiveDate(videoDate)
    }
  }, [activeVideo])

  return (
    <div className="relative w-full h-[calc(50vh-4px)] min-h-[calc(50vh-4px)] overflow-x-auto overflow-y-auto bg-muted/50 dark:bg-[#1a1a1a]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Отменить"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Повторить"
          >
            <Redo2 size={16} />
          </button>
          <button
            disabled={!activeTrackId}
            onClick={() => {
              const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
              setTracks(updatedTracks)
            }}
            className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <button
            disabled={!activeTrackId}
            onClick={() => {
              const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
              setTracks(updatedTracks)
            }}
            className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <Scissors size={16} className="rotate-90" />
          </button>
        </div>
        <TimelineControls scale={scale} setScale={setScale} />
      </div>
      <div className="relative w-full min-h-full pt-[2px]" style={{ minWidth: "100%" }}>
        {[...sections].reverse().map((section) => (
          <div
            key={section.date}
            className={`relative mb-4 ${section.date === activeDate ? "" : "opacity-50"}`}
          >
            <div className="relative">
              <div className="w-full text-center text-xs text-[#8E8E8E] mb-1">
                {formatSectionDate(section.date)}
              </div>
              <TimelineScale
                startTime={section.startTime}
                endTime={section.endTime}
                duration={section.duration}
                scale={scale}
              />
              <div className="relative border-t border-gray-700/50">
                {section.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="relative border-b border-gray-700/50 h-21"
                    style={{
                      marginTop: index === 0 ? 0 : "1px",
                      // paddingBottom: "1px",
                    }}
                  >
                    <VideoTrack
                      track={{
                        ...track,
                        index: Number(track.index)
                      }}
                      index={index}
                      sectionStartTime={section.startTime}
                      sectionDuration={section.duration}
                    />
                  </div>
                ))}
              </div>
              <TimelineBar
                startTime={section.startTime}
                endTime={section.endTime}
                height={section.tracks.length * 85 + 46}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
