import ffmpeg from "fluent-ffmpeg"
import { ScreenshotsConfig } from "../types/screenshots"

export async function generateThumbnails(
  videoPath: string,
  config: ScreenshotsConfig,
): Promise<string[]> {
  const {
    count = 1,
    folder,
    filename,
    size,
    timestamps,
    quality = 3,
  } = config

  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath)

    if (timestamps) {
      // Используем конкретные временные метки
      timestamps.forEach((time) => {
        command = command.screenshot({
          folder,
          filename: `${filename}-%i.jpg`,
          timestamps: [time],
          size: size ? `${size.width}x${size.height}` : "?x?",
        })
      })
    } else {
      // Делаем равномерно распределенные скриншоты
      command.screenshot({
        folder,
        filename: `${filename}-%i.jpg`,
        count,
        size: size ? `${size.width}x${size.height}` : "?x?",
      })
    }

    command.on("end", () => {
      const files = Array.from(
        { length: timestamps ? timestamps.length : count },
        (_, i) => `${folder}/${filename}-${i + 1}.jpg`,
      )
      resolve(files)
    })
      .on("error", reject)
  })
}
