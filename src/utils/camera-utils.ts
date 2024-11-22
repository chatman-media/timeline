export function getCameraIndex(videoPath: string): number {
  const cameraMatch = videoPath.match(/camera[_-]?(\d+)/i)
  return cameraMatch ? parseInt(cameraMatch[1]) : 1
}
