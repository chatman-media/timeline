import { spawn } from "child_process"
import path from "path"
import { mkdir } from "fs/promises"
import { promises as fs } from "fs"
import { VideoAnalysis } from "@/types/video"
import process from "node:process"

export async function analyzeVideo(videoPath: string): Promise<VideoAnalysis> {
  const tempDir = path.join(process.cwd(), "public", "temp")
  const analysisFileName = `${path.parse(videoPath).name}_analysis.json`
  const analysisPath = path.join(tempDir, analysisFileName)

  await mkdir(tempDir, { recursive: true })

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      videoPath,
      "-af",
      "volumedetect",
      "-vf",
      "blackdetect=d=0.1:pix_th=0.1",
      "-f",
      "null",
      "-y",
      "pipe:1",
    ])

    let output = ""

    ffmpeg.stderr.on("data", (data) => {
      output += data.toString()
    })

    ffmpeg.on("close", async (code) => {
      if (code === 0) {
        const analysis = {
          blackFrames: parseBlackDetect(output),
          volumeStats: parseVolumeDetect(output),
        }

        await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2))
        resolve(analysis)
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${output}`))
      }
    })

    ffmpeg.on("error", (err) => reject(err))
  })
}

function parseBlackDetect(output: string) {
  const blackFrames = []
  const regex = /black_start:(\d+\.?\d*) black_end:(\d+\.?\d*)/g
  let match

  while ((match = regex.exec(output)) !== null) {
    blackFrames.push({
      start: parseFloat(match[1]),
      end: parseFloat(match[2]),
    })
  }

  return blackFrames
}

function parseVolumeDetect(output: string) {
  const meanVolumeMatch = output.match(/mean_volume: ([-\d.]+) dB/)
  const maxVolumeMatch = output.match(/max_volume: ([-\d.]+) dB/)

  return {
    meanVolume: meanVolumeMatch ? parseFloat(meanVolumeMatch[1]) : null,
    maxVolume: maxVolumeMatch ? parseFloat(maxVolumeMatch[1]) : null,
  }
}
