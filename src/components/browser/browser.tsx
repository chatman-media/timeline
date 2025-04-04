import { Blend, FlipHorizontal2, Image, Music, Sparkles, Sticker, Type } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EffectsList } from "./effects-list"
import { FiltersList } from "./filters-list"
import { MediaFileList } from "./media-file-list"
import { MusicFileList } from "./music-file-list"
import { StickersList } from "./stickers-list"
import { SubtitlesList } from "./subtitles-list"
import { TransitionsList } from "./transition-list"

export const TAB_TRIGGER_STYLES =
  "text-xs text-gray-800 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-secondary data-[state=active]:text-black dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-white hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 border-1 border-transparent flex flex-col items-center justify-center gap-1 py-2"

export function Browser() {
  return (
    <Tabs defaultValue="media" className="w-full h-full">
      <TabsList className="bg-transparent h-[50px]">
        <TabsTrigger value="media" className={TAB_TRIGGER_STYLES}>
          <Image className="w-4 h-4" />
          <span>Медиатека</span>
        </TabsTrigger>
        <TabsTrigger value="music" className={TAB_TRIGGER_STYLES}>
          <Music className="w-4 h-4" />
          <span>Музыка</span>
        </TabsTrigger>
        <TabsTrigger value="transitions" className={TAB_TRIGGER_STYLES}>
          <FlipHorizontal2 className="w-4 h-4" />
          <span>Переходы</span>
        </TabsTrigger>
        <TabsTrigger value="effects" className={TAB_TRIGGER_STYLES}>
          <Sparkles className="w-4 h-4" />
          <span>Эффекты</span>
        </TabsTrigger>
        <TabsTrigger value="subtitles" className={TAB_TRIGGER_STYLES}>
          <Type className="w-4 h-4" />
          <span>Титры</span>
        </TabsTrigger>
        <TabsTrigger value="filters" className={TAB_TRIGGER_STYLES}>
          <Blend className="w-4 h-4" />
          <span>Фильтры</span>
        </TabsTrigger>
        <TabsTrigger value="stickers" className={TAB_TRIGGER_STYLES}>
          <Sticker className="w-4 h-4" />
          <span>Стикеры</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="media" className="h-full">
        <MediaFileList />
      </TabsContent>
      <TabsContent value="music" className="h-full">
        <MusicFileList />
      </TabsContent>
      <TabsContent value="transitions" className="h-full">
        <TransitionsList />
      </TabsContent>
      <TabsContent value="effects" className="h-full">
        <EffectsList />
      </TabsContent>
      <TabsContent value="subtitles" className="h-full">
        <SubtitlesList />
      </TabsContent>
      <TabsContent value="filters" className="h-full">
        <FiltersList />
      </TabsContent>
      <TabsContent value="stickers" className="h-full">
        <StickersList />
      </TabsContent>
    </Tabs>
  )
}
