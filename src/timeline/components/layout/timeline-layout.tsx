import { cn } from "@/lib/utils"
import { useTimelineContext } from "@/timeline/services"

import { TimelineTopPanel } from "./timeline-top-panel"

export function TimelineLayout() {
  const { sectors } = useTimelineContext()
  console.log(sectors)
  return (
    <div className="flex h-full flex-col">
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
      <div className="flex-1 overflow-auto overflow-x-hidden overflow-y-auto">
        <div className="flex h-full">
          {/* Левая панель фиксированной ширины */}
          <div
            className="sticky left-0 h-full min-h-full w-[200px] flex-shrink-0 border-r border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900"
            style={{
              height: `${sectors?.reduce(
                (acc, sector) => acc + 42 + sector.tracks.length * 54,
                0,
              )}px`,
            }}
          >
            {sectors?.map((sector, index) => (
              <div className="flex w-full flex-col gap-1 p-2">
                <div className="z-10 h-[26px] w-full flex-shrink-0"></div>
                {sector.tracks.map((track, index) => (
                  <div
                    className="min-h-[50px] w-full flex-1 bg-[#033032] p-2 text-sm"
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
            className="flex w-full flex-col overflow-x-auto overflow-y-hidden"
            style={{
              height: `${sectors?.reduce(
                (acc, sector) => acc + 42 + sector.tracks.length * 54,
                0,
              )}px`,
            }}
          >
            {sectors?.map((sector, index) => (
              <div
                className="flex-shrink-0 overflow-x-auto"
                style={{
                  height: `${42 + sector.tracks.length * 54}px`,
                }}
              >
                <div
                  className="z-10 h-[30px] w-full flex-shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
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

                <div className="flex w-full flex-col gap-1 p-2">
                  {sector.tracks.map((track, index) => (
                    <div
                      key={index}
                      // ширина должна быть равна самому длинному треку в секторе
                      className={cn(
                        "h-[50px] w-[220px] flex-shrink-0 rounded-lg bg-[#033032] bg-gradient-to-br",
                      )}
                      style={{ width: `${track.combinedDuration * 5}px` }}
                    >
                      <div className="h-full flex-1 justify-between text-sm">
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
