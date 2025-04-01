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

  // Подсчитываем количество оставшихся файлов каждого типа
  const remainingVideoCount = media.filter((f) => {
    const fileId = f.id || `${f.path}-${f.name}`
    return getFileType(f) === "video" && !addedFiles.has(fileId)
  }).length

  const remainingAudioCount = media.filter((f) => {
    const fileId = f.id || `${f.path}-${f.name}`
    return getFileType(f) === "audio" && !addedFiles.has(fileId)
  }).length

  // Проверяем, все ли файлы уже добавлены
  const allFilesAdded =
    media.length > 0 &&
    media.every((file) => {
      const fileId = file.id || `${file.path}-${file.name}`
      return addedFiles.has(fileId)
    })

  // Если все файлы добавлены, не показываем строку состояния
  if (allFilesAdded) {
    return null
  }

  // Функция для подсчета оставшихся файлов за определенную дату
  const getRemainingFilesForDate = (dateInfo: { date: string; files: MediaFile[] }) => {
    return dateInfo.files.filter((file) => {
      const fileId = file.id || `${file.path}-${file.name}`
      return !addedFiles.has(fileId)
    })
  }

  const remainingMaxDateFiles = maxDateInfo ? getRemainingFilesForDate(maxDateInfo) : []
  const remainingSecondMaxDateFiles = secondMaxDateInfo ? getRemainingFilesForDate(secondMaxDateInfo) : []

  return (
    <div className="flex justify-between items-center text-sm w-full h-[24px] bg-background dark:bg-[#1a1a1a] p-[3px] border-t border-border">
      <div className="flex flex-col items-end justify-center gap-0 text-xs text-gray-700 dark:text-gray-300">
        <span className="px-1 flex items-center whitespace-nowrap gap-1">
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
        {secondMaxDateInfo && remainingSecondMaxDateFiles.length > 0 && (
          <ActionButton
            title="Добавить видео за эту дату"
            onClick={() => onAddDateFiles(secondMaxDateInfo.date)}
          >
            {`${remainingSecondMaxDateFiles.length} видео ${secondMaxDateInfo.date}`}
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
