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
    if (!video || typeof video !== "string") {
      return res.status(400).json({ error: "Video parameter is required" })
    }

    const videoNameWithoutExt = video.split(".").slice(0, -1).join(".")
    const inputPath = join(process.cwd(), "public/videos", video)
    const videoThumbDir = join(
      process.cwd(),
      "public/thumbnails",
      videoNameWithoutExt,
      scale as string,
    )

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: `Video file not found: ${video}` })
    }

    if (!fs.existsSync(videoThumbDir)) {
      fs.mkdirSync(videoThumbDir, { recursive: true })
    }

    const outputPath = join(videoThumbDir, "thumb_0.jpg")
    const command = `ffmpeg -ss 0 -i "${inputPath}" -vframes 1 -vf "scale=320:-1" "${outputPath}"`
    await execAsync(command)

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
