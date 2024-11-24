import { AssembledTrack } from "@/types/video"

interface AudioScore {
  cameraIndex: number
  score: number
}

/**
 * Анализирует качество аудио для заданного временного сегмента по всем камерам
 *
 * @param startTime - Время начала сегмента (unix timestamp в секундах)
 * @param endTime - Время окончания сегмента (unix timestamp в секундах)
 * @param assembledTracks - Массив собранных видеодорожек с метаданными
 * @returns Массив оценок качества аудио для каждой камеры
 */
export const analyzeAudioForSegment = (
  startTime: number,
  endTime: number,
  assembledTracks: AssembledTrack[],
): AudioScore[] => {
  const audioScores = assembledTracks.map((track) => {
    const videos = track.allMedia
    let score = 0

    // Находим видео, содержащее этот временной отрезок
    const video = videos.find((v) => {
      const videoStart = new Date(v.probeData.format.creation_time!).getTime() / 1000
      const videoEnd = videoStart + v.probeData.format.duration!
      return videoStart <= startTime && videoEnd >= endTime
    })

    if (video?.probeData.streams?.find((s) => s.codec_type === "audio")) {
      // Учитываем битрейт аудио
      score += (video.probeData.streams?.find((s) =>
        s.codec_type === "audio"
      )?.bit_rate / 1000000) || 0 // Нормализуем к мегабитам

      // Учитываем количество каналов
      score *= video.probeData.streams?.find((s) => s.codec_type === "audio")?.channels || 1
    }

    return {
      cameraIndex: track.index,
      score,
    }
  })

  return audioScores
}

export function parseAudioAnalysis(data: string) {
  const analysis = {
    silenceRanges: [] as { start: number; end: number }[],
    loudness: {
      integrated: 0,
      range: 0,
      peak: 0,
    },
  }

  // Парсим результаты silence detect
  const silenceMatches = data.matchAll(/silence_start: (\d+\.?\d*)|silence_end: (\d+\.?\d*)/g)
  let start: number | null = null

  for (const match of silenceMatches) {
    if (match[1]) { // silence_start
      start = parseFloat(match[1])
    } else if (match[2] && start !== null) { // silence_end
      analysis.silenceRanges.push({
        start,
        end: parseFloat(match[2]),
      })
      start = null
    }
  }

  // Парсим результаты EBU R128
  const loudnessMatch = data.match(
    /I:\s*([-\d.]+)\s*LUFS.*LRA:\s*([-\d.]+)\s*LU.*Peak:\s*([-\d.]+)\s*dBFS/s,
  )
  if (loudnessMatch) {
    analysis.loudness = {
      integrated: parseFloat(loudnessMatch[1]),
      range: parseFloat(loudnessMatch[2]),
      peak: parseFloat(loudnessMatch[3]),
    }
  }

  return analysis
}
