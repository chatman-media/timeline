import { useEffect, useRef, useState } from "react"
import { formatTime } from "@/lib/utils"

interface PreviewTimelineProps {
  time: number
  duration: number
  videoRef?: HTMLVideoElement | null
}

export function PreviewTimeline({ time, duration, videoRef }: PreviewTimelineProps) {
  const animationRef = useRef<number | undefined>(undefined)
  const [displayTime, setDisplayTime] = useState(time)

  // Эффект для синхронизации с внешним временем при не проигрывании
  useEffect(() => {
    // Если не воспроизводится или нет ссылки на видео, используем переданное время
    if (!videoRef || videoRef.paused) {
      setDisplayTime(time)
    }
  }, [time, videoRef])

  // Эффект для анимации движения индикатора во время проигрывания
  useEffect(() => {
    if (!videoRef) return

    console.log("[PreviewTimeline] videoRef установлен, настраиваем анимацию")

    // Функция для обновления позиции индикатора
    const updatePosition = () => {
      // Обновляем состояние только если видео проигрывается
      if (!videoRef.paused) {
        setDisplayTime(videoRef.currentTime)
      }

      // Запрашиваем следующий кадр анимации
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    // Запускаем анимацию сразу если видео уже играет
    if (!videoRef.paused) {
      console.log("[PreviewTimeline] Видео проигрывается, запускаем анимацию")
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    // Добавляем слушатели событий
    const handlePlay = () => {
      console.log("[PreviewTimeline] Событие play, запускаем анимацию")
      // Отменяем предыдущую анимацию, если она есть
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // Запускаем новую анимацию
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    const handlePause = () => {
      console.log("[PreviewTimeline] Событие pause, останавливаем анимацию")
      // Останавливаем анимацию
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      // Устанавливаем последнее известное время
      setDisplayTime(videoRef.currentTime)
    }

    // Регистрируем слушатели
    videoRef.addEventListener("play", handlePlay)
    videoRef.addEventListener("pause", handlePause)

    // Очистка при размонтировании
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      // Если videoRef все еще существует при размонтировании, удаляем слушатели
      if (videoRef) {
        videoRef.removeEventListener("play", handlePlay)
        videoRef.removeEventListener("pause", handlePause)
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
      <div
        className="absolute bottom-0 text-xs bg-black/75 text-white px-1 rounded pointer-events-none z-20"
        style={{
          left: `${positionPercent}%`,
          fontSize: "10px",
          transform: "translateX(-50%)",
        }}
      >
        {formatTime(displayTime, false)}
      </div>
    </>
  )
}
