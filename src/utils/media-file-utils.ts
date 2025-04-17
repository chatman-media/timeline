import { MediaFile } from "@/types/media"
import { getFileType } from "@/utils/media-utils"

export function hasAudioStream(file: MediaFile): boolean {
  return file.probeData?.streams?.some((stream) => stream.codec_type === "audio") ?? false
}

export function getRemainingMediaCounts(media: MediaFile[], addedFiles: Set<string>): {
  remainingVideoCount: number
  remainingAudioCount: number
  allFilesAdded: boolean
} {
  const remainingVideoCount = media.filter(
    (f) => getFileType(f) === "video" && f.path && !addedFiles.has(f.path) && hasAudioStream(f),
  ).length

  const remainingAudioCount = media.filter(
    (f) => getFileType(f) === "audio" && f.path && !addedFiles.has(f.path) && hasAudioStream(f),
  ).length

  const allFilesAdded =
    media.length > 0 &&
    media.filter(hasAudioStream).every((file) => file.path && addedFiles.has(file.path))

  return {
    remainingVideoCount,
    remainingAudioCount,
    allFilesAdded,
  }
}

export function getRemainingFilesForDate(
  dateInfo: { date: string; files: MediaFile[] },
  addedFiles: Set<string>,
): MediaFile[] {
  return dateInfo.files.filter(
    (file) => !file.path || (!addedFiles.has(file.path) && hasAudioStream(file)),
  )
}

export function getTopDateWithRemainingFiles(
  sortedDates: { date: string; files: MediaFile[] }[],
  addedFiles: Set<string>,
): { date: string; files: MediaFile[]; remainingFiles: MediaFile[] } | undefined {
  const datesByFileCount = [...sortedDates].sort((a, b) => b.files.length - a.files.length)

  return datesByFileCount
    .map((dateInfo) => ({
      ...dateInfo,
      remainingFiles: getRemainingFilesForDate(dateInfo, addedFiles),
    }))
    .find((dateInfo) => dateInfo.remainingFiles.length > 0)
}
