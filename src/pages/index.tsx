import { useCallback, useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import type { BitrateDataPoint, VideoInfo } from "@/types/video"
import { ActiveVideo } from "@/components/active-video"
import { Button } from "@/components/ui/button"
import { PauseIcon, PlayIcon } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { useMemo } from "react"
import { distributeScenes } from "@/utils/scene-distribution"
import { ThemeToggle } from "@/components/theme-toggle"
import type { RecordEntry } from "@/types/record-entry"
import type { ActiveVideoEntry } from "@/types/active-video-entry"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectedScenesList } from "@/components/selected-scenes-list"
import { Label } from "@/components/ui/label"
import { Timeline } from "@/components/timeline"
import { VideoSegment } from "@/types/video-segment"

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
    targetDuration: 900,
    minSegmentLength: 0.2,
    maxSegmentLength: 100,
    averageSceneDuration: 5,
    cameraChangeFrequency: 4 / 7,
  })
  const [selectedSegments, setSelectedSegments] = useState<VideoSegment[]>([])
  const [, setBitrateData] = useState<Array<BitrateDataPoint[]>>([])

  const lastUpdateTime = useRef<number>(0)
  const animationFrameId = useRef<number>()

  const RecordingsList = (
    { recordings, baseTime }: { recordings: RecordEntry[]; baseTime: number },
  ) => {
    return useMemo(() =>
      recordings.map((record, idx) => {
        const startTimeFormatted = dayjs.unix(baseTime + record.startTime)
          .format("HH:mm:ss.SSS")

        const endTimeFormatted = record.endTime
          ? dayjs.unix(baseTime + record.endTime)
            .format("HH:mm:ss.SSS")
          : "recording..."

        return (
          <div key={idx}>
            Camera {record.camera}: {startTimeFormatted} → {endTimeFormatted}
          </div>
        )
      }), [recordings, baseTime])
  }

  const [activeSegmentEnd, setActiveSegmentEnd] = useState<number | null>(null)

  useEffect(() => {
    if (activeSegmentEnd !== null && isPlaying) {
      const checkInterval = setInterval(() => {
        const currentTime = timeRange.min
        if (currentTime >= activeSegmentEnd) {
          setActiveSegmentEnd(null)
        }
      }, 100)

      return () => clearInterval(checkInterval)
    }
  }, [activeSegmentEnd, isPlaying])

  const handleCreateCompilation = () => {
    const scenes = distributeScenes({
      targetDuration: compilationSettings.targetDuration,
      numCameras: videos.length,
      averageSceneDuration: compilationSettings.averageSceneDuration,
      cameraChangeFrequency: compilationSettings.cameraChangeFrequency,
      mainCamera,
      mainCameraProb: 0.6,
      timeRange: timeRange,
      videos: videos,
    })

    setSelectedSegments(scenes.map((scene) => ({
      cameraIndex: scene.cameraIndex,
      startTime: scene.startTime,
      endTime: scene.endTime,
      duration: scene.duration,
      videoFile: scene.videoFile,
    })))
  }

  const maxDuration = timeRange.max - timeRange.min

  const getCameraChangeLabel = (value: number): string => {
    if (value <= 1 / 7) return "Очень редко"
    if (value <= 2 / 7) return "Редко"
    if (value <= 3 / 7) return "Умеренно редко"
    if (value <= 4 / 7) return "Средне"
    if (value <= 5 / 7) return "Умеренно часто"
    if (value <= 6 / 7) return "Часто"
    return "Очень часто"
  }

  const handleTargetDurationChange = (value: number) => {
    setCompilationSettings({
      ...compilationSettings,
      targetDuration: value,
    })
  }

  const handleSceneDurationChange = (value: number) => {
    setCompilationSettings({
      ...compilationSettings,
      averageSceneDuration: value,
    })
  }

  const handleCameraChangeFrequencyChange = (value: number) => {
    setCompilationSettings({
      ...compilationSettings,
      cameraChangeFrequency: Math.round(value * 7) / 7,
    })
  }

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        console.log("Received video data:", data)

        if (!data.videos || !Array.isArray(data.videos) || data.videos.length === 0) {
          console.error("No videos received from API")
          return
        }

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
      .catch((error) => {
        console.error("Error fetching videos:", error)
        if (error instanceof Response) {
          error.text().then((text) => console.error("Response text:", text))
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
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
    console.log("Updating active videos:", {
      videosCount: videos.length,
      currentTime,
      videoGroups: videos.map((v) => ({
        path: v.path,
        creationTime: v.metadata.creation_time,
      })),
    })

    // Создаем мапу для группировки видео по их номеру камеры
    const videoGroups = new Map<number, VideoInfo[]>()

    videos.forEach((video) => {
      // Извлекаем номер камеры из имени файла или другим способом
      // Предполагаем, что номер камеры содержится в имени файла
      const cameraNumber = parseInt(video.path.match(/camera[_-]?(\d+)/i)?.[1] || "1")

      if (!videoGroups.has(cameraNumber)) {
        videoGroups.set(cameraNumber, [])
      }
      videoGroups.get(cameraNumber)?.push(video)
    })

    const active = Array.from(videoGroups.entries()).map(([cameraNumber, groupVideos]) => {
      const isActive = groupVideos.some((video) => {
        if (!video.metadata.creation_time) return false
        const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
        const startTime = videos[0]?.metadata.creation_time
          ? new Date(videos[0].metadata.creation_time).getTime() / 1000
          : 0
        const videoSeconds = videoTime - startTime
        const videoEndSeconds = videoSeconds + video.metadata.format.duration
        return videoSeconds <= currentTime && currentTime <= videoEndSeconds
      })

      return {
        video: groupVideos[0], // Используем первое видео для метаданных
        index: cameraNumber,
        isActive,
        allVideos: groupVideos, // Сохраняем все видео для этой камеры
      }
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

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#0A0A0A]">
      {isLoading
        ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600 dark:text-gray-400">Загрузка видео...</div>
          </div>
        )
        : videos.length === 0
        ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600 dark:text-gray-400">Видео не найдены</div>
          </div>
        )
        : (
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
                <span className="text-sm text-gray-600 dark:text-gray-100">
                  {formatDuration(currentTime, 0)}
                </span>

                <span className="text-xl font-medium ml-auto text-gray-900 dark:text-gray-100">
                  {videos[0]?.metadata.creation_time
                    ? dayjs(new Date(videos[0].metadata.creation_time))
                      .add(currentTime - timeRange.min, "second")
                      .format("D MMMM, HH:mm:ss")
                    : "--:--:--"}
                </span>

                {recordings.length > 0 && (
                  <div className="ml-6 text-sm text-gray-600 dark:text-gray-100">
                    <RecordingsList
                      recordings={recordings}
                      baseTime={videos[0]?.metadata.format.start_time ?? 0}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2  text-gray-900 dark:text-gray-100">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={togglePlayback}
                    >
                      {isPlaying
                        ? <PauseIcon className="h-4 w-4" />
                        : <PlayIcon className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <span className="text-sm">Главная камера:</span>
                    <Select
                      value={mainCamera.toString()}
                      onValueChange={(value) => setMainCamera(parseInt(value))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeVideos.map(({ index }) => (
                          <SelectItem key={index} value={index.toString()}>
                            V{index}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                      Длительность: {formatDuration(compilationSettings.targetDuration, 0)}
                    </span>
                    <Slider
                      value={[compilationSettings.targetDuration]}
                      onValueChange={([value]) => handleTargetDurationChange(value)}
                      min={2}
                      max={maxDuration}
                      step={1}
                      className="w-[200px]"
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="space-y-2 text-gray-900 dark:text-gray-100">
                      <Label>Средняя длительность сцны</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[compilationSettings.averageSceneDuration]}
                          onValueChange={([value]) => handleSceneDurationChange(value)}
                          min={0.5}
                          max={10}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-sm w-16 text-right text-muted-foreground">
                          {compilationSettings.averageSceneDuration.toFixed(1)} сек
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-gray-900 dark:text-gray-100">
                      <Label>Частота смены камеры</Label>
                      <div className="flex flex-col gap-1">
                        <Slider
                          value={[compilationSettings.cameraChangeFrequency]}
                          onValueChange={([value]) => handleCameraChangeFrequencyChange(value)}
                          min={0}
                          max={1}
                          step={1 / 7}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">
                          {getCameraChangeLabel(compilationSettings.cameraChangeFrequency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    // variant="outline"
                    onClick={handleCreateCompilation}
                    disabled={isRecording || !compilationSettings.targetDuration ||
                      activeVideos.length === 0}
                  >
                    Авто-монтаж
                  </Button>
                  <Button
                    onClick={() => {}}
                    variant="default"
                  >
                    Сохранить
                  </Button>
                </div>

                <Timeline
                  videos={videos}
                  timeRange={timeRange}
                  selectedSegments={selectedSegments}
                  onPlaySegment={(_cameraIndex, startTime) => {
                    const videoElement = videoRefs.current[`active-${activeCamera}`]
                    if (videoElement) {
                      videoElement.currentTime = startTime
                    }
                    // setMainCamera(cameraIndex)
                    // setActiveSegmentEnd(endTime)
                    // if (!isPlaying) {
                    //   togglePlayback()
                    // }
                  }}
                />

                <SelectedScenesList
                  segments={selectedSegments}
                  videos={videos}
                  onSegmentClick={() => {}}
                />
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
        )}
    </div>
  )
}
