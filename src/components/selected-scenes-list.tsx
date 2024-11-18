import { VideoInfo } from "@/types/video"
import { formatDuration } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">#</TableHead>
          <TableHead className="w-24">Источник</TableHead>
          <TableHead>Начало</TableHead>
          <TableHead>Конец</TableHead>
          <TableHead>Длительность</TableHead>
          <TableHead>Файл</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {segments.map((segment, index) => {
          const video = videos[segment.cameraIndex]
          const isAudio = video.path.includes('audio') || video.path.includes('A')
          const sourceLabel = isAudio ? `A${segment.cameraIndex}` : `V${segment.cameraIndex}`
          const duration = segment.endTime - segment.startTime
          const fileName = video.path.split('/').pop() || ''

          return (
            <TableRow 
              key={index}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => onSegmentClick(segment.startTime)}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{sourceLabel}</TableCell>
              <TableCell>{formatDuration(segment.startTime)}</TableCell>
              <TableCell>{formatDuration(segment.endTime)}</TableCell>
              <TableCell>{formatDuration(duration)}</TableCell>
              <TableCell className="font-mono text-sm">{fileName}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
} 