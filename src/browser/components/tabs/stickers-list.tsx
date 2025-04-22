import { Smile } from "lucide-react"
import { useState } from "react"

export function StickersList() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-3 pr-1 pl-1">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="focus:ring-primary w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Smile className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
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
