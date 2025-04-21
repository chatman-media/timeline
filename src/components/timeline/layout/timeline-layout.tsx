import { Layout, LayoutTemplate, Scissors, SquareMousePointer } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTimelineContext } from "@/providers"

import { TimelineControls } from ".."
import { TimelineTopPanel } from "./timeline-top-panel"

export function TimelineLayout() {
  const { sectors } = useTimelineContext()
  console.log(sectors)
  return (
    <div className="flex flex-col h-full">
      {/* Панель управления дорожками */}
      <TimelineTopPanel
        tracks={[]}
        deleteTrack={() => {}}
        cutTrack={() => {}}
        handleScaleDecrease={() => {}}
        handleScaleIncrease={() => {}}
        handleSliderChange={() => {}}
        sliderValue={0}
        maxScale={0}
      />

      {/* Скроллируемый контент с разделением на левую и правую части */}
      <div className="flex-1 overflow-auto overflow-y-auto overflow-x-hidden">
        <div className="flex h-full">
          {/* Левая панель фиксированной ширины */}
          <div
            className="w-[200px] h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 sticky left-0 min-h-full"
            style={{
              height: `${sectors?.reduce(
                (acc, sector) => acc + 42 + sector.tracks.length * 54,
                0,
              )}px`,
            }}
          >
            {sectors?.map((sector, index) => (
              <div className="flex flex-col gap-1 p-2 w-full">
                <div className="h-[26px] flex-shrink-0 z-10 w-full"></div>
                {sector.tracks.map((track, index) => (
                  <div
                    className="flex-1 w-full text-sm p-2 min-h-[50px] bg-[#033032]"
                    style={{ height: `50px` }}
                  >
                    {track.name}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Правая часть со скроллом */}
          <div
            className="flex flex-col w-full overflow-y-hidden overflow-x-auto"
            style={{
              height: `${sectors?.reduce(
                (acc, sector) => acc + 42 + sector.tracks.length * 54,
                0,
              )}px`,
            }}
          >
            {sectors?.map((sector, index) => (
              <div
                className="overflow-x-auto flex-shrink-0"
                style={{
                  height: `${42 + sector.tracks.length * 54}px`,
                }}
              >
                <div
                  className="h-[30px] flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 w-full"
                  style={{
                    width: `${
                      Math.max(...sector.tracks.map((t) => (t.endTime ?? 0) - (t.startTime ?? 0))) *
                        5 +
                      8
                    }px`,
                  }}
                >
                  Шкала
                </div>

                <div className="flex flex-col gap-1 p-2 w-full">
                  {sector.tracks.map((track, index) => (
                    <div
                      key={index}
                      // ширина должна быть равна самому длинному треку в секторе
                      className={cn(
                        "h-[50px] w-[220px] flex-shrink-0 rounded-lg bg-gradient-to-br bg-[#033032]",
                      )}
                      style={{ width: `${track.combinedDuration * 5}px` }}
                    >
                      <div className="flex-1 h-full text-sm justify-between">
                        {track.name}
                        {track.videos.map((video, index) => (
                          <div key={index}>{video.name}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
