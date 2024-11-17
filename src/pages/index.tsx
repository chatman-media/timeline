import localFont from "next/font/local"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"
import { formatTimeWithDecisecond } from "@/lib/utils"
import { VideoPlayer } from "../components/video-player"
import type { VideoInfo } from "@/types/video"
import { ActiveVideo } from "@/components/active-video"

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

interface EditSegment {
  camera: number
  startTime: number
  endTime: number
  bitrate: number
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

export default function Home() {
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeCamera, setActiveCamera] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<RecordEntry[]>([])
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})
  const [activeVideos, setActiveVideos] = useState<Array<{ video: VideoInfo; index: number }>>([])
  const [editSegments, setEditSegments] = useState<EditSegment[]>([])
  const [mainCamera, setMainCamera] = useState(1)
  const [bitrateThreshold, setBitrateThreshold] = useState(5000000) // 5 Mbps default
  // const [globalPlayTime, setGlobalPlayTime] = useState(0)

  const lastUpdateTime = useRef<number>(0)
  const animationFrameId = useRef<number>()

  const RecordingsList = (
    { recordings, baseVideoTime }: { recordings: RecordEntry[]; baseVideoTime: string },
  ) => {
    return useMemo(() =>
      recordings.map((record, idx) => {
        const baseTime = baseVideoTime ? new Date(baseVideoTime).getTime() / 1000 : 0

        const startTimeFormatted = dayjs.unix(baseTime)
          .add(record.startTime, "second")
          .format("HH:mm:ss.SSS")

        const endTimeFormatted = record.endTime
          ? dayjs.unix(baseTime)
            .add(record.endTime, "second")
            .format("HH:mm:ss.SSS")
          : "recording..."

        return (
          <div key={idx}>
            Camera {record.camera}: {startTimeFormatted} → {endTimeFormatted}
          </div>
        )
      }), [recordings, baseVideoTime])
  }

  useEffect(() => {
    fetch("/api/videos")
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
          const endTime = startTime + (v.metadata.format.duration * 1000) // конвертируем длит��льност в миллисекунды
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
  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

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

  // Оборачиваем toggleRecording в useCallback
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      // Начало записи
      setIsRecording(true)
      if (!isPlaying) {
        setIsPlaying(true)
      }
      setRecordings((prev) => [...prev, {
        camera: activeCamera,
        startTime: currentTime,
      }])
    } else {
      // Остановка записи
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
  }, [isRecording, activeCamera, currentTime, isPlaying])

  // Обновляем useEffect с правильными зависимостями
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = parseInt(event.key)
      if (!isNaN(key) && key >= 1 && key <= 9) {
        const activeVideos = getActiveVideos()
        if (key <= activeVideos.length) {
          setActiveCamera(key)
        }
      }

      // Обработка клавиши R для записи
      if (event.key.toLowerCase() === "r") {
        toggleRecording()
      }

      // Обработка пробела для паузы/воспроизведения
      if (event.code === "Space") {
        event.preventDefault() // Предотвращаем прокрутку страницы
        togglePlayback()
      }
    }

    globalThis.addEventListener("keydown", handleKeyPress)
    return () => globalThis.removeEventListener("keydown", handleKeyPress)
  }, [videos, currentTime, toggleRecording, togglePlayback])

  // Modify camera change effect
  useEffect(() => {
    if (isRecording) {
      setRecordings((prev) => {
        const updatedRecordings = [...prev]
        const lastRecord = updatedRecordings[updatedRecordings.length - 1]

        if (lastRecord && lastRecord.camera !== activeCamera) {
          lastRecord.endTime = currentTime
          updatedRecordings.push({
            camera: activeCamera,
            startTime: currentTime,
          })
        }

        return updatedRecordings
      })
    }
  }, [activeCamera, isRecording])

  // Модифицирум эффект для синхронизации видео
  useEffect(() => {
    if (videos.length > 0) {
      const activeVids = getActiveVideos()

      const updatePlayback = (timestamp: number) => {
        if (!lastUpdateTime.current) {
          lastUpdateTime.current = timestamp
        }

        const deltaTime = timestamp - lastUpdateTime.current
        lastUpdateTime.current = timestamp

        if (isPlaying) {
          setCurrentTime((prev) => {
            const newTime = prev + (deltaTime / 1000)
            // Проверяем, не вышли ли мы за пределы диапазона
            if (newTime > timeRange.max) {
              setIsPlaying(false)
              return timeRange.max
            }
            return newTime
          })
          animationFrameId.current = requestAnimationFrame(updatePlayback)
        }
      }

      const syncVideos = async () => {
        const videoElements = activeVids
          .map((video) => videoRefs.current[video.path])
          .filter(Boolean)

        const activeVideoElements = activeVids
          .map((video) => videoRefs.current[`active-${video.path}`])
          .filter(Boolean)

        const allVideos = [...videoElements, ...activeVideoElements]

        if (isPlaying) {
          await Promise.all(allVideos.map((video) => video.play()))
          if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(updatePlayback)
          }
        } else {
          await Promise.all(allVideos.map((video) => video.pause()))
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current)
            lastUpdateTime.current = 0
          }
        }
      }

      // Синхронизация времени при промотке
      activeVids.forEach((video) => {
        const videoElement = videoRefs.current[video.path]
        const activeVideoElement = videoRefs.current[`active-${video.path}`]

        if (videoElement) {
          const videoTime = new Date(video.metadata.creation_time!).getTime() / 1000
          const startTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000
          const relativeTime = currentTime - (videoTime - startTime)

          // Добавляем более точную синхронизацию
          if (videoElement.readyState >= 2) { // Проверяем, что видео готово к воспроизведению
            if (Math.abs(videoElement.currentTime - relativeTime) > 0.1) { // Уменьшаем порог синхронизации
              videoElement.currentTime = relativeTime
              if (activeVideoElement) {
                activeVideoElement.currentTime = relativeTime
              }
            }
          }
        }
      })

      syncVideos().catch(console.error)
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        lastUpdateTime.current = 0
      }
    }
  }, [currentTime, isPlaying, videos, timeRange.max])

  // Обновляем функцию для получения активных видео
  const updateActiveVideos = useCallback(() => {
    const active = videos
      .map((video, index) => ({ video, index: index + 1 }))
      .filter(({ video }) => {
        if (!video.metadata.creation_time) return false
        const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
        const startTime = videos[0]?.metadata.creation_time
          ? new Date(videos[0].metadata.creation_time).getTime() / 1000
          : 0
        const videoSeconds = videoTime - startTime
        const videoEndSeconds = videoSeconds + video.metadata.format.duration
        return videoSeconds <= currentTime && currentTime <= videoEndSeconds
      })
    setActiveVideos(active)
  }, [videos, currentTime])

  // Добавляем эффект для обновления активных видео
  useEffect(() => {
    updateActiveVideos()
  }, [videos, updateActiveVideos])

  useEffect(() => {
    const activeVideo = document.querySelector(`.video-${activeCamera}`)
    const container = document.getElementById("active-video-container")

    console.log("Debug:", {
      activeCamera,
      foundActiveVideo: !!activeVideo,
      foundContainer: !!container,
    })

    if (activeVideo && container) {
      container.innerHTML = ""
      const clone = activeVideo.cloneNode(true)
      container.appendChild(clone)
    }
  }, [activeCamera])

  // Add new function to analyze bitrate and create segments
  const analyzeAndCreateSegments = useCallback(() => {
    if (!videos.length || !videos[0]?.metadata?.creation_time) {
      console.warn('No videos or missing metadata')
      return
    }

    const segments: EditSegment[] = []
    let currentCamera = mainCamera
    let currentSegment: EditSegment | null = null

    // Get the base time from the first video
    const baseTime = new Date(videos[0].metadata.creation_time).getTime() / 1000

    // Helper function to get bitrate at specific time
    const getBitrateAtTime = (video: VideoInfo, time: number) => {
      if (!video?.metadata?.creation_time || !video.bitrate_data) {
        return 0
      }

      try {
        const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
        const relativeTime = time - (videoTime - baseTime)
        
        const bitratePoint = video.bitrate_data.find(point => 
          Math.abs(point.timestamp - relativeTime) < 0.1
        )
        return bitratePoint?.bitrate || 0
      } catch (error) {
        console.error('Error calculating bitrate:', error)
        return 0
      }
    }

    // Analyze each time point
    for (let time = timeRange.min; time <= timeRange.max; time += 0.1) { // 100ms intervals
      const activeVids = videos.filter(video => {
        if (!video?.metadata?.creation_time || !video?.metadata?.format?.duration) {
          return false
        }

        try {
          const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
          const videoStart = videoTime - baseTime
          const videoEnd = videoStart + video.metadata.format.duration
          return time >= videoStart && time <= videoEnd
        } catch (error) {
          console.error('Error filtering active videos:', error)
          return false
        }
      })

      if (!activeVids.length) continue

      activeVids.forEach((video, index) => {
        const bitrate = getBitrateAtTime(video, time)
        const cameraNumber = index + 1

        if (bitrate < bitrateThreshold && cameraNumber === currentCamera) {
          // Switch to another camera with better bitrate
          const betterCamera = activeVids.findIndex((v, i) => 
            getBitrateAtTime(v, time) >= bitrateThreshold && i + 1 !== currentCamera
          )

          if (betterCamera !== -1) {
            if (currentSegment) {
              currentSegment.endTime = time
              segments.push(currentSegment)
            }
            currentCamera = betterCamera + 1
            currentSegment = {
              camera: currentCamera,
              startTime: time,
              endTime: time,
              bitrate: getBitrateAtTime(activeVids[betterCamera], time)
            }
          }
        }
      })

      if (!currentSegment) {
        const currentVideo = activeVids.find((_, i) => i + 1 === currentCamera)
        if (currentVideo) {
          currentSegment = {
            camera: currentCamera,
            startTime: time,
            endTime: time,
            bitrate: getBitrateAtTime(currentVideo, time)
          }
        }
      }
    }

    // Add the last segment
    if (currentSegment) {
      currentSegment.endTime = timeRange.max
      segments.push(currentSegment)
    }

    // Merge adjacent segments with the same camera
    const mergedSegments = segments.reduce((acc: EditSegment[], segment) => {
      const lastSegment = acc[acc.length - 1]
      
      if (lastSegment && lastSegment.camera === segment.camera) {
        lastSegment.endTime = segment.endTime
        lastSegment.bitrate = (lastSegment.bitrate + segment.bitrate) / 2 // Average bitrate
        return acc
      }
      
      acc.push(segment)
      return acc
    }, [])

    setEditSegments(mergedSegments)
  }, [videos, mainCamera, bitrateThreshold, timeRange])

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-[family-name:var(--font-geist-sans)] relative`}
    >
      <div className="absolute top-4 right-4">
        {/* <TimeZoneSelect value={timezone} onValueChange={setTimezone} /> */}
      </div>
      <main className="flex gap-16 w-full px-12 sm:px-16 py-16">
        {/* Левая часть с ской видео */}
        <div className="w-[70%] flex flex-col gap-8">
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
                <RecordingsList
                  recordings={recordings}
                  baseVideoTime={videos[0]?.metadata.creation_time ?? ""}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label>Main Camera:</label>
              <select 
                value={mainCamera} 
                onChange={(e) => setMainCamera(parseInt(e.target.value))}
                className="border rounded px-2 py-1"
              >
                {activeVideos.map(({index}) => (
                  <option key={index} value={index}>{index}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={analyzeAndCreateSegments}
            >
              Analyze Segments
            </Button>
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

          {/* Сетка видео */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeVideos.map(({ video, index }) => (
              <VideoPlayer
                key={video.path}
                video={{ ...video, activeIndex: index - 1 }}
                cameraNumber={index}
                currentTime={currentTime}
                onVideoRef={(el) => {
                  if (el) {
                    videoRefs.current[video.path] = el
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Правая часть с активным видео */}
        <div className="w-[30%] sticky top-4">
          {activeVideos
            .filter(({ index }) => index === activeCamera)
            .map(({ video, index }) => (
              <ActiveVideo
                key={`active-${video.path}`}
                video={{ ...video, activeIndex: index - 1 }}
                isPlaying={isPlaying}
                videoRefs={videoRefs}
              />
            ))}
        </div>
      </main>
      {editSegments.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-bold">Edit Segments:</h3>
          {editSegments.map((segment, idx) => (
            <div key={idx} className="flex gap-4 text-sm">
              <span>Camera {segment.camera}</span>
              <span>{dayjs(videos[0]?.metadata?.creation_time)
                .add(segment.startTime, "second")
                .format("HH:mm:ss.SSS")}</span>
              <span>-</span>
              <span>{dayjs(videos[0]?.metadata?.creation_time)
                .add(segment.endTime, "second")
                .format("HH:mm:ss.SSS")}</span>
              <span>{(segment.bitrate / 1000000).toFixed(2)} Mbps</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
