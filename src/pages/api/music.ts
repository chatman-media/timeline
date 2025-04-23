import process from "node:process"

import { ffprobe, FfprobeData } from "fluent-ffmpeg"
import { promises as fs } from "fs"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { promisify } from "util"

import { MediaFile } from "@/types/media"

const ffprobeAsync = promisify(ffprobe)
const metadataCache = new Map<string, FfprobeData>()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[]; total: number }>,
) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate")
  try {
    const musicDir = path.join(process.cwd(), "public", "music")
    await fs.mkdir(musicDir, { recursive: true })
    const musicFiles = await fs.readdir(musicDir)

    // Фильтруем файлы
    const filteredFiles = musicFiles
      .map((file) => ({ dir: musicDir, file, type: "music" }))
      .filter(({ file }) => {
        const ext = path.extname(file).toLowerCase()
        return (
          [".mp3", ".wav", ".aac", ".ogg", ".flac", ".aiff"].includes(ext) && !file.startsWith(".")
        )
      })

    const totalFiles = filteredFiles.length

    // Обрабатываем все файлы
    const mediaPromises = filteredFiles.map(async ({ dir, file, type }) => {
      try {
        const filePath = path.join(dir, file)
        const probeData = metadataCache.get(filePath) || (await ffprobeAsync(filePath))
        metadataCache.set(filePath, probeData as FfprobeData)

        return {
          name: file,
          path: `/${type}/${file}`,
          probeData,
          isVideo: false,
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error)
        return null
      }
    })

    const media = (await Promise.all(mediaPromises)).filter((item) => item !== null) as MediaFile[]

    res.status(200).json({ media, total: totalFiles })
  } catch (error) {
    console.error("Error processing media:", error)
    res.status(500).json({ media: [], total: 0 })
  }
}
