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
import { usePlayerContext } from "@/providers"
import { useTimelineContext } from "@/providers/timeline-provider"
import { MediaFile, Track } from "@/types/media"

import { TimelineBar } from "./layout/timeline-bar"
import { TimelineControls } from "./layout/timeline-controls"
import { TimelineScale } from "./timeline-scale/timeline-scale"
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
  const context = useTimelineContext()
  if (!context) {
    throw new Error("Timeline must be used within a TimelineProvider")
  }

  const {
    tracks,
    setTracks,
    undo,
    redo,
    canUndo,
    canRedo,
    activeTrackId,
    seek,
    setTrack,
    removeFiles,
  } = context

  const { isRecording, setIsRecording, setVideo, video, currentTime, isPlaying } =
    usePlayerContext()
  const activeVideo = video

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

    return Array.from(videosByDay.entries()).map(([date, data]) => ({
      date,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.endTime - data.startTime,
      tracks: data.tracks,
    }))
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
          if (isRecording && activeTrackId) {
            const currentTrack = tracks.find((track) => track.id === activeTrackId)
            if (currentTrack) {
              // Сохраняем текущее время перед остановкой
              const savedCurrentTime = currentTime
              console.log(
                `[Timeline] Сохраняем текущее время перед переключением: ${savedCurrentTime.toFixed(3)}`,
              )

              // Останавливаем запись на текущей дорожке
              setIsRecording(false)

              // Начинаем запись на новой дорожке
              setTimeout(() => {
                // Устанавливаем активный трек и активное видео сразу после остановки
                setTrack(targetTrack.id)

                // Найдем подходящее видео в новом треке для текущего времени
                const video = targetTrack.videos.find((v) => {
                  const startTime = v.startTime ?? 0
                  const duration = v.duration ?? 0
                  return startTime <= savedCurrentTime && startTime + duration >= savedCurrentTime
                })

                if (video) {
                  setVideo(video)
                } else if (targetTrack.videos.length > 0) {
                  // Если нет видео, соответствующего текущему времени, используем первое
                  setVideo(targetTrack.videos[0])
                }

                // Обновляем время до запуска новой записи
                seek(savedCurrentTime)

                setIsRecording(true)

                // Обновляем макет
                // const newLayout = {
                //   ...currentLayout,
                //   activeTracks: [targetTrack.id],
                // }
                // setCurrentLayout(newLayout)
              }, 100)

              // Дальше не выполняем стандартную логику переключения
              return
            }
          }

          // Переключаемся на новую дорожку
          setTrack(targetTrack.id)

          // Если идет воспроизведение, сохраняем текущее время
          if (isPlaying) {
            const video = targetTrack.videos.find((v) => {
              const startTime = v.startTime ?? 0
              const duration = v.duration ?? 0
              return startTime <= currentTime && startTime + duration >= currentTime
            })

            if (video) {
              setVideo(video)
              // Проверяем время перед обновлением
              if (
                isFinite(currentTime) &&
                currentTime >= 0 &&
                currentTime <= (video.duration || 0)
              ) {
                seek(currentTime)
              } else {
                console.warn("[Timeline] Некорректное время при переключении дорожек:", currentTime)
                seek(0)
              }
            } else if (targetTrack.videos.length > 0) {
              // Если не нашли подходящее видео, берем первое видео
              const firstVideo = targetTrack.videos[0]
              setVideo(firstVideo)
              seek(firstVideo.startTime ?? 0)
            }
          } else {
            // Если воспроизведение не идет, берем первое видео трека
            if (targetTrack.videos.length > 0) {
              const firstVideo = targetTrack.videos[0]
              setVideo(firstVideo)

              // Проверяем время перед обновлением
              if (
                isFinite(currentTime) &&
                currentTime >= 0 &&
                currentTime <= (firstVideo.duration || 0)
              ) {
                seek(currentTime)
              } else {
                console.warn("[Timeline] Некорректное время при переключении дорожек:", currentTime)
                seek(firstVideo.startTime ?? 0)
              }
            }
          }
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
    setTrack,
    isPlaying,
    isRecording,
    currentTime,
    setVideo,
    seek,
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
          seek(videoStartTime)
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
      removeFiles(filesToRemove)
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
            setTrack(nextSectionTracks[0].id)

            // Если есть первое видео, устанавливаем его как активное
            if (nextSectionTracks[0].videos.length > 0) {
              setVideo(nextSectionTracks[0].videos[0])
              // Обновляем текущее время на начало видео
              const startTime = nextSectionTracks[0].videos[0].startTime || 0
              seek(startTime)
            }
          }
        }
      } else {
        // Если секций не осталось, сбрасываем активную дату и трек
        setActiveDate(null)
        setTrack("")
      }
    }

    // Закрываем диалог
    setDeleteDialogOpen(false)
    setDeletingSectionDate(null)
  }

  const handleTrackClick = (track: Track) => {
    // ... existing code ...
  }

  const handleVideoClick = (video: MediaFile) => {
    // ... existing code ...
  }

  const handleTrackDoubleClick = (track: Track) => {
    // ... existing code ...
  }

  const handleVideoDoubleClick = (video: MediaFile) => {
    // ... existing code ...
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
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
                removeFiles(filesToRemove)
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
                removeFiles(filesToRemove)
              }
            }}
            className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <Scissors size={16} className="rotate-90" />
          </button>
        </div>
        <TimelineControls />
      </div>
      <div className="relative w-full h-full overflow-x-auto overflow-y-auto">
        {[...sections].map((section) => (
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
              />
              <div className="flex-1 w-full h-full relative border-t border-border">
                {section.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex-1 relative my-1 mt-${index === 0 ? 0 : 1} mb-${
                      index === section.tracks.length - 1 ? 0 : 1
                    }`}
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
              <TimelineBar
                startTime={section.startTime}
                endTime={section.endTime}
                height={section.tracks.length * 80 + 46}
              />
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
