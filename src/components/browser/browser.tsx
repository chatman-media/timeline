import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EffectsList } from "./effects-list"
import { MediaFileList } from "./media-file-list"
import { MusicFileList } from "./music-file-list"
import { StickersList } from "./stickers-list"
import { SubtitlesList } from "./subtitles-list"
import { TransitionsList } from "./transition-list"

export const TAB_TRIGGER_STYLES =
  "text-gray-800 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-800 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 border-2 border-transparent"

export function Browser() {
  return (
    <Tabs defaultValue="media" className="w-full h-full">
      <TabsList className="">
        <TabsTrigger value="media" className={TAB_TRIGGER_STYLES}>
          Медиатека
        </TabsTrigger>
        <TabsTrigger value="music" className={TAB_TRIGGER_STYLES}>
          Музыка
        </TabsTrigger>
        <TabsTrigger value="transitions" className={TAB_TRIGGER_STYLES}>
          Переходы
        </TabsTrigger>
        <TabsTrigger value="effects" className={TAB_TRIGGER_STYLES}>
          Эффекты
        </TabsTrigger>
        <TabsTrigger value="subtitles" className={TAB_TRIGGER_STYLES}>
          Титры
        </TabsTrigger>
        <TabsTrigger value="stickers" className={TAB_TRIGGER_STYLES}>
          Стикеры
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
      <TabsContent value="stickers" className="h-full">
        <StickersList />
      </TabsContent>
    </Tabs>
  )
}
