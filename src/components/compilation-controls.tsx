import { useState } from "react"
import { Button } from "./ui/button"
import { PauseIcon, PlayIcon } from "lucide-react"
import { distributeScenes } from "@/utils/scene-distribution"
import { VideoInfo } from "@/types/video"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { BitrateDataPoint, VideoSegment } from "@/types/video"
import { Slider } from "./ui/slider"
import { formatTimeWithDecisecond } from "@/lib/utils"
import { SelectedScenesList } from "./selected-scenes-list"
import { Label } from "./ui/label"
import { CompilationSettings } from "@/lib/compilation"

interface CompilationControlsProps {
  mainCamera: number
  activeVideos: Array<{ index: number }>
  isRecording: boolean
  isPlaying: boolean
  onMainCameraChange: (camera: number) => void
  onTargetDurationChange: (duration: number) => void
  onCreateCompilation: () => void
  onToggleRecording: () => void
  onTogglePlayback: () => void
  onSegmentsChange: (segments: VideoSegment[]) => void
  timeRange: { min: number; max: number }
  videos: VideoInfo[]
  bitrateData?: Array<BitrateDataPoint[]>
  onSeek: (time: number) => void
  compilationSettings: {
    targetDuration: number
    minSegmentLength: number
    maxSegmentLength: number
    averageSceneDuration: number
    cameraChangeFrequency: number
  }
  onSettingsChange: (settings: CompilationSettings) => void
}

interface TimelineProps {
  videos: VideoInfo[]
  timeRange: { min: number; max: number }
  selectedSegments: Array<{ cameraIndex: number; startTime: number; endTime: number }>
}

