import { useEffect, useRef, useState } from "react"

interface PreviewTimelineProps {
  time: number
  duration: number
  videoRef?: HTMLVideoElement | null
}

export function PreviewTimeline({ time, duration, videoRef }: PreviewTimelineProps) {
  const animationRef = useRef<number | undefined>(undefined)
  const [displayTime, setDisplayTime] = useState(time)
  const lastTimeRef = useRef<number>(time)

  // Эффект для синхронизации с внешним временем при не проигрывании
  useEffect(() => {
    // Если не воспроизводится или нет ссылки на видео, используем переданное время
    if (!videoRef || videoRef.paused) {
      setDisplayTime(time)
      lastTimeRef.current = time
    }
  }, [time, videoRef])

  // Эффект для анимации движения индикатора во время проигрывания
  useEffect(() => {
    if (!videoRef) return

    // Функция для обновления позиции индикатора
    const updatePosition = () => {
      if (!videoRef) return

      const currentTime = videoRef.currentTime

      // Обновляем позицию только если время изменилось
      if (currentTime !== lastTimeRef.current) {
        setDisplayTime(currentTime)
        lastTimeRef.current = currentTime
      }

      // Запрашиваем следующий кадр анимации
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    // Запускаем анимацию сразу если видео уже играет
    if (!videoRef.paused) {
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    // Добавляем слушатели событий
    const handlePlay = () => {
      // Отменяем предыдущую анимацию, если она есть
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // Запускаем новую анимацию
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    const handlePause = () => {
      // Останавливаем анимацию
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      // Устанавливаем последнее известное время
      setDisplayTime(videoRef.currentTime)
      lastTimeRef.current = videoRef.currentTime
    }

    const handleTimeUpdate = () => {
      if (!videoRef.paused) {
        setDisplayTime(videoRef.currentTime)
        lastTimeRef.current = videoRef.currentTime
      }
    }

    // Регистрируем слушатели
    videoRef.addEventListener("play", handlePlay)
    videoRef.addEventListener("pause", handlePause)
    videoRef.addEventListener("timeupdate", handleTimeUpdate)

    // Очистка при размонтировании
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      // Если videoRef все еще существует при размонтировании, удаляем слушатели
      if (videoRef) {
        videoRef.removeEventListener("play", handlePlay)
        videoRef.removeEventListener("pause", handlePause)
        videoRef.removeEventListener("timeupdate", handleTimeUpdate)
      }
    }
  }, [videoRef]) // Зависимость только от videoRef

  // Защита от деления на ноль
  const positionPercent = duration > 0 ? (displayTime / duration) * 100 : 0

  return (
    <>
      <div
        className="absolute top-0 bottom-0 w-[1px] bg-red-500 pointer-events-none z-10"
        style={{
          left: `${positionPercent}%`,
        }}
      />
      {/* <div
        className="absolute bottom-0 text-xs bg-black/75 text-white px-1 rounded pointer-events-none z-20"
        style={{
          left: `${positionPercent}%`,
          fontSize: "10px",
          transform: "translateX(-50%)",
        }}
      >
        {formatTime(displayTime, false)}
      </div> */}
    </>
  )
}
