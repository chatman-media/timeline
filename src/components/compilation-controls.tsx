import { useState } from "react"
import { Button } from "./ui/button"
import { PauseIcon, PlayIcon } from "lucide-react"
import { distributeScenes } from "@/utils/scene-distribution"
import { VideoInfo } from "@/types/video"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { BitrateDataPoint, VideoSegment } from "@/types/video"
import { Slider } from "./ui/slider"
import { formatDuration } from "@/lib/utils"

interface CompilationControlsProps {
  mainCamera: number
  activeVideos: Array<{ index: number }>
  targetDuration: number
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
}

interface TimelineProps {
  videos: VideoInfo[]
  timeRange: { min: number; max: number }
  selectedSegments: Array<{ cameraIndex: number; startTime: number; endTime: number }>
}

const Timeline: React.FC<TimelineProps> = ({ videos, timeRange, selectedSegments }) => {
  const totalDuration = timeRange.max - timeRange.min

  return (
    <div className="w-full">
      {videos.map((video, index) => {
        const videoStartTime = new Date(video.metadata.creation_time!).getTime() / 1000
        const videoEndTime = videoStartTime + video.metadata.format.duration

        const startOffset = ((videoStartTime - timeRange.min) / totalDuration) * 100
        const width = ((videoEndTime - videoStartTime) / totalDuration) * 100

        const cameraSegments = selectedSegments.filter((seg) => seg.cameraIndex === index)

        return (
          <div key={video.path} className="h-6 w-full relative mb-0.5 flex items-center">
            <span className="absolute left-0 w-16 text-sm text-muted-foreground">Cam {index}</span>
            <div className="absolute h-4 bg-secondary left-16 right-0">
              <div
                className="absolute h-full bg-secondary-foreground/20"
                style={{ left: `${startOffset}%`, width: `${width}%` }}
              >
                {cameraSegments.map((segment, idx) => {
                  const segStartOffset =
                    ((segment.startTime - timeRange.min) / totalDuration) * 100 - startOffset
                  const segWidth = ((segment.endTime - segment.startTime) / totalDuration) * 100

                  return (
                    <div
                      key={idx}
                      className="absolute h-full bg-primary/50"
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
  targetDuration,
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
}: CompilationControlsProps) {
  const [selectedSegments, setSelectedSegments] = useState<VideoSegment[]>([])

  const handleCreateCompilation = () => {
    console.log("Creating compilation with params:", {
      targetDuration,
      timeRange,
      activeVideos: activeVideos.length,
      bitrateData,
    })

    const scenes = distributeScenes(
      targetDuration,
      timeRange.max - timeRange.min,
      activeVideos.length,
      bitrateData,
    )

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
          <span className="text-sm">Main Camera:</span>
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
                  Camera {index}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm whitespace-nowrap">
            Длительность: {formatDuration(targetDuration)}
          </span>
          <Slider
            value={[targetDuration]}
            onValueChange={([value]) => onTargetDurationChange(value)}
            min={2}
            max={maxDuration}
            step={1}
            className="w-[200px]"
          />
        </div>

        {/* <Button
          variant={isRecording ? "destructive" : "outline"}
          onClick={onToggleRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button> */}

        <Button
          variant="outline"
          onClick={handleCreateCompilation}
          disabled={isRecording || !targetDuration || activeVideos.length === 0}
        >
          Создать видео
        </Button>
      </div>

      <Timeline
        videos={videos}
        timeRange={timeRange}
        selectedSegments={selectedSegments}
      />
    </div>
  )
}
