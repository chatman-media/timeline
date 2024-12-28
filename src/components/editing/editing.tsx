import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EditingIndex } from "./editing-index"
import { EditingTracks } from "./editing-tracks"

export function Editing() {
  return (
    <Tabs defaultValue="index" className="w-full h-full">
      <TabsList className="bg-white dark:bg-gray-800">
        <TabsTrigger
          value="index"
          className="text-gray-500 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Монтаж
        </TabsTrigger>
        <TabsTrigger
          value="tracks"
          className="text-gray-500 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Дорожки
        </TabsTrigger>
      </TabsList>

      <TabsContent value="index">
        <EditingIndex />
      </TabsContent>
      <TabsContent value="tracks">
        <EditingTracks />
      </TabsContent>
    </Tabs>
  )
}
