import { ffprobe, FfprobeData } from "fluent-ffmpeg"
import { promisify } from "util"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)

// Функция для получения информации о видео
export async function getMediaFile(videoPath: string): Promise<FfprobeData> {
  try {
    console.log("Probing file:", videoPath)
    const probeData = (await ffprobeAsync(videoPath)) as FfprobeData
    console.log("Probe successful for:", videoPath, {
      format: probeData.format,
      streams: probeData.streams.map((s) => s.codec_type),
    })
    return probeData
  } catch (error) {
    console.error(`Error probing file ${videoPath}:`, error)
    throw error
  }
}
