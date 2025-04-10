import { Redo2, Scissors, Trash2, Undo2, X } from "lucide-react"
import React, { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRootStore } from "@/hooks/use-root-store"
import { rootStore } from "@/stores/root-store"
import { MediaFile, Track } from "@/types/videos"

import { TimelineBar } from "./timeline/timeline-bar"
import { TimelineControls } from "./timeline/timeline-controls"
import { TimelineScale } from "./timeline/timeline-scale"
import { VideoTrack } from "./track/video-track"

// Добавляю функцию для форматирования даты секции
function formatSectionDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Неверный формат даты"

    // Форматируем дату как "31 марта 25 г." (как на скриншоте)
    const day = date.getDate()

    // Месяцы на русском
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ]
    const month = months[date.getMonth()]

    // Год (последние 2 цифры)
    const year = date.getFullYear().toString().slice(-2)

    return `${day} ${month} ${year} г.`
  } catch (e) {
    console.error("Error formatting section date:", e)
    return "Ошибка форматирования даты"
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
    removeFromAddedFiles,
  } = useRootStore()
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [deletingSectionDate, setDeletingSectionDate] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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

  // Обработчик нажатия клавиш - перемещен сюда после определения sections
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

      // Если это число от 1 до 9, то пытаемся найти трек с соответствующим индексом
      if (key >= "1" && key <= "9") {
        const trackNumber = parseInt(key)

        // Получаем текущую активную секцию (день)
        const currentSection = sections.find((section) => section.date === activeDate)
        if (!currentSection) {
          console.log(`[Timeline] Не найдена активная секция для даты ${activeDate}`)
          return
        }

        // Ищем трек только среди треков текущей секции
        const tracksInCurrentSection = currentSection.tracks

        // Найдем трек по номеру среди треков только этой секции
        const targetTrack = tracksInCurrentSection.find((track) => {
          const trackIndex = typeof track.index === "string" ? parseInt(track.index) : track.index
          return trackIndex === trackNumber
        })

        if (targetTrack) {
          console.log(
            `[Timeline] Нажата клавиша ${key}, выбран трек ${targetTrack.id} с индексом ${targetTrack.index} в текущей секции (${activeDate})`,
          )

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
              // Сохраняем текущее время при переключении дорожек
              updateTime(currentTime)
            }
          } else {
            // Если воспроизведение не идет, берем первое видео трека
            if (targetTrack.videos.length > 0) {
              const firstVideo = targetTrack.videos[0]
              setActiveVideo(firstVideo.id)

              // Сохраняем текущую позицию, а не прыгаем на начало видео
              // Это предотвратит прыжки между секциями
              updateTime(currentTime)
            }
          }

          // Обновляем макет, сохраняя текущий тип и добавляя новую дорожку
          const newLayout = {
            ...currentLayout,
            activeTracks: [targetTrack.id],
          }
          rootStore.send({ type: "setScreenLayout", layout: newLayout })
        } else {
          console.log(
            `[Timeline] Трек с индексом ${trackNumber} не найден в текущей секции (${activeDate})`,
          )
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
    activeDate,
    sections, // Добавляем зависимость от sections и activeDate
  ])

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

  // Функция для удаления секции
  const handleDeleteSection = (sectionDate: string) => {
    setDeletingSectionDate(sectionDate)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSection = () => {
    if (!deletingSectionDate) return

    // Проверим, удаляем ли мы активную секцию
    const isDeletingActiveSection = deletingSectionDate === activeDate
    const wasActiveTrackInDeletedSection = tracks.find(
      (track) =>
        track.id === activeTrackId &&
        track.videos.some((video) => {
          const videoStart = video.startTime || 0
          return new Date(videoStart * 1000).toDateString() === deletingSectionDate
        }),
    )

    // Найдем все пути к файлам для удаления из addedFiles
    const filesToRemove: string[] = []

    tracks.forEach((track) => {
      track.videos.forEach((video) => {
        const videoStart = video.startTime || 0
        if (new Date(videoStart * 1000).toDateString() === deletingSectionDate && video.path) {
          filesToRemove.push(video.path)
        }
      })
    })

    // Обновляем треки, удаляя видео с указанной датой
    const updatedTracks = tracks
      .map((track) => {
        // Фильтруем видео, оставляя только те, которые не относятся к удаляемой дате
        const filteredVideos = track.videos.filter((video) => {
          const videoStart = video.startTime || 0
          return new Date(videoStart * 1000).toDateString() !== deletingSectionDate
        })

        return {
          ...track,
          videos: filteredVideos,
        }
      })
      .filter((track) => track.videos.length > 0) // Удаляем треки, у которых не осталось видео

    // Обновляем треки в хранилище
    setTracks(updatedTracks)

    // Удаляем файлы из множества addedFiles, чтобы их можно было заново добавить
    if (filesToRemove.length > 0) {
      removeFromAddedFiles(filesToRemove)
    }

    // Обрабатываем переключение на другую секцию, если удалили активную
    if (isDeletingActiveSection || wasActiveTrackInDeletedSection) {
      const remainingSections = sections.filter((s) => s.date !== deletingSectionDate)

      if (remainingSections.length > 0) {
        // Находим "соседнюю" секцию для переключения
        let nextActiveSection
        const deletedSectionIndex = sections.findIndex((s) => s.date === deletingSectionDate)

        // Пробуем взять следующую секцию, если нет - берем предыдущую
        if (deletedSectionIndex < sections.length - 1) {
          nextActiveSection = sections[deletedSectionIndex + 1]
        } else if (deletedSectionIndex > 0) {
          nextActiveSection = sections[deletedSectionIndex - 1]
        } else {
          nextActiveSection = remainingSections[0]
        }

        if (nextActiveSection) {
          setActiveDate(nextActiveSection.date)

          // Находим первый доступный трек в этой секции
          const nextSectionTracks = updatedTracks.filter((track) =>
            track.videos.some((video) => {
              const videoStart = video.startTime || 0
              return new Date(videoStart * 1000).toDateString() === nextActiveSection.date
            }),
          )

          if (nextSectionTracks.length > 0) {
            setActiveTrack(nextSectionTracks[0].id)

            // Если есть первое видео, устанавливаем его как активное
            if (nextSectionTracks[0].videos.length > 0) {
              setActiveVideo(nextSectionTracks[0].videos[0].id)
              // Обновляем текущее время на начало видео
              const startTime = nextSectionTracks[0].videos[0].startTime || 0
              updateTime(startTime, "user")
            }
          }
        }
      } else {
        // Если секций не осталось, сбрасываем активную дату и трек
        setActiveDate(null)
        setActiveTrack("")
      }
    }

    // Закрываем диалог
    setDeleteDialogOpen(false)
    setDeletingSectionDate(null)
  }

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
              // Найдем активную дорожку
              const trackToDelete = tracks.find((track) => track.id === activeTrackId)
              if (!trackToDelete) return

              // Соберем все пути к файлам в этой дорожке для удаления из addedFiles
              const filesToRemove: string[] = []
              trackToDelete.videos.forEach((video) => {
                if (video.path) {
                  filesToRemove.push(video.path)
                }
              })

              // Удаляем дорожку
              const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
              setTracks(updatedTracks)

              // Удаляем файлы из множества addedFiles, чтобы их можно было заново добавить
              if (filesToRemove.length > 0) {
                removeFromAddedFiles(filesToRemove)
              }
            }}
            className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <button
            disabled={!activeTrackId}
            onClick={() => {
              // Найдем активную дорожку
              const trackToDelete = tracks.find((track) => track.id === activeTrackId)
              if (!trackToDelete) return

              // Соберем все пути к файлам в этой дорожке для удаления из addedFiles
              const filesToRemove: string[] = []
              trackToDelete.videos.forEach((video) => {
                if (video.path) {
                  filesToRemove.push(video.path)
                }
              })

              // Удаляем дорожку
              const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
              setTracks(updatedTracks)

              // Удаляем файлы из множества addedFiles, чтобы их можно было заново добавить
              if (filesToRemove.length > 0) {
                removeFromAddedFiles(filesToRemove)
              }
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
            className={`relative mb-4 ${section.date === activeDate ? "" : "opacity-50"} timeline-section`}
          >
            <div className="relative">
              <div className="w-full text-left text-xs mb-1 ml-2 flex items-center justify-between">
                <div>{formatSectionDate(section.date)}</div>
                <button
                  onClick={() => handleDeleteSection(section.date)}
                  className="mr-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Удалить секцию"
                >
                  <X className="h-4 w-4" />
                </button>
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
                        index: Number(track.index),
                      }}
                      index={index}
                      sectionStartTime={section.startTime}
                      sectionDuration={section.duration}
                    />
                  </div>
                ))}
              </div>
              <div style={{ position: "relative", zIndex: 10 }}>
                <TimelineBar
                  startTime={section.startTime}
                  endTime={section.endTime}
                  height={section.tracks.length * 85 + 46}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно подтверждения удаления секции */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Удаление секции</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить секцию{" "}
              {deletingSectionDate ? formatSectionDate(deletingSectionDate) : ""}? Это действие
              нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSection}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
