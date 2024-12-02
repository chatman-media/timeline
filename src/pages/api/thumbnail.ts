import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import fs from "fs/promises"
import ffmpeg from "fluent-ffmpeg"
import process from "node:process"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { video, timestamp } = req.query

  if (!video || !timestamp) {
    return res.status(400).json({ error: "Video and timestamp parameters are required" })
  }

  try {
    const videoPath = path.join(process.cwd(), "public", "videos", video as string)
    const thumbnailName = `${path.parse(video as string).name}_${timestamp}.jpg`
    const thumbnailPath = path.join(process.cwd(), "public", "videos", thumbnailName)
    const publicPath = `/videos/${thumbnailName}`

    // Проверяем существование видео файла
    try {
      await fs.access(videoPath)
    } catch {
      return res.status(404).json({ error: "Video file not found" })
    }

    // Проверяем существование превью
    try {
      await fs.access(thumbnailPath)
      return res.json({ thumbnail: publicPath })
    } catch {
      // Если файл не существует, генерируем новый
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [Number(timestamp)],
            filename: thumbnailName,
            folder: path.join(process.cwd(), "public", "videos"),
            size: "320x?",
          })
          .on("end", resolve)
          .on("error", reject)
      })

      res.json({ thumbnail: publicPath })
    }
  } catch (error) {
    console.error("Error generating thumbnail:", error)
    res.status(500).json({ error: "Failed to generate thumbnail" })
  }
}
