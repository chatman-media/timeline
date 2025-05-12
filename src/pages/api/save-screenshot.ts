import formidable from "formidable"
import { IncomingForm } from "formidable"
import fs from "fs/promises"
import { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Отключаем встроенный парсер тела запроса, так как будем использовать formidable
export const config = {
  api: {
    bodyParser: false,
  },
}

// Функция для парсинга формы с помощью formidable
const parseForm = async (
  req: NextApiRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    try {
      const form = new IncomingForm({
        keepExtensions: true,
        maxFileSize: 20 * 1024 * 1024, // Увеличиваем до 20MB
        multiples: false, // Отключаем множественную загрузку файлов
        uploadDir: path.join(process.cwd(), "tmp"), // Указываем директорию для временных файлов
        filename: (name, ext, part, form) => {
          // Генерируем уникальное имя для временного файла
          return `${Date.now()}_${uuidv4().substring(0, 8)}${ext}`
        },
      })

      // Создаем временную директорию, если она не существует
      try {
        const tmpDir = path.join(process.cwd(), "tmp")
        await fs.mkdir(tmpDir, { recursive: true })
        console.log(`[save-screenshot] Временная директория создана или уже существует: ${tmpDir}`)
      } catch (mkdirError) {
        console.error("[save-screenshot] Ошибка при создании временной директории:", mkdirError)
      }

      // Добавляем обработчик событий для отладки
      form.on("error", (err) => {
        console.error("Formidable error:", err)
        reject(err)
      })

      form.on("fileBegin", (name, file) => {
        console.log(
          `[save-screenshot] Начало загрузки файла: ${name}, размер: ${file.size || "неизвестен"}`,
        )
      })

      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Error parsing form:", err)
          return reject(err)
        }

        console.log(`[save-screenshot] Форма успешно обработана. Поля:`, Object.keys(fields))
        console.log(`[save-screenshot] Файлы:`, Object.keys(files))

        resolve({ fields, files })
      })
    } catch (error) {
      console.error("Error in parseForm:", error)
      reject(error)
    }
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    console.log("[save-screenshot] Получен запрос на сохранение скриншота")

    // Парсим форму
    const { fields, files } = await parseForm(req)

    // Проверяем наличие файла
    if (!files || Object.keys(files).length === 0) {
      console.error("[save-screenshot] Файл не найден в запросе")
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Получаем файл изображения
    const fileKey = Object.keys(files)[0]
    console.log(`[save-screenshot] Ключ файла: ${fileKey}, Тип:`, typeof files[fileKey])

    // Проверяем, что файл существует и имеет нужные свойства
    if (!files[fileKey] || !("filepath" in files[fileKey])) {
      console.error("[save-screenshot] Некорректный формат файла:", files[fileKey])
      return res.status(400).json({ error: "Invalid file format" })
    }

    const imageFile = files[fileKey] as unknown as formidable.File

    // Получаем имя файла из полей или используем значение по умолчанию
    const fileName = fields.fileName
      ? Array.isArray(fields.fileName)
        ? fields.fileName[0]
        : (fields.fileName as string)
      : `screenshot_${new Date().toISOString().replace(/:/g, "-")}.png`

    // Получаем путь для сохранения из полей или используем значение по умолчанию
    const screenshotsPath = fields.screenshotsPath
      ? Array.isArray(fields.screenshotsPath)
        ? fields.screenshotsPath[0]
        : (fields.screenshotsPath as string)
      : "public/screenshots"

    console.log(`[save-screenshot] Файл: ${fileName}, Путь: ${screenshotsPath}`)

    if (!imageFile) {
      console.error("[save-screenshot] Файл изображения не найден после парсинга")
      return res.status(400).json({ error: "Image file not found" })
    }

    // Создаем уникальное имя файла
    const fileExt = path.extname(fileName) || ".png"
    const fileNameWithoutExt = path.basename(fileName, fileExt)
    const uniqueFileName = `${fileNameWithoutExt}_${uuidv4().substring(0, 8)}${fileExt}`

    // Путь для сохранения файла
    // Если путь начинается с "public/", используем его как есть
    // В противном случае добавляем "public/" в начало
    let screenshotsDirPath = screenshotsPath
    if (!screenshotsDirPath.startsWith("public/")) {
      screenshotsDirPath = `public/${screenshotsDirPath}`
    }

    // Удаляем дублирующиеся слеши
    screenshotsDirPath = screenshotsDirPath.replace(/\/+/g, "/")

    // Путь для сохранения файла
    const screenshotsDir = path.join(process.cwd(), screenshotsDirPath)
    const filePath = path.join(screenshotsDir, uniqueFileName)

    console.log(`[save-screenshot] Директория для сохранения: ${screenshotsDir}`)
    console.log(`[save-screenshot] Полный путь к файлу: ${filePath}`)

    // Создаем директорию, если она не существует
    try {
      await fs.mkdir(screenshotsDir, { recursive: true })
      console.log(`[save-screenshot] Директория создана или уже существует: ${screenshotsDir}`)
    } catch (mkdirError) {
      console.error(
        `[save-screenshot] Ошибка при создании директории: ${screenshotsDir}`,
        mkdirError,
      )
      return res.status(500).json({ error: `Failed to create directory: ${String(mkdirError)}` })
    }

    // Получаем временный путь к загруженному файлу
    if (!imageFile.filepath) {
      console.error("[save-screenshot] Отсутствует путь к временному файлу")
      return res.status(500).json({ error: "Missing temporary file path" })
    }

    const tempFilePath = imageFile.filepath
    console.log(`[save-screenshot] Временный путь к файлу: ${tempFilePath}`)

    // Проверяем существование временного файла
    try {
      await fs.access(tempFilePath)
      console.log(`[save-screenshot] Временный файл существует: ${tempFilePath}`)
    } catch (accessError) {
      console.error(`[save-screenshot] Временный файл не найден: ${tempFilePath}`, accessError)
      return res.status(500).json({ error: `Temporary file not found: ${String(accessError)}` })
    }

    // Копируем файл из временной директории в целевую
    try {
      await fs.copyFile(tempFilePath, filePath)
      console.log(`[save-screenshot] Файл успешно скопирован в: ${filePath}`)
    } catch (copyError) {
      console.error(`[save-screenshot] Ошибка при копировании файла:`, copyError)
      return res.status(500).json({ error: `Failed to copy file: ${String(copyError)}` })
    }

    // Получаем размер файла
    let stats
    try {
      stats = await fs.stat(filePath)
      console.log(`[save-screenshot] Размер файла: ${stats.size} байт`)
    } catch (statError) {
      console.error(`[save-screenshot] Ошибка при получении информации о файле:`, statError)
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

    console.log(`[save-screenshot] Скриншот успешно сохранен:`, result)
    return res.status(200).json(result)
  } catch (error) {
    console.error("[save-screenshot] Ошибка при сохранении скриншота:", error)
    return res.status(500).json({
      error: "Failed to save screenshot",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
