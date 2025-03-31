import { useCallback, useState } from "react"
import { useVideoStore } from "@/hooks/useVideoStore"

export function SubtitlesList() {
  const { tracks, currentTime, activeTrackId } = useVideoStore()
  const activeTrack = tracks.find(track => track.id === activeTrackId)
  
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
    {
      id: "subtitle-3",
      title: "Нижний титр",
      text: "Имя говорящего или локация",
      style: "lower-third"
    },
    {
      id: "subtitle-4",
      title: "Субтитры",
      text: "Текст речи или перевод",
      style: "subtitle"
    },
    {
      id: "subtitle-5",
      title: "Финальные титры",
      text: "Список участников и благодарности",
      style: "credits"
    }
  ])
  
  const handleDragStart = useCallback((e: React.DragEvent, subtitle: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'subtitle',
      data: subtitle,
      startTime: currentTime
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [currentTime])
  
  return (
    <div className="h-[calc(50vh-28px)] overflow-y-auto">
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Доступные титры</h3>
        
        <div className="grid gap-4">
          {subtitles.map((subtitle) => (
            <div 
              key={subtitle.id} 
              className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-grab"
              draggable
              onDragStart={(e) => handleDragStart(e, subtitle)}
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
          {!activeTrack && (
            <p className="text-sm text-amber-500 mt-2">
              Для добавления титров сначала выберите дорожку на таймлайне.
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 