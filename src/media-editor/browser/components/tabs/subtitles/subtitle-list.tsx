import { useState } from "react"

export function SubtitlesList() {
  const [searchQuery, setSearchQuery] = useState("")
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-1">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="focus:ring-primary w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
      </div>
    </div>
  )
}
