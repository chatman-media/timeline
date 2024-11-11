import Image from "next/image"
import localFont from "next/font/local"
import { useEffect, useState } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

// Добавляем интерфейс VideoInfo
interface VideoInfo {
  name: string
  path: string
  thumbnail: string
  metadata: {
    format: {
      duration: number
    }
    creation_time?: string
  }
}

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

// Добавляем функцию форматирования времени
const formatDuration = (seconds: number) => {
  const duration = dayjs.duration(seconds, "seconds")
  if (duration.hours() > 0) {
    return duration.format("H:mm:ss")
  }
  return duration.format("m:ss")
}

// Добавим компонент-заглушку
const EmptyState = () => (
  <div className="flex gap-4 items-center">
    <div className="w-[160px] h-[90px] bg-gray-900 rounded-lg" />
    <div className="flex flex-col">
      <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
      <div className="h-4 w-48 bg-gray-800 rounded mt-2 animate-pulse" />
    </div>
  </div>
)

export default function Home() {
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => {
        // Сортируем видео по времени создания
        const sortedVideos = data.videos.sort((a: VideoInfo, b: VideoInfo) => {
          const timeA = a.metadata.creation_time ? new Date(a.metadata.creation_time).getTime() : 0
          const timeB = b.metadata.creation_time ? new Date(b.metadata.creation_time).getTime() : 0
          return timeA - timeB
        })

        // Находим минимальное время начала и максимальное время окончания среди всех видо
        const times = sortedVideos.flatMap((v: VideoInfo) => {
          if (!v.metadata.creation_time) return []
          const startTime = new Date(v.metadata.creation_time).getTime()
          const endTime = startTime + (v.metadata.format.duration * 1000) // конвертируем длительность в миллисекунды
          return [startTime, endTime]
        }).filter((t: number) => t > 0)
        console.log(times.map((t: number) => new Date(Math.floor(t))))

        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)

        // Устанавливаем диапазон в секундах
        setTimeRange({
          min: Math.floor(minTime / 1000),
          max: Math.floor(maxTime / 1000),
        })

        setVideos(sortedVideos)
        // Устанавливаем начальное значение слайдера в максимум
        setCurrentTime(timeRange.min)
      })
      .catch((error) => console.error("Error fetching videos:", error))
  }, [])

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-6xl">
        <div className="w-full">
          <Slider
            defaultValue={[0]}
            max={timeRange.max - timeRange.min}
            step={1}
            value={[currentTime]}
            onValueChange={(value) => setCurrentTime(value[0])}
          />
          <div className="mt-2 text-sm text-gray-500">
            {videos.length > 0 && videos[0].metadata.creation_time && (
              dayjs(new Date(videos[0].metadata.creation_time).getTime() + (currentTime * 1000))
                .format("D MMM YYYY, HH:mm:ss")
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {videos.filter((video) => {
              if (!video.metadata.creation_time) return false
              const videoTime = new Date(video.metadata.creation_time).getTime()
              const startTime = new Date(videos[0].metadata.creation_time!).getTime() // Используем первое (самое старое) видео как точку отсчета
              const videoSeconds = Math.floor((videoTime - startTime) / 1000)
              return videoSeconds <= currentTime
            }).length === 0
            ? <EmptyState />
            : (
              videos
                .filter((video) => {
                  if (!video.metadata.creation_time) return false
                  const videoTime = new Date(video.metadata.creation_time).getTime()
                  const startTime = new Date(videos[0].metadata.creation_time!).getTime() // Используем первое (самое старое) видео как точку отсчета
                  const videoSeconds = Math.floor((videoTime - startTime) / 1000)
                  return videoSeconds <= currentTime
                })
                .map((video) => (
                  <div key={video.path} className="flex gap-4 items-center">
                    <Image
                      src={video.thumbnail}
                      alt={video.name}
                      width={160}
                      height={90}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex flex-col">
                      <h3 className="font-medium">{video.name}</h3>
                      <div className="flex gap-2 text-sm text-gray-500">
                        <span>
                          {video.metadata.creation_time &&
                            dayjs(video.metadata.creation_time).tz("Asia/Bangkok").format(
                              "D MMM YYYY, HH:mm:ss",
                            )}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(video.metadata.format.duration)}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  )
}
