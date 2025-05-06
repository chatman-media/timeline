import { cn } from "@/lib/utils"
import { TimelineTopPanel, useTimeline } from "@/media-editor/timeline/"
import { MediaFile, Track } from "@/types/media"

export function TimelineLayout() {
  const { sectors } = useTimeline()

  console.log(
    "TimelineLayout rendering with sectors:",
    sectors.map((s) => ({
      name: s.name,
      tracksCount: s.tracks.length,
      tracks: s.tracks.map((t) => ({
        name: t.name,
        videosCount: t.videos?.length || 0,
      })),
    })),
  )

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
                (acc, sector) => acc + 57 + sector.tracks.length * 54,
                0,
              )}px`,
            }}
          >
            {sectors?.map((sector, index) => {
              console.log(`Rendering sector ${sector.name} with ${sector.tracks.length} tracks`)
              return (
                <div key={index} className="flex w-full flex-col gap-1 p-2">
                  <div className="z-10 h-[26px] w-full flex-shrink-0 font-bold">{sector.name}</div>
                  {sector.tracks.map((track: Track, i: number) => {
                    console.log(
                      `Rendering track ${track.name} with ${track.videos?.length || 0} videos`,
                    )
                    return (
                      <div
                        key={i}
                        className="min-h-[50px] w-full flex-1 bg-[#033032] p-2 text-sm"
                        style={{ height: `50px` }}
                      >
                        <div className="flex flex-row justify-between">
                          <div>{track.name}</div>
                          <div className="font-bold">({track.videos?.length || 0} видео)</div>
                        </div>
                        <div className="truncate text-xs text-gray-400">
                          {track.videos?.map((v) => v.name).join(", ")}
                        </div>
                      </div>
                    )
                  })}
                  <div className="h-[11px] w-full flex-shrink-0"></div>
                </div>
              )
            })}
          </div>

          {/* Правая часть со скроллом */}
          <div
            className="flex h-full w-full flex-col overflow-x-auto overflow-y-hidden"
            style={{
              height: `${sectors?.reduce(
                (acc, sector) => acc + 57 + sector.tracks.length * 54,
                0,
              )}px`,
            }}
          >
            {sectors?.map((sector, index) => (
              <div
                key={index}
                className="flex-shrink-0 overflow-x-auto overflow-y-hidden"
                style={{
                  height: `${57 + sector.tracks.length * 54}px`,
                }}
              >
                <div
                  className="z-10 h-[30px] w-full flex-shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  style={{
                    width: `${
                      Math.max(
                        ...sector.tracks.map((t: Track) => (t.endTime ?? 0) - (t.startTime ?? 0)),
                      ) *
                        5 +
                      8
                    }px`,
                  }}
                >
                  Шкала
                </div>

                <div className="flex w-full flex-col gap-1 p-2">
                  {sector.tracks.map((track: Track, index: number) => (
                    <div
                      key={index}
                      // ширина должна быть равна самому длинному треку в секторе
                      className={cn("h-[50px] w-[220px] flex-shrink-0 rounded-lg bg-[#033032]")}
                      style={{ width: `${(track.combinedDuration ?? 0) * 5}px` }}
                    >
                      <div className="h-full flex-1 justify-between overflow-x-auto text-sm whitespace-nowrap">
                        <div className="flex flex-row justify-between">
                          <div className="font-bold">{track.name}</div>
                          <div className="font-bold">({track.videos?.length || 0} видео)</div>
                        </div>
                        <div
                          className="relative flex flex-row gap-2 overflow-x-auto"
                          style={{ height: "30px" }}
                        >
                          {track.videos?.map((video: MediaFile, index: number) => (
                            <div
                              key={index}
                              className="absolute rounded bg-[#044042] px-1"
                              style={{
                                left: `${(video.startTime || 0) * 5}px`,
                                width: `${(video.duration || 0) * 5}px`,
                                height: "30px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {video.name}
                            </div>
                          ))}
                        </div>
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
