import { exec } from "child_process"
import fs from "fs/promises"
import { NextApiRequest } from "next"
import path from "path"
import { Server as SocketIOServer } from "socket.io"

import { NextApiResponseServerIO } from "@/types/socket"

// Включаем встроенный парсер тела запроса для JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Увеличиваем лимит размера запроса до 10 МБ
    },
  },
}

// Функция для выполнения команды и получения вывода
const execAsync = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[detect-objects] Ошибка выполнения команды: ${error.message}`)
        console.error(`[detect-objects] stderr: ${stderr}`)
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
}

// Функция для проверки наличия Python
const checkPythonInstalled = async (): Promise<boolean> => {
  // Сначала проверяем Python в виртуальном окружении
  const venvPython = path.join(process.cwd(), "venv/bin/python")
  try {
    await fs.access(venvPython)
    await execAsync(`"${venvPython}" --version`)
    console.log("[detect-objects] Python в виртуальном окружении найден")
    return true
  } catch (venvError) {
    console.error("[detect-objects] Python в виртуальном окружении не найден:", venvError)

    // Если Python в виртуальном окружении не найден, проверяем системный Python
    try {
      await execAsync("python3 --version")
      console.log("[detect-objects] Системный Python найден")
      return true
    } catch (error) {
      console.error("[detect-objects] Системный Python не установлен:", error)
      return false
    }
  }
}

// Функция для проверки наличия необходимых библиотек
const checkPythonDependencies = async (): Promise<boolean> => {
  // Сначала проверяем библиотеки в виртуальном окружении
  const venvPython = path.join(process.cwd(), "venv/bin/python")
  try {
    await fs.access(venvPython)
    await execAsync(
      `"${venvPython}" -c "import torch; print('PyTorch version:', torch.__version__)"`,
    )
    console.log("[detect-objects] PyTorch в виртуальном окружении найден")
    return true
  } catch (venvError) {
    console.error("[detect-objects] PyTorch в виртуальном окружении не найден:", venvError)

    // Если библиотеки в виртуальном окружении не найдены, проверяем системные библиотеки
    try {
      await execAsync("python3 -c \"import torch; print('PyTorch version:', torch.__version__)\"")
      console.log("[detect-objects] Системный PyTorch найден")
      return true
    } catch (error) {
      console.error("[detect-objects] Необходимые Python-библиотеки не установлены:", error)
      return false
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
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

  // Проверяем наличие Python
  const isPythonInstalled = await checkPythonInstalled()
  if (!isPythonInstalled) {
    return res.status(500).json({
      error: "Python не установлен",
      details:
        "Для распознавания объектов необходим Python 3. Пожалуйста, установите Python и необходимые зависимости.",
    })
  }

  // Проверяем наличие необходимых библиотек
  const areDependenciesInstalled = await checkPythonDependencies()
  if (!areDependenciesInstalled) {
    return res.status(500).json({
      error: "Необходимые Python-библиотеки не установлены",
      details:
        "Для распознавания объектов необходимы библиотеки PyTorch, OpenCV и другие. Пожалуйста, установите их с помощью скрипта scripts/setup-python.sh.",
    })
  }

  try {
    console.log("[detect-objects] Получен запрос на распознавание объектов")

    // Получаем данные из тела запроса
    const {
      videoId,
      screenshotPaths,
      outputDir,
      confidenceThreshold = 0.25,
      modelName = "yolov10s.pt",
    } = req.body

    // Проверяем наличие необходимых данных
    if (!videoId) {
      console.error("[detect-objects] Отсутствует ID видео")
      return res.status(400).json({ error: "Missing video ID" })
    }

    if (!screenshotPaths || !Array.isArray(screenshotPaths) || screenshotPaths.length === 0) {
      console.error("[detect-objects] Отсутствуют пути к скриншотам")
      return res.status(400).json({ error: "Missing screenshot paths" })
    }

    // Получаем путь для сохранения результатов из запроса или используем значение по умолчанию
    const finalOutputDir = outputDir || path.join("public/screenshots/detected", videoId)

    // Создаем директорию для результатов, если она не существует
    const outputDirPath = path.join(process.cwd(), finalOutputDir)
    await fs.mkdir(outputDirPath, { recursive: true })

    // Также создаем директорию для JSON-файла с результатами
    const jsonOutputDir = path.join(process.cwd(), "public/screenshots/detected", videoId)
    await fs.mkdir(jsonOutputDir, { recursive: true })

    console.log(`[detect-objects] Директория для результатов: ${outputDirPath}`)

    // Получаем Socket.IO сервер из объекта ответа
    const io: SocketIOServer | undefined = res.socket.server.io

    // Отправляем уведомление о начале распознавания объектов
    if (io) {
      io.emit("object_detection_start", {
        videoId: videoId,
        screenshotCount: screenshotPaths.length,
        timestamp: Date.now(),
      })
    }

    // Формируем команду для распознавания объектов
    // Преобразуем относительные пути в абсолютные
    const absoluteScreenshotPaths = screenshotPaths.map((p) =>
      path.isAbsolute(p) ? p : path.join(process.cwd(), p.replace(/^\//, "")),
    )

    // Проверяем существование скриншотов
    const existingScreenshotPaths = []
    for (const screenshotPath of absoluteScreenshotPaths) {
      try {
        await fs.access(screenshotPath)
        console.log(`[detect-objects] Скриншот найден: ${screenshotPath}`)
        existingScreenshotPaths.push(screenshotPath)
      } catch (error) {
        console.error(`[detect-objects] Скриншот не найден: ${screenshotPath}`)
      }
    }

    // Проверяем, есть ли скриншоты для обработки
    if (existingScreenshotPaths.length === 0) {
      console.error(`[detect-objects] Не найдено ни одного скриншота для обработки`)
      throw new Error("Не найдено ни одного скриншота для обработки")
    }

    console.log(
      `[detect-objects] Найдено ${existingScreenshotPaths.length} скриншотов из ${absoluteScreenshotPaths.length}`,
    )

    // Используем абсолютный путь к скрипту и виртуальное окружение
    const scriptPath = path.join(process.cwd(), "scripts/python/detect_objects.py")
    const venvPython = path.join(process.cwd(), "venv/bin/python")

    // Определяем оптимальный размер изображения для модели
    // YOLOv10 обычно работает с квадратными изображениями, но может принимать прямоугольные
    // Для 4K видео и вертикальных видео нужно выбрать подходящий размер
    const imgSize = 640 // Стандартный размер для YOLOv10

    // Проверяем существование Python в виртуальном окружении
    let command
    try {
      await fs.access(venvPython)
      console.log(`[detect-objects] Python в виртуальном окружении найден: ${venvPython}`)
      command = `"${venvPython}" "${scriptPath}" ${existingScreenshotPaths.map((p) => `"${p}"`).join(" ")} --output-dir "${outputDirPath}" --conf-threshold ${confidenceThreshold} --model ${modelName} --img-size ${imgSize}`
    } catch (error) {
      console.error(`[detect-objects] Python в виртуальном окружении не найден: ${venvPython}`)
      console.log(`[detect-objects] Попробуем использовать системный Python`)
      // Если Python в виртуальном окружении не найден, используем системный Python
      command = `python3 "${scriptPath}" ${existingScreenshotPaths.map((p) => `"${p}"`).join(" ")} --output-dir "${outputDirPath}" --conf-threshold ${confidenceThreshold} --model ${modelName} --img-size ${imgSize}`
    }

    console.log(`[detect-objects] Полный путь к скрипту: ${scriptPath}`)

    console.log(`[detect-objects] Выполняем команду: ${command}`)

    // Выполняем команду с обработкой ошибок
    let stdout
    try {
      stdout = await execAsync(command)
      console.log(
        `[detect-objects] Команда успешно выполнена, размер вывода: ${stdout.length} байт`,
      )
    } catch (error) {
      console.error(`[detect-objects] Ошибка при выполнении команды:`, error)
      throw new Error(`Ошибка при выполнении команды: ${error.message}`)
    }

    // Парсим результат
    let result
    try {
      // Ищем начало JSON в выводе (может содержать отладочную информацию перед JSON)
      const jsonStartIndex = stdout.indexOf("{")
      if (jsonStartIndex >= 0) {
        const jsonOutput = stdout.substring(jsonStartIndex)
        result = JSON.parse(jsonOutput)
        console.log(
          `[detect-objects] Результат успешно распарсен, количество обработанных изображений: ${result.image_count}`,
        )
      } else {
        throw new Error("JSON не найден в выводе команды")
      }
    } catch (error) {
      console.error(`[detect-objects] Ошибка при парсинге результата:`, error)
      console.error(`[detect-objects] Вывод команды:`, stdout)
      throw new Error(`Ошибка при парсинге результата: ${error.message}`)
    }

    // Добавляем ID видео к результату
    result.videoId = videoId

    // Сохраняем результаты в JSON-файл
    try {
      const jsonFilePath = path.join(jsonOutputDir, `${videoId}.json`)
      await fs.writeFile(jsonFilePath, JSON.stringify(result, null, 2))
      console.log(`[detect-objects] Результаты сохранены в JSON-файл: ${jsonFilePath}`)
    } catch (jsonError) {
      console.error(`[detect-objects] Ошибка при сохранении результатов в JSON-файл:`, jsonError)
    }

    // Отправляем уведомление о завершении распознавания объектов
    if (io) {
      io.emit("object_detection_complete", {
        videoId: videoId,
        detectionResults: result,
        timestamp: Date.now(),
      })
    }

    // Возвращаем результаты
    return res.status(200).json({
      success: true,
      result: result,
    })
  } catch (error) {
    console.error("[detect-objects] Ошибка при распознавании объектов:", error)

    // Получаем Socket.IO сервер из объекта ответа
    const io: SocketIOServer | undefined = res.socket.server.io

    // Отправляем уведомление об ошибке
    if (io && req.body.videoId) {
      io.emit("object_detection_error", {
        videoId: req.body.videoId,
        error: String(error),
        timestamp: Date.now(),
      })
    }

    return res.status(500).json({
      error: "Failed to detect objects",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
