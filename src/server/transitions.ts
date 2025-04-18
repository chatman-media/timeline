import ffmpeg from "fluent-ffmpeg"

import { TransitionEffect } from "@/types/transitions"

export async function generateTransition(
  sourceVideo: string,
  targetVideo: string,
  transition: TransitionEffect,
  params: Record<string, any>,
): Promise<{ status: "success" | "error"; outputPath?: string; error?: string }> {
  const outputPath = `output_${Date.now()}.mp4`

  // Получаем информацию о видео через ffprobe
  const videoInfo = (await getVideoInfo(sourceVideo)) as any
  const fps = videoInfo.streams[0].r_frame_rate ? eval(videoInfo.streams[0].r_frame_rate) : 30

  // Генерируем команду с актуальными параметрами
  const command = transition.ffmpegCommand({
    fps,
    width: videoInfo.streams[0].width,
    height: videoInfo.streams[0].height,
    scale: params.scale || transition.params?.scale,
    duration: params.duration || transition.duration,
  })

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(sourceVideo)
      .input(targetVideo)
      .complexFilter(command)
      .outputOptions(["-c:v libx264", "-preset fast", "-crf 22"])
      .output(outputPath)
      .on("end", () => resolve({ status: "success", outputPath }))
      .on("error", (err) => reject({ status: "error", error: err.message }))
      .run()
  })
}

// Вспомогательная функция для получения информации о видео
async function getVideoInfo(videoPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata)
    })
  })
}
