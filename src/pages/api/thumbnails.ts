import type { NextApiRequest, NextApiResponse } from "next"
import { promises as fs } from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import process from "node:process"
import os from "os"

// const execAsync = util.promisify(exec)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { videoPath } = req.query
  const numThumbnails = 20

  try {
    const videoFile = path.join(process.cwd(), "public", videoPath as string)
    const tempDir = path.join(os.tmpdir(), "insta-editor-thumbnails")
    await fs.mkdir(tempDir, { recursive: true })

    // Получаем длительность видео
    const probeData = await ffprobeAsync(videoFile)
    const duration = parseFloat(probeData.format.duration)

    // Генерируем timestamps для скриншотов
    const timestamps = Array.from(
      { length: numThumbnails },
      (_, i) => (duration * i) / (numThumbnails - 1),
    )

    // Генерируем thumbnails
    await Promise.all(timestamps.map((timestamp, index) =>
      new Promise((resolve, reject) => {
        const outputPath = path.join(
          tempDir,
          `${path.parse(videoFile as string).name}_${Date.now()}_${index}.jpg`,
        )

        ffmpeg(videoFile)
          .screenshots({
            timestamps: [timestamp],
            filename: path.basename(outputPath),
            folder: tempDir,
            size: "320x?",
          })
          .on("end", resolve)
          .on("error", reject)
      })
    ))

    res.json({
      thumbnails: timestamps.map((_, index) =>
        `/thumbnails/${path.parse(videoFile as string).name}_${index}.jpg`
      ),
    })
  } catch (error) {
    console.error("Error generating thumbnails:", error)
    res.status(500).json({ error: "Failed to generate thumbnails" })
  }
}
