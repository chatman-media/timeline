import fs from "fs/promises"
import { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Включаем встроенный парсер тела запроса для JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Увеличиваем лимит размера запроса до 50 МБ
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Обрабатываем preflight запросы
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    console.log("[save-screenshot-json] Получен запрос на сохранение скриншота")

    // Получаем данные из тела запроса
    const { imageData, fileName, screenshotsPath } = req.body

    // Проверяем наличие необходимых данных
    if (!imageData) {
      console.error("[save-screenshot-json] Отсутствуют данные изображения")
      return res.status(400).json({ error: "Missing image data" })
    }

    // Используем имя файла из запроса или генерируем новое
    const finalFileName =
      fileName || `screenshot_${new Date().toISOString().replace(/:/g, "-")}.png`

    // Получаем путь для сохранения из запроса или используем значение по умолчанию
    const finalScreenshotsPath = screenshotsPath || "public/screenshots"

    console.log(`[save-screenshot-json] Файл: ${finalFileName}, Путь: ${finalScreenshotsPath}`)

    // Создаем уникальное имя файла
    const fileExt = path.extname(finalFileName) || ".png"
    const fileNameWithoutExt = path.basename(finalFileName, fileExt)
    const uniqueFileName = `${fileNameWithoutExt}_${uuidv4().substring(0, 8)}${fileExt}`

    // Путь для сохранения файла
    // Если путь начинается с "public/", используем его как есть
    // В противном случае добавляем "public/" в начало
    let screenshotsDirPath = finalScreenshotsPath
    if (!screenshotsDirPath.startsWith("public/")) {
      screenshotsDirPath = `public/${screenshotsDirPath}`
    }

    // Удаляем дублирующиеся слеши
    screenshotsDirPath = screenshotsDirPath.replace(/\/+/g, "/")

    // Путь для сохранения файла
    const screenshotsDir = path.join(process.cwd(), screenshotsDirPath)
    const filePath = path.join(screenshotsDir, uniqueFileName)

    console.log(`[save-screenshot-json] Директория для сохранения: ${screenshotsDir}`)
    console.log(`[save-screenshot-json] Полный путь к файлу: ${filePath}`)

    // Создаем директорию, если она не существует
    try {
      await fs.mkdir(screenshotsDir, { recursive: true })
      console.log(`[save-screenshot-json] Директория создана или уже существует: ${screenshotsDir}`)
    } catch (mkdirError) {
      console.error(
        `[save-screenshot-json] Ошибка при создании директории: ${screenshotsDir}`,
        mkdirError,
      )
      return res.status(500).json({ error: `Failed to create directory: ${String(mkdirError)}` })
    }

    // Конвертируем base64 в буфер и сохраняем файл
    try {
      const buffer = Buffer.from(imageData, "base64")
      await fs.writeFile(filePath, buffer)
      console.log(`[save-screenshot-json] Файл успешно сохранен: ${filePath}`)
    } catch (writeError) {
      console.error(`[save-screenshot-json] Ошибка при записи файла:`, writeError)
      return res.status(500).json({ error: `Failed to write file: ${String(writeError)}` })
    }

    // Получаем размер файла
    let stats
    try {
      stats = await fs.stat(filePath)
      console.log(`[save-screenshot-json] Размер файла: ${stats.size} байт`)
    } catch (statError) {
      console.error(`[save-screenshot-json] Ошибка при получении информации о файле:`, statError)
      return res.status(500).json({ error: `Failed to get file stats: ${String(statError)}` })
    }

    // Возвращаем информацию о файле
    const result = {
      success: true,
      filePath: `/${screenshotsDirPath.replace(/^public\//, "")}/${uniqueFileName}`,
      fileName: uniqueFileName,
      fullPath: filePath,
      size: stats.size,
      createdAt: new Date().toISOString(),
    }

    console.log(`[save-screenshot-json] Скриншот успешно сохранен:`, result)
    return res.status(200).json(result)
  } catch (error) {
    console.error("[save-screenshot-json] Ошибка при сохранении скриншота:", error)
    return res.status(500).json({
      error: "Failed to save screenshot",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
