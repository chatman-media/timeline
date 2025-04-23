export function FiltersList() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-3 pr-1 pl-1">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="focus:ring-primary w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Заглушки для фильтров */}
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <div className="absolute right-2 bottom-2 left-2">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Фильтр {index + 1}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Описание фильтра</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Перетащите фильтр на клип на таймлайне, чтобы применить его
          </p>
        </div>
      </div>
    </div>
  )
}
