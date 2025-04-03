import { Check } from "lucide-react"
import { useEffect, useState } from "react"

import { useAutoSave } from "@/hooks/use-auto-save"
import { useRootStore } from "@/hooks/use-root-store"
import { cn } from "@/lib/utils"

export function SaveStatus() {
  const { isSaved } = useRootStore()
  const { lastSavedTime } = useAutoSave()
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (lastSavedTime) {
      setShowTooltip(true)
      const timer = setTimeout(() => setShowTooltip(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastSavedTime])

  const getTimeAgo = () => {
    if (!lastSavedTime) return ""
    const seconds = Math.floor((Date.now() - lastSavedTime.getTime()) / 1000)
    if (seconds < 5) return "только что"
    if (seconds < 60) return `${seconds} сек. назад`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} мин. назад`
  }

  return (
    <div className="relative flex items-center">
      <div
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
          isSaved ? "bg-green-500/10" : "bg-gray-400/10",
        )}
      >
        <Check
          className={cn(
            "h-3 w-3 transition-all duration-200",
            isSaved ? "text-green-500" : "text-gray-400",
          )}
        />
      </div>
      {showTooltip && lastSavedTime && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Сохранено {getTimeAgo()}
        </div>
      )}
    </div>
  )
}
