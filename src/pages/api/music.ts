import process from "node:process"

import { ffprobe, FfprobeData } from "fluent-ffmpeg"
import { promises as fs } from "fs"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { promisify } from "util"

import { MediaFile } from "@/types/videos"

const ffprobeAsync = promisify(ffprobe)

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[] }>,
) {
  try {
    const musicDir = path.join(process.cwd(), "public", "music")

    // Проверяем существование директории
    await fs.mkdir(musicDir, { recursive: true })

    // Получаем список файлов
    const musicFiles = await fs.readdir(musicDir)

    // Фильтруем файлы по расширению
    const mediaFiles = musicFiles
      .map((file) => ({ dir: musicDir, file, type: "music" }))
      .filter(({ file }) => {
        const ext = path.extname(file).toLowerCase()
        return [".mp3", ".wav", ".aac", ".ogg", ".flac"].includes(ext) && !file.startsWith(".")
      })

    // Обрабатываем все файлы параллельно
    const mediaPromises = mediaFiles.map(async ({ dir, file, type }) => {
      try {
        const filePath = path.join(dir, file)
        const probeData = await ffprobeAsync(filePath) as FfprobeData

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

    const media = (await Promise.all(mediaPromises)).filter(
      (item): item is MediaFile => item !== null,
    )

    res.status(200).json({ media })
  } catch (error) {
    console.error("Error processing media:", error)
    res.status(500).json({ media: [] })
  }
}
