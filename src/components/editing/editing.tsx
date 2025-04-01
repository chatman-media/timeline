import { TAB_TRIGGER_STYLES } from "../browser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EditingIndex } from "./editing-index"
import { EditingTracks } from "./editing-tracks"

export function Editing() {
  return (
    <Tabs defaultValue="index" className="w-full h-full">
      <TabsList className="">
        <TabsTrigger value="index" className={TAB_TRIGGER_STYLES}>
          Монтаж
        </TabsTrigger>
        <TabsTrigger value="tracks" className={TAB_TRIGGER_STYLES}>
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
