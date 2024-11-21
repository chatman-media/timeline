import { useCallback, useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import { VideoPlayer } from "../components/video-player"
import type { BitrateDataPoint, VideoInfo } from "@/types/video"
import { ActiveVideo } from "@/components/active-video"
import CompilationControls from "../components/compilation-controls"
import { Button } from "@/components/ui/button"
import { Pause } from "lucide-react"
import { Play } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { useMemo } from "react"
import { distributeScenes } from "@/utils/scene-distribution"
import { ThemeToggle } from "@/components/theme-toggle"
import type { RecordEntry } from "@/types/record-entry"
import type { ActiveVideoEntry } from "@/types/active-video-entry"
import type { VideoSegment } from "@/types/video-segment"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeCamera, setActiveCamera] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<RecordEntry[]>([])
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})
  const [activeVideos, setActiveVideos] = useState<ActiveVideoEntry[]>([])
  const [mainCamera, setMainCamera] = useState(1)
  const [compilationSettings, setCompilationSettings] = useState({
    targetDuration: 300,
    minSegmentLength: 0.5,
    maxSegmentLength: 10,
    averageSceneDuration: 3,
    cameraChangeFrequency: 4 / 7,
  })
  const [selectedSegments, setSelectedSegments] = useState<VideoSegment[]>([])
  const [bitrateData, setBitrateData] = useState<Array<BitrateDataPoint[]>>([])

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
        // Используем bitrate_data из каждого видео
        const bitrateData = data.videos.map((video: VideoInfo) => video.bitrate_data || [])
        setBitrateData(bitrateData)
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
          const endTime = startTime + (v.metadata.format.duration * 1000) // конвертируем длитльност в миллисекунды
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Модифицируем функцию handleTimeChange
  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  // Добавляем функцию для управления воспроизведением
  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Добавляем функцию дя записи
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
  }, [isRecording, activeCamera, isPlaying])

  // Обновляем эффект для обработки клавиш
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Выбор камеры цифрами
      const key = parseInt(event.key)
      if (!isNaN(key) && key >= 1 && key <= 9) {
        const activeVids = activeVideos
        if (key <= activeVids.length) {
          setActiveCamera(key)
        }
      }

      // Запись (R)
      // if (event.key.toLowerCase() === "r") {
      //   toggleRecording()
      // }

      // Пауза/воспроизведение (Space)
      if (event.code === "Space") {
        event.preventDefault()
        togglePlayback()
      }
    }

    globalThis.addEventListener("keydown", handleKeyPress)
    return () => globalThis.removeEventListener("keydown", handleKeyPress)
  }, [activeVideos, toggleRecording, togglePlayback])

  // Обновляем эффект для смены камеры во время записи
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
      const activeVids = videos

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

      // Синхронизация времен при промотке
      activeVids.forEach((video) => {
        const videoElement = videoRefs.current[video.path]
        const activeVideoElement = videoRefs.current[`active-${video.path}`]

        if (videoElement) {
          const videoTime = new Date(video.metadata.creation_time!).getTime() / 1000
          const startTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000
          const relativeTime = currentTime - (videoTime - startTime)

          // Добавляем более точную инхронизацию
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
  }, [isPlaying, videos, timeRange.max])

  // Модифицируем updateActiveVideos для определения активных видео
  const updateActiveVideos = useCallback(() => {
    const active = videos
      .map((video, index) => {
        const isActive = (() => {
          if (!video.metadata.creation_time) return false
          const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
          const startTime = videos[0]?.metadata.creation_time
            ? new Date(videos[0].metadata.creation_time).getTime() / 1000
            : 0
          const videoSeconds = videoTime - startTime
          const videoEndSeconds = videoSeconds + video.metadata.format.duration
          return videoSeconds <= currentTime && currentTime <= videoEndSeconds
        })()

        return { video, index: index + 1, isActive }
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

  // Модифицируем createCompilation для учета ручных записей
  const createCompilation = useCallback(() => {
    // Преобразуем ручные записи в сегменты
    const manualSegments = recordings
      .filter((rec) => rec.endTime !== undefined)
      .map((rec) => ({
        cameraIndex: rec.camera,
        startTime: rec.startTime,
        endTime: rec.endTime!,
        duration: rec.endTime! - rec.startTime,
      }))

    // Получаем автоматические сегменты
    const autoSegments = distributeScenes({
      targetDuration: compilationSettings.targetDuration -
        manualSegments.reduce((sum, seg) => sum + seg.duration, 0),
      totalDuration: timeRange.max - timeRange.min,
      numCameras: videos.length,
      averageSceneDuration: compilationSettings.averageSceneDuration,
      cameraChangeFrequency: compilationSettings.cameraChangeFrequency,
      bitrateData,
    }).map((scene) => ({
      cameraIndex: scene.cameraIndex,
      startTime: scene.startTime,
      endTime: scene.startTime + scene.duration,
      duration: scene.duration,
    }))

    // Объединяем и сортируем все сегменты
    const allSegments = [...manualSegments, ...autoSegments]
      .sort((a, b) => a.startTime - b.startTime)

    setSelectedSegments(allSegments)
  }, [compilationSettings, recordings, timeRange.max, timeRange.min, bitrateData, videos.length])

  // Add new function near other callbacks
  const createVideo = useCallback(() => {
    fetch("/api/create-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        segments: selectedSegments,
        videos: videos,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Video creation started:", data)
      })
      .catch((error) => {
        console.error("Error creating video:", error)
      })
  }, [selectedSegments, videos])

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#0A0A0A]">
      <main className="flex gap-16 w-full px-12 sm:px-16 py-16">
        <div className="w-[70%] flex flex-col gap-8">
          <div className="flex items-center gap-6 w-full">
            <span className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
              {activeCamera}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleRecording}
              className={`h-12 w-12 border border-gray-200 dark:border-gray-700 ${
                isRecording
                  ? "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div
                className={`h-4 w-4 ${isRecording ? "bg-white" : "bg-red-500 dark:bg-red-600"}`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayback}
              className="h-8 w-8 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-100">
              {formatDuration(currentTime, 0)}
            </span>

            <span className="text-xl font-medium ml-auto text-gray-900 dark:text-gray-100">
              {dayjs(videos[0]?.metadata?.creation_time)
                .add(currentTime, "second")
                .format("HH:mm:ss")}
            </span>

            {recordings.length > 0 && (
              <div className="ml-6 text-sm text-gray-600 dark:text-gray-100">
                <RecordingsList
                  recordings={recordings}
                  baseVideoTime={videos[0]?.metadata.creation_time ?? ""}
                />
              </div>
            )}
          </div>

          <CompilationControls
            mainCamera={mainCamera}
            activeVideos={activeVideos}
            isRecording={isRecording}
            isPlaying={isPlaying}
            onMainCameraChange={setMainCamera}
            onTargetDurationChange={(duration) =>
              setCompilationSettings((prev) => ({ ...prev, targetDuration: duration }))}
            onCreateCompilation={createCompilation}
            onToggleRecording={toggleRecording}
            onTogglePlayback={togglePlayback}
            onSegmentsChange={setSelectedSegments}
            selectedSegments={selectedSegments}
            timeRange={timeRange}
            videos={videos}
            bitrateData={bitrateData}
            onSeek={(time) => {
              const videoElement = videoRefs.current[`active-${activeCamera}`]
              if (videoElement) {
                videoElement.currentTime = time
              }
            }}
            compilationSettings={compilationSettings}
            onSettingsChange={setCompilationSettings}
            onCreateVideo={createVideo}
          />

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
          <div className="" style={{ display: "flex", flexWrap: "wrap", rowGap: "30px" }}>
            {videos.map((video, index) => {
              const activeVideo = activeVideos.find((v) => v.video.path === video.path)
              const isActive = activeVideo?.isActive ?? false

              return (
                <VideoPlayer
                  key={video.path}
                  video={{ ...video, activeIndex: index }}
                  cameraNumber={index + 1}
                  currentTime={currentTime}
                  isActive={isActive}
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

        {/* Правая часть с активным видео */}
        <div className="w-[40%] sticky top-4 bg-gray-50 dark:bg-[#111111] p-4 border border-gray-200 dark:border-gray-800">
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
        <ThemeToggle />
      </main>
    </div>
  )
}
