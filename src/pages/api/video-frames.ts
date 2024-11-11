import type { NextApiRequest, NextApiResponse } from "next"
import { promises as fs } from "fs"
import * as pth from "path"
import ffmpeg from "fluent-ffmpeg"
import process from "node:process";

interface FrameResponse {
  frames?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FrameResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ frames: undefined, error: 'Method not allowed' })
  }

  try {
    console.log(req.body)
    
    const requestData = req.body
    const framesDir = pth.join(process.cwd(), 'public', 'frames')
    await fs.mkdir(framesDir, { recursive: true })

    // Обрабатываем все видео параллельно
    const framePromises = requestData.map(async ({ path, timestamp }) => {
        const fullVideoPath = pth.join(process.cwd(), 'public', path)
        const framePrefix = `${pth.parse(path).name}_${Date.now()}`
        
        await new Promise((resolve, reject) => {
            ffmpeg(fullVideoPath)
                .screenshots({
                    timestamps: [timestamp],
                    filename: `${framePrefix}_1.jpg`,
                    folder: framesDir,
                    size: '640x?'
                })
                .on('end', resolve)
                .on('error', reject)
        })

        return {
            videoPath: path,
            framePath: `/frames/${framePrefix}_1.jpg`
        }
    })

    const frames = await Promise.all(framePromises)
    res.status(200).json({ frames })
  } catch (error) {
    console.error('Error extracting frames:', error)
    res.status(500).json({ 
      error: 'Failed to extract frames' 
    })
  }
} 