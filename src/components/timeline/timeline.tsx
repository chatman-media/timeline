import React, { useCallback, useEffect, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useTimelineScale } from "@/hooks/use-timeline-scale"
import { SeekbarState } from "@/types/timeline"

import { VideoTrack } from "../track"
import { TrackSliceWrap } from "../track/track-slice-wrap"
import { MediaFile, Track } from "@/types/videos"

export function Timeline() {
  const { tracks, activeVideo, currentTime, setActiveVideo } = useMedia()
  const { scale, maxDuration, minStartTime } = useTimelineScale()
  const parentRef = useRef<HTMLDivElement>(null)

  const TRACK_HEIGHT = 100 // Высота одного трека

  const handleTrackClick = useCallback((e: React.MouseEvent, track: Track, video?: MediaFile) => {
    if (video && video.id) {
      setActiveVideo(video.id)
    } else {
      setActiveVideo(`V${track.index}`)
    }
  }, [setActiveVideo])

  return (
    <div className="timeline w-full min-h-[calc(50vh-70px)]">
      <div className="relative" style={{ paddingBottom: `37px` }}>
        <div className="flex">
          <div
            className="w-full flex flex-col gap-2"
            style={{ width: `${scale * 100}%` }}
          >
            {tracks.map((track, index) => {
              const firstVideo = track.videos[0]
              const lastVideo = track.videos[track.videos.length - 1]

              const trackStartTime = firstVideo.startTime || 0
              const trackEndTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)

              const startOffset = ((trackStartTime - minStartTime) / maxDuration) * 100
              const width = ((trackEndTime - trackStartTime) / maxDuration) * 100

              return (
                <div
                  key={`track-${track.id}`}
                  className="relative"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <div
                    className="absolute h-full"
                    style={{
                      left: `${startOffset}%`,
                      width: `${width}%`,
                    }}
                  >
                    <VideoTrack
                      track={track}
                      index={index}
                      timeRanges={track.timeRanges}
                      maxDuration={maxDuration}
                      activeVideo={activeVideo?.id}
                      handleTrackClick={handleTrackClick}
                      parentRef={parentRef}
                      currentTime={currentTime}
                      TrackSliceWrap={TrackSliceWrap}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
