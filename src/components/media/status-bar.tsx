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
  groupedSequences: string
  sortedDates: { date: string; files: MediaFile[] }[]
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
}: StatusBarProps) {
  const [maxDateInfo, secondMaxDateInfo] = sortedDates

  return (
    <div className="flex justify-between items-start p-0 text-sm m-1">
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
        {maxDateInfo && (
          <ActionButton
            title="Добавить видео за эту дату"
            onClick={() => onAddDateFiles(maxDateInfo.date)}
          >
            {`${maxDateInfo.files.length} видео ${maxDateInfo.date}`}
          </ActionButton>
        )}
        {secondMaxDateInfo && (
          <ActionButton
            title="Добавить видео за эту дату"
            onClick={() => onAddDateFiles(secondMaxDateInfo.date)}
          >
            {`${secondMaxDateInfo.files.length} видео ${secondMaxDateInfo.date}`}
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
