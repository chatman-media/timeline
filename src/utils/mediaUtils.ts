import { MediaFile, Track } from "@/types/videos"
import { nanoid } from "nanoid"
import { calculateTimeRanges } from "./videoUtils"

// Функция для расчета реальных размеров
export const calculateRealDimensions = (
  stream: any,
): { width: number; height: number; style: string } => {
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
export const getSequentialGroups = (files: MediaFile[]): { [key: string]: MediaFile[] } => {
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
export const isHorizontalVideo = (width: number, height: number, rotation?: number): boolean => {
  if (rotation && (Math.abs(rotation) === 90 || Math.abs(rotation) === 270)) {
    return height > width
  }
  return width > height
}

// Функция для получения сгруппированных файлов
export const getGroupedFiles = (files: MediaFile[]): { [key: string]: MediaFile[] } => {
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
): Track[] => {
  const groupedFiles = getGroupedFiles(files)

  // Handle case where there's only one file
  if (files.length === 1) {
    const file = files[0]
    return [{
      id: nanoid(),
      index: currentTracksLength + 1,
      isActive: false,
      videos: [file], // Explicitly create array with single video
      startTime: file.startTime || 0,
      endTime: (file.startTime || 0) + (file.duration || 0),
      combinedDuration: file.duration || 0,
      timeRanges: calculateTimeRanges([file]),
    }]
  }

  return Object.entries(groupedFiles)
    .map(([, groupFiles], index) => ({
      id: nanoid(),
      index: currentTracksLength + index + 1,
      isActive: false,
      videos: groupFiles,
      startTime: groupFiles[0].startTime || 0,
      endTime: (groupFiles[groupFiles.length - 1].startTime || 0) +
        (groupFiles[groupFiles.length - 1].duration || 0),
      combinedDuration: groupFiles.reduce(
        (total, file) => total + (file.duration || 0),
        0,
      ),
      timeRanges: calculateTimeRanges(groupFiles),
    }))
}

export const getSequentialFiles = (files: MediaFile[]): MediaFile[] => {
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

  return Object.values(groups)
    .filter((group) => group.length > 1)
    .flat()
}

export function groupFilesByDate(media: MediaFile[]) {
  const videoFilesByDate = media.reduce((acc, file) => {
    if (!file.startTime || file.probeData?.streams?.[0]?.codec_type !== "video") return acc

    const date = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)

    return acc
  }, {} as Record<string, MediaFile[]>)

  return Object.entries(videoFilesByDate)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([date, files]) => ({ date, files }))
}
