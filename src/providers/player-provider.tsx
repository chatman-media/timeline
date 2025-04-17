import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { playerMachine } from "@/machines"
import { MediaFile } from "@/types/media"
import { TimelineVideo } from "@/types/timeline"

import { browserInspector } from "./providers"
interface PlayerContextType {
  video: MediaFile | null
  currentTime: number
  duration: number
  volume: number

  isPlaying: boolean
  isSeeking: boolean
  isChangingCamera: boolean
  isRecording: boolean
  isVideoLoading: boolean
  isVideoReady: boolean

  videoRefs: Record<string, HTMLVideoElement>
  videos: Record<string, TimelineVideo>

  setVideoRefs: (videoRefs: Record<string, HTMLVideoElement>) => void
  setVideo: (video: MediaFile) => void
  setVideos: (videos: Record<string, TimelineVideo>) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setCurrentTime: (currentTime: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsSeeking: (isSeeking: boolean) => void
  setIsChangingCamera: (isChangingCamera: boolean) => void
  setIsRecording: (isRecording: boolean) => void
  setVideoLoading: (isLoading: boolean) => void
  setVideoReady: (isReady: boolean) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

interface PlayerProviderProps {
  children: React.ReactNode
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [state, send] = useMachine(playerMachine, { inspect: browserInspector.inspect })

  return (
    <PlayerContext.Provider
      value={{
        ...state.context,
        setCurrentTime: (currentTime: number) => send({ type: "setCurrentTime", currentTime }),
        setIsPlaying: (isPlaying: boolean) => send({ type: "setIsPlaying", isPlaying }),
        setIsSeeking: (isSeeking: boolean) => send({ type: "setIsSeeking", isSeeking }),
        setIsChangingCamera: (isChangingCamera: boolean) =>
          send({ type: "setIsChangingCamera", isChangingCamera }),
        setIsRecording: (isRecording: boolean) => send({ type: "setIsRecording", isRecording }),
        setVideoRefs: (videoRefs: Record<string, HTMLVideoElement>) =>
          send({ type: "setVideoRefs", videoRefs }),
        setVideo: (video: MediaFile) => send({ type: "setVideo", video }),
        setVideos: (videos: Record<string, TimelineVideo>) => send({ type: "setVideos", videos }),
        setDuration: (duration: number) => send({ type: "setDuration", duration }),
        setVolume: (volume: number) => send({ type: "setVolume", volume }),
        setVideoLoading: (isLoading: boolean) => send({ type: "setVideoLoading", isVideoLoading: isLoading }),
        setVideoReady: (isReady: boolean) => send({ type: "setVideoReady", isVideoReady: isReady }),
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayerContext() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider")
  }
  return context
}
