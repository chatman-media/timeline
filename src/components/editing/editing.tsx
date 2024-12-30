import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EditingIndex } from "./editing-index"
import { EditingTracks } from "./editing-tracks"

export function Editing() {
  return (
    <Tabs defaultValue="index" className="w-full h-full">
      <TabsList className="">
        <TabsTrigger
          value="index"
          className="text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          Монтаж
        </TabsTrigger>
        <TabsTrigger
          value="tracks"
          className="text-gray-500 dark:bg-[#1b1a1f] bg-gray-200 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
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
