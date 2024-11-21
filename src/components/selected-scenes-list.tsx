import { VideoInfo } from "@/types/video"

interface SelectedScenesListProps {
  segments: Array<{ cameraIndex: number; startTime: number; endTime: number, duration: number }>
  videos: VideoInfo[]
  onSegmentClick: (startTime: number) => void
}

function formatTimeForDisplay(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00.000"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const ms = Math.floor((remainingSeconds % 1) * 1000)

  return `${String(minutes).padStart(2, "0")}:${
    String(Math.floor(remainingSeconds)).padStart(2, "0")
  }.${String(ms).padStart(3, "0")}`
}

export function SelectedScenesList({ segments, videos, onSegmentClick }: SelectedScenesListProps) {
  if (!segments.length) return null

  return (
    <div className="border max-h-[200px] overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50 text-gray-900 dark:text-gray-100">
            <th className="p-1 text-left">№</th>
            <th className="p-1 text-left">Камера</th>
            <th className="p-1 text-left">Начало</th>
            <th className="p-1 text-left">Конец</th>
            <th className="p-1 text-left">Длительность</th>
            <th className="p-1 text-left">Файл</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted text-gray-900 dark:text-gray-100">
          {segments.map((segment, index) => {
            const video = videos[segment.cameraIndex]

            return (
              <tr
                key={index}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onSegmentClick(segment.startTime)}
              >
                <td className="p-1">{index + 1}</td>
                <td className="p-1">V{segment.cameraIndex}</td>
                <td className="p-1">{formatTimeForDisplay(segment.startTime)}</td>
                <td className="p-1">{formatTimeForDisplay(segment.endTime)}</td>
                <td className="p-1">{formatTimeForDisplay(segment.endTime - segment.startTime)}</td>
                <td className="p-1 font-mono">{video?.path.split("/").pop() || "-"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
