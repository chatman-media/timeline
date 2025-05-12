import { Blend, FlipHorizontal2, Image, Layout, Music, Sparkles, Type } from "lucide-react"
import dynamic from "next/dynamic"
import { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBrowserVisibility } from "@/media-editor/browser/providers/browser-visibility-provider"

import {
  BrowserToggle,
  EffectList,
  FilterList,
  MediaFileList,
  MusicFileList,
  SubtitlesList,
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

// Клиентский компонент Browser
const BrowserClient = memo(function BrowserClient() {
  // Используем useState с отложенной инициализацией для предотвращения ошибок гидратации
  const [activeTab, setActiveTab] = useState("media")
  const { t } = useTranslation()
  const { isBrowserVisible } = useBrowserVisibility()

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
    <div className={`relative h-full ${isBrowserVisible ? "w-full" : "w-0 overflow-hidden"}`}>
      <BrowserToggle />
      <div className={isBrowserVisible ? "block h-full" : "hidden"}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          defaultValue="media"
          className="flex h-full w-full flex-col items-stretch overflow-hidden"
        >
          <TabsList className="h-[50px] flex-shrink-0 justify-start border-none bg-transparent p-0">
            <TabsTrigger value="media" className={TAB_TRIGGER_STYLES}>
              <Image className="h-4 w-4" />
              <span>{t("browser.tabs.media")}</span>
            </TabsTrigger>
            <TabsTrigger value="music" className={TAB_TRIGGER_STYLES}>
              <Music className="h-4 w-4" />
              <span>{t("browser.tabs.music")}</span>
            </TabsTrigger>
            <TabsTrigger value="effects" className={TAB_TRIGGER_STYLES}>
              <Sparkles className="h-4 w-4" />
              <span>{t("browser.tabs.effects")}</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className={TAB_TRIGGER_STYLES}>
              <Blend className="h-4 w-4" />
              <span>{t("browser.tabs.filters")}</span>
            </TabsTrigger>
            {/* <TabsTrigger value="subtitles" className={TAB_TRIGGER_STYLES}>
              <Type className="h-4 w-4" />
              <span>{t("titles.add")}</span>
            </TabsTrigger> */}
            <TabsTrigger value="transitions" className={TAB_TRIGGER_STYLES}>
              <FlipHorizontal2 className="h-4 w-4" />
              <span>{t("browser.tabs.transitions")}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className={TAB_TRIGGER_STYLES}>
              <Layout className="h-4 w-4" />
              <span>{t("browser.tabs.templates")}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="media" className="bg-secondary m-0 flex-1 overflow-auto">
            <MediaFileList />
          </TabsContent>
          <TabsContent value="music" className="bg-secondary m-0 flex-1 overflow-auto">
            <MusicFileList />
          </TabsContent>
          <TabsContent value="transitions" className="bg-secondary m-0 flex-1 overflow-auto">
            <TransitionsList />
          </TabsContent>
          <TabsContent value="effects" className="bg-secondary m-0 flex-1 overflow-auto">
            <EffectList />
          </TabsContent>
          <TabsContent value="subtitles" className="bg-secondary m-0 flex-1 overflow-auto">
            <SubtitlesList />
          </TabsContent>
          <TabsContent value="filters" className="bg-secondary m-0 flex-1 overflow-auto">
            <FilterList />
          </TabsContent>
          <TabsContent value="templates" className="bg-secondary m-0 flex-1 overflow-auto">
            <TemplateList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
})

// Экспортируем компонент с использованием dynamic для предотвращения ошибок гидратации
export const Browser = dynamic(() => Promise.resolve(BrowserClient), {
  ssr: false,
})
