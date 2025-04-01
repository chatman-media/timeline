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

  const videoCount = media.filter((f) => getFileType(f) === "video").length
  const audioCount = media.filter((f) => getFileType(f) === "audio").length

  // Проверяем, все ли файлы уже добавлены
  const allFilesAdded =
    media.length > 0 &&
    media.every((file) => {
      const fileId = file.id || `${file.path}-${file.name}`
      return addedFiles.has(fileId)
    })

  // Проверяем, все ли видео файлы добавлены
  const allVideoFilesAdded =
    videoCount > 0 &&
    media
      .filter((f) => getFileType(f) === "video")
      .every((file) => {
        const fileId = file.id || `${file.path}-${file.name}`
        return addedFiles.has(fileId)
      })

  // Проверяем, все ли аудио файлы добавлены
  const allAudioFilesAdded =
    audioCount > 0 &&
    media
      .filter((f) => getFileType(f) === "audio")
      .every((file) => {
        const fileId = file.id || `${file.path}-${file.name}`
        return addedFiles.has(fileId)
      })

  return (
    <div className="flex justify-between items-center text-sm w-full h-[24px] bg-background dark:bg-[#1a1a1a] p-[3px] border-t border-border">
      <div className="flex flex-col items-end justify-center gap-0 text-xs text-gray-700 dark:text-gray-300">
        <span className="px-1 flex items-center whitespace-nowrap gap-1">
          {videoCount > 0 && !allVideoFilesAdded ? (
            <ActionButton title="Добавить все видео" onClick={onAddAllVideoFiles}>
              {videoCount} видео
            </ActionButton>
          ) : (
            videoCount > 0 && <span className="px-2 py-0.5 text-gray-400">{videoCount} видео</span>
          )}
          {audioCount > 0 && !allAudioFilesAdded ? (
            <ActionButton title="Добавить все аудио" onClick={onAddAllAudioFiles}>
              {audioCount} аудио
            </ActionButton>
          ) : (
            audioCount > 0 && <span className="px-2 py-0.5 text-gray-400">{audioCount} аудио</span>
          )}
        </span>
      </div>
      <div className="flex flex-col items-end justify-center gap-0 text-xs">
        {maxDateInfo && (
          <>
            {!maxDateInfo.files.every((file) => {
              const fileId = file.id || `${file.path}-${file.name}`
              return addedFiles.has(fileId)
            }) ? (
              <ActionButton
                title="Добавить видео за эту дату"
                onClick={() => onAddDateFiles(maxDateInfo.date)}
              >
                {`${maxDateInfo.files.length} видео ${maxDateInfo.date}`}
              </ActionButton>
            ) : (
              <span className="px-2 py-0.5 text-gray-400">
                {`${maxDateInfo.files.length} видео ${maxDateInfo.date}`}
              </span>
            )}
          </>
        )}
        {secondMaxDateInfo && (
          <>
            {!secondMaxDateInfo.files.every((file) => {
              const fileId = file.id || `${file.path}-${file.name}`
              return addedFiles.has(fileId)
            }) ? (
              <ActionButton
                title="Добавить видео за эту дату"
                onClick={() => onAddDateFiles(secondMaxDateInfo.date)}
              >
                {`${secondMaxDateInfo.files.length} видео ${secondMaxDateInfo.date}`}
              </ActionButton>
            ) : (
              <span className="px-2 py-0.5 text-gray-400">
                {`${secondMaxDateInfo.files.length} видео ${secondMaxDateInfo.date}`}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex flex-col gap-0 items-end justify-center text-xs">
        {!allFilesAdded ? (
          <ActionButton title="Добавить все файлы" onClick={onAddAllFiles}>
            Добавить все
          </ActionButton>
        ) : (
          <span className="px-2 py-0.5 text-gray-400">Все добавлено</span>
        )}
      </div>
    </div>
  )
}
