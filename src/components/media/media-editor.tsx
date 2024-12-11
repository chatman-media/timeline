import { ThemeToggle } from "../layout/theme-toggle"
import { Timeline } from "../timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ActiveVideo } from "./active-video"
import { MediaFilesList } from "./media-files-list"
import { MusicFilesList } from "./music-files-list"

export function MediaEditor() {
  return (
    <div>
      <div
        data-testid="media-player"
        className="media-editor flex flex-row px-1 py-1 h-[50%]"
      >
        <div className="w-[40%]  max-w-[600px]">
          <ThemeToggle />
          <Tabs defaultValue="media" className="w-full">
            <TabsList className="ml-10">
              <TabsTrigger value="media">Медиатека</TabsTrigger>
              <TabsTrigger value="music">Музыка</TabsTrigger>
              <TabsTrigger value="transitions">Переходы</TabsTrigger>
            </TabsList>
            <TabsContent value="media">
              <MediaFilesList />
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
          </Tabs>
        </div>
        <div className="w-full">
          <div className="bg-gray-50 dark:bg-gray-900 m-1">
            <ActiveVideo />
          </div>
        </div>
      </div>
      <div
        data-testid="media-player"
        className="media-editor flex flex-row px-1 py-1 min-h-[50%]"
      >
        <Timeline />
      </div>
    </div>
  )
}
