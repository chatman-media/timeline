import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EffectsList } from "./effects-list"
import { MediaFilesList } from "./media-files-list"
import { MusicFilesList } from "./music-files-list"
import { TransitionsList } from "./transitions-list"

export function FileBrowser({ viewMode }: { viewMode: "list" | "grid" | "thumbnails" }) {
  const handleTransitionSelect = (transitionId: string) => {
    // Здесь будет логика применения перехода
    console.log("Selected transition:", transitionId)
  }

  return (
    <Tabs defaultValue="media" className="w-full h-full">
      <TabsList className="ml-7">
        <TabsTrigger
          value="media"
          className="text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          Медиатека
        </TabsTrigger>
        <TabsTrigger
          value="music"
          className="text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          Музыка
        </TabsTrigger>
        <TabsTrigger
          value="transitions"
          className="text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          Переходы
        </TabsTrigger>
        <TabsTrigger
          value="effects"
          className="text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          Эффекты
        </TabsTrigger>
      </TabsList>
      <TabsContent value="media">
        <MediaFilesList viewMode={viewMode} />
      </TabsContent>
      <TabsContent value="music">
        <MusicFilesList />
      </TabsContent>
      <TabsContent value="transitions">
        <TransitionsList onSelect={handleTransitionSelect} />
      </TabsContent>
      <TabsContent value="effects">
        <EffectsList />
      </TabsContent>
    </Tabs>
  )
}
