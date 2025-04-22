import { Blend, FlipHorizontal2, Image, Layout, Music, Sparkles, Type } from "lucide-react"
import { memo, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  EffectsList,
  FiltersList,
  MediaFileList,
  MusicFileList,
  SubtitlesList,
  TransitionsList,
} from "."

export const TAB_TRIGGER_STYLES =
  "text-xs text-gray-800 dark:bg-[#1b1a1f] border-none " +
  "bg-gray-200 data-[state=active]:bg-secondary data-[state=active]:text-[#38dacac3] " +
  "dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-[#38dac9] " +
  "hover:text-gray-800 dark:text-gray-400 dark:hover:bg-secondary dark:hover:text-gray-100 " +
  "border-1 border-transparent flex flex-col items-center justify-center gap-1 py-2 " +
  "[&>svg]:data-[state=active]:text-[#38dacac3] rounded-none"

// Используем memo для предотвращения ненужных рендеров
export const Browser = memo(function Browser() {
  const [activeTab, setActiveTab] = useState("media")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
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
        <TabsTrigger value="subtitles" className={TAB_TRIGGER_STYLES}>
          <Type className="h-4 w-4" />
          <span>Титры</span>
        </TabsTrigger>
        {/* <TabsTrigger value="stickers" className={TAB_TRIGGER_STYLES}>
          <Sticker className="w-4 h-4" />
          <span>Стикеры</span>
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
        <EffectsList />
      </TabsContent>
      <TabsContent value="subtitles" className="bg-secondary m-0 flex-1 overflow-hidden">
        <SubtitlesList />
      </TabsContent>
      <TabsContent value="filters" className="bg-secondary m-0 flex-1 overflow-hidden">
        <FiltersList />
      </TabsContent>
      {/* <TabsContent value="stickers" className="flex-1 overflow-hidden">
        <StickersList />
      </TabsContent> */}
    </Tabs>
  )
})
