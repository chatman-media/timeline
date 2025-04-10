import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  Maximize2,
  MonitorCog,
  Pause,
  Play,
  StepBack,
  StepForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { EntryPointIcon } from "@/components/icons/entry-point"
import { ExitPointIcon } from "@/components/icons/exit-point"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useRootStore } from "@/hooks/use-root-store"
import { cn } from "@/lib/utils"

import { Button } from "../ui/button"

export function PlayerControls() {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    activeVideo,
    setCurrentTime,
    volume: globalVolume,
    setVolume: setGlobalVolume,
    isSeeking,
    setIsSeeking,
    tracks,
    activeTrackId,
    timeRanges,
    initializeHistory,
    isRecordingSchema,
    startRecordingSchema,
    stopRecordingSchema,
  } = useRootStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [localTime, setLocalTime] = useState(currentTime)
  const lastUpdateTime = useRef(0)
  const lastSaveTime = useRef(0)
  const frameRef = useRef<number | null>(null)
  const initialFrameTimeRef = useRef<number | null>(null)
  const timeAtPlayStartRef = useRef<number>(0)
  const SAVE_INTERVAL = 5000 // Сохраняем каждые 5 секунд
  const [aspectRatioModalOpen, setAspectRatioModalOpen] = useState(false)
  const [showSafeZones, setShowSafeZones] = useState(false)
  const [showRuler, setShowRuler] = useState(false)

  // Загружаем состояние при монтировании компонента
  useEffect(() => {
    initializeHistory()
  }, [initializeHistory])

  // Сохраняем состояние периодически
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveTime.current >= SAVE_INTERVAL) {
        lastSaveTime.current = now
      }
    }, SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  // Синхронизируем локальное время с глобальным при изменении currentTime
  useEffect(() => {
    if (!isPlaying) {
      setLocalTime(currentTime)
    }
  }, [currentTime, isPlaying])

  // Фиксируем время начала воспроизведения
  useEffect(() => {
    if (isPlaying) {
      initialFrameTimeRef.current = null
    }
  }, [isPlaying, localTime])

  // Изменяем логику работы с таймером, чтобы управлять только активным видео
  useEffect(() => {
    if (!isPlaying || !activeVideo || isSeeking) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    // Получаем видеоэлементы только для активного видео
    const videoElements = document.querySelectorAll(`video[data-video-id="${activeVideo.id}"]`)
    if (videoElements.length === 0) {
      console.warn("No video elements found for active video:", activeVideo.id)
      return
    }

    console.log(
      `[PlayerControls] Воспроизведение видео ${activeVideo.id}, найдено элементов:`,
      videoElements.length,
    )

    // Воспроизводим только активное видео
    videoElements.forEach((videoElement) => {
      try {
        // Приводим элемент к типу HTMLVideoElement
        const video = videoElement as HTMLVideoElement
        video.play()
      } catch (e) {
        console.error(`Error playing video ${activeVideo.id}:`, e)
      }
    })

    // Функция для обновления UI на основе фактического состояния видео
    const updateVideo = () => {
      if (videoElements.length === 0) return

      // Берем первый видеоэлемент активного видео как источник времени
      const mainVideo = videoElements[0] as HTMLVideoElement
      const newTime = mainVideo.currentTime

      // Обновляем локальное время
      setLocalTime(newTime)

      // Обновляем глобальное время реже для улучшения производительности
      const now = performance.now()
      if (now - lastUpdateTime.current >= 100) {
        setCurrentTime(newTime)
        lastUpdateTime.current = now
      }

      // Запланировать следующий кадр
      frameRef.current = requestAnimationFrame(updateVideo)
    }

    frameRef.current = requestAnimationFrame(updateVideo)

    // Очищаем при размонтировании
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      // Останавливаем только активное видео
      videoElements.forEach((videoElement) => {
        try {
          const video = videoElement as HTMLVideoElement
          video.pause()
        } catch (e) {
          console.error(`Error pausing video ${activeVideo.id}:`, e)
        }
      })
    }
  }, [isPlaying, activeVideo, setCurrentTime, isSeeking])

  // Обновляем функцию handlePlayPause для работы только с активным видео
  const handlePlayPause = useCallback(() => {
    if (!activeVideo) return

    // Получаем видеоэлементы только для активного видео
    const videoElements = document.querySelectorAll(`video[data-video-id="${activeVideo.id}"]`)
    console.log(`[handlePlayPause] Найдено элементов для ${activeVideo.id}:`, videoElements.length)

    if (isPlaying) {
      // Если играет - останавливаем
      videoElements.forEach((videoElement) => {
        try {
          const video = videoElement as HTMLVideoElement
          video.pause()
          // Когда ставим на паузу, синхронизируем положение слайдера с видео
          const currentVideoTime = video.currentTime
          setLocalTime(currentVideoTime)
          setCurrentTime(currentVideoTime, "user")
        } catch (e) {
          console.error(`Error pausing video ${activeVideo.id}:`, e)
        }
      })
    } else {
      // Если на паузе - запускаем
      // Сначала получаем актуальное состояние UI
      const uiTime = localTime

      videoElements.forEach((videoElement) => {
        try {
          const video = videoElement as HTMLVideoElement
          // Устанавливаем текущее время для всех видео
          video.currentTime = uiTime
          video.play()
        } catch (e) {
          console.error(`Error playing video ${activeVideo.id}:`, e)
        }
      })
    }

    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying, localTime, setCurrentTime, activeVideo])

  const handleSkipBackward = useCallback(() => {
    if (!activeVideo) return

    const videoStartTime = activeVideo.startTime || 0
    // Если уже на первом кадре, не делаем ничего
    if (Math.abs(localTime - videoStartTime) < 0.01) return

    if (!activeVideo?.probeData?.streams?.[0]?.r_frame_rate) {
      const newTime = Math.max(videoStartTime, localTime - 1 / 25)
      setLocalTime(newTime)
      setCurrentTime(newTime)
      // Важно: обновляем точку отсчета для следующего воспроизведения
      timeAtPlayStartRef.current = newTime
      setIsPlaying(false)
      return
    }

    const fpsStr = activeVideo.probeData.streams[0].r_frame_rate
    // Более надежный расчет FPS
    const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
    const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

    if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

    const frameTime = 1 / fps
    // Используем актуальное localTime
    const newTime = Math.max(activeVideo.startTime || 0, localTime - frameTime)

    // Обновляем timeAtPlayStartRef, чтобы при следующем воспроизведении начать с правильного места
    timeAtPlayStartRef.current = newTime

    setLocalTime(newTime)
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [activeVideo, localTime, setCurrentTime, setIsPlaying, currentTime])

  const handleSkipForward = useCallback(() => {
    if (!activeVideo) return

    const videoEndTime = (activeVideo.startTime || 0) + (activeVideo.duration || 0)
    // Если уже на последнем кадре, не делаем ничего
    if (Math.abs(localTime - videoEndTime) < 0.01) return

    if (!activeVideo?.probeData?.streams?.[0]?.r_frame_rate) {
      const newTime = Math.min(videoEndTime, localTime + 1 / 25)
      setLocalTime(newTime)
      setCurrentTime(newTime)
      // Важно: обновляем точку отсчета для следующего воспроизведения
      timeAtPlayStartRef.current = newTime
      setIsPlaying(false)
      return
    }

    const fpsStr = activeVideo.probeData.streams[0].r_frame_rate
    // Более надежный расчет FPS
    const fpsMatch = fpsStr.match(/(\d+)\/(\d+)/)
    const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : eval(fpsStr)

    if (typeof fps !== "number" || fps <= 0 || isNaN(fps)) return

    const frameTime = 1 / fps
    // Используем актуальное localTime и проверяем, что не выходим за конец видео
    const newTime = Math.min(videoEndTime, localTime + frameTime)

    // Обновляем timeAtPlayStartRef, чтобы при следующем воспроизведении начать с правильного места
    timeAtPlayStartRef.current = newTime

    setLocalTime(newTime)
    setCurrentTime(newTime)
    setIsPlaying(false)
  }, [activeVideo, localTime, setCurrentTime, setIsPlaying, currentTime])

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setGlobalVolume(value[0])
    },
    [setGlobalVolume],
  )

  const handleToggleMute = useCallback(() => {
    setGlobalVolume(globalVolume === 0 ? 1 : 0)
  }, [globalVolume, setGlobalVolume])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const handleRecordToggle = useCallback(() => {
    if (isRecordingSchema) {
      stopRecordingSchema()
    } else {
      // Используем ID активного трека, если он есть, или ID активного видео
      const trackId = activeTrackId || activeVideo?.id || ""
      if (trackId) {
        console.log("[handleRecordToggle] Начинаем запись для трека:", trackId)
        startRecordingSchema(trackId, localTime)
      } else {
        console.warn("Не удалось начать запись: отсутствует активный трек и активное видео")
      }
    }
  }, [
    isRecordingSchema,
    startRecordingSchema,
    stopRecordingSchema,
    activeTrackId,
    activeVideo,
    localTime,
  ])

  // Упрощаем handleTimeChange для работы напрямую с видео
  const handleTimeChange = useCallback(
    (value: number[]) => {
      if (!activeVideo) return

      const videoStartTime = activeVideo.startTime || 0
      const videoEndTime = videoStartTime + (activeVideo.duration || 0)

      // Убедимся, что значение из слайдера валидное
      const sliderValue = value[0]
      if (!isFinite(sliderValue) || sliderValue < 0) return

      const newTime = Math.min(videoEndTime, Math.max(videoStartTime, sliderValue + videoStartTime))

      // Устанавливаем локальное и глобальное время сразу
      setLocalTime(newTime)
      setCurrentTime(newTime, "user")

      // Флаг seeking не нужно устанавливать на длительное время,
      // иначе можно заблокировать обработку событий слайдера
      setIsSeeking(true)

      // Синхронизируем видео элементы после установки времени
      const updateVideoElements = () => {
        // Получаем видеоэлементы только для активного видео
        const videoElements = document.querySelectorAll(`video[data-video-id="${activeVideo.id}"]`)
        videoElements.forEach((videoElement) => {
          try {
            const video = videoElement as HTMLVideoElement
            // Устанавливаем позицию видео на новое время
            video.currentTime = newTime
          } catch (e) {
            console.error(`Error setting time for video ${activeVideo.id}:`, e)
          }
        })

        // Сразу сбрасываем флаг seeking
        setIsSeeking(false)
      }

      // Запускаем обновление видео элементов в асинхронном режиме,
      // чтобы не блокировать обработку событий слайдера
      setTimeout(updateVideoElements, 0)
    },
    [activeVideo, setCurrentTime, setIsSeeking],
  )

  const handleChevronFirst = useCallback(() => {
    if (!activeVideo) return

    const startTime = activeVideo.startTime || 0

    // Уже находимся в начале
    if (Math.abs(localTime - startTime) < 0.01) return

    setLocalTime(startTime)
    setCurrentTime(startTime)

    // Обновляем timeAtPlayStartRef
    timeAtPlayStartRef.current = startTime

    setIsPlaying(false)
  }, [activeVideo, setCurrentTime, setIsPlaying, localTime])

  const handleChevronLast = useCallback(() => {
    if (!activeVideo) return

    const videoEndTime = (activeVideo.startTime || 0) + (activeVideo.duration || 0)

    // Уже находимся в конце
    if (Math.abs(localTime - videoEndTime) < 0.01) return

    setLocalTime(videoEndTime)
    setCurrentTime(videoEndTime)

    // Обновляем timeAtPlayStartRef
    timeAtPlayStartRef.current = videoEndTime

    setIsPlaying(false)
  }, [activeVideo, setCurrentTime, setIsPlaying, localTime])

  // Проверяем, находимся ли мы на первом или последнем кадре
  const fps = activeVideo?.probeData?.streams?.[0]?.r_frame_rate
  const frameTime = fps ? 1 / eval(fps) : 0
  const isFirstFrame = Math.abs(localTime - (activeVideo?.startTime || 0)) < frameTime
  const isLastFrame = Math.abs(localTime - (activeVideo?.endTime || Infinity)) < frameTime

  // Функция для форматирования времени в формат ЧЧ:ММ:СС.МС
  const formatTime = (time: number) => {
    // Обрабатываем отрицательное время (оно не должно отображаться как отрицательное)
    const absTime = Math.abs(time)
    // Отрицательное время отображаем как 00:00:00.000
    if (time < 0) {
      return "00:00:00.000"
    }

    const hours = Math.floor(absTime / 3600)
    const minutes = Math.floor((absTime % 3600) / 60)
    const seconds = Math.floor(absTime % 60)
    const milliseconds = Math.floor((absTime % 1) * 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  // Добавляем эффект для сохранения времени внутри дня при переключении дорожек
  useEffect(() => {
    // Если активное видео изменилось, но время внутри дня должно быть сохранено
    if (activeVideo) {
      try {
        // Получаем timestamp из метаданных видео (обычно он хранится в tags.creation_time)
        const creationTimeStr = activeVideo.probeData?.format?.tags?.creation_time || ""

        if (typeof creationTimeStr !== "string" || !creationTimeStr) {
          console.log("Нет данных о времени создания видео")
          return
        }

        // Получаем абсолютное время суток от начала дня для текущего положения
        const currentTimeOfDay = getTimeOfDayFromISOTime(creationTimeStr, localTime)

        console.log("[PlayerControls] Переключение на новое видео:", {
          currentVideo: activeVideo.name,
          creationTime: creationTimeStr,
          currentTimeOfDay,
        })

        // Если удалось получить время суток, применяем его к новой дорожке
        if (currentTimeOfDay !== null) {
          // Пытаемся найти такую же временную точку в новом видео
          const newPositionInVideo = getPositionFromTimeOfDay(creationTimeStr, currentTimeOfDay)

          if (newPositionInVideo !== null) {
            console.log("[PlayerControls] Устанавливаем позицию в новом видео:", newPositionInVideo)

            // Проверяем, находится ли новая позиция в границах видео
            const videoStartTime = activeVideo.startTime || 0
            const videoEndTime = videoStartTime + (activeVideo.duration || 0)

            if (newPositionInVideo >= videoStartTime && newPositionInVideo <= videoEndTime) {
              // Обновляем локальное время и глобальное время
              setLocalTime(newPositionInVideo)
              setCurrentTime(newPositionInVideo, "user")

              // Обновляем видео элементы
              const videoElements = document.querySelectorAll("video")
              videoElements.forEach((video) => {
                try {
                  video.currentTime = newPositionInVideo
                } catch (e) {
                  console.error("Error setting video time during track switch:", e)
                }
              })
            }
          }
        }
      } catch (e) {
        console.error("Error syncing time between tracks:", e)
      }
    }
  }, [activeVideo?.id, setCurrentTime, localTime])

  // Вспомогательная функция для получения времени суток из ISO времени и позиции видео
  function getTimeOfDayFromISOTime(isoTime: string, positionInVideo: number): number | null {
    try {
      // Парсим ISO время начала видео
      const date = new Date(isoTime)
      if (isNaN(date.getTime())) return null

      // Получаем секунды от начала дня для начала видео
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()
      const milliseconds = date.getMilliseconds()

      const startTimeOfDay = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000

      // Добавляем позицию в видео к начальному времени
      return startTimeOfDay + positionInVideo
    } catch (e) {
      console.error("Error parsing time:", e)
      return null
    }
  }

  // Вспомогательная функция для получения позиции в видео по времени суток
  function getPositionFromTimeOfDay(isoTime: string, timeOfDay: number): number | null {
    try {
      // Парсим ISO время начала видео
      const date = new Date(isoTime)
      if (isNaN(date.getTime())) return null

      // Получаем секунды от начала дня для начала видео
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()
      const milliseconds = date.getMilliseconds()

      const startTimeOfDay = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000

      // Вычисляем позицию в видео
      return timeOfDay - startTimeOfDay
    } catch (e) {
      console.error("Error calculating position:", e)
      return null
    }
  }

  return (
    <div className="w-full flex flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Slider
              value={[Math.max(0, localTime - (activeVideo?.startTime || 0))]}
              min={0}
              max={activeVideo?.duration || 100}
              step={0.01}
              onValueChange={handleTimeChange}
              className="cursor-pointer"
            />
          </div>
          <span className="text-xs bg-white dark:bg-black text-black dark:text-white rounded-md px-1">
            {formatTime(Math.max(0, localTime - (activeVideo?.startTime || 0)))}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="text-xs bg-white dark:bg-black text-black dark:text-white rounded-md px-1">
            {formatTime(activeVideo?.duration || 0)}
          </span>
        </div>
      </div>

      <div className="w-full flex items-center p-[2px] justify-between">
        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Первый кадр"
            onClick={handleChevronFirst}
            disabled={isFirstFrame || isPlaying}
          >
            <ChevronFirst className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Предыдущий кадр"
            onClick={handleSkipBackward}
            disabled={isFirstFrame || isPlaying}
          >
            <StepBack className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title={isPlaying ? "Пауза" : "Воспроизвести"}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Следующий кадр"
            onClick={handleSkipForward}
            disabled={isLastFrame || isPlaying}
          >
            <StepForward className="w-4 h-4" />
          </Button>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Последний кадр"
            onClick={handleChevronLast}
            disabled={isLastFrame || isPlaying}
          >
            <ChevronLast className="w-4 h-4" />
          </Button>

          <Button
            className={"cursor-pointer h-6 w-6"}
            variant="ghost"
            size="icon"
            title={isRecordingSchema ? "Остановить запись" : "Начать запись"}
            onClick={handleRecordToggle}
          >
            <CircleDot
              className={cn(
                "w-4 h-4",
                isRecordingSchema
                  ? "text-red-500 hover:text-red-600 animate-pulse"
                  : "text-white hover:text-gray-300",
              )}
            />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Точка входа"
            onClick={() => {}}
          >
            <EntryPointIcon className="w-4 h-4" />
          </Button>
          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Точка выхода"
            onClick={() => {}}
          >
            <ExitPointIcon className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="cursor-pointer h-6 w-6"
                variant="ghost"
                size="icon"
                title="Настройки"
              >
                <MonitorCog className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[#1a1a1a] text-white">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setAspectRatioModalOpen(true)}
              >
                Изменить соотношение сторон
              </DropdownMenuItem>
              <DropdownMenuSeparator className="" />
              <DropdownMenuCheckboxItem
                checked={showSafeZones}
                onCheckedChange={setShowSafeZones}
                className="cursor-pointer"
              >
                Безопасные зоны
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showRuler}
                onCheckedChange={setShowRuler}
                className="cursor-pointer"
              >
                Линейка
                <span className="ml-2 text-[#999]">⌘P</span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title="Сделать снимок"
            onClick={() => {}}
          >
            <Camera className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              className="cursor-pointer h-6 w-6"
              variant="ghost"
              size="icon"
              title={globalVolume === 0 ? "Включить звук" : "Выключить звук"}
              onClick={handleToggleMute}
            >
              {globalVolume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <div className="w-20">
              <Slider
                value={[globalVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
              />
            </div>
          </div>

          <Button
            className="cursor-pointer h-6 w-6"
            variant="ghost"
            size="icon"
            title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            onClick={handleFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {aspectRatioModalOpen && (
        <Dialog open={aspectRatioModalOpen} onOpenChange={setAspectRatioModalOpen}>
          <DialogContent className="bg-[#1a1a1a] text-white border-[#333]">
            <DialogHeader>
              <DialogTitle className="text-white text-center text-xl">
                Настройки проекта
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-6 py-4">
              <div className="flex justify-between items-center">
                <Label className="text-[#ccc]">Соотношение сторон:</Label>
                <Select defaultValue="16:9">
                  <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <SelectItem value="16:9" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      16:9 (Широкоэкранный)
                    </SelectItem>
                    <SelectItem value="9:16" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      9:16 (Портрет)
                    </SelectItem>
                    <SelectItem value="1:1" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      1:1 (Instagram)
                    </SelectItem>
                    <SelectItem value="4:3" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      4:3 (Стандарт)
                    </SelectItem>
                    <SelectItem value="4:5" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      4:5 (Вертикальный)
                    </SelectItem>
                    <SelectItem value="21:9" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      21:9 (Кинотеатр)
                    </SelectItem>
                    <SelectItem value="3:4" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      3:4 (Бизнес)
                    </SelectItem>
                    <SelectItem
                      value="custom"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      Пользовательское
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-[#ccc]">Разрешение:</Label>
                <Select defaultValue="4096x2160">
                  <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <SelectItem
                      value="1280x720"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      1280x720 (HD)
                    </SelectItem>
                    <SelectItem
                      value="1920x1080"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      1920x1080 (Full HD)
                    </SelectItem>
                    <SelectItem
                      value="3840x2160"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      3840x2160 (4k UHD)
                    </SelectItem>
                    <SelectItem
                      value="4096x2160"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      4096x2160 (DCI 4k)
                    </SelectItem>
                    <SelectItem
                      value="custom"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      Пользовательское
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-[#ccc]">Частота кадров:</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <SelectItem
                      value="23.97"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      23.97 fps
                    </SelectItem>
                    <SelectItem value="24" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      24 fps
                    </SelectItem>
                    <SelectItem value="25" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      25 fps
                    </SelectItem>
                    <SelectItem
                      value="29.97"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      29.97 fps
                    </SelectItem>
                    <SelectItem value="30" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      30 fps
                    </SelectItem>
                    <SelectItem value="50" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      50 fps
                    </SelectItem>
                    <SelectItem
                      value="59.94"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      59.94 fps
                    </SelectItem>
                    <SelectItem value="60" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      60 fps
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-[#ccc]">Цветовое пространство:</Label>
                <Select defaultValue="sdr">
                  <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <SelectItem value="sdr" className="text-white hover:bg-[#333] focus:bg-[#333]">
                      SDR - Rec.709
                    </SelectItem>
                    <SelectItem
                      value="dci-p3"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      DCI-P3
                    </SelectItem>
                    <SelectItem
                      value="p3-d65"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      P3-D65
                    </SelectItem>
                    <SelectItem
                      value="hdr-hlg"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      HDR - Rec.2100HLG
                    </SelectItem>
                    <SelectItem
                      value="hdr-pq"
                      className="text-white hover:bg-[#333] focus:bg-[#333]"
                    >
                      HDR - Rec.2100PQ
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex justify-between space-x-4">
              <Button
                variant="outline"
                className="flex-1 text-white bg-[#333333] hover:bg-[#444444] border-none"
                onClick={() => setAspectRatioModalOpen(false)}
              >
                Отменить
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-[#00CCC0] hover:bg-[#00AAA0] text-black border-none"
                onClick={() => {
                  setAspectRatioModalOpen(false)
                  // Здесь логика сохранения настроек
                }}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
