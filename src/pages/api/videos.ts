// pages/api/videos.ts
import { getMediaFile } from "@/lib/video/probe"
import type { NextApiRequest, NextApiResponse } from "next"
import { promises as fs } from "fs"
import path from "path"
import type { MediaFile } from "@/types/video"
import process from "node:process"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const videosDir = path.join(process.cwd(), "public", "videos")
  await fs.mkdir(videosDir, { recursive: true })

  // const cacheFile = path.join(process.cwd(), "public", "videos", "cache.json")

  // try {
  //   const cachedData = await fs.readFile(cacheFile, "utf-8")
  //   const { videos, timestamp } = JSON.parse(cachedData)

  //   if (Date.now() - timestamp < 5 * 60 * 1000) {
  //     console.log("Using cached video data")
  //     return res.status(200).json({ videos })
  //   }
  // } catch (e) {
  //   console.log("No cache found or cache invalid")
  // }

  const files = await fs.readdir(videosDir)
  console.log("Found files in videos directory:", files)

  const mediaFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase()
    const isValid = (
      [".mp4", ".mov", ".avi", ".mkv", ".webm", ".insv"].includes(ext) ||
      [".mp3", ".wav", ".aac", ".m4a", ".flac", ".ogg"].includes(ext)
    ) && !file.startsWith(".")
    console.log(`File ${file}: extension ${ext}, isValid: ${isValid}`)
    return isValid
  })
  console.log("Filtered media files:", mediaFiles)

  const mediaPromises = mediaFiles.map(async (filename): Promise<MediaFile | null> => {
    try {
      const filePath = path.join(process.cwd(), "public", "videos", filename)
      console.log("Processing file:", filePath)

      const probeData = await getMediaFile(filePath)

      if (!probeData || !probeData.format) {
        console.log(`Skipping ${filename}: invalid probe data`)
        return null
      }

      const videoStream = probeData.streams?.find((s) => s.codec_type === "video")
      const audioStream = probeData.streams?.find((s) => s.codec_type === "audio")

      if (!videoStream && !audioStream) {
        console.log(`Skipping ${filename}: no valid media streams found`)
        return null
      }

      // const primaryStream = videoStream || audioStream
      // if (!primaryStream) return null

      return {
        name: filename,
        path: `/videos/${filename}`,
        probeData,
      }
    } catch (error) {
      console.error(`Error processing ${filename}:`, error)
      return null
    }
  })

  const videos = (await Promise.all(mediaPromises)).filter(
    (video) => video !== null,
  ) as MediaFile[]

  // console.log(
  //   "Processed videos:",
  //   videos.map((v) => ({
  //     name: v.name,
  //     path: v.path,
  //     hasProbeData: !!v.probeData,
  //     streams: v.probeData.streams.map((s) => s.codec_type),
  //   })),
  // )

  // await fs.writeFile(
  //   cacheFile,
  //   JSON.stringify({
  //     videos,
  //     timestamp: Date.now(),
  //   }),
  // )

  // После отправки ответа генерируем превью
  // videos.forEach(async (video) => {
  //   // Проверяем, что это видео файл
  //   if (video.probeData.streams.find((s) => s.codec_type === "video")) {
  //     try {
  //       const videoPath = path.join(process.cwd(), "public", "videos", video.name)
  //       const thumbnailPath = path.join(
  //         process.cwd(),
  //         "public",
  //         "thumbnails",
  //         `${path.parse(video.name).name}.jpg`,
  //       )

  //       // Проверяем существование thumbnail
  //       const thumbnailExists = await fs.access(thumbnailPath).then(() => true).catch(() => false)

  //       if (!thumbnailExists) {
  //         // Вычисляем интервал для 30 кадров
  //         const interval = Math.max(video.probeData.format.duration / 30, 0.1) // минимум 0.1 секунда между кадрами

  //         await generateThumbnails(videoPath, path.parse(video.name).name, interval)
  //         console.log(`Thumbnails generated for ${video.name} with interval ${interval}s`)
  //       }
  //     } catch (error) {
  //       console.error(`Error generating thumbnails for ${video.name}:`, error)
  //     }
  //   }
  // })
  res.status(200).json({ videos })

  // } catch (error) {
  //   console.error("Error processing videos:", error)
  //   res.status(500).json({ videos: [] })
}
