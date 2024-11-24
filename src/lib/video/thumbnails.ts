import { spawn } from "child_process"
import path from "path"
import { promises as fs } from "fs"
import process from "node:process"

export async function generateThumbnails(videoPath: string, videoName: string, duration: number) {
  const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails", videoName)
  await fs.mkdir(thumbnailsDir, { recursive: true })

  // Рассчитываем интервал для 30 кадров
  const fps = Math.ceil(duration / 30)

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      videoPath,
      "-vf",
      `fps=1/${fps}`, // 30 кадров на всю длительность
      "-frame_pts",
      "1",
      "-f",
      "image2",
      path.join(thumbnailsDir, "thumb-%d.jpg"),
    ])

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(true)
      else reject(new Error(`FFmpeg exited with code ${code}`))
    })

    ffmpeg.on("error", (err) => reject(err))
  })
}
