// pages/api/videos.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { promises as fs } from "fs"
import path from "path"
import { promisify } from "util"
import ffmpeg, { ffprobe, FfprobeData } from "fluent-ffmpeg"
import process from "node:process"
import { MediaFile } from "@/types/video"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[] }>,
) {
  try {
    const videosDir = path.join(process.cwd(), "public", "videos")

    // Проверяем существование директории
    await fs.mkdir(videosDir, { recursive: true })

    // Получаем список файлов
    const files = await fs.readdir(videosDir)

    // Фильтруем файлы по расширению
    const mediaFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return (
        [
          ".mp4",
          ".mov",
          ".avi",
          ".mkv",
          ".webm",
          ".insv", // видео форматы
          ".mp3",
          ".wav",
          ".aac",
          ".ogg",
          ".flac",
        ] // аудио форматы
      ).includes(ext) &&
        !file.startsWith(".") // Пропускаем скрытые файлы
    })

    const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails")
    await fs.mkdir(thumbnailsDir, { recursive: true })

    // Обрабатываем все файлы параллельно
    const mediaPromises = mediaFiles.map(async (filename) => {
      try {
        const filePath = path.join(videosDir, filename)
        const thumbnailName = `${path.parse(filename).name}.jpg`
        const fileStats = await fs.stat(filePath)

        if (fileStats.isDirectory()) return null

        // Получаем метаданные через ffprobe
        const probeData = await ffprobeAsync(filePath) as FfprobeData

        // Проверяем тип медиа
        const isVideo = probeData.streams.some((stream) => stream.codec_type === "video")

        // Генерируем превью только для видео файлов
        if (isVideo) {
          await new Promise((resolve, reject) => {
            ffmpeg(filePath)
              .screenshots({
                timestamps: [0],
                filename: thumbnailName,
                folder: thumbnailsDir,
                size: "320x?",
              })
              .on("end", resolve)
              .on("error", reject)
          })
        }

        return {
          name: filename,
          path: `/videos/${filename}`,
          thumbnail: isVideo ? `/thumbnails/${thumbnailName}` : null,
          probeData,
          isVideo,
        }
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error)
        return null
      }
    })

    const media = (await Promise.all(mediaPromises)).filter(
      (item): item is MediaFile => item !== null,
    )

    res.status(200).json({ media: media })
  } catch (error) {
    console.error("Error processing media:", error)
    res.status(500).json({ media: [] })
  }
}
