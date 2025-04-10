import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRootStore } from "@/hooks/use-root-store"
import { MontageSegment } from "@/lib/state-types" // Импортируем тип
import { Track } from "@/types/videos"

// Функция форматирования времени с учетом временной зоны
const formatTime = (unixTimestamp: number | null): string => {
  if (unixTimestamp === null) return "запись..."

  // Создаем объект Date из Unix timestamp (в секундах)
  const date = new Date(unixTimestamp * 1000)

  // Получаем компоненты времени с учетом локальной временной зоны
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
}

// Функция для получения имени/индекса трека
const getSourceTrackInfo = (sourceTrackIds: string[], tracks: Track[]): string => {
  if (!sourceTrackIds || sourceTrackIds.length === 0) return "N/A"
  const firstId = sourceTrackIds[0]
  const track = tracks.find((t) => t.id === firstId)
  return track ? `Видео ${Number(track.index)}` : "N/A"
}

export function MontageSchemaView() {
  const { context } = useRootStore()
  const { montageSchema = [], tracks = [] } = context

  return (
    <div className="rounded-md border overflow-auto h-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[100px] text-xs">Источник</TableHead>
            <TableHead className="w-[120px] text-xs">Начало</TableHead>
            <TableHead className="w-[120px] text-xs">Конец</TableHead>
            <TableHead className="text-xs">Файл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {montageSchema.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-xs">
                Схема монтажа пуста. Начните запись.
              </TableCell>
            </TableRow>
          ) : (
            montageSchema.map((segment: MontageSegment) => {
              const track = tracks.find((t) => t.id === segment.sourceTrackIds[0])
              const file = track?.videos?.[0]
              return (
                <TableRow key={segment.id}>
                  <TableCell className="text-xs">
                    {getSourceTrackInfo(segment.sourceTrackIds, tracks)}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {formatTime(segment.startTime)}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{formatTime(segment.endTime)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">
                    {file?.name || "—"}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
