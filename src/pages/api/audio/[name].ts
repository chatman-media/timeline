import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Video name is required' });
  }

  const videoPath = join(process.cwd(), 'public/videos', name);
  const audioPath = join(process.cwd(), 'public/audio', `${name}.mp3`);

  // Create audio directory if it doesn't exist
  const audioDir = join(process.cwd(), 'public/audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  try {
    // Extract audio if it doesn't exist
    if (!fs.existsSync(audioPath)) {
      await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}"`);
    }

    // Stream the audio file
    const stat = fs.statSync(audioPath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(audioPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      });
      
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
}