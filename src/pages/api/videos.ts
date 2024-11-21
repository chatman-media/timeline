// pages/api/videos.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { promises as fs } from "fs"
import path from "path"
import { promisify } from "util"
import ffmpeg, { ffprobe } from "fluent-ffmpeg"
import process from "node:process"
import { AudioStream, VideoMetadata, VideoStream } from "@/types/metadata"
import { VideoInfo } from "@/types/video"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ videos: VideoInfo[] }>,
) {
  try {
    const videosDir = path.join(process.cwd(), "public", "videos")

    // Проверяем существование директории
    await fs.mkdir(videosDir, { recursive: true })

    // Получаем список файлов
    const files = await fs.readdir(videosDir)

    // Фильтруем файлы, оставляя только видео файлы
    const videoFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return [".mp4", ".mov", ".avi", ".mkv", ".webm", ".insv"].includes(ext) &&
        !file.startsWith(".") // Пропускаем скрытые файлы
    })

    // Обрабатываем все файлы параллельно
    const videosPromises = videoFiles.map(async (filename) => {
      try {
        const filePath = path.join(videosDir, filename)
        // Создаем директорию для thumbnails, если её нет
        const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails")
        await fs.mkdir(thumbnailsDir, { recursive: true })

        // Генерируем имя для thumbnail
        const thumbnailName = `${path.parse(filename).name}.jpg`

        // Извлекаем первй кадр
        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .screenshots({
              timestamps: [0],
              filename: thumbnailName,
              folder: thumbnailsDir,
              size: "320x?", // ширина 320px, высота пропорционально
            })
            .on("end", resolve)
            .on("error", reject)
        })

        // Получаем информацию о файле
        const fileStats = await fs.stat(filePath)

        // Пропускаем директории
        if (fileStats.isDirectory()) {
          return null
        }

        // Получаем метаданные через ffprobe
        const probeData = await ffprobeAsync(filePath) as FFProbeData

        // Находим видео и аудио потоки
        const videoStream = probeData.streams.find(
          (stream: VideoStream) => stream.codec_type === "video",
        )
        const audioStream = probeData.streams.find(
          (stream: AudioStream) => stream.codec_type === "audio",
        )

        // Формируем метаданные
        const metadata: VideoMetadata = {
          format: {
            filename: path.basename(filePath),
            format_name: probeData.format.format_name,
            format_long_name: probeData.format.format_long_name,
            duration: parseFloat(probeData.format.duration),
            size: probeData.format.size,
            bit_rate: parseInt(probeData.format.bit_rate),
            start_time: parseFloat(probeData.format.start_time || "0"),
            nb_streams: probeData.format.nb_streams,
            probe_score: probeData.format.probe_score,
          },
          video_stream: videoStream
            ? {
              codec_name: videoStream.codec_name,
              codec_long_name: videoStream.codec_long_name,
              width: videoStream.width || 0,
              height: videoStream.height || 0,
              display_aspect_ratio: videoStream.display_aspect_ratio || "",
              fps: Function(`"use strict"; return (${videoStream.r_frame_rate || "0"})`)(),
              bit_rate: parseInt(videoStream.bit_rate || "0"),
              pix_fmt: videoStream.pix_fmt,
              color_space: videoStream.color_space,
              color_range: videoStream.color_range,
              level: videoStream.level,
              is_avc: videoStream.is_avc,
              frame_count: parseInt(videoStream.nb_frames || "0"),
            }
            : undefined,
          audio_stream: audioStream
            ? {
              codec_name: audioStream.codec_name,
              codec_long_name: audioStream.codec_long_name,
              sample_rate: audioStream.sample_rate || "",
              channels: audioStream.channels || 0,
              bit_rate: parseInt(audioStream.bit_rate || "0"),
            }
            : undefined,
          creation_time: probeData.format.tags?.creation_time,
          tags: probeData.format.tags,
        }

        // Calculate bitrate data points
        const duration = parseFloat(probeData.format.duration)
        const totalBitrate = parseInt(probeData.format.bit_rate)
        const dataPoints = 100 // Number of data points to generate
        const interval = duration / dataPoints

        // Generate sample bitrate data (you may want to replace this with actual data)
        const bitrate_data = Array.from({ length: dataPoints }, (_, i) => ({
          timestamp: i * interval,
          bitrate: totalBitrate * (0.8 + Math.random() * 0.4), // Random variation ±20%
        }))

        return {
          name: filename,
          path: `/videos/${filename}`,
          thumbnail: `/thumbnails/${thumbnailName}`,
          metadata,
          bitrate_data,
        }
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error)
        return null
      }
    })

    // Ждем завершения всех промисов и фильтруем null значения
    const videos = (await Promise.all(videosPromises)).filter(
      (video): video is VideoInfo => video !== null,
    )

    res.status(200).json({ videos })
  } catch (error) {
    console.error("Error processing videos:", error)
    res.status(500).json({ videos: [] })
  }
}
