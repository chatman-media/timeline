import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
