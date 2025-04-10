import { Smile } from "lucide-react"
import { useState } from "react"

export function StickersList() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-3 pr-1 pl-1">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full px-3 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Smile className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Перетащите стикер на таймлайн, чтобы добавить его к проекту
          </p>
        </div>
      </div>
    </div>
  )
}
