import type { MediaFile, TimeRange } from "@/types/videos"

// Получает сигнатуру видео, извлекая информацию о кодеке, разрешении, соотношении сторон и частоте кадров
export const getVideoSignature = (video: MediaFile) => {
  const videoStream = video.probeData?.streams.find((s) => s.codec_type === "video")
  return {
    codec: videoStream?.codec_name,
    width: videoStream?.width,
    height: videoStream?.height,
    aspectRatio: videoStream?.display_aspect_ratio,
    frameRate: videoStream?.r_frame_rate,
  }
}

// Сравнивает два видео, чтобы определить, имеют ли они одинаковый тип (кодек, разрешение, соотношение сторон и частоту кадров)
export const isSameVideoType = (video1: MediaFile, video2: MediaFile): boolean => {
  const sig1 = getVideoSignature(video1)
  const sig2 = getVideoSignature(video2)

  return sig1.codec === sig2.codec &&
    sig1.width === sig2.width &&
    sig1.height === sig2.height &&
    sig1.aspectRatio === sig2.aspectRatio &&
    sig1.frameRate === sig2.frameRate
}

// Вычисляет временные диапазоны для массива видео, основываясь на времени создания и продолжительности каждого видео
export const calculateTimeRanges = (videos: MediaFile[]): TimeRange[] => {
  const times = videos.flatMap((v: MediaFile) => {
    const startTime = new Date(v.probeData?.format.tags?.creation_time || 0).getTime()
    const duration = v.probeData?.format.duration || 0
    const endTime = startTime + duration * 1000
    return [startTime, endTime]
  })

  if (times.length === 0) return []

  const sortedTimes = times.sort((a: number, b: number) => a - b)
  const ranges: TimeRange[] = []
  let currentRange = {
    start: Math.floor(sortedTimes[0] / 1000),
    end: Math.floor(sortedTimes[0] / 1000),
    duration: Math.floor(sortedTimes[1] / 1000) - Math.floor(sortedTimes[0] / 1000),
  }

  for (let i = 1; i < sortedTimes.length; i++) {
    const currentTime = Math.floor(sortedTimes[i] / 1000)
    const gap = currentTime - currentRange.end

    if (gap > 3600) {
      ranges.push(currentRange)
      currentRange = {
        start: currentTime,
        end: currentTime,
        duration: 0,
      }
    } else {
      currentRange.end = currentTime
    }
  }
  ranges.push(currentRange)

  return ranges
} 