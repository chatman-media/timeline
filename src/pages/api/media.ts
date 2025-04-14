import * as fs from "node:fs/promises"
import process from "node:process"

import { ffprobe, FfprobeData } from "fluent-ffmpeg"
import { nanoid } from "nanoid"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { promisify } from "util"

import { getMediaCreationTime } from "@/lib/utils"
import { MediaFile } from "@/types/videos"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[] }>,
) {
  console.log("[API] Начинаю обработку медиафайлов...")
  try {
    const mediaDir = path.join(process.cwd(), "public", "media")
    await fs.mkdir(mediaDir, { recursive: true })

    console.log("[API] Читаю директорию:", mediaDir)
    const videoFiles = await fs.readdir(mediaDir)
    console.log("[API] Найдено файлов:", videoFiles)

    const videoExtensions = [
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
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
    ]

    console.log("[API] Фильтрую файлы по расширениям...")
    const mediaFiles = videoFiles
      .map((file) => ({ dir: mediaDir, file }))
      .filter(({ file }) => {
        const isValid =
          !file.startsWith(".") && videoExtensions.includes(path.extname(file).toLowerCase())
        console.log(`[API] Файл ${file}: ${isValid ? "валидный" : "невалидный"}`)
        return isValid
      })

    console.log("[API] Прошли фильтрацию:", mediaFiles)

    const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails")
    await fs.mkdir(thumbnailsDir, { recursive: true })

    console.log("[API] Начинаю анализ файлов...")
    const mediaPromises = mediaFiles.map(async ({ dir, file }) => {
      try {
        const filePath = path.join(dir, file)
        console.log(`[API] Обрабатываю файл: ${filePath}`)

        const thumbnailName = `${path.parse(file).name}.jpg`

        try {
          console.log(`[API] Запускаю ffprobe для ${file}...`)
          const probeData = (await ffprobeAsync(filePath)) as FfprobeData
          console.log(`[API] ffprobe успешно для ${file}`)

          const isVideo = probeData.streams.some((stream) => stream.codec_type === "video")
          const fileExt = path.extname(file).toLowerCase()
          const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(fileExt)
          const startTime = getMediaCreationTime(probeData)
          const duration = probeData.format.duration || 0

          // console.log(`[API] Данные файла ${file}:`, {
          //   isVideo,
          //   isImage,
          //   startTime,
          //   duration,
          //   hasStreams: probeData.streams?.length || 0,
          // })

          // console.log(probeData.format)

          return {
            id: nanoid(),
            name: file,
            path: `/media/${file}`,
            thumbnail: isVideo && !isImage ? `/thumbnails/${thumbnailName}` : undefined,
            probeData,
            startTime,
            endTime: startTime + duration,
            duration,
            isVideo: isImage ? false : isVideo,
            isImage,
          }
        } catch (probeError) {
          console.error(`[API] Ошибка ffprobe для ${file}:`, probeError)

          // Проверяем, является ли файл изображением
          const fileExt = path.extname(file).toLowerCase()
          const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(fileExt)

          if (isImage) {
            return {
              id: nanoid(),
              name: file,
              path: `/media/${file}`,
              startTime: 0,
              endTime: 0,
              duration: 0,
              isVideo: false,
              isImage: true,
              probeData: {
                format: {
                  duration: 0,
                  size: 0,
                  bit_rate: 0,
                  filename: file,
                  nb_streams: 1,
                  format_name: "image",
                  format_long_name: "image",
                  start_time: 0,
                  tags: {},
                },
                streams: [
                  {
                    codec_type: "video",
                    codec_name: "image",
                    width: 1920,
                    height: 1080,
                    duration: 0,
                    codec_tag: "0",
                    codec_tag_string: "",
                    index: 0,
                  },
                ],
                chapters: [],
              } as unknown as FfprobeData,
            }
          }

          // Если не смогли получить метаданные, создаем минимальный объект
          return {
            id: nanoid(),
            name: file,
            path: `/media/${file}`,
            probeData: {
              format: {
                duration: 0,
                size: 0,
                bit_rate: 0,
                filename: file,
                nb_streams: 1,
                format_name: "unknown",
                format_long_name: "unknown",
                start_time: 0,
                tags: {},
              },
              streams: [
                {
                  codec_type: "video",
                  codec_name: "unknown",
                  width: 1920,
                  height: 1080,
                  duration: 0,
                  codec_tag: "0",
                  codec_tag_string: "",
                  index: 0,
                },
              ],
              chapters: [],
            } as unknown as FfprobeData,
            startTime: 0,
            endTime: 0,
            duration: 0,
            isVideo: true,
          }
        }
      } catch (error) {
        console.error(`[API] Ошибка обработки файла ${file}:`, error)
        return null
      }
    })

    const media = (await Promise.all(mediaPromises)).filter((item) => item !== null)
    console.log("[API] Обработано медиафайлов:", media.length)
    console.log(
      "[API] Возвращаю медиафайлы:",
      media.map((m) => m.name),
    )

    res.status(200).json({ media })
  } catch (error) {
    console.error("[API] Общая ошибка:", error)
    res.status(500).json({ media: [] })
  }
}
