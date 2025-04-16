import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { playerMachine } from "@/machines"
import { TimelineVideo } from "@/types/timeline"

interface PlayerContextType {
  currentTime: number
  duration: number
  volume: number

  isPlaying: boolean
  isSeeking: boolean

  isChangingCamera: boolean
  isRecording: boolean
  videoRefs: Record<string, HTMLVideoElement>
  videos: Record<string, TimelineVideo>

  setCurrentTime: (currentTime: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsSeeking: (isSeeking: boolean) => void
  setIsChangingCamera: (isChangingCamera: boolean) => void
  setIsRecording: (isRecording: boolean) => void
  setVideoRefs: (videoRefs: Record<string, HTMLVideoElement>) => void
  setVideos: (videos: Record<string, TimelineVideo>) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

interface PlayerProviderProps {
  children: React.ReactNode
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [state, send] = useMachine(playerMachine)

  return (
    <PlayerContext.Provider
      value={{
        ...state.context,
        setCurrentTime: (currentTime: number) => send({ type: "SET_CURRENT_TIME", currentTime }),
        setIsPlaying: (isPlaying: boolean) => send({ type: "SET_IS_PLAYING", isPlaying }),
        setIsSeeking: (isSeeking: boolean) => send({ type: "SET_IS_SEEKING", isSeeking }),
        setIsChangingCamera: (isChangingCamera: boolean) =>
          send({ type: "SET_IS_CHANGING_CAMERA", isChangingCamera }),
        setIsRecording: (isRecording: boolean) => send({ type: "SET_IS_RECORDING", isRecording }),
        setVideoRefs: (videoRefs: Record<string, HTMLVideoElement>) =>
          send({ type: "SET_VIDEO_REFS", videoRefs }),
        setVideos: (videos: Record<string, TimelineVideo>) => send({ type: "SET_VIDEOS", videos }),
        setDuration: (duration: number) => send({ type: "SET_DURATION", duration }),
        setVolume: (volume: number) => send({ type: "SET_VOLUME", volume }),
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
