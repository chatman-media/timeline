import process from "node:process"
import { ffprobe, FfprobeData } from "fluent-ffmpeg"
import * as fs from "node:fs/promises"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { promisify } from "util"

import { MediaFile } from "@/types/videos"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[] }>,
) {
  try {
    const videosDir = path.join(process.cwd(), "public", "videos")
    await fs.mkdir(videosDir, { recursive: true })

    const videoFiles = await fs.readdir(videosDir)
    const mediaFiles = videoFiles
      .map((file) => ({ dir: videosDir, file, type: "videos" }))
      .filter(({ file }) => !file.startsWith("."))

    const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails")
    await fs.mkdir(thumbnailsDir, { recursive: true })

    const mediaPromises = mediaFiles.map(async ({ dir, file, type }) => {
      try {
        const filePath = path.join(dir, file)
        const thumbnailName = `${path.parse(file).name}.jpg`
        const probeData = await ffprobeAsync(filePath) as FfprobeData
        const isVideo = probeData.streams.some((stream) => stream.codec_type === "video")

        return {
          name: file,
          path: `/${type}/${file}`,
          thumbnail: isVideo ? `/thumbnails/${thumbnailName}` : undefined,
          probeData,
          isVideo,
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error)
        return null
      }
    })

    const media = (await Promise.all(mediaPromises)).filter(
      (item) => item !== null,
    )

    res.status(200).json({ media })
  } catch (error) {
    console.error("Error processing media:", error)
    res.status(500).json({ media: [] })
  }
}
