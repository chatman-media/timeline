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
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
    })

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Парсим форму
    const { fields, files } = await parseForm(req)
    const audioFile = files.file as formidable.File
    const fileName = fields.fileName as string

    if (!audioFile || !fileName) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Создаем уникальное имя файла
    const fileExt = path.extname(fileName)
    const fileNameWithoutExt = path.basename(fileName, fileExt)
    const uniqueFileName = `${fileNameWithoutExt}_${uuidv4().substring(0, 8)}${fileExt}`

    // Путь для сохранения файла
    const mediaDir = path.join(process.cwd(), "public", "media")
    const filePath = path.join(mediaDir, uniqueFileName)

    // Создаем директорию, если она не существует
    await fs.mkdir(mediaDir, { recursive: true })

    // Получаем временный путь к загруженному файлу
    const tempFilePath = (audioFile as any).filepath

    // Копируем файл из временной директории в целевую
    await fs.copyFile(tempFilePath, filePath)

    // Получаем размер файла
    const stats = await fs.stat(filePath)

    // Возвращаем информацию о файле
    return res.status(200).json({
      success: true,
      filePath: `/media/${uniqueFileName}`,
      fileName: uniqueFileName,
      fullPath: filePath,
      size: stats.size,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error saving audio recording:", error)
    return res.status(500).json({ error: "Failed to save audio recording" })
  }
}
