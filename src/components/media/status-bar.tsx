import { RefreshCw } from "lucide-react"
import { MediaFile } from "@/types/videos"
import { ActionButton } from "./action-button"
import { getFileType } from "@/utils/mediaUtils"

interface StatusBarProps {
  media: MediaFile[]
  onAddAllVideoFiles: () => void
  onAddAllAudioFiles: () => void
  onAddSequentialFiles: () => void
  onAddDateFiles: (date: string) => void
  onAddAllFiles: () => void
  onUpdateList: () => void
  groupedSequences: number | null
  sortedDates: { date: string; files: MediaFile[] }[]
  addedDates: Set<string>
}

export function StatusBar({
  media,
  onAddAllVideoFiles,
  onAddAllAudioFiles,
  onAddSequentialFiles,
  onAddDateFiles,
  onAddAllFiles,
  onUpdateList,
  groupedSequences,
  sortedDates,
  addedDates,
}: StatusBarProps) {
  // Фильтруем даты, исключая уже добавленные
  const availableDates = sortedDates.filter((dateInfo) => !addedDates.has(dateInfo.date))

  // Берем только первые две доступные даты
  const [firstDate, secondDate] = availableDates

  const handleAddDateFiles = (date: string) => {
    onAddDateFiles(date)
  }

  return (
    <div className="flex justify-between items-start p-1 text-sm m-0 w-full">
      <div className="flex flex-col items-end gap-0 text-xs text-gray-500 dark:text-gray-500">
        <span className="px-1 flex items-center whitespace-nowrap gap-1">
          <ActionButton title="Добавить все видео" onClick={onAddAllVideoFiles}>
            {media.filter((f) => getFileType(f) === "video").length} видео
          </ActionButton>
          <ActionButton title="Добавить все аудио" onClick={onAddAllAudioFiles}>
            {media.filter((f) => getFileType(f) === "audio").length} аудио
          </ActionButton>
        </span>
        <span className="px-1">
          <ActionButton title="Добавить серии файлов" onClick={onAddSequentialFiles}>
            {groupedSequences && `${groupedSequences}`}
          </ActionButton>
        </span>
      </div>
      <div className="flex flex-col items-end gap-0 text-xs">
        {firstDate && (
          <ActionButton
            title="Добавить видео за эту дату"
            onClick={() => handleAddDateFiles(firstDate.date)}
          >
            {`${firstDate.files.length} видео ${firstDate.date}`}
          </ActionButton>
        )}
        {secondDate && (
          <ActionButton
            title="Добавить видео за эту дату"
            onClick={() => handleAddDateFiles(secondDate.date)}
          >
            {`${secondDate.files.length} видео ${secondDate.date}`}
          </ActionButton>
        )}
      </div>
      <div className="flex flex-col gap-0 items-end text-xs">
        <ActionButton title="Добавить все файлы" onClick={onAddAllFiles}>
          Добавить все
        </ActionButton>
        <ActionButton
          title="Обновить"
          onClick={onUpdateList}
          icon={
            <RefreshCw className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          }
        >
          Обновить
        </ActionButton>
      </div>
    </div>
  )
}
