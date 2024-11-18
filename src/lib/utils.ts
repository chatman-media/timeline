import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs, { extend } from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

// Инициализируем плагин duration если еще не инициализирован
if (!dayjs.isDuration) {
  extend(duration)
}

// Инициализируем необходимые плагины
dayjs.extend(utc)
dayjs.extend(timezone)

export const formatDuration = (seconds: number): string => {
  const duration = dayjs.duration(seconds, "seconds")
  const ms = Math.floor((seconds % 1) * 1000)

  return `${duration.format("mm:ss")}.${ms.toString().padStart(3, "0")}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeWithDecisecond(time: number, precision = 0): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const decisecond = precision > 0 ? Math.floor((time % 1) * 10 ** (precision + 1)) : 0
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}${
    decisecond ? `.${decisecond}` : ""
  }`
}

export function formatTimeWithMilliseconds(seconds: number): string {
  // Конвертируем секунды в миллисекунды и создаем объект dayjs
  const time = dayjs(seconds * 1000)
    .utc()
    .tz(dayjs.tz.guess()) // Определяем локальную таймзону пользователя

  const hours = time.hour()
  const minutes = time.minute()
  const secs = time.second()
  const ms = time.millisecond()

  return `${hours.toString().padStart(2, "0")}:${
    minutes
      .toString()
      .padStart(2, "0")
  }:${secs.toString().padStart(2, "0")}.${
    ms
      .toString()
      .padStart(3, "0")
  }`
}
