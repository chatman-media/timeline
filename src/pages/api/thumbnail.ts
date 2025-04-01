import process from "node:process"

import ffmpeg from "fluent-ffmpeg"
import fs from "fs/promises"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { video, timestamp } = req.query

  if (!video || typeof video !== "string" || !timestamp || typeof timestamp !== "string") {
    return res.status(400).json({ error: "Invalid video or timestamp parameters" })
  }

  try {
    const videoPath = path.join(process.cwd(), "public", "videos", video)
    const thumbnailName = `${path.parse(video).name}_${timestamp}.jpg`
    const thumbnailPath = path.join(process.cwd(), "public", "videos", thumbnailName)
    const publicPath = `/media/${thumbnailName}`

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
          .on("error", (err) => {
            console.error("FFmpeg error:", err)
            reject(err)
          })
      })

      // Проверяем, что файл действительно создался
      try {
        await fs.access(thumbnailPath)
        return res.json({ thumbnail: publicPath })
      } catch {
        throw new Error("Failed to generate thumbnail")
      }
    }
  } catch (error) {
    console.error("Error generating thumbnail:", error)
    res.status(500).json({
      error: "Failed to generate thumbnail",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
