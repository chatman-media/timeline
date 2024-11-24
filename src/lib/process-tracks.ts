import { AssembledTrack, MediaFile } from "@/types/video"

export function processVideoTracks(mediaFiles: MediaFile[]): {
  videos: MediaFile[]
  timeRange: { min: number; max: number }
  assembledTracks: AssembledTrack[]
} {
  // Сортируем видео по времени создания
  const sortedVideos = mediaFiles.sort((a, b) => {
    const timeA = a.probeData.format.tags?.creation_time
      ? new Date(a.probeData.format.tags.creation_time).getTime()
      : 0
    const timeB = b.probeData.format.tags?.creation_time
      ? new Date(b.probeData.format.tags.creation_time).getTime()
      : 0
    return timeA - timeB
  })

  // Конвертируем в MediaFile
  const videos: MediaFile[] = sortedVideos

  // Вычисляем временной диапазон
  const times = videos.flatMap((v) => {
    if (!v.probeData.format.creation_time) return []
    const startTime = new Date(v.probeData.format.creation_time).getTime()
    const endTime = startTime + (v.probeData.format.duration * 1000) // конвертируем длительность в миллисекунды
    return [startTime, endTime]
  }).filter((t) => t > 0)

  const timeRange = {
    min: Math.floor(Math.min(...times) / 1000),
    max: Math.floor(Math.max(...times) / 1000),
  }

  // Группируем треки
  const videoTracks = videos
    .filter((v) => v.probeData.streams.find((s) => s.codec_type === "video"))
    .map((video, i) => ({
      video,
      index: i + 1,
      isActive: true,
      allVideos: [video],
      type: "video" as const,
      displayName: `V${i + 1}`,
    }))

  const audioOnlyTracks = videos
    .filter((v) => v.probeData.streams.find((s) => s.codec_type === "audio"))
    .map((video, i) => ({
      video,
      index: videoTracks.length + i + 1,
      isActive: true,
      allVideos: [video],
      type: "audio" as const,
      displayName: `A${i + 1}`,
    }))

  return {
    videos,
    timeRange,
    assembledTracks: [...videoTracks, ...audioOnlyTracks],
  }
}
