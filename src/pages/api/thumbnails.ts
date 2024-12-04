import process from "node:process"

import ffmpeg from "fluent-ffmpeg"
import fs from "fs/promises"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"

export interface ThumbnailRequest {
  video: string
  start: number
  end: number
  count: number
}

export interface ThumbnailResponse {
  thumbnails: string[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThumbnailResponse>,
) {
  const { video, start, end, count } = req.query as unknown as ThumbnailRequest

  if (!video || typeof video !== "string" || !start || !end || !count) {
    return res.status(400).json({
      thumbnails: [],
      error: "Invalid parameters. Required: video, start, end, count",
    })
  }

  try {
    const videoPath = path.join(process.cwd(), "public", "videos", video)
    const thumbnailDir = path.join(process.cwd(), "public", "thumbnails")

    // Проверяем существование видео файла
    try {
      await fs.access(videoPath)
    } catch {
      return res.status(404).json({
        thumbnails: [],
        error: "Video file not found",
      })
    }

    // Создаем директорию для миниатюр если её нет
    await fs.mkdir(thumbnailDir, { recursive: true })

    // Рассчитываем временные метки для миниатюр
    const timeStep = (end - start) / count
    const timestamps = Array.from({ length: count }, (_, i) => start + timeStep * i)

    // Генерируем имена файлов для миниатюр
    const thumbnailNames = timestamps.map(
      (timestamp) => `${path.parse(video).name}_${timestamp}.webp`,
    )

    // Проверяем какие миниатюры уже существуют
    const existingThumbnails = await Promise.all(
      thumbnailNames.map(async (name) => {
        const thumbnailPath = path.join(thumbnailDir, name)
        try {
          await fs.access(thumbnailPath)
          return `/thumbnails/${name}`
        } catch {
          return null
        }
      }),
    )

        // Определяем какие миниатюры нужно сгенерировать
        const missingIndexes = existingThumbnails
        .map((thumb, index) => (thumb === null ? index : -1))
        .filter((index) => index !== -1)
  
      // Генерируем недостающие миниатюры
      if (missingIndexes.length > 0) {
        await Promise.all(
          missingIndexes.map((index) =>
            new Promise<void>((resolve, reject) => {
              ffmpeg(videoPath)
                .screenshots({
                  timestamps: [timestamps[index]],
                  filename: thumbnailNames[index],
                  folder: thumbnailDir,
                  size: "320x180",
                })
                .outputOptions(["-c:v libwebp", "-quality 80"]) // Используем WebP для лучшего сжатия
                .on("end", () => resolve())
                .on("error", (err) => {
                  console.error("FFmpeg error:", err)
                  reject(err)
                })
            })
          ),
        )
      }

    // Формируем итоговый массив путей к миниатюрам
    const thumbnails = thumbnailNames.map((name) => `/thumbnails/${name}`)

    res.json({ thumbnails })
  } catch (error) {
    console.error("Error generating thumbnails:", error)
    res.status(500).json({
      thumbnails: [],
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
