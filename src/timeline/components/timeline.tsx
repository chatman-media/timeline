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
import { usePlayerContext } from "@/media-player"
import { useTimeline } from "@/timeline/services"
import { MediaFile, Track } from "@/types/media"

import { TimelineBar } from "./layout/timeline-bar"
import { TimelineControls } from "./layout/timeline-controls"
import { TimelineContainer } from "./timeline-container"

// Добавляю функцию для форматирования даты секции
function formatSectionDate(dateString: string): string {
  try {
    // Если дата в формате ISO (YYYY-MM-DD), добавляем время
    const date = new Date(dateString + "T00:00:00")
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
  const context = useTimeline()
  if (!context) {
    throw new Error("Timeline must be used within a TimelineProvider")
  }

  const {
    tracks,
    undo,
    redo,
    canUndo,
    canRedo,
    activeTrackId,
    seek,
    setActiveTrack,
    setTracks,
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
      track.videos?.forEach((video) => {
        const videoStart = video.startTime || 0
        const videoEnd = videoStart + (video.duration || 0)
        const date = new Date(videoStart * 1000).toISOString().split("T")[0]

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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
              const savedCurrentTime = currentTime
              console.log(
                `[Timeline] Сохраняем текущее время перед переключением: ${savedCurrentTime.toFixed(3)}`,
              )

              setIsRecording(false)

              setTimeout(() => {
                setActiveTrack(targetTrack.id)

                const video = targetTrack.videos?.find((v) => {
                  const startTime = v.startTime ?? 0
                  const duration = v.duration ?? 0
                  return startTime <= savedCurrentTime && startTime + duration >= savedCurrentTime
                })

                if (video) {
                  setVideo(video)
                } else if (targetTrack.videos?.length) {
                  setVideo(targetTrack.videos[0])
                }

                seek(savedCurrentTime)
                setIsRecording(true)
              }, 100)
              return
            }
          }

          setActiveTrack(targetTrack.id)

          if (isPlaying) {
            const video = targetTrack.videos?.find((v) => {
              const startTime = v.startTime ?? 0
              const duration = v.duration ?? 0
              return startTime <= currentTime && startTime + duration >= currentTime
            })

            if (video) {
              setVideo(video)
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
            } else if (targetTrack.videos?.length) {
              const firstVideo = targetTrack.videos[0]
              setVideo(firstVideo)
              seek(firstVideo.startTime ?? 0)
            }
          } else {
            if (targetTrack.videos?.length) {
              const firstVideo = targetTrack.videos[0]
              setVideo(firstVideo)

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
    isRecording,
    currentTime,
    setVideo,
    seek,
    activeDate,
    sections,
  ])

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
  }, [sections])

  React.useEffect(() => {
    if (activeVideo) {
      const videoStartTime = activeVideo.startTime || 0
      const videoDate = new Date(videoStartTime * 1000).toDateString()
      setActiveDate(videoDate)
    }
  }, [activeVideo])

  const handleDeleteSection = (sectionDate: string) => {
    setDeletingSectionDate(sectionDate)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSection = () => {
    if (!deletingSectionDate) return

    const isDeletingActiveSection = deletingSectionDate === activeDate
    const wasActiveTrackInDeletedSection = tracks.find(
      (track) =>
        track.id === activeTrackId &&
        track.videos?.some((video) => {
          const videoStart = video.startTime || 0
          return new Date(videoStart * 1000).toDateString() === deletingSectionDate
        }),
    )

    const filesToRemove: string[] = []

    tracks.forEach((track) => {
      track.videos?.forEach((video) => {
        const videoStart = video.startTime || 0
        if (new Date(videoStart * 1000).toDateString() === deletingSectionDate && video.path) {
          filesToRemove.push(video.path)
        }
      })
    })

    const updatedTracks = tracks
      .map((track) => {
        const filteredVideos = track.videos?.filter((video) => {
          const videoStart = video.startTime || 0
          return new Date(videoStart * 1000).toDateString() !== deletingSectionDate
        })

        return {
          ...track,
          videos: filteredVideos,
        }
      })
      .filter((track) => track.videos?.length)

    setTracks(updatedTracks)

    if (filesToRemove.length > 0) {
      removeFiles(filesToRemove)
    }

    if (isDeletingActiveSection || wasActiveTrackInDeletedSection) {
      const remainingSections = sections.filter((s) => s.date !== deletingSectionDate)

      if (remainingSections.length > 0) {
        let nextActiveSection
        const deletedSectionIndex = sections.findIndex((s) => s.date === deletingSectionDate)

        if (deletedSectionIndex < sections.length - 1) {
          nextActiveSection = sections[deletedSectionIndex + 1]
        } else if (deletedSectionIndex > 0) {
          nextActiveSection = sections[deletedSectionIndex - 1]
        } else {
          nextActiveSection = remainingSections[0]
        }

        if (nextActiveSection) {
          setActiveDate(nextActiveSection.date)

          const nextSectionTracks = updatedTracks.filter((track) =>
            track.videos?.some((video) => {
              const videoStart = video.startTime || 0
              return new Date(videoStart * 1000).toDateString() === nextActiveSection.date
            }),
          )

          if (nextSectionTracks.length > 0) {
            setActiveTrack(nextSectionTracks[0].id)

            if (nextSectionTracks[0].videos?.length) {
              setVideo(nextSectionTracks[0].videos[0])
              const startTime = nextSectionTracks[0].videos[0].startTime || 0
              seek(startTime)
            }
          }
        }
      } else {
        setActiveDate(null)
        setActiveTrack("")
      }
    }

    setDeleteDialogOpen(false)
    setDeletingSectionDate(null)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Отменить"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Повторить"
          >
            <Redo2 size={16} />
          </button>
          <button
            disabled={!activeTrackId}
            onClick={() => {
              const trackToDelete = tracks.find((track) => track.id === activeTrackId)
              if (!trackToDelete) return

              const filesToRemove: string[] = []
              trackToDelete.videos?.forEach((video) => {
                if (video.path) {
                  filesToRemove.push(video.path)
                }
              })

              const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
              setTracks(updatedTracks)

              if (filesToRemove.length > 0) {
                removeFiles(filesToRemove)
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <Trash2 size={16} />
          </button>
          <button
            disabled={!activeTrackId}
            onClick={() => {
              const trackToDelete = tracks.find((track) => track.id === activeTrackId)
              if (!trackToDelete) return

              const filesToRemove: string[] = []
              trackToDelete.videos?.forEach((video) => {
                if (video.path) {
                  filesToRemove.push(video.path)
                }
              })

              const updatedTracks = tracks.filter((track) => track.id !== activeTrackId)
              setTracks(updatedTracks)

              if (filesToRemove.length > 0) {
                removeFiles(filesToRemove)
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <Scissors size={16} className="rotate-90" />
          </button>
        </div>
        <TimelineControls />
      </div>
      <div className="relative h-full w-full overflow-x-auto overflow-y-auto">
        {[...sections].map((section) => (
          <div
            key={section.date}
            className={`relative mb-4 ${section.date === activeDate ? "" : "opacity-50"} timeline-section`}
          >
            <div className="relative">
              <div className="mb-1 ml-2 flex w-full items-center justify-between text-left text-xs">
                <div>{formatSectionDate(section.date)}</div>
                <button
                  onClick={() => handleDeleteSection(section.date)}
                  className="mr-2 text-gray-400 transition-colors hover:text-red-500"
                  title="Удалить секцию"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <TimelineContainer
                startTime={section.startTime}
                endTime={section.endTime}
                duration={section.duration}
              >
                <TimelineBar
                  startTime={section.startTime}
                  endTime={section.endTime}
                  height={section.tracks.length * 80 + 46}
                />
              </TimelineContainer>
            </div>
          </div>
        ))}
      </div>
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
