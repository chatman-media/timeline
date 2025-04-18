import { CopyPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MediaFile } from "@/types/media"
import { getRemainingMediaCounts, getTopDateWithRemainingFiles } from "@/utils/media-file-utils"

interface StatusBarProps {
  media: MediaFile[]
  onAddAllVideoFiles: () => void
  onAddAllAudioFiles: () => void
  onAddDateFiles: (files: MediaFile[]) => void
  onAddAllFiles: () => void
  sortedDates: { date: string; files: MediaFile[] }[]
  addedFiles: MediaFile[]
}

/**
 * Компонент для отображения статуса браузера
 *
 * @param media - Массив медиа-файлов
 * @param onAddAllVideoFiles - Callback для добавления всех видеофайлов
 * @param onAddAllAudioFiles - Callback для добавления всех аудиофайлов
 * @param onAddDateFiles - Callback для добавления видеофайлов за определенную дату
 * @param onAddAllFiles - Callback для добавления всех файлов
 * @param sortedDates - Массив отсортированных дат и соответствующих им файлов
 * @param addedFiles - Массив добавленных файлов
 */
export function StatusBar({
  media,
  onAddAllVideoFiles,
  onAddAllAudioFiles,
  onAddDateFiles,
  onAddAllFiles,
  sortedDates,
  addedFiles,
}: StatusBarProps) {
  const addedFilesSet = new Set(addedFiles.map((file) => file.path))
  const { remainingVideoCount, remainingAudioCount, allFilesAdded } = getRemainingMediaCounts(
    media,
    addedFilesSet,
  )
  const topDateWithRemainingFiles = getTopDateWithRemainingFiles(sortedDates, addedFilesSet)

  return (
    <div className="flex justify-between items-center text-sm w-full p-1.5 gap-2">
      <div className="flex flex-col items-end justify-center gap-0 text-xs">
        <span className="px-1 flex items-center whitespace-nowrap gap-2">
          {remainingVideoCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs rounded-sm cursor-pointer px-2 h-6 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] bg-secondary"
              title="Добавить все видео"
              onClick={onAddAllVideoFiles}
            >
              {remainingVideoCount} видео
              <CopyPlus size={10} className="" />
            </Button>
          )}
          {remainingAudioCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs rounded-sm cursor-pointer px-2 h-6 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] bg-secondary"
              title="Добавить все аудио"
              onClick={onAddAllAudioFiles}
            >
              {remainingAudioCount} аудио
              <CopyPlus size={10} className="" />
            </Button>
          )}
        </span>
      </div>
      {topDateWithRemainingFiles && topDateWithRemainingFiles.remainingFiles.length > 0 && (
        <div className="flex flex-row items-end justify-center gap-0 text-xs">
          {/* <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-xs rounded-sm cursor-pointer px-2 h-6 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] bg-secondary"
          title={`Пропустить дату`}
          onClick={() => {}}
        >
          <SquareArrowDown size={10} className="" />
        </Button> */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs rounded-sm cursor-pointer px-2 h-6 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] bg-secondary"
            title={`Добавить видео за ${topDateWithRemainingFiles.date}`}
            onClick={() => {
              onAddDateFiles(topDateWithRemainingFiles.files)
            }}
          >
            {`${topDateWithRemainingFiles.remainingFiles.length} видео ${topDateWithRemainingFiles.date}`}
            <CopyPlus size={10} className="" />
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-0 items-end justify-center text-xs">
        {allFilesAdded ? (
          <div className="flex items-center gap-1 text-[#49a293] font-medium px-2">
            <span>Все файлы добавлены</span>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs rounded-sm cursor-pointer px-2 h-6 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] bg-secondary"
            title="Добавить все файлы"
            onClick={onAddAllFiles}
          >
            <span className="text-xs px-1">Добавить все</span>
            <CopyPlus size={10} className="" />
          </Button>
        )}
      </div>
    </div>
  )
}
