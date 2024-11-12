import Image from "next/image"
import localFont from "next/font/local"
import { useEffect, useState, useCallback } from "react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

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

// Добавляем интерфейс VideoFrame
interface VideoFrame {
  videoPath: string
  framePath: string
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
  <div className="w-full aspect-video bg-gray-900 rounded-lg">
    <div className="flex flex-col p-4">
      <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
      <div className="h-4 w-48 bg-gray-800 rounded mt-2 animate-pulse" />
    </div>
  </div>
)

export default function Home() {
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [timeRange, setTimeRange] = useState({ min: 0, max: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [frames, setFrames] = useState<VideoFrame[]>([])
  const [isLoadingFrames, setIsLoadingFrames] = useState(false)
  const [timezone, setTimezone] = useState("Asia/Bangkok")
  const [isPlaying, setIsPlaying] = useState(false)

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
        // Устаавливаем начальное значение слайдера в максимум
        setCurrentTime(timeRange.min)
      })
      .catch((error) => console.error("Error fetching videos:", error))
  }, [])

  // Добавяем debounced версию fetchFrames
  const debouncedFetchFrames = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (timestamp: number) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          fetchFrames(timestamp)
        }, 500) // 500ms задержка
      }
    })(),
    [videos] // Зависимость от videos, так как используется внутри функции
  )

  // Добавляем функцию для получения кадров
  const fetchFrames = async (timestamp: number) => {
    setIsLoadingFrames(true)
    try {
      const activeVideos = videos.filter((video) => {
        if (!video.metadata.creation_time) return false
        const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
        const startTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000
        return videoTime <= (startTime + timestamp)
      })

      if (activeVideos.length === 0) {
        setFrames([])
        return
      }

      // Изменяем структуру запроса согласно требованиям API
      const requestData = activeVideos.map(video => {
        const videoStartTime = new Date(video.metadata.creation_time!).getTime() / 1000
        const firstVideoTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000
        const relativeTimestamp = Math.max(0, timestamp - (videoStartTime - firstVideoTime))
        
        return {
          path: video.path,
          timestamp: relativeTimestamp // Отправляем массив timestamps
        }
      })

      console.log('Full request payload:', requestData)

      const response = await fetch('/api/video-frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      setFrames(data.frames)
    } catch (error) {
      console.error('Error fetching frames:', error)
      setFrames([])
    } finally {
      setIsLoadingFrames(false)
    }
  }

  // Добавляем эффект для воспроизведения
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= timeRange.max - timeRange.min) {
            setIsPlaying(false);
            fetchFrames(prevTime);
            return prevTime;
          }
          const newTime = prevTime + 1;
          // Обновляем кадры каждую секунду во время воспроизведения
          fetchFrames(newTime);
          return newTime;
        });
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, timeRange.max, timeRange.min]);

  // Модифицируем функцию handleTimeChange
  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0]);
    debouncedFetchFrames(value[0]);
  };

  // Добавляем функцию для управления воспроизведением
  const togglePlayback = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (!newPlayingState) {
      fetchFrames(currentTime);
    }
  };

  // Создаем функцию для фильтрации активных видео
  const isVideoActive = (video: VideoInfo) => {
    if (!video.metadata.creation_time) return false;
    const videoTime = new Date(video.metadata.creation_time).getTime() / 1000;
    const startTime = new Date(videos[0].metadata.creation_time!).getTime() / 1000;
    const videoSeconds = videoTime - startTime;
    const videoEndSeconds = videoSeconds + video.metadata.format.duration;
    return videoSeconds <= currentTime && currentTime <= videoEndSeconds;
  };

  // Создаем функцию для получения всех активных видео
  const getActiveVideos = () => {
    return videos.filter(isVideoActive);
  };

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-[family-name:var(--font-geist-sans)] relative`}>
      <div className="absolute top-4 right-4">
        {/* <TimeZoneSelect value={timezone} onValueChange={setTimezone} /> */}
      </div>
      <main className="flex flex-col gap-8 items-center w-full px-12 sm:px-16 py-16">
        {/* Панель управления */}
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            className="h-8 w-8"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm text-gray-500">
            {dayjs.duration(currentTime, "seconds").format("mm:ss")}
          </span>
        </div>

        <div className="w-full">
          <Slider
            defaultValue={[0]}
            max={timeRange.max - timeRange.min}
            step={1}
            value={[currentTime]}
            onValueChange={handleTimeChange}
            className="w-full"
          />
        </div>

        {/* Новый контейнер с разделением на две части */}
        <div className="flex gap-8 w-full">
          {/* Левая часть (2/3) для обычных видео */}
          <div className="w-2/3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Основные камеры</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {videos
                .filter(video => isVideoActive(video) && !video.name.toLowerCase().includes('.insv'))
                .map((video) => {
                  const videoFrame = frames.find(frame => frame.videoPath === video.path);
                  // Находим индекс видео среди всех активных видео
                  const activeIndex = getActiveVideos().findIndex(v => v.path === video.path);
                  return (
                    <div key={video.path} className="flex flex-col gap-3">
                      <div className="w-full aspect-video relative">
                        <Image
                          src={videoFrame?.framePath || video.thumbnail}
                          alt={video.name}
                          fill
                          className={`rounded-lg object-cover ${isLoadingFrames ? 'opacity-50' : ''}`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl">
                            {activeIndex + 1}
                          </span>
                          <h3 className="font-medium">{video.name}</h3>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-500">
                          <span>
                            {video.metadata.creation_time &&
                              dayjs(video.metadata.creation_time)
                                .tz(timezone)
                                .format("D MMM YYYY, HH:mm:ss")
                            }
                          </span>
                          <span>•</span>
                          <span>{formatDuration(video.metadata.format.duration)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Разделитель */}
          <div className="w-px bg-gray-200 dark:bg-gray-800" />

          {/* Правая часть (1/3) для INSV */}
          <div className="w-1/3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">360° камеры</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {videos
                .filter(video => isVideoActive(video) && video.name.toLowerCase().includes('.insv'))
                .map((video) => {
                  const videoFrame = frames.find(frame => frame.videoPath === video.path);
                  // Находим индекс видео среди всех активных видео
                  const activeIndex = getActiveVideos().findIndex(v => v.path === video.path);
                  return (
                    <div key={video.path} className="flex flex-col gap-3">
                      <div className="w-full aspect-video relative">
                        <Image
                          src={videoFrame?.framePath || video.thumbnail}
                          alt={video.name}
                          fill
                          className={`rounded-lg object-cover ${isLoadingFrames ? 'opacity-50' : ''}`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 text-base text-4xl font-extrabold tracking-tight lg:text-3xl">
                            {activeIndex + 1}
                          </span>
                          <h3 className="font-medium">{video.name}</h3>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-500">
                          <span>
                            {video.metadata.creation_time &&
                              dayjs(video.metadata.creation_time)
                                .tz(timezone)
                                .format("D MMM YYYY, HH:mm:ss")
                            }
                          </span>
                          <span>•</span>
                          <span>{formatDuration(video.metadata.format.duration)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
