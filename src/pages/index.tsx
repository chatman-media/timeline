import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { PauseIcon, PlayIcon } from "lucide-react"
import { formatDuration, formatTimeWithMilliseconds } from "@/lib/utils"
import {
  AssembledTrack,
  MediaFile,
  RecordEntry,
  VideosApiResponse,
  VideoSegment,
} from "@/types/video"
import { distributeScenes } from "@/utils/scene-distribution"
import { processVideoTracks } from "@/lib/process-tracks"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Timeline } from "@/components/timeline"
import { SelectedScenesList } from "@/components/selected-scenes-list"
import { ThemeToggle } from "@/components/theme-toggle"

// Инициализиуем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  // 1. useState - все состояния определяем сразу
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeCamera, setActiveCamera] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<RecordEntry[]>([])
  const [activeVideos, setActiveVideos] = useState<AssembledTrack[]>([])
  const [mainCamera, setMainCamera] = useState(1)
  const [selectedSegments, setSelectedSegments] = useState<VideoSegment[]>([])
  const [assembledTracks, setAssembledTracks] = useState<AssembledTrack[]>([])
  const [, setError] = useState<Error | null>(null)
  const [compilationSettings, setCompilationSettings] = useState({
    targetDuration: 900,
    minSegmentLength: 0.2,
    maxSegmentLength: 100,
    averageSceneDuration: 5,
    cameraChangeFrequency: 4 / 7,
    mainCameraPriority: 60,
  })
  // 2. Все useRef хуки
  // const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})
  // const lastUpdateTime = useRef<number>(0)
  // const animationFrameId = useRef<number>()

  // 3. Все useCallback хуки
  const handleTimeChange = useCallback((value: number[]) => {
    setCurrentTime(value[0])
  }, [])

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleCreateCompilation = useCallback(() => {
    if (!assembledTracks.length) return

    const scenes = distributeScenes({
      targetDuration: compilationSettings.targetDuration,
      numCameras: assembledTracks.length,
      averageSceneDuration: compilationSettings.averageSceneDuration,
      cameraChangeFrequency: compilationSettings.cameraChangeFrequency,
      mainCamera,
      mainCameraProb: compilationSettings.mainCameraPriority / 100,
      timeRange,
      videos,
      assembledTracks,
    })

    setSelectedSegments(scenes)
  }, [
    assembledTracks,
    compilationSettings.targetDuration,
    compilationSettings.averageSceneDuration,
    compilationSettings.cameraChangeFrequency,
    compilationSettings.mainCameraPriority,
    mainCamera,
    timeRange,
    videos,
  ])

  // Добавляем обработчики изменения настроек
  const handleTargetDurationChange = useCallback((value: number) => {
    setCompilationSettings({ ...compilationSettings, targetDuration: value })
  }, [])

  const handleSceneDurationChange = useCallback((value: number) => {
    setCompilationSettings({ ...compilationSettings, averageSceneDuration: value })
  }, [])

  const handleCameraChangeFrequencyChange = useCallback((value: number) => {
    setCompilationSettings({ ...compilationSettings, cameraChangeFrequency: value })
  }, [])

  const handleMainCameraPriorityChange = useCallback((value: number) => {
    setCompilationSettings({ ...compilationSettings, mainCameraPriority: value })
  }, [])

  // const handleMinSegmentLengthChange = useCallback((value: number) => {
  //   setCompilationSettings({ ...compilationSettings, minSegmentLength: value })
  // }, [])

  // const handleMaxSegmentLengthChange = useCallback((value: number) => {
  //   setCompilationSettings({ ...compilationSettings, maxSegmentLength: value })
  // }, [])

  const handlePlaySegment = useCallback(() => {
    // setSelectedSegments([segment])
  }, [])

  // Добавляем функцию для управления воспроизведением
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

  useEffect(() => {
    if (!assembledTracks.length) return

    const active = assembledTracks.filter((track) => {
      return track.allMedia.some((video) => {
        const videoTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
        const startTime = assembledTracks[0]?.video.probeData.format.tags?.creation_time
          ? new Date(assembledTracks[0].video.probeData.format.tags.creation_time).getTime() / 1000
          : 0
        const videoSeconds = videoTime - startTime
        const duration = video.probeData.format?.duration || 0
        const videoEndSeconds = videoSeconds + duration

        return videoSeconds <= currentTime && currentTime <= videoEndSeconds
      })
    })

    setActiveVideos(active)
  }, [assembledTracks, currentTime])

  // 4. Все useEffect хуки
  useEffect(() => {
    // Загрузка видео
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data: VideosApiResponse) => {
        if (!data.videos?.length) return
        const processed = processVideoTracks(data.videos)
        setVideos(processed.videos)
        setTimeRange(processed.timeRange)
        setCurrentTime(processed.timeRange.min)

        // Создаем объединенные треки
        const tracks = processed.videos.reduce<AssembledTrack[]>((acc, video) => {
          const videoStream = video.probeData.streams.find((stream) =>
            stream.codec_type === "video"
          )
          const audioStream = video.probeData.streams.find((stream) =>
            stream.codec_type === "audio"
          )

          const cameraMatch = video.name.match(/camera[_-]?(\d+)/i)
          const cameraIndex = cameraMatch ? parseInt(cameraMatch[1]) : 1

          const videoTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime()

          // Если есть видео поток, создаем или обновляем видео трек
          if (videoStream) {
            const existingVideoTrack = acc.find((track) =>
              track.index === cameraIndex &&
              track.type === "video" &&
              Math.abs(
                  new Date(track.video.probeData.format.tags?.creation_time || 0).getTime() -
                    videoTime,
                ) <= 1000
            )

            if (existingVideoTrack) {
              existingVideoTrack.allMedia.push(video)
            } else {
              acc.push({
                video,
                index: cameraIndex,
                type: "video",
                allMedia: [video],
                displayName: `V${cameraIndex}`,
              })
            }
          }

          // Если есть аудио поток, создаем или обновляем аудио трек
          if (audioStream) {
            const existingAudioTrack = acc.find((track) =>
              track.index === cameraIndex &&
              track.type === "audio" &&
              Math.abs(
                  new Date(track.video.probeData.format.tags?.creation_time || 0).getTime() -
                    videoTime,
                ) <= 1000
            )

            if (existingAudioTrack) {
              existingAudioTrack.allMedia.push(video)
            } else {
              acc.push({
                video,
                index: cameraIndex,
                type: "audio",
                allMedia: [video],
                displayName: `A${cameraIndex}`,
              })
            }
          }

          return acc
        }, [])

        // Сортируем треки: сначала все видео (V1-VX), потом все аудио (A1-AX)
        const sortedTracks = tracks.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "video" ? -1 : 1
          }
          return a.index - b.index
        })

        // Для каждого трека сортируем внутренние медиафайлы по времени
        sortedTracks.forEach((track) => {
          track.allMedia.sort((a, b) => {
            const timeA = new Date(a.probeData.format.tags?.creation_time || 0).getTime()
            const timeB = new Date(b.probeData.format.tags?.creation_time || 0).getTime()
            return timeA - timeB
          })
        })

        setAssembledTracks(sortedTracks)
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
  }, [])

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

  // 5. Все остальные хуки (useMemo и т.д.)
  const RecordingsList = useMemo(() => {
    return function RecordingsListComponent({
      recordings,
      baseTime,
    }: {
      recordings: RecordEntry[]
      baseTime: number
    }) {
      return (
        <>
          {recordings.map((record, idx) => {
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
          })}
        </>
      )
    }
  }, [recordings])

  if (!videos.length) return <div>Нет доступных видео</div>

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
            <span className="text-sm text-gray-600 dark:text-gray-100">
              {formatTimeWithMilliseconds(currentTime)}
            </span>

            <span className="text-xl font-medium ml-auto text-gray-900 dark:text-gray-100">
              {formatTimeWithMilliseconds(currentTime)}
            </span>

            {recordings.length > 0 && (
              <div className="ml-6 text-sm text-gray-600 dark:text-gray-100">
                <RecordingsList
                  recordings={recordings}
                  baseTime={videos[0]?.probeData.format.creation_time ?? 0}
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
                  {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
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
                    {assembledTracks.map(({ index }) => (
                      <SelectItem
                        key={index}
                        value={index.toString()}
                      >
                        V{index}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                  Длительность: {formatDuration(compilationSettings.targetDuration, 0)}
                  {" "}
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
                  <Label>редняя длительность сцены</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[compilationSettings.averageSceneDuration]}
                      onValueChange={([value]) => handleSceneDurationChange(value)}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm w-16 text-right text-gray-600 dark:text-gray-400">
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getCameraChangeLabel(compilationSettings.cameraChangeFrequency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>
                  Приоритет главной камеры ({compilationSettings.mainCameraPriority}%)
                </Label>
                <Slider
                  value={[compilationSettings.mainCameraPriority]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => handleMainCameraPriorityChange(value[0])}
                />
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
              onPlaySegment={handlePlaySegment}
              // targetDuration={compilationSettings.targetDuration}
            />

            <SelectedScenesList
              segments={selectedSegments}
              videos={videos}
              onSegmentClick={handlePlaySegment}
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
        {
          /* <div className="w-[40%] sticky top-4 bg-gray-50 dark:bg-[#111111] p-4 border border-gray-200 dark:border-gray-800">
          {assembledTracks
            .filter((track) => track.index === activeCamera)
            .map((track) => (
              <ActiveVideo
                key={`active-${track.video.name}`}
                video={track.video}
                isPlaying={isPlaying}
                videoRefs={videoRefs}
              />
            ))}
        </div> */
        }
        <ThemeToggle />
      </main>
    </div>
  )
}
