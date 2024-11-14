import localFont from "next/font/local"
import { useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"
import { formatTimeWithDecisecond } from "@/lib/utils"
import { VideoPlayer } from "../components/VideoPlayer"
import type { VideoInfo } from "@/types/video"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

// Add new interfaces and types
interface RecordEntry {
  camera: number
  startTime: number
  endTime?: number
}

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

// Добавляем функцию форматирования времени
const formatDuration = (seconds: number) => {
  const duration = dayjs.duration(seconds, "seconds")
  if (duration.hours() > 0) {
    return duration.format("H:mm:ss")
  }
  return duration.format("m:ss")
}

export default function Home() {
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [timezone] = useState("Asia/Bangkok")
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeCamera, setActiveCamera] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<RecordEntry[]>([])
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => {
        // Сортируем видео по времени создания
        const sortedVideos = data.videos.sort((a: VideoInfo, b: VideoInfo) => {
          const timeA = a.metadata.creation_time ? new Date(a.metadata.creation_time).getTime() : 0
          const timeB = b.metadata.creation_time ? new Date(b.metadata.creation_time).getTime() : 0
          return timeA - timeB
        })

        // Находим минимальное время начала и максимальное время окончания среди всех видо
        const times = sortedVideos.flatMap((v: VideoInfo) => {
          if (!v.metadata.creation_time) return []
          const startTime = new Date(v.metadata.creation_time).getTime()
          const endTime = startTime + (v.metadata.format.duration * 1000) // конвертируем длительность в миллисекунды
          return [startTime, endTime]
        }).filter((t: number) => t > 0)
        console.log(times.map((t: number) => new Date(Math.floor(t))))

        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)

        // Устанавливаем диапазн в секундах
        setTimeRange({
          min: Math.floor(minTime / 1000),
          max: Math.floor(maxTime / 1000),
        })

        setVideos(sortedVideos)
        // Устаавливаем начаьное значение слайдера в максимум
        setCurrentTime(timeRange.min)
      })
      .catch((error) => console.error("Error fetching videos:", error))
  }, [])

  // Модифицируем функцию handleTimeChange
  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  // Добавляем функцию для управленя воспроизведением
  const togglePlayback = () => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
  }

  // Создаем функцию для фильтрации активных видео
  const isVideoActive = (video: VideoInfo) => {
    if (!video.metadata.creation_time) return false
    const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
    const startTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000
    const videoSeconds = videoTime - startTime
    const videoEndSeconds = videoSeconds + video.metadata.format.duration
    return videoSeconds <= currentTime && currentTime <= videoEndSeconds
  }

  // Создаем функцию для получения всех активных видео
  const getActiveVideos = () => {
    return videos.filter(isVideoActive)
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = parseInt(event.key)
      if (!isNaN(key) && key >= 1 && key <= 9) {
        const activeVideos = getActiveVideos()
        if (key <= activeVideos.length) {
          setActiveCamera(key)
        }
      }
    }

    globalThis.addEventListener("keydown", handleKeyPress)
    return () => globalThis.removeEventListener("keydown", handleKeyPress)
  }, [videos, currentTime])

  // Add new function to handle recording
  const toggleRecording = () => {
    if (!isRecording) {
      // Start new recording and playback
      setIsRecording(true)
      setIsPlaying(true)
      setRecordings((prev) => [...prev, {
        camera: activeCamera,
        startTime: currentTime,
      }])
    } else {
      // End current recording and pause playback
      setIsRecording(false)
      setIsPlaying(false)
      setRecordings((prev) => {
        const updatedRecordings = [...prev]
        if (updatedRecordings.length > 0) {
          updatedRecordings[updatedRecordings.length - 1].endTime = currentTime
        }
        return updatedRecordings
      })
    }
  }

  // Modify the camera change effect to track camera changes during recording
  useEffect(() => {
    if (isRecording) {
      setRecordings((prev) => {
        const updatedRecordings = [...prev]
        const lastRecord = updatedRecordings[updatedRecordings.length - 1]

        if (lastRecord && lastRecord.camera !== activeCamera) {
          // End previous camera recording
          lastRecord.endTime = currentTime
          // Start new camera recording
          updatedRecordings.push({
            camera: activeCamera,
            startTime: currentTime,
          })
        }

        return updatedRecordings
      })
    }
  }, [activeCamera, isRecording, currentTime])

  // Модифицирум эффект для синхронизации видео
  useEffect(() => {
    if (videos.length > 0) {
      const activeVids = getActiveVideos()
      activeVids.forEach((video) => {
        const videoElement = videoRefs.current[video.path]
        if (videoElement) {
          const videoStartTime = new Date(video.metadata.creation_time!).getTime() / 1000
          const firstVideoTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000
          const relativeTime = Math.max(0, currentTime - (videoStartTime - firstVideoTime))

          if (Math.abs(videoElement.currentTime - relativeTime) > 0.1) {
            videoElement.currentTime = relativeTime
          }

          if (isPlaying && videoElement.paused) {
            videoElement.play()
          } else if (!isPlaying && !videoElement.paused) {
            videoElement.pause()
          }
        }
      })
    }
  }, [currentTime, isPlaying, videos])

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-[family-name:var(--font-geist-sans)] relative`}
    >
      <div className="absolute top-4 right-4">
        {/* <TimeZoneSelect value={timezone} onValueChange={setTimezone} /> */}
      </div>
      <main className="flex flex-col gap-8 items-center w-full px-12 sm:px-16 py-16">
        {/* Панель управления */}
        <div className="flex items-center gap-4 w-full">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl text-gray-900 dark:text-white">
            {activeCamera}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleRecording}
            className={`h-12 w-12 rounded-full ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <div className={`h-4 w-4 rounded-full ${isRecording ? "bg-white" : "bg-red-500"}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            className="h-8 w-8"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-gray-500">
            {formatTimeWithDecisecond(currentTime)}
          </span>

          <span className="text-xl font-medium ml-auto">
            {dayjs(videos[0]?.metadata?.creation_time)
              .add(currentTime, "second")
              .format("HH:mm:ss")}
          </span>

          {recordings.length > 0 && (
            <div className="ml-4 text-sm text-gray-500">
              {recordings.map((record, index) => (
                <div key={index}>
                  Camera {record.camera}: {formatDuration(record.startTime)} →{" "}
                  {record.endTime ? formatDuration(record.endTime) : "recording..."}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full">
          <Slider
            defaultValue={[0]}
            max={timeRange.max - timeRange.min}
            step={1}
            value={[currentTime]}
            onValueChange={handleTimeChange}
            className="w-full"
          />
        </div>

        {/* Единый список всех видео */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium">Все камеры</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {videos
              .map((video, originalIndex) => ({ video, cameraNumber: originalIndex + 1 }))
              .filter(({ video }) => isVideoActive(video))
              .map(({ video, cameraNumber }) => {
                console.log(`Rendering video ${cameraNumber}`, {
                  activeCamera,
                  cameraNumber,
                })
                return (
                  <VideoPlayer
                    key={video.path}
                    video={video}
                    activeIndex={activeCamera}
                    cameraNumber={cameraNumber}
                    timezone={timezone}
                    formatDuration={formatDuration}
                    onVideoRef={(el) => {
                      if (el) {
                        videoRefs.current[video.path] = el
                      }
                    }}
                  />
                )
              })}
          </div>
        </div>
      </main>
    </div>
  )
}
