import fs from "fs/promises"
import { NextApiRequest } from "next"
import path from "path"

import { NextApiResponseServerIO } from "@/types/socket"

// Включаем встроенный парсер тела запроса для JSON
export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // Разрешаем CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Обрабатываем preflight запросы
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Получаем ID видео из запроса
    const { videoId } = req.query

    if (!videoId || typeof videoId !== "string") {
      return res.status(400).json({ error: "Missing video ID" })
    }

    // Формируем путь к директории со скриншотами
    const screenshotsDir = path.join(process.cwd(), "public/screenshots", videoId)

    // Проверяем существование директории
    try {
      await fs.access(screenshotsDir)

      // Получаем список файлов в директории
      const files = await fs.readdir(screenshotsDir)

      // Фильтруем только файлы изображений
      const imageFiles = files.filter(
        (file) => file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png"),
      )

      // Формируем пути к скриншотам
      const screenshotPaths = imageFiles.map((file) =>
        path.join("public/screenshots", videoId, file),
      )

      return res.status(200).json({
        exists: true,
        count: imageFiles.length,
        paths: screenshotPaths,
      })
    } catch (error) {
      // Директория не существует
      return res.status(200).json({
        exists: false,
        count: 0,
        paths: [],
      })
    }
  } catch (error) {
    console.error("[check-screenshots] Ошибка при проверке скриншотов:", error)
    return res.status(500).json({
      error: "Failed to check screenshots",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
