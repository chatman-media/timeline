import { useState } from "react"

export function SubtitlesList() {
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
          </div>
        </div>
      </div>
    </div>
  )
}
