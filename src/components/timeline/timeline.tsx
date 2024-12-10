import React, { useRef } from "react"

import { useMedia } from "@/hooks/use-media"

import { VideoTrack } from "../track"
import { TrackSliceWrap } from "../track/track-slice-wrap"
import { TimelineScale } from "./timeline-scale"

export function Timeline() {
  const { tracks } = useMedia()
  const parentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="timeline w-full min-h-[calc(50vh-70px)]">
      {/* <TimelineScale tracks={tracks} /> */}
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          <div className="w-full flex flex-col gap-2" // style={{ width: `${scale * 100}%` }}
          >
            {tracks.map((track, index) => (
              <div
                key={`track-${track.id}`}
                className="relative"
                style={{ height: 80 }}
              >
                <VideoTrack
                  track={track}
                  index={index}
                  parentRef={parentRef}
                  TrackSliceWrap={TrackSliceWrap}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
