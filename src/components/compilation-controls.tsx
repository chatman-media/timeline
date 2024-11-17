import { Button } from "./ui/button"
import { PauseIcon, PlayIcon } from "lucide-react"

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
}: CompilationControlsProps) {
  return (
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
        onClick={onCreateCompilation}
      >
        Create Compilation
      </Button>
    </div>
  )
}
