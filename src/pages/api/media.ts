import * as fs from "node:fs/promises"
import process from "node:process"

import { exec } from "child_process"
import { ffprobe, FfprobeData } from "fluent-ffmpeg"
import { nanoid } from "nanoid"
import type { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { promisify } from "util"

import { getMediaCreationTime } from "@/lib/utils"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile } from "@/types/media"

// Промисифицируем ffprobe
const ffprobeAsync = promisify(ffprobe)
const execAsync = promisify(exec)

const PROXY_SETTINGS = {
  width: 640,
  height: 360,
  bitrate: "1000k",
  preset: "veryfast",
}

async function generateProxyFile(sourcePath: string): Promise<string | null> {
  try {
    // Изменяем расширение на .mp4 для прокси-файла
    const sourceExt = path.extname(sourcePath)
    const sourceBaseName = path.basename(sourcePath, sourceExt)
    const proxyFileName = `proxy-${sourceBaseName}.mp4`
    const proxyPath = path.join(process.cwd(), "public", "proxies", proxyFileName)

    // Проверяем, существует ли уже прокси-файл
    try {
      await fs.access(proxyPath)
      // console.log(`[API] Прокси-файл уже существует: ${proxyPath}`)
      return `/proxies/${proxyFileName}`
    } catch {
      // Файл не существует, продолжаем генерацию
    }

    // Создаем директорию для прокси, если её нет
    const proxyDir = path.dirname(proxyPath)
    await fs.mkdir(proxyDir, { recursive: true })

    // Генерируем прокси с помощью ffmpeg
    const ffmpegCommand = `ffmpeg -i "${sourcePath}" -vf "scale=${PROXY_SETTINGS.width}:${PROXY_SETTINGS.height}" -c:v libx264 -preset ${PROXY_SETTINGS.preset} -b:v ${PROXY_SETTINGS.bitrate} -c:a aac "${proxyPath}"`

    console.log(`[API] Генерирую прокси: ${ffmpegCommand}`)
    await execAsync(ffmpegCommand)

    return `/proxies/${proxyFileName}`
  } catch (error) {
    console.error("[API] Ошибка при генерации прокси:", error)
    return null
  }
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ media: MediaFile[] }>,
) {
  console.log("[API] Начинаю обработку медиафайлов...")
  try {
    const mediaDir = path.join(process.cwd(), "public", "media")
    await fs.mkdir(mediaDir, { recursive: true })

    console.log("[API] Читаю директорию:", mediaDir)
    const allFiles = await fs.readdir(mediaDir)
    // console.log("[API] Найдено файлов:", videoFiles)

    // Создаем Map для хранения LRV файлов
    const lrvFiles = new Map<string, string>()
    // Сначала собираем все LRV файлы
    allFiles.forEach((filename) => {
      if (filename.toLowerCase().endsWith(".lrv")) {
        const baseFileName = filename.slice(0, -4) // убираем .lrv
        lrvFiles.set(baseFileName, filename)
      }
    })

    const mediaPromises = allFiles.map(async (filename) => {
      const filePath = path.join(mediaDir, filename)
      const stats = await fs.stat(filePath)
      const fileType = path.extname(filename).toLowerCase()

      // Для изображений
      if (
        [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".heic",
          ".heif",
          ".arw",
          ".hif",
          ".hevc",
        ].includes(fileType)
      ) {
        return {
          id: path.basename(filename, path.extname(filename)),
          name: filename,
          path: `/media/${filename}`,
          size: stats.size,
          isImage: true,
          probeData: {
            streams: [],
            format: {
              size: stats.size,
              bit_rate: 0,
            },
          },
        }
      }

      // Для аудио файлов
      if ([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".alac"].includes(fileType)) {
        try {
          const probeData = (await ffprobeAsync(filePath)) as FfprobeData
          const audioStream = probeData.streams.find((s: FfprobeStream) => s.codec_type === "audio")

          return {
            id: path.basename(filename, path.extname(filename)),
            name: filename,
            path: `/media/${filename}`,
            size: stats.size,
            isAudio: true,
            isVideo: false,
            duration: probeData.format.duration || 0,
            probeData: {
              streams: probeData.streams,
              format: {
                duration: probeData.format.duration || 0,
                size: probeData.format.size || 0,
                bit_rate: probeData.format.bit_rate || 0,
              },
            },
          }
        } catch (error) {
          console.error(`[API] Ошибка при обработке аудио файла ${filename}:`, error)
          return null
        }
      }

      // Для видео файлов
      if ([".mp4", ".mov", ".avi", ".mkv", ".webm", ".insv"].includes(fileType)) {
        try {
          const probeData = (await ffprobeAsync(filePath)) as FfprobeData

          // Генерируем прокси-файл
          const proxyPath = await generateProxyFile(filePath)

          // Получаем время создания файла из метаданных
          const creationTime = getMediaCreationTime(probeData)
          console.log(
            `[API] Время создания файла ${filename}: ${new Date(creationTime * 1000).toISOString()}`,
          )

          // Проверяем наличие LRV файла
          const baseFileName = path.basename(filename, fileType)
          const lrvFileName = lrvFiles.get(baseFileName)
          let lrvData = null

          if (lrvFileName) {
            const lrvPath = path.join(mediaDir, lrvFileName)
            try {
              const lrvProbeData = (await ffprobeAsync(lrvPath)) as FfprobeData
              lrvData = {
                path: `/media/${lrvFileName}`,
                width: lrvProbeData.streams[0]?.width || 0,
                height: lrvProbeData.streams[0]?.height || 0,
                duration: lrvProbeData.format.duration || 0,
                probeData: lrvProbeData,
              }
            } catch (error) {
              console.error(`[API] Ошибка при обработке LRV файла ${lrvFileName}:`, error)
            }
          }

          const mediaFile: MediaFile = {
            id: path.basename(filename, path.extname(filename)),
            name: filename,
            path: `/media/${filename}`,
            size: stats.size,
            duration: probeData.format.duration || 0,
            startTime: creationTime,
            probeData: {
              streams: probeData.streams,
              format: {
                duration: probeData.format.duration || 0,
                size: probeData.format.size || 0,
                bit_rate: probeData.format.bit_rate || 0,
              },
            },
            isVideo: true,
            isAudio: false,
            proxy: proxyPath
              ? {
                path: proxyPath,
                width: PROXY_SETTINGS.width,
                height: PROXY_SETTINGS.height,
                bitrate: parseInt(PROXY_SETTINGS.bitrate),
              }
              : undefined,
            lrv: lrvData ?? undefined,
          }

          console.log(`[API] probeData.streams: ${JSON.stringify(probeData.streams)}`)

          return mediaFile
        } catch (error) {
          console.error(`[API] Ошибка при обработке видео файла ${filename}:`, error)
          return null
        }
      }

      return null
    })

    const mediaFiles = await Promise.all(mediaPromises)
    const validMediaFiles = mediaFiles.filter((file): file is MediaFile => file !== null)

    console.log("[API] Успешно обработано файлов:", validMediaFiles.length)
    res.status(200).json({ media: validMediaFiles })
  } catch (error) {
    console.error("[API] Ошибка при обработке медиафайлов:", error)
    res.status(500).json({ media: [] })
  }
}
