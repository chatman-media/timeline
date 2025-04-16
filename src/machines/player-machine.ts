import { useMachine } from "@xstate/react"
import { assign, createMachine } from "xstate"

import { MediaFile } from "@/types/media"
import { TimelineVideo } from "@/types/timeline"

export interface PlayerContextType {
  currentTime: number
  duration: number
  volume: number

  isPlaying: boolean
  isSeeking: boolean

  isChangingCamera: boolean
  isRecording: boolean
  videoRefs: Record<string, HTMLVideoElement>
  videos: Record<string, TimelineVideo>
}

const initialContext: PlayerContextType = {
  currentTime: 0,
  isPlaying: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  videoRefs: {},
  videos: {},
  duration: 0,
  volume: 1,
}

type SetCurrentTimeEvent = {
  type: "setCurrentTime"
  currentTime: number
}

type SetIsPlayingEvent = {
  type: "setIsPlaying"
  isPlaying: boolean
}

type SetIsSeekingEvent = {
  type: "setIsSeeking"
  isSeeking: boolean
}

type SetIsChangingCameraEvent = {
  type: "setIsChangingCamera"
  isChangingCamera: boolean
}

type SetIsRecordingEvent = {
  type: "setIsRecording"
  isRecording: boolean
}

type SetVideoRefsEvent = {
  type: "setVideoRefs"
  videoRefs: Record<string, HTMLVideoElement>
}

type SetVideosEvent = {
  type: "setVideos"
  videos: Record<string, TimelineVideo>
}

type SetDurationEvent = {
  type: "setDuration"
  duration: number
}

type SetVolumeEvent = {
  type: "setVolume"
  volume: number
}

export type PlayerEvent =
  | SetCurrentTimeEvent
  | SetIsPlayingEvent
  | SetIsSeekingEvent
  | SetIsChangingCameraEvent
  | SetIsRecordingEvent
  | SetVideoRefsEvent
  | SetVideosEvent
  | SetDurationEvent
  | SetVolumeEvent

export const playerMachine = createMachine({
  id: "player",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        SET_CURRENT_TIME: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        SET_IS_PLAYING: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        SET_IS_SEEKING: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        SET_IS_CHANGING_CAMERA: {
          actions: assign({ isChangingCamera: ({ event }) => event.isChangingCamera }),
        },
        SET_IS_RECORDING: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        SET_VIDEO_REFS: {
          actions: assign({ videoRefs: ({ event }) => event.videoRefs }),
        },
        SET_VIDEOS: {
          actions: assign({ videos: ({ event }) => event.videos }),
        },
        SET_DURATION: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        SET_VOLUME: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
      },
    },
  },
})

export const usePlayerMachine = () => {
  const [state, send] = useMachine(playerMachine)
  return { state, send }
}
