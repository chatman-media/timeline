import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EffectsList } from "./effects-list"
import { MediaFileList } from "./media-file-list"
import { MusicFileList } from "./music-file-list"
import { TransitionsList } from "./transition-list"

export const TAB_TRIGGER_STYLES =
  "text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"

export function Browser() {
  return (
    <Tabs defaultValue="media" className="w-full h-full">
      <TabsList className="ml-7">
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
      </TabsList>
      <TabsContent value="media">
        <MediaFileList />
      </TabsContent>
      <TabsContent value="music">
        <MusicFileList />
      </TabsContent>
      <TabsContent value="transitions">
        <TransitionsList />
      </TabsContent>
      <TabsContent value="effects">
        <EffectsList />
      </TabsContent>
    </Tabs>
  )
}
