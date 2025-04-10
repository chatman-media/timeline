export function FiltersList() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-3 pr-1 pl-1">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full px-3 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Заглушки для фильтров */}
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="aspect-video relative group overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-b from-transparent to-gray-200 dark:to-gray-700" />
              </div>
              <div className="absolute bottom-2 left-2 right-2">
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
