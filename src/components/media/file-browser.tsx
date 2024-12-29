import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { MediaFilesList } from "./media-files-list"
import { MusicFilesList } from "./music-files-list"

export function FileBrowser({ viewMode }: { viewMode: "list" | "grid" | "thumbnails" }) {
  return (
    <Tabs defaultValue="media" className="w-full h-full">
      <TabsList className="ml-9 bg-white dark:bg-gray-800">
        <TabsTrigger
          value="media"
          className="text-gray-500 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Медиатека
        </TabsTrigger>
        <TabsTrigger
          value="music"
          className="text-gray-500 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Музыка
        </TabsTrigger>
        <TabsTrigger
          value="transitions"
          className="text-gray-500 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Переходы
        </TabsTrigger>
        <TabsTrigger
          value="effects"
          className="text-gray-500 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
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
      <TabsContent
        value="transitions"
        className="text-sm text-gray-400 dark:text-gray-500 p-2"
      >
        Переходы
      </TabsContent>
      <TabsContent value="effects" className="text-sm text-gray-400 dark:text-gray-500 p-2">
        Эффекты
      </TabsContent>
    </Tabs>
  )
}
