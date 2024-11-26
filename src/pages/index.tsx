import { useCallback, useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import type { MediaFile } from "@/types/videos"
import { ActiveVideo } from "@/components/active-video"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AssembledTrack } from "@/types/videos"
import { Timeline } from "@/components/timeline"
import { useTimeline } from "@/hooks/use-timeline"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  // Используем хук для управления временем
  const { updateTime } = useTimeline({
    startTime: timeRange.min,
    duration: timeRange.max - timeRange.min,
  })
  const [isPlaying] = useState(false)
  const [activeCamera] = useState(1)
  const [isRecording] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})
  const [activeVideos] = useState<AssembledTrack[]>([])
  const [mainCamera, setMainCamera] = useState(1)
  const [compilationSettings, setCompilationSettings] = useState({
    targetDuration: 900,
    minSegmentLength: 0.2,
    maxSegmentLength: 100,
    averageSceneDuration: 5,
    cameraChangeFrequency: 4 / 7,
    mainCameraPriority: 60,
  })

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

  const getSceneDurationLabel = (value: number): string => {
    if (value <= 1) return "Очень короткие"
    if (value <= 2) return "Короткие"
    if (value <= 3.5) return "Умеренно короткие"
    if (value <= 5) return "Средние"
    if (value <= 6.5) return "Умеренно длинные"
    if (value <= 8) return "Длинные"
    return "Очень длинные"
  }

  const handleTargetDurationChange = (value: number) => {
    setCompilationSettings((prev) => ({
      ...prev,
      targetDuration: value,
    }))
  }

  const handleSceneDurationChange = (value: number) => {
    setCompilationSettings((prev) => ({
      ...prev,
      averageSceneDuration: value,
    }))
  }

  const handleCameraChangeFrequencyChange = (value: number) => {
    setCompilationSettings((prev) => ({
      ...prev,
      cameraChangeFrequency: Math.round(value * 7) / 7,
    }))
  }

  const [isLoading, setIsLoading] = useState(true)

  // Добавляем функцию для управления воспроизведением
  // const togglePlayback = useCallback(() => {
  //   setIsPlaying((prev) => !prev)
  // }, [])

  // Добавляем функцию дя записи
  // const toggleRecording = useCallback(() => {
  //   if (!isRecording) {
  //     // Начало записи
  //     setIsRecording(true)
  //     if (!isPlaying) {
  //       setIsPlaying(true)
  //     }
  //     setRecordings((prev) => [...prev, {
  //       camera: activeCamera,
  //       startTime: currentTime,
  //     }])
  //   } else {
  //     // Остановка записи
  //     setIsRecording(false)
  //     setIsPlaying(false)

  //     setRecordings((prev) => {
  //       const updatedRecordings = [...prev]
  //       if (updatedRecordings.length > 0) {
  //         updatedRecordings[updatedRecordings.length - 1].endTime = currentTime
  //       }
  //       return updatedRecordings
  //     })
  //   }
  // }, [isRecording, activeCamera, isPlaying])

  const handleMainCameraPriorityChange = useCallback((value: number) => {
    setCompilationSettings((prev) => ({
      ...prev,
      mainCameraPriority: value,
    }))
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        console.log("Received video data:", data)

        if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
          console.error("No videos received from API")
          return
        }

        const validVideos = data.media.filter((v: MediaFile) => {
          const isVideo = v.probeData.streams.some((s) => s.codec_type === "video")
          const hasCreationTime = !!v.probeData.format.tags?.creation_time
          return isVideo && hasCreationTime
        })

        const sortedVideos = validVideos.sort((a: MediaFile, b: MediaFile) => {
          const timeA = new Date(a.probeData.format.tags!.creation_time).getTime()
          const timeB = new Date(b.probeData.format.tags!.creation_time).getTime()
          return timeA - timeB
        })

        const times = sortedVideos.flatMap((v: MediaFile) => {
          const startTime = new Date(v.probeData.format.tags!.creation_time).getTime()
          const duration = v.probeData.format.duration || 0
          const endTime = startTime + duration * 1000
          return [startTime, endTime]
        })

        if (times.length > 0) {
          const minTime = Math.min(...times)
          const maxTime = Math.max(...times)

          const newTimeRange = {
            min: Math.floor(minTime / 1000),
            max: Math.floor(maxTime / 1000),
          }

          setTimeRange(newTimeRange)
          updateTime(newTimeRange.min)
        } else {
          setTimeRange({ min: 0, max: 0 })
          updateTime(0)
        }

        setVideos(sortedVideos)
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
  }, [])

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#0A0A0A]">
      {isLoading
        ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600 dark:text-gray-400">Загрузка медиа...</div>
          </div>
        )
        : videos.length === 0
        ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-600 dark:text-gray-400">Файлы не найдены</div>
          </div>
        )
        : (
          <>
            <div className="flex gap-16 w-full px-12 sm:px-16 py-8">
              <div className="w-[70%] flex flex-col gap-8">
                <div className="flex items-center gap-6 w-full">
                  <span className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                    {activeCamera}
                  </span>
                </div>

                <div className="flex flex-col gap-6 w-full">
                  <div className="flex items-center gap-4 text-gray-900 dark:text-gray-100">
                    <span className="text-sm min-w-32">Главная камера:</span>
                    <Select
                      value={mainCamera.toString()}
                      onValueChange={(value) => setMainCamera(parseInt(value))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {videos.map((x) => (
                          <SelectItem
                            key={x.name}
                            value={x.name}
                          >
                            V{x.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
                      Длительность: {formatDuration(compilationSettings.targetDuration, 0)}
                    </span>
                    <div className="flex items-center gap-4 flex-1">
                      <Slider
                        value={[compilationSettings.targetDuration]}
                        onValueChange={([value]) => handleTargetDurationChange(value)}
                        min={2}
                        max={maxDuration}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-32 text-right text-muted-foreground">
                        {formatDuration(compilationSettings.targetDuration, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
                      Длина сцены:
                    </span>
                    <div className="flex items-center gap-4 flex-1">
                      <Slider
                        value={[compilationSettings.averageSceneDuration]}
                        onValueChange={([value]) => handleSceneDurationChange(value)}
                        min={0.5}
                        max={10}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-sm w-32 text-right text-muted-foreground">
                        {getSceneDurationLabel(compilationSettings.averageSceneDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
                      Смена камеры:
                    </span>
                    <div className="flex items-center gap-4 flex-1">
                      <Slider
                        value={[compilationSettings.cameraChangeFrequency]}
                        onValueChange={([value]) => handleCameraChangeFrequencyChange(value)}
                        min={0}
                        max={1}
                        step={1 / 7}
                        className="flex-1"
                      />
                      <span className="text-sm w-32 text-right text-muted-foreground">
                        {getCameraChangeLabel(compilationSettings.cameraChangeFrequency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
                      Приоритет главной:
                    </span>
                    <div className="flex items-center gap-4 flex-1">
                      <Slider
                        value={[compilationSettings.mainCameraPriority]}
                        min={0}
                        max={100}
                        step={5}
                        className="flex-1"
                        onValueChange={(value) => handleMainCameraPriorityChange(value[0])}
                      />
                      <span className="text-sm w-32 text-right text-muted-foreground">
                        {compilationSettings.mainCameraPriority}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Button
                      disabled={isRecording || !compilationSettings.targetDuration ||
                        activeVideos.length === 0}
                      className="flex-1"
                    >
                      Авто-монтаж
                    </Button>
                    <Button
                      onClick={() => {}}
                      variant="default"
                      className="flex-1"
                    >
                      Сохранить
                    </Button>
                  </div>
                </div>

                {
                  /* <SelectedScenesList
                  segments={selectedSegments}
                  videos={videos}
                  onSegmentClick={() => {}}
                /> */
                }
              </div>

              {/* Правая часть с активным видео */}
              <div className="w-[40%] sticky top-4 bg-gray-50 dark:bg-[#111111] p-4 border border-gray-200 dark:border-gray-800">
                {activeVideos
                  .filter(({ index }) => index === activeCamera)
                  .map(({ video }) => (
                    <ActiveVideo
                      key={`active-${video.path}`}
                      video={video}
                      isPlaying={isPlaying}
                      videoRefs={videoRefs}
                    />
                  ))}
              </div>
              <ThemeToggle />
            </div>
            <div className="flex gap-16 w-full px-12 sm:px-16">
              <div className="w-full">
                <Timeline
                  duration={timeRange.max - timeRange.min}
                  startTime={timeRange.min}
                  videos={videos}
                  onTimeUpdate={updateTime}
                />
                {
                  /* <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {currentTime && dayjs.unix(currentTime).format("HH:mm:ss.SSS")}
                </div> */
                }
              </div>
            </div>
          </>
        )}
    </div>
  )
}