const Timeline: React.FC<TimelineProps> = ({ videos, timeRange, selectedSegments }) => {
  const totalDuration = timeRange.max - timeRange.min

  // Функция для проверки последовательности видео
  const isSequentialVideos = (video1: VideoInfo, video2: VideoInfo) => {
    // Извлекаем числа из имени файла формата VID_YYYYMMDD_HHMMSS_XXX
    const getFileInfo = (path: string) => {
      const match = path.match(/VID_(\d{8})_(\d{6})_(\d+)/)
      if (!match) return null
      return {
        date: match[1],
        time: match[2],
        sequence: parseInt(match[3]),
      }
    }

    const info1 = getFileInfo(video1.path)
    const info2 = getFileInfo(video2.path)

    if (!info1 || !info2) return false

    // Проверяем, что файлы от одной даты
    if (info1.date !== info2.date) return false

    // Проверяем последовательность номеров
    if (info2.sequence !== info1.sequence + 1) return false

    // Используем metadata для проверки временной последовательности
    const video1End = video1.metadata.format.start_time + video1.metadata.format.duration
    const video2Start = video2.metadata.format.start_time

    // Увеличиваем допуск до 1 секунды
    return Math.abs(video1End - video2Start) < 1
  }

  // Группируем последовательные видео
  const groupedVideos = videos.reduce((acc: VideoInfo[][], video, index) => {
    const prevVideo = videos[index - 1]

    if (prevVideo && isSequentialVideos(prevVideo, video)) {
      acc[acc.length - 1].push(video)
    } else {
      acc.push([video])
    }
    return acc
  }, [])

  return (
    <div className="w-full">
      {groupedVideos.map((group, ) => {
        const firstVideo = group[0]
        const lastVideo = group[group.length - 1]

        const videoStartTime = new Date(firstVideo.metadata.creation_time!).getTime() / 1000
        const videoEndTime = new Date(lastVideo.metadata.creation_time!).getTime() / 1000 +
          lastVideo.metadata.format.duration

        const startOffset = ((videoStartTime - timeRange.min) / totalDuration) * 100
        const width = ((videoEndTime - videoStartTime) / totalDuration) * 100

        const cameraSegments = selectedSegments.filter(
          (seg) => seg.cameraIndex === videos.indexOf(firstVideo),
        )

        return (
          <div key={firstVideo.path} className="h-6 w-full relative mb-0.5 flex items-center">
            <span className="absolute left-0 w-16 text-sm text-muted-foreground">
              V{videos.indexOf(firstVideo)}
            </span>
            <div className="absolute h-4 bg-secondary left-16 right-0">
              <div
                className="absolute h-full bg-secondary-foreground/20"
                style={{ left: `${startOffset}%`, width: `${width}%` }}
              >
                {cameraSegments.map((segment, idx) => {
                  const segStartOffset = ((segment.startTime - timeRange.min) / totalDuration) * 100
                  const segWidth = ((segment.endTime - segment.startTime) / totalDuration) * 100

                  return (
                    <div
                      key={idx}
                      className="absolute h-full bg-yellow-400"
                      style={{
                        left: `${segStartOffset}%`,
                        width: `${segWidth}%`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CompilationControls({
  mainCamera,
  activeVideos,
  isRecording,
  isPlaying,
  onMainCameraChange,
  onTargetDurationChange,
  onCreateCompilation,
  onTogglePlayback,
  onSegmentsChange,
  timeRange,
  videos,
  bitrateData,
  onSeek,
  compilationSettings,
  onSettingsChange,
}: CompilationControlsProps) {
  const [selectedSegments, setSelectedSegments] = useState<VideoSegment[]>([])
  const [averageSceneDuration, ] = useState(3)
  const [cameraChangeFrequency, setCameraChangeFrequency] = useState(4 / 7)

  const handleCreateCompilation = () => {
    setSelectedSegments([])
    onSegmentsChange([])

    console.log("Creating compilation with params:", {
      targetDuration: compilationSettings.targetDuration,
      timeRange,
      activeVideos: activeVideos.length,
      averageSceneDuration,
      cameraChangeFrequency,
      bitrateData,
    })

    const scenes = distributeScenes({
      targetDuration: compilationSettings.targetDuration,
      totalDuration: timeRange.max - timeRange.min,
      numCameras: activeVideos.length,
      averageSceneDuration,
      cameraChangeFrequency,
      bitrateData,
    })

    console.log("Generated scenes:", scenes)

    const segments = scenes.map((scene) => ({
      cameraIndex: scene.cameraIndex,
      startTime: timeRange.min + scene.startTime,
      endTime: timeRange.min + scene.startTime + scene.duration,
    }))

    console.log("Generated segments:", segments)

    setSelectedSegments(segments)
    onSegmentsChange(segments)
    onCreateCompilation()
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

  const handleSceneDurationChange = (value: number) => {
    onSettingsChange({
      ...compilationSettings,
      averageSceneDuration: value,
    })
  }

  // const handleFrequencyChange = (value: number) => {
  //   onSettingsChange({
  //     ...compilationSettings,
  //     cameraChangeFrequency: Math.round(value * 7) / 7,
  //   })
  // }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onTogglePlayback}
          >
            {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Главная камера:</span>
          <Select
            value={mainCamera.toString()}
            onValueChange={(value) => onMainCameraChange(parseInt(value))}
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
          <span className="text-sm whitespace-nowrap">
            Длительность: {formatTimeWithDecisecond(compilationSettings.targetDuration)}
          </span>
          <Slider
            value={[compilationSettings.targetDuration]}
            onValueChange={([value]) => onTargetDurationChange(value)}
            min={2}
            max={maxDuration}
            step={1}
            className="w-[200px]"
          />
        </div>

        {
          /* <Button
          variant={isRecording ? "destructive" : "outline"}
          onClick={onToggleRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button> */
        }

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Средняя длительность сцены</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[compilationSettings.averageSceneDuration]}
                onValueChange={([value]) => handleSceneDurationChange(value)}
                min={0.5}
                max={10}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm w-16 text-right">
                {compilationSettings.averageSceneDuration.toFixed(1)} сек
                {averageSceneDuration.toFixed(1)} сек
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Частота смены камеры</Label>
            <div className="flex flex-col gap-1">
              <Slider
                value={[cameraChangeFrequency]}
                onValueChange={([value]) =>
                  setCameraChangeFrequency(
                    // Округляем до ближайшей 1/7 для 7 уровней
                    Math.round(value * 7) / 7,
                  )}
                min={0}
                max={1}
                step={1 / 7}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                {getCameraChangeLabel(cameraChangeFrequency)}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleCreateCompilation}
          disabled={isRecording || !compilationSettings.targetDuration || activeVideos.length === 0}
        >
          Создать видео
        </Button>
      </div>

      <Timeline
        videos={videos}
        timeRange={timeRange}
        selectedSegments={selectedSegments}
      />

      <SelectedScenesList
        segments={selectedSegments}
        videos={videos}
        onSegmentClick={(time) => onSeek(time)}
      />
    </div>
  )
}
