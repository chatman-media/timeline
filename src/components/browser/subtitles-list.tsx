import { useState } from "react"

export function SubtitlesList() {
  const [subtitles] = useState([
    {
      id: "subtitle-1",
      title: "Заголовок",
      text: "Главный заголовок видео",
      style: "heading-1"
    },
    {
      id: "subtitle-2",
      title: "Подзаголовок",
      text: "Подзаголовок или описание",
      style: "heading-2"
    },
  ])
  
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#1b1a1f] p-4">
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Доступные титры</h3>
      
      <div className="grid gap-4">
        {subtitles.map((subtitle) => (
          <div 
            key={subtitle.id} 
            className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{subtitle.title}</h4>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                {subtitle.style}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle.text}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Перетащите титр на таймлайн, чтобы добавить его к проекту. 
          Вы можете редактировать текст и стиль титров после добавления.
        </p>
      </div>
    </div>
  )
} 