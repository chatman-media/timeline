import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs, { extend } from "dayjs"
import duration from "dayjs/plugin/duration"

// Инициализируем плагин duration если еще не инициализирован
if (!dayjs.isDuration) {
  extend(duration)
}

export const formatDuration = (seconds: number) => {
  const duration = dayjs.duration(seconds, "seconds")
  if (duration.hours() > 0) {
    return duration.format("H:mm:ss")
  }
  return duration.format("m:ss")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeWithDecisecond(time: number, precision = 1): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const decisecond = precision > 0 ? Math.floor((time % 1) * 10 ** precision) : 0
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}${
    decisecond ? `.${decisecond}` : ""
  }`
}
