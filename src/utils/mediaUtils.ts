import { MediaFile } from "@/types/videos"

// Функция для расчета реальных размеров
export const calculateRealDimensions = (stream: any) => {
  const rotation = stream.rotation ? parseInt(stream.rotation) : 0
  const width = stream.width
  const height = stream.height

  if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
    return {
      width: height,
      height: width,
      style: "",
    }
  }

  return {
    width: width,
    height: height,
    style: "",
  }
}

// Функция для определения последовательных записей
export const getSequentialGroups = (files: MediaFile[]) => {
  const groups: { [key: string]: MediaFile[] } = {}

  files.forEach((file) => {
    const match = file.name.match(/(.+?)(?:_(\d+))?\.([^.]+)$/)
    if (match) {
      const baseName = match[1]
      if (!groups[baseName]) {
        groups[baseName] = []
      }
      groups[baseName].push(file)
    }
  })

  const groupsBySize = Object.values(groups)
    .filter((files) => files.length > 1)
    .reduce((acc, files) => {
      const count = files.length
      acc[count] = (acc[count] || 0) + 1
      return acc
    }, {} as Record<number, number>)

  return Object.entries(groupsBySize)
    .map(([size, count]) => `${count} серии по ${size} видео`)
    .join(", ")
}

// Функция определения горизонтального видео
export const isHorizontalVideo = (width: number, height: number, rotation?: number) => {
  if (rotation && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
    return height > width
  }
  return width > height
}
