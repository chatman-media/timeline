import { VideoInfo } from "@/types/video"
import { formatDuration } from "@/lib/utils"

interface SelectedScenesListProps {
  segments: Array<{
    cameraIndex: number
    startTime: number
    endTime: number
  }>
  videos: VideoInfo[]
  onSegmentClick: (startTime: number) => void
}

export function SelectedScenesList({ segments, videos, onSegmentClick }: SelectedScenesListProps) {
  return (
    <div className="border max-h-[200px] overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-background shadow-sm">
          <tr>
            <th className="p-1 text-left text-muted-foreground border-b">#</th>
            <th className="p-1 text-left text-muted-foreground border-b">Источник</th>
            <th className="p-1 text-left text-muted-foreground border-b">Начало</th>
            <th className="p-1 text-left text-muted-foreground border-b">Конец</th>
            <th className="p-1 text-left text-muted-foreground border-b">Длительность</th>
            <th className="p-1 text-left text-muted-foreground border-b">Файл</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted">
          {segments.map((segment, index) => {
            const video = videos[segment.cameraIndex]
            const duration = segment.endTime - segment.startTime
            const fileName = video?.path.split("/").pop() || "-"

            return (
              <tr
                key={index}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onSegmentClick(segment.startTime)}
              >
                <td className="p-1 text-gray-600 dark:text-gray-100">{index + 1}</td>
                <td className="p-1 text-gray-600 dark:text-gray-100">V{segment.cameraIndex}</td>
                <td className="p-1 text-gray-600 dark:text-gray-100">
                  {formatDuration(segment.startTime)}
                </td>
                <td className="p-1 text-gray-600 dark:text-gray-100">
                  {formatDuration(segment.endTime)}
                </td>
                <td className="p-1 text-gray-600 dark:text-gray-100">
                  {formatDuration(duration, 3)}
                </td>
                <td className="p-1 text-gray-600 dark:text-gray-100 font-mono">{fileName}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
