import { CopyPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MediaFile } from "@/types/videos"
import { getRemainingMediaCounts, getTopDateWithRemainingFiles } from "@/utils/media-file-utils"

interface StatusBarProps {
  media: MediaFile[]
  onAddAllVideoFiles: () => void
  onAddAllAudioFiles: () => void
  onAddDateFiles: (date: string) => void
  onAddAllFiles: () => void
  sortedDates: { date: string; files: MediaFile[] }[]
  addedFiles: Set<string>
}

export function StatusBar({
  media,
  onAddAllVideoFiles,
  onAddAllAudioFiles,
  onAddDateFiles,
  onAddAllFiles,
  sortedDates,
  addedFiles,
}: StatusBarProps) {
  const { remainingVideoCount, remainingAudioCount, allFilesAdded } = getRemainingMediaCounts(
    media,
    addedFiles,
  )
  const topDateWithRemainingFiles = getTopDateWithRemainingFiles(sortedDates, addedFiles)

  return (
    <div className="flex justify-between items-center text-sm w-full p-2 gap-2">
      <div className="flex flex-col items-end justify-center gap-0 text-xs">
        <span className="px-1 flex items-center whitespace-nowrap gap-2">
          {remainingVideoCount && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 cursor-pointer px-2 h-7"
              title="Добавить все видео"
              onClick={onAddAllVideoFiles}
            >
              {remainingVideoCount} видео
              <CopyPlus size={10} className="" />
            </Button>
          )}
          {remainingAudioCount && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 cursor-pointer px-2 h-7"
              title="Добавить все аудио"
              onClick={onAddAllAudioFiles}
            >
              {remainingAudioCount} аудио
              <CopyPlus size={10} className="" />
            </Button>
          )}
        </span>
      </div>
      <div className="flex flex-col items-end justify-center gap-1 text-xs">
        {topDateWithRemainingFiles && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1 cursor-pointer px-2 h-7"
            title={`Добавить видео за ${topDateWithRemainingFiles.date}`}
            onClick={() => onAddDateFiles(topDateWithRemainingFiles.date)}
          >
            {`${topDateWithRemainingFiles.remainingFiles.length} видео ${topDateWithRemainingFiles.date}`}
            <CopyPlus size={10} className="" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-0 items-end justify-center text-xs">
        {allFilesAdded ? (
          <div className="flex items-center gap-1 text-[#49a293] font-medium px-2">
            <span>Все файлы добавлены</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1 cursor-pointer px-1 h-7"
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
