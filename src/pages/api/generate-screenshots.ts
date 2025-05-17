import { exec } from "child_process"
import fs from "fs/promises"
import { NextApiRequest, NextApiResponse } from "next"
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
        console.error(`[generate-screenshots] Ошибка выполнения команды: ${error.message}`)
        console.error(`[generate-screenshots] stderr: ${stderr}`)
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
}

// Функция для проверки наличия виртуального окружения и Python
const checkVenvPythonInstalled = async (): Promise<boolean> => {
  try {
    const venvPython = path.join(process.cwd(), "venv/bin/python")
    await execAsync(`"${venvPython}" --version`)
    return true
  } catch (error) {
    console.error("[generate-screenshots] Виртуальное окружение Python не найдено:", error)
    return false
  }
}

// Функция для проверки наличия необходимых библиотек в виртуальном окружении
const checkPythonDependencies = async (): Promise<boolean> => {
  try {
    // Проверяем наличие OpenCV в виртуальном окружении
    const venvPython = path.join(process.cwd(), "venv/bin/python")
    await execAsync(`"${venvPython}" -c "import cv2; print('OpenCV version:', cv2.__version__)"`)
    return true
  } catch (error) {
    console.error(
      "[generate-screenshots] Необходимые Python-библиотеки не установлены в виртуальном окружении:",
      error,
    )
    return false
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
  const isPythonInstalled = await checkVenvPythonInstalled()
  if (!isPythonInstalled) {
    console.log(
      "[generate-screenshots] Python в виртуальном окружении не найден, проверяем системный Python",
    )

    // Проверяем наличие системного Python
    try {
      await execAsync("python3 --version")
      console.log("[generate-screenshots] Системный Python найден")
    } catch (error) {
      console.error("[generate-screenshots] Системный Python не установлен:", error)
      return res.status(500).json({
        error: "Python не установлен",
        details:
          "Для генерации скриншотов необходим Python 3. Пожалуйста, установите Python и необходимые зависимости.",
      })
    }
  }

  // Проверяем наличие необходимых библиотек
  const areDependenciesInstalled = await checkPythonDependencies()
  if (!areDependenciesInstalled) {
    console.log(
      "[generate-screenshots] Библиотеки в виртуальном окружении не найдены, проверяем системные библиотеки",
    )

    // Проверяем наличие системных библиотек
    try {
      await execAsync("python3 -c \"import cv2; print('OpenCV version:', cv2.__version__)\"")
      console.log("[generate-screenshots] Системный OpenCV найден")
    } catch (error) {
      console.error("[generate-screenshots] Системный OpenCV не установлен:", error)
      return res.status(500).json({
        error: "Необходимые Python-библиотеки не установлены",
        details:
          "Для генерации скриншотов необходимы библиотеки OpenCV и другие. Пожалуйста, установите их с помощью скрипта scripts/setup-python.sh.",
      })
    }
  }

  try {
    console.log("[generate-screenshots] Получен запрос на генерацию скриншотов")

    // Получаем данные из тела запроса
    const {
      videoFiles,
      screenshotsPath,
      interval = 1.0,
      maxScreenshots = null,
      width = null,
      height = null,
    } = req.body

    // Проверяем наличие необходимых данных
    if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0) {
      console.error("[generate-screenshots] Отсутствуют данные о видеофайлах")
      return res.status(400).json({ error: "Missing video files data" })
    }

    // Получаем путь для сохранения из запроса или используем значение по умолчанию
    const finalScreenshotsPath = screenshotsPath || "public/screenshots"

    // Создаем директорию для скриншотов, если она не существует
    const screenshotsDirPath = path.join(process.cwd(), finalScreenshotsPath)
    await fs.mkdir(screenshotsDirPath, { recursive: true })

    // Создаем директорию для результатов распознавания объектов
    const detectedDirPath = path.join(process.cwd(), "public/screenshots/detected")
    await fs.mkdir(detectedDirPath, { recursive: true })

    console.log(`[generate-screenshots] Директории для скриншотов созданы:`)
    console.log(`[generate-screenshots] - ${screenshotsDirPath}`)
    console.log(`[generate-screenshots] - ${detectedDirPath}`)

    console.log(`[generate-screenshots] Директория для скриншотов: ${screenshotsDirPath}`)

    // Получаем Socket.IO сервер из объекта ответа
    const io: SocketIOServer | undefined = res.socket.server.io

    // Результаты для каждого видеофайла
    const results = []

    // Обрабатываем каждый видеофайл
    for (const videoFile of videoFiles) {
      try {
        // Получаем путь к видеофайлу
        const videoPath = path.join(process.cwd(), "public", videoFile.path.replace(/^\//, ""))

        // Проверяем существование видеофайла
        try {
          await fs.access(videoPath)
          console.log(`[generate-screenshots] Видеофайл найден: ${videoPath}`)
        } catch (error) {
          console.error(`[generate-screenshots] Видеофайл не найден: ${videoPath}`)
          throw new Error(`Видеофайл не найден: ${videoPath}`)
        }

        // Создаем директорию для скриншотов конкретного видео
        const videoName = path.basename(videoFile.path, path.extname(videoFile.path))
        const videoScreenshotsPath = path.join(screenshotsDirPath, videoName)
        await fs.mkdir(videoScreenshotsPath, { recursive: true })

        console.log(`[generate-screenshots] Генерация скриншотов для видео: ${videoPath}`)
        console.log(
          `[generate-screenshots] Директория для скриншотов видео: ${videoScreenshotsPath}`,
        )

        // Формируем команду для генерации скриншотов
        // Используем абсолютный путь к скрипту и виртуальное окружение
        const scriptPath = path.join(process.cwd(), "scripts/python/generate_screenshots.py")
        const venvPython = path.join(process.cwd(), "venv/bin/python")

        // Проверяем существование Python в виртуальном окружении
        let command
        try {
          await fs.access(venvPython)
          console.log(`[generate-screenshots] Python в виртуальном окружении найден: ${venvPython}`)
          command = `"${venvPython}" "${scriptPath}" "${videoPath}" "${videoScreenshotsPath}" --interval ${interval} ${maxScreenshots ? `--max-screenshots ${maxScreenshots}` : ""}`

          // Добавляем параметры размера только если они указаны
          if (width !== null) {
            command += ` --width ${width}`
          }
          if (height !== null) {
            command += ` --height ${height}`
          }
        } catch (error) {
          console.error(
            `[generate-screenshots] Python в виртуальном окружении не найден: ${venvPython}`,
          )
          console.log(`[generate-screenshots] Попробуем использовать системный Python`)
          // Если Python в виртуальном окружении не найден, используем системный Python
          command = `python3 "${scriptPath}" "${videoPath}" "${videoScreenshotsPath}" --interval ${interval} ${maxScreenshots ? `--max-screenshots ${maxScreenshots}` : ""}`

          // Добавляем параметры размера только если они указаны
          if (width !== null) {
            command += ` --width ${width}`
          }
          if (height !== null) {
            command += ` --height ${height}`
          }
        }

        console.log(`[generate-screenshots] Полный путь к скрипту: ${scriptPath}`)
        console.log(`[generate-screenshots] Выполняем команду: ${command}`)

        // Отправляем уведомление о начале генерации скриншотов
        if (io) {
          io.emit("screenshot_generation_start", {
            videoId: videoFile.id,
            videoName: videoName,
            timestamp: Date.now(),
          })
        }

        // Выполняем команду с обработкой ошибок
        let stdout
        try {
          stdout = await execAsync(command)
          console.log(
            `[generate-screenshots] Команда успешно выполнена, размер вывода: ${stdout.length} байт`,
          )
        } catch (error) {
          console.error(`[generate-screenshots] Ошибка при выполнении команды:`, error)
          throw new Error(`Ошибка при выполнении команды: ${error?.message}`)
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
              `[generate-screenshots] Результат успешно распарсен, количество скриншотов: ${result.screenshot_count}`,
            )
          } else {
            throw new Error("JSON не найден в выводе команды")
          }
        } catch (error) {
          console.error(`[generate-screenshots] Ошибка при парсинге результата:`, error)
          console.error(`[generate-screenshots] Вывод команды:`, stdout)
          throw new Error(`Ошибка при парсинге результата: ${error?.message}`)
        }

        // Добавляем ID видео к результату
        result.videoId = videoFile.id

        // Добавляем результат в общий список
        results.push(result)

        // Отправляем уведомление о завершении генерации скриншотов
        if (io) {
          io.emit("screenshot_generation_complete", {
            videoId: videoFile.id,
            videoName: videoName,
            screenshotCount: result.screenshot_count,
            screenshots: result.screenshots,
            timestamp: Date.now(),
          })
        }

        // Автоматически запускаем распознавание объектов на созданных скриншотах
        try {
          console.log(
            `[generate-screenshots] Запуск распознавания объектов для видео ${videoFile.id}`,
          )

          // Получаем пути к скриншотам
          const screenshotPaths = result.screenshots.map((screenshot: any) => screenshot.path)

          // Формируем директорию для результатов распознавания
          const detectedOutputDir = path.join("public/screenshots/detected", videoFile.id)

          // Параметры для распознавания объектов
          const confidenceThreshold = 0.25
          const modelName = "yolov10s.pt"

          // Запускаем скрипт распознавания объектов
          const detectScriptPath = path.join(process.cwd(), "scripts/python/detect_objects.py")
          const detectCommand = command.includes(venvPython)
            ? `"${venvPython}" "${detectScriptPath}" ${screenshotPaths.map((p: string) => `"${p}"`).join(" ")} --output-dir "${path.join(process.cwd(), detectedOutputDir)}" --conf-threshold ${confidenceThreshold} --model ${modelName}`
            : `python3 "${detectScriptPath}" ${screenshotPaths.map((p: string) => `"${p}"`).join(" ")} --output-dir "${path.join(process.cwd(), detectedOutputDir)}" --conf-threshold ${confidenceThreshold} --model ${modelName}`

          console.log(
            `[generate-screenshots] Выполняем команду распознавания объектов: ${detectCommand}`,
          )

          // Выполняем команду асинхронно, не дожидаясь результата
          exec(detectCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
              console.error(
                `[generate-screenshots] Ошибка при распознавании объектов: ${error.message}`,
              )
              console.error(`[generate-screenshots] stderr: ${stderr}`)

              // Отправляем уведомление об ошибке
              if (io) {
                io.emit("object_detection_error", {
                  videoId: videoFile.id,
                  error: error.message,
                  timestamp: Date.now(),
                })
              }
              return
            }

            try {
              // Ищем начало JSON в выводе (может содержать отладочную информацию перед JSON)
              const jsonStartIndex = stdout.indexOf("{")
              if (jsonStartIndex >= 0) {
                const jsonOutput = stdout.substring(jsonStartIndex)
                const detectResult = JSON.parse(jsonOutput)
                console.log(
                  `[generate-screenshots] Распознавание объектов успешно завершено, количество обработанных изображений: ${detectResult.image_count || detectResult.results?.length || 0}`,
                )

                // Отправляем уведомление о завершении распознавания объектов
                if (io) {
                  io.emit("object_detection_complete", {
                    videoId: videoFile.id,
                    detectionResults: detectResult,
                    timestamp: Date.now(),
                  })
                }
              } else {
                throw new Error("JSON не найден в выводе команды распознавания объектов")
              }
            } catch (parseError) {
              console.error(
                `[generate-screenshots] Ошибка при парсинге результата распознавания:`,
                parseError,
              )

              // Отправляем уведомление об ошибке
              if (io) {
                io.emit("object_detection_error", {
                  videoId: videoFile.id,
                  error: String(parseError),
                  timestamp: Date.now(),
                })
              }
            }
          })

          console.log(
            `[generate-screenshots] Запрос на распознавание объектов отправлен асинхронно`,
          )
        } catch (detectError) {
          console.error(
            `[generate-screenshots] Ошибка при запуске распознавания объектов:`,
            detectError,
          )
          // Не прерываем основной процесс, если распознавание не удалось
        }
      } catch (error) {
        console.error(`[generate-screenshots] Ошибка при обработке видео ${videoFile.path}:`, error)

        // Добавляем информацию об ошибке в результаты
        results.push({
          videoId: videoFile.id,
          videoPath: videoFile.path,
          error: String(error),
        })

        // Отправляем уведомление об ошибке
        if (io) {
          io.emit("screenshot_generation_error", {
            videoId: videoFile.id,
            videoName: path.basename(videoFile.path, path.extname(videoFile.path)),
            error: String(error),
            timestamp: Date.now(),
          })
        }
      }
    }

    // Возвращаем результаты
    return res.status(200).json({
      success: true,
      results: results,
    })
  } catch (error) {
    console.error("[generate-screenshots] Ошибка при генерации скриншотов:", error)
    return res.status(500).json({
      error: "Failed to generate screenshots",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
