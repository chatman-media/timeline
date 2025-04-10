import { useState } from "react"

export function SubtitlesList() {
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
          </div>
        </div>
      </div>
    </div>
  )
}
