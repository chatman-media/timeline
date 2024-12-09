import { MediaFile } from "@/types/videos"
import { nanoid } from "nanoid"
import { calculateTimeRanges } from "./videoUtils"

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

// Функция для получения сгруппированных файлов
export const getGroupedFiles = (files: MediaFile[]) => {
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

  return Object.entries(groups)
    .reduce((acc, [key, files]) => {
      acc[key] = files.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
      return acc
    }, {} as { [key: string]: MediaFile[] })
}

// Функция для создания треков из файлов
export const createTracksFromFiles = (
  files: MediaFile[],
  currentTracksLength: number,
) => {
  return Object.entries(getGroupedFiles(files))
    .map(([groupKey, groupFiles], index) => ({
      id: nanoid(),
      index: currentTracksLength + index + 1,
      isActive: false,
      videos: groupFiles,
      startTime: groupFiles[0].startTime || 0,
      endTime: (groupFiles[groupFiles.length - 1].startTime || 0) +
        (groupFiles[groupFiles.length - 1].duration || 0),
      combinedDuration: groupFiles.reduce(
        (total, file) => total + (file.probeData?.format.duration || 0),
        0,
      ),
      timeRanges: calculateTimeRanges(groupFiles),
    }))
}
