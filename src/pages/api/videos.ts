// pages/api/videos.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { promises as fs } from "fs"
import path from "path"
import { promisify } from "util"
import ffmpeg, { ffprobe, FfprobeData } from "fluent-ffmpeg"
import process from "node:process"
import { MediaFile } from "@/types/videos"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[] }>,
) {
  try {
    const videosDir = path.join(process.cwd(), "public", "videos")
    const musicDir = path.join(process.cwd(), "public", "music")

    // Проверяем существование директорий
    await Promise.all([
      fs.mkdir(videosDir, { recursive: true }),
      fs.mkdir(musicDir, { recursive: true }),
    ])

    // Получаем список файлов из обеих директорий
    const [videoFiles, musicFiles] = await Promise.all([
      fs.readdir(videosDir),
      fs.readdir(musicDir),
    ])

    // Фильтруем файлы по расширению
    const mediaFiles = [
      ...videoFiles.map((file) => ({ dir: videosDir, file, type: "videos" })),
      // ...musicFiles.map(file => ({ dir: musicDir, file, type: 'music' }))
    ].filter(({ file }) => {
      const ext = path.extname(file).toLowerCase()
      return [
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".webm",
        ".insv",
        ".mp3",
        ".wav",
        ".aac",
        ".ogg",
        ".flac",
      ]
        .includes(ext) && !file.startsWith(".")
    })

    // const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails")
    // await fs.mkdir(thumbnailsDir, { recursive: true })

    // Обрабатываем все файлы параллельно
    const mediaPromises = mediaFiles.map(async ({ dir, file, type }) => {
      try {
        const filePath = path.join(dir, file)
        // const thumbnailName = `${path.parse(file).name}.jpg`
        const fileStats = await fs.stat(filePath)

        if (fileStats.isDirectory()) return null

        const probeData = await ffprobeAsync(filePath) as FfprobeData
        const isVideo = probeData.streams.some((stream) => stream.codec_type === "video")

        // Генерируем превью только для видео файлов
        // if (isVideo) {
        //   await new Promise((resolve, reject) => {
        //     ffmpeg(filePath)
        //       .screenshots({
        //         timestamps: [0],
        //         filename: thumbnailName,
        //         folder: thumbnailsDir,
        //         size: "320x?",
        //       })
        //       .on("end", resolve)
        //       .on("error", reject)
        //   })
        // }

        return {
          name: file,
          path: `/${type}/${file}`,
          // thumbnail: isVideo ? `/thumbnails/${thumbnailName}` : null,
          probeData,
          isVideo,
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error)
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
