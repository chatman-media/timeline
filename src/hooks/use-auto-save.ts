import { useEffect, useRef, useState } from "react"

import { useRootStore } from "./use-root-store"

export function useAutoSave(intervalMs: number = 3000) {
  const { isSaved, saveState } = useRootStore()
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const autoSave = () => {
      if (!isSaved) {
        saveState()
        setLastSavedTime(new Date())
      }
      timeoutRef.current = setTimeout(autoSave, intervalMs)
    }

    timeoutRef.current = setTimeout(autoSave, intervalMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isSaved, saveState, intervalMs])

  return {
    lastSavedTime,
  }
}
