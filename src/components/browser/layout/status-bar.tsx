import { MediaFile } from "@/types/videos"
import { getFileType } from "@/utils/media-utils"

import { ActionButton } from "./action-button"

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
  const [maxDateInfo, secondMaxDateInfo] = sortedDates

  const hasAudioStream = (file: MediaFile) => {
    return file.probeData?.streams?.some(stream => stream.codec_type === "audio")
  }

  // Подсчитываем количество оставшихся файлов каждого типа
  const remainingVideoCount = media.filter((f) => {
    return getFileType(f) === "video" && f.path && !addedFiles.has(f.path) && hasAudioStream(f)
  }).length

  const remainingAudioCount = media.filter((f) => {
    return getFileType(f) === "audio" && f.path && !addedFiles.has(f.path) && hasAudioStream(f)
  }).length

  // Проверяем, все ли файлы уже добавлены
  const allFilesAdded =
    media.length > 0 &&
    media.filter(hasAudioStream).every((file) => file.path && addedFiles.has(file.path))

  // Если все файлы добавлены, не показываем строку состояния
  if (allFilesAdded) {
    return null
  }

  // Функция для подсчета оставшихся файлов за определенную дату
  const getRemainingFilesForDate = (dateInfo: { date: string; files: MediaFile[] }) => {
    return dateInfo.files.filter((file) => 
      !file.path || !addedFiles.has(file.path) && hasAudioStream(file)
    )
  }

  const remainingMaxDateFiles = maxDateInfo ? getRemainingFilesForDate(maxDateInfo) : []
  const remainingSecondMaxDateFiles = secondMaxDateInfo
    ? getRemainingFilesForDate(secondMaxDateInfo)
    : []

  return (
    <div className="flex justify-between items-center text-sm w-full h-[28px] bg-background dark:bg-[#1a1a1a] p-[4px] pt-0 border-t border-border">
      <div className="flex flex-col items-end justify-center gap-0 text-xs text-gray-700 dark:text-gray-300">
        <span className="px-1 flex items-center whitespace-nowrap gap-2">
          {remainingVideoCount > 0 && (
            <ActionButton title="Добавить все видео" onClick={onAddAllVideoFiles}>
              {remainingVideoCount} видео
            </ActionButton>
          )}
          {remainingAudioCount > 0 && (
            <ActionButton title="Добавить все аудио" onClick={onAddAllAudioFiles}>
              {remainingAudioCount} аудио
            </ActionButton>
          )}
        </span>
      </div>
      <div className="flex flex-col items-end justify-center gap-0 text-xs">
        {maxDateInfo && remainingMaxDateFiles.length > 0 && (
          <ActionButton
            title="Добавить видео за эту дату"
            onClick={() => onAddDateFiles(maxDateInfo.date)}
          >
            {`${remainingMaxDateFiles.length} видео ${maxDateInfo.date}`}
          </ActionButton>
        )}
      </div>
      <div className="flex flex-col gap-0 items-end justify-center text-xs">
        {!allFilesAdded && (
          <ActionButton title="Добавить все файлы" onClick={onAddAllFiles}>
            Добавить все
          </ActionButton>
        )}
      </div>
    </div>
  )
}
