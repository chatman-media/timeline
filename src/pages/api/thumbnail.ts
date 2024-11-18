import { NextApiRequest, NextApiResponse } from "next"
import { join } from "path"
import fs from "fs"
import { exec } from "child_process"
import util from "util"
import process from "node:process"

const execAsync = util.promisify(exec)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { video, scale = "1min" } = req.query
    console.log("Received request with params:", { video, scale })

    if (!video || typeof video !== "string") {
      console.log("Missing or invalid video parameter")
      return res.status(400).json({ error: "Video parameter is required" })
    }

    // Базовые пути
    const videoNameWithoutExt = video.split(".").slice(0, -1).join(".")
    const inputPath = join(process.cwd(), "public/videos", video)
    const videoThumbDir = join(process.cwd(), "public/thumbnails", videoNameWithoutExt, scale)

    console.log("Paths:", {
      inputPath,
      videoThumbDir,
    })

    // Проверяем существование видео
    if (!fs.existsSync(inputPath)) {
      console.log("Video file not found at:", inputPath)
      return res.status(404).json({ error: `Video file not found: ${video}` })
    }

    // Создаем директорию для thumbnails
    if (!fs.existsSync(videoThumbDir)) {
      fs.mkdirSync(videoThumbDir, { recursive: true })
    }

    // Тестовый thumbnail
    const outputPath = join(videoThumbDir, `thumb_0.jpg`)

    console.log("Executing ffmpeg command...")
    const command = `ffmpeg -ss 0 -i "${inputPath}" -vframes 1 -vf "scale=320:-1" "${outputPath}"`

    const { _, stderr } = await execAsync(command)
    if (stderr) {
      console.log("FFMPEG stderr:", stderr)
    }

    res.json({
      success: true,
      thumbnail: `/thumbnails/${videoNameWithoutExt}/${scale}/thumb_0.jpg`,
    })
  } catch (error) {
    console.error("Detailed error:", error)
    res.status(500).json({
      error: String(error),
      details: error instanceof Error ? error.stack : undefined,
    })
  }
}
