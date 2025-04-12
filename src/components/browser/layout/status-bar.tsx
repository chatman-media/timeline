import { Check } from "lucide-react"

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
  // Сортируем даты по количеству видео (от большего к меньшему)
  const datesByFileCount = [...sortedDates].sort((a, b) => b.files.length - a.files.length)

  const hasAudioStream = (file: MediaFile) => {
    return file.probeData?.streams?.some((stream) => stream.codec_type === "audio")
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

  // Функция для подсчета оставшихся файлов за определенную дату
  const getRemainingFilesForDate = (dateInfo: { date: string; files: MediaFile[] }) => {
    return dateInfo.files.filter(
      (file) => !file.path || (!addedFiles.has(file.path) && hasAudioStream(file)),
    )
  }

  // Получаем дату с наибольшим количеством оставшихся файлов
  const topDateWithRemainingFiles = datesByFileCount
    .map((dateInfo) => ({
      ...dateInfo,
      remainingFiles: getRemainingFilesForDate(dateInfo),
    }))
    .find((dateInfo) => dateInfo.remainingFiles.length > 0)

  return (
    <div className="flex justify-between items-center text-sm w-full h-8 p-[4px] pt-0 border-t border-border">
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
        {topDateWithRemainingFiles && (
          <ActionButton
            title={`Добавить видео за ${topDateWithRemainingFiles.date}`}
            onClick={() => onAddDateFiles(topDateWithRemainingFiles.date)}
          >
            {`${topDateWithRemainingFiles.remainingFiles.length} видео ${topDateWithRemainingFiles.date}`}
          </ActionButton>
        )}
      </div>
      <div className="flex flex-col gap-0 items-end justify-center text-xs">
        {allFilesAdded ? (
          <div className="flex items-center gap-1 text-[#3ebfb2] font-medium px-2">
            <Check size={14} />
            <span>Все файлы добавлены</span>
          </div>
        ) : (
          <ActionButton title="Добавить все файлы" onClick={onAddAllFiles}>
            Добавить все
          </ActionButton>
        )}
      </div>
    </div>
  )
}
