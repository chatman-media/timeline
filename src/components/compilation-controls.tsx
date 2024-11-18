import { useState } from "react"
import { Button } from "./ui/button"
import { PauseIcon, PlayIcon } from "lucide-react"
import { distributeScenes } from "@/utils/scene-distribution"

interface Segment {
  cameraIndex: number
  startTime: number
  endTime: number
}

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
  onSegmentsChange: (segments: Segment[]) => void
}

interface SegmentTimelineProps {
  segments: Segment[]
  totalDuration: number
}

function SegmentTimeline({ segments, totalDuration }: SegmentTimelineProps) {
  const cameras = Array.from(new Set(segments.map((s) => s.cameraIndex))).sort()

  return (
    <div className="space-y-1">
      <h3 className="font-semibold">Selected Segments Timeline:</h3>
      {cameras.map((cameraIndex) => (
        <div key={cameraIndex} className="flex items-center gap-2">
          <span className="w-16 text-sm">Cam {cameraIndex}</span>
          <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-800 relative">
            {segments
              .filter((s) => s.cameraIndex === cameraIndex)
              .map((segment, idx) => (
                <div
                  key={idx}
                  className="absolute h-full bg-green-500 dark:bg-green-600"
                  style={{
                    left: `${(segment.startTime / totalDuration) * 100}%`,
                    width: `${((segment.endTime - segment.startTime) / totalDuration) * 100}%`,
                  }}
                />
              ))}
          </div>
        </div>
      ))}
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
  onToggleRecording,
  onTogglePlayback,
  onSegmentsChange,
}: CompilationControlsProps) {
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([])

  const handleCreateCompilation = () => {
    const scenes = distributeScenes(
      targetDuration * 2,
      targetDuration,
      activeVideos.length,
    )

    const segments = scenes.map((scene) => ({
      cameraIndex: scene.cameraIndex,
      startTime: scene.startTime,
      endTime: scene.startTime + scene.duration,
    }))

    setSelectedSegments(segments)
    onSegmentsChange(segments)
    onCreateCompilation()
  }

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
          <label>Main Camera:</label>
          <select
            value={mainCamera}
            onChange={(e) => onMainCameraChange(parseInt(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {activeVideos.map(({ index }) => <option key={index} value={index}>{index}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label>Target Duration (s):</label>
          <input
            type="number"
            value={targetDuration}
            onChange={(e) => onTargetDurationChange(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20"
          />
        </div>

        <Button
          variant={isRecording ? "destructive" : "outline"}
          onClick={onToggleRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>

        <Button
          variant="outline"
          onClick={handleCreateCompilation}
          disabled={isRecording}
        >
          Создать видео
        </Button>
      </div>

      {selectedSegments.length > 0 && (
        <SegmentTimeline
          segments={selectedSegments}
          totalDuration={targetDuration * 2}
        />
      )}
    </div>
  )
}
