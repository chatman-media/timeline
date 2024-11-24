import { MediaFile } from "@/types/video"

interface SelectedScenesListProps {
  segments: Array<{
    cameraIndex: number
    startTime: number
    endTime: number
    duration: number
    videoFile?: string
  }>
  videos: MediaFile[]
  onSegmentClick: (cameraIndex: number, startTime: number, endTime: number) => void
}

function formatTimeForDisplay(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  const ms = date.getMilliseconds().toString().padStart(3, "0")

  return `${hours}:${minutes}:${seconds}.${ms}`
}

function formatDurationForDisplay(durationInSeconds: number): string {
  const seconds = Math.floor(durationInSeconds)
  const ms = Math.floor((durationInSeconds - seconds) * 1000)
  return `${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}

export function SelectedScenesList({ segments, onSegmentClick }: SelectedScenesListProps) {
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
            console.log("Segment data:", segment) // Добавляем отладочный вывод
            return (
              <tr
                key={index}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  onSegmentClick(segment.cameraIndex, segment.startTime, segment.endTime)}
              >
                <td className="p-1">{index + 1}</td>
                <td className="p-1">V{segment.cameraIndex}</td>
                <td className="p-1 font-mono">{formatTimeForDisplay(segment.startTime)}</td>
                <td className="p-1 font-mono">{formatTimeForDisplay(segment.endTime)}</td>
                <td className="p-1 font-mono">
                  {formatDurationForDisplay(segment.endTime - segment.startTime)}
                </td>
                <td className="p-1 font-mono">
                  {segment.videoFile ? segment.videoFile.split("/").pop() : ""}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
