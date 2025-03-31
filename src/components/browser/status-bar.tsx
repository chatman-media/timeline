import { MediaFile } from "@/types/videos"
import { getFileType } from "@/utils/mediaUtils"
import { ActionButton } from "./action-button"

interface StatusBarProps {
  media: MediaFile[]
  onAddAllVideoFiles: () => void
  onAddAllAudioFiles: () => void
  onAddDateFiles: (date: string) => void
  onAddAllFiles: () => void
  sortedDates: { date: string; files: MediaFile[] }[]
}

export function StatusBar({
  media,
  onAddAllVideoFiles,
  onAddAllAudioFiles,
  onAddDateFiles,
  onAddAllFiles,
  sortedDates,
}: StatusBarProps) {
  const [maxDateInfo, secondMaxDateInfo] = sortedDates

  const videoCount = media.filter((f) => getFileType(f) === "video").length
  const audioCount = media.filter((f) => getFileType(f) === "audio").length

  return (
    <div className="flex justify-between items-center text-sm w-full h-full p-[3px]">
      <div className="flex flex-col items-end justify-center gap-0 text-xs text-gray-500 dark:text-gray-500">
        <span className="px-1 flex items-center whitespace-nowrap gap-1">
          {videoCount > 0 && (
            <ActionButton title="Добавить все видео" onClick={onAddAllVideoFiles}>
              {videoCount} видео
            </ActionButton>
          )}
          {audioCount > 0 && (
            <ActionButton title="Добавить все аудио" onClick={onAddAllAudioFiles}>
              {audioCount} аудио
            </ActionButton>
          )}
        </span>
      </div>
      <div className="flex flex-col items-end justify-center gap-0 text-xs">
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
      <div className="flex flex-col gap-0 items-end justify-center text-xs">
        <ActionButton title="Добавить все файлы" onClick={onAddAllFiles}>
          Добавить все
        </ActionButton>
        {/* <ActionButton
          title="Обновить"
          onClick={onUpdateList}
          icon={
            <RefreshCw className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          }
        >
          Обновить
        </ActionButton> */}
      </div>
    </div>
  )
}