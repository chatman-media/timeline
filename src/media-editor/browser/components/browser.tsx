import { Blend, FlipHorizontal2, Image, Layout, Music, Sparkles } from "lucide-react"
import { memo, useEffect, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  EffectList,
  FilterList,
  MediaFileList,
  MusicFileList,
  TemplateList,
  TransitionsList,
} from "."

// Константа для ключа хранилища
const STORAGE_KEY_ACTIVE_TAB = "browser-active-tab"

export const TAB_TRIGGER_STYLES =
  "text-xs text-gray-800 dark:bg-[#1b1a1f] border-none " +
  "bg-gray-200 data-[state=active]:bg-secondary data-[state=active]:text-[#38dacac3] " +
  "dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-[#35d1c1] " +
  "hover:text-gray-800 dark:text-gray-400 dark:hover:bg-secondary dark:hover:text-gray-100 " +
  "border-1 border-transparent flex flex-col items-center justify-center gap-1 py-2 " +
  "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none"

// Используем memo для предотвращения ненужных рендеров
export const Browser = memo(function Browser() {
  // Используем useState с отложенной инициализацией для предотвращения ошибок гидратации
  const [activeTab, setActiveTab] = useState("media")

  // Загружаем сохраненный таб из localStorage только на клиенте
  useEffect(() => {
    // Функция для загрузки сохраненного таба из localStorage
    const getSavedActiveTab = (): string => {
      try {
        const savedTab = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB)
        return savedTab || "media"
      } catch (error) {
        return "media"
      }
    }

    // Устанавливаем активный таб из localStorage
    setActiveTab(getSavedActiveTab())
  }, [])

  // Обработчик изменения таба
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Сохраняем активный таб в localStorage
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, value)
    } catch (error) {
      // Игнорируем ошибки
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      defaultValue="media"
      className="flex h-full w-full flex-col items-stretch overflow-hidden"
    >
      <TabsList className="h-[50px] flex-shrink-0 justify-start border-none bg-transparent p-0">
        <TabsTrigger value="media" className={TAB_TRIGGER_STYLES}>
          <Image className="h-4 w-4" />
          <span>Медиатека</span>
        </TabsTrigger>
        <TabsTrigger value="music" className={TAB_TRIGGER_STYLES}>
          <Music className="h-4 w-4" />
          <span>Музыка</span>
        </TabsTrigger>
        <TabsTrigger value="transitions" className={TAB_TRIGGER_STYLES}>
          <FlipHorizontal2 className="h-4 w-4" />
          <span>Переходы</span>
        </TabsTrigger>
        <TabsTrigger value="effects" className={TAB_TRIGGER_STYLES}>
          <Sparkles className="h-4 w-4" />
          <span>Эффекты</span>
        </TabsTrigger>
        <TabsTrigger value="filters" className={TAB_TRIGGER_STYLES}>
          <Blend className="h-4 w-4" />
          <span>Фильтры</span>
        </TabsTrigger>
        {/* <TabsTrigger value="subtitles" className={TAB_TRIGGER_STYLES}>
          <Type className="h-4 w-4" />
          <span>Титры</span>
        </TabsTrigger> */}
        <TabsTrigger value="templates" className={TAB_TRIGGER_STYLES}>
          <Layout className="h-4 w-4" />
          <span>Шаблоны</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="media" className="bg-secondary m-0 flex-1 overflow-hidden">
        <MediaFileList />
      </TabsContent>
      <TabsContent value="music" className="bg-secondary m-0 flex-1 overflow-hidden">
        <MusicFileList />
      </TabsContent>
      <TabsContent value="transitions" className="bg-secondary m-0 flex-1 overflow-hidden">
        <TransitionsList />
      </TabsContent>
      <TabsContent value="effects" className="bg-secondary m-0 flex-1 overflow-hidden">
        <EffectList />
      </TabsContent>
      {/* <TabsContent value="subtitles" className="bg-secondary m-0 flex-1 overflow-hidden">
        <SubtitlesList />
      </TabsContent> */}
      <TabsContent value="filters" className="bg-secondary m-0 flex-1 overflow-hidden">
        <FilterList />
      </TabsContent>
      <TabsContent value="templates" className="bg-secondary m-0 flex-1 overflow-hidden">
        <TemplateList />
      </TabsContent>
    </Tabs>
  )
})
