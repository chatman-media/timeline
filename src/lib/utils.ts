import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeWithDecisecond(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const decisecond = Math.floor((time % 1) * 10)
  return `${minutes.toString().padStart(2, "0")}:${
    seconds.toString().padStart(2, "0")
  }.${decisecond}`
}
