"use client"

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
import { Segment } from "next/dist/server/app-render/types"
import { Timeline } from "./timeline"

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
  selectedSegments: Segment[]
  setSelectedSegments: (segments: Segment[]) => void
  averageSceneDuration: number
  setAverageSceneDuration: (duration: number) => void
}

const CompilationControls: React.FC<CompilationControlsProps> = ({
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
  setSelectedSegments,
  selectedSegments,
  averageSceneDuration = 5,
  setAverageSceneDuration,
}) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2  text-gray-900 dark:text-gray-100">
          <Button
            variant="outline"
            size="icon"
            onClick={onTogglePlayback}
          >
            {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
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
          <span className="text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
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
          <div className="space-y-2 text-gray-900 dark:text-gray-100">
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
              <span className="text-sm w-16 text-right text-muted-foreground">
                {compilationSettings.averageSceneDuration.toFixed(1)} сек
                {averageSceneDuration.toFixed(1)} сек
              </span>
            </div>
          </div>
          <div className="space-y-2 text-gray-900 dark:text-gray-100">
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
          // variant="outline"
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

export default CompilationControls
