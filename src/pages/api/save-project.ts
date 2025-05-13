import fs from "fs/promises"
import { NextApiRequest, NextApiResponse } from "next"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Включаем встроенный парсер тела запроса для JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Лимит размера запроса до 10 МБ
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
    console.log("[save-project] Получен запрос на сохранение проекта")

    // Получаем данные из тела запроса
    const { projectData, fileName, projectsPath } = req.body

    // Проверяем наличие необходимых данных
    if (!projectData) {
      console.error("[save-project] Отсутствуют данные проекта")
      return res.status(400).json({ error: "Missing project data" })
    }

    // Используем имя файла из запроса или генерируем новое
    const finalFileName = fileName || `project_${new Date().toISOString().replace(/:/g, "-")}.json`

    // Получаем путь для сохранения из запроса или используем значение по умолчанию
    const finalProjectsPath = projectsPath || "public/projects"

    console.log(`[save-project] Файл: ${finalFileName}, Путь: ${finalProjectsPath}`)

    // Создаем уникальное имя файла
    const fileExt = path.extname(finalFileName) || ".json"
    const fileNameWithoutExt = path.basename(finalFileName, fileExt)
    const uniqueFileName = `${fileNameWithoutExt}_${uuidv4().substring(0, 8)}${fileExt}`

    // Путь для сохранения файла
    // Если путь начинается с "public/", используем его как есть
    // В противном случае добавляем "public/" в начало
    let projectsDirPath = finalProjectsPath
    if (!projectsDirPath.startsWith("public/")) {
      projectsDirPath = `public/${projectsDirPath}`
    }

    // Удаляем дублирующиеся слеши
    projectsDirPath = projectsDirPath.replace(/\/+/g, "/")

    // Путь для сохранения файла
    const projectsDir = path.join(process.cwd(), projectsDirPath)
    const filePath = path.join(projectsDir, uniqueFileName)

    console.log(`[save-project] Директория для сохранения: ${projectsDir}`)
    console.log(`[save-project] Полный путь к файлу: ${filePath}`)

    // Создаем директорию, если она не существует
    try {
      await fs.mkdir(projectsDir, { recursive: true })
      console.log(`[save-project] Директория создана или уже существует: ${projectsDir}`)
    } catch (mkdirError) {
      console.error(`[save-project] Ошибка при создании директории: ${projectsDir}`, mkdirError)
      return res.status(500).json({ error: `Failed to create directory: ${String(mkdirError)}` })
    }

    // Сохраняем данные проекта в файл
    try {
      // Преобразуем данные проекта в строку JSON
      const projectDataString = JSON.stringify(projectData, null, 2)
      await fs.writeFile(filePath, projectDataString, "utf8")
      console.log(`[save-project] Файл успешно сохранен: ${filePath}`)
    } catch (writeError) {
      console.error(`[save-project] Ошибка при записи файла:`, writeError)
      return res.status(500).json({ error: `Failed to write file: ${String(writeError)}` })
    }

    // Получаем размер файла
    let stats
    try {
      stats = await fs.stat(filePath)
      console.log(`[save-project] Размер файла: ${stats.size} байт`)
    } catch (statError) {
      console.error(`[save-project] Ошибка при получении информации о файле:`, statError)
      return res.status(500).json({ error: `Failed to get file stats: ${String(statError)}` })
    }

    // Возвращаем информацию о файле
    const result = {
      success: true,
      filePath: `/${projectsDirPath.replace(/^public\//, "")}/${uniqueFileName}`,
      fileName: uniqueFileName,
      fullPath: filePath,
      size: stats.size,
      createdAt: new Date().toISOString(),
    }

    console.log(`[save-project] Проект успешно сохранен:`, result)
    return res.status(200).json(result)
  } catch (error) {
    console.error("[save-project] Ошибка при сохранении проекта:", error)
    return res.status(500).json({
      error: "Failed to save project",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
