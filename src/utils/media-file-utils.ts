import { MediaFile } from "@/types/media"
import { getFileType } from "@/utils/media-utils"

export function hasAudioStream(file: MediaFile): boolean {
  const hasAudio = file.probeData?.streams?.some((stream) => stream.codec_type === "audio") ?? false
  console.log(`[hasAudioStream] ${file.name}:`, hasAudio)
  return hasAudio
}

export function getRemainingMediaCounts(
  media: MediaFile[],
  addedFiles: Set<string>,
): {
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
  const isVideoWithAudio = (file: MediaFile) => {
    const hasVideo = file.probeData?.streams?.some((s) => s.codec_type === "video")
    const hasAudio = file.probeData?.streams?.some((s) => s.codec_type === "audio")
    console.log(`[getRemainingFilesForDate] ${file.name}: video=${hasVideo}, audio=${hasAudio}`)
    return hasVideo && hasAudio
  }

  return dateInfo.files.filter(
    (file) => !addedFiles.has(file.path) && isVideoWithAudio(file)
  )
}

export function getTopDateWithRemainingFiles(
  sortedDates: { date: string; files: MediaFile[] }[],
  addedFiles: Set<string>,
): { date: string; files: MediaFile[]; remainingFiles: MediaFile[] } | undefined {
  const isVideoWithAudio = (file: MediaFile) => {
    const hasVideo = file.probeData?.streams?.some((s) => s.codec_type === "video")
    const hasAudio = file.probeData?.streams?.some((s) => s.codec_type === "audio")
    console.log(`[getTopDateWithRemainingFiles] ${file.name}: video=${hasVideo}, audio=${hasAudio}`)
    return hasVideo && hasAudio
  }

  const datesByFileCount = [...sortedDates].sort((a, b) => {
    const aCount = a.files.filter((f) => !addedFiles.has(f.path) && isVideoWithAudio(f)).length
    const bCount = b.files.filter((f) => !addedFiles.has(f.path) && isVideoWithAudio(f)).length
    return bCount - aCount
  })

  const result = datesByFileCount
    .map((dateInfo) => ({
      ...dateInfo,
      remainingFiles: dateInfo.files.filter(
        (file) => !addedFiles.has(file.path) && isVideoWithAudio(file)
      ),
    }))
    .find((dateInfo) => dateInfo.remainingFiles.length > 0)

  console.log('[getTopDateWithRemainingFiles] Result:', {
    date: result?.date,
    remainingFilesCount: result?.remainingFiles.length,
    files: result?.remainingFiles.map(f => f.name)
  })

  return result
}
