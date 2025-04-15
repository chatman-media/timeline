import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createActor } from "xstate"

import { selectionMachine } from "@/machines/selection-machine"
import { MediaFile, Track } from "@/types/videos"

interface SelectionProviderProps {
  children: React.ReactNode
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const [selectedFile, setSelectedFile] = useState<MediaFile | undefined>()
  const [selectedTrack, setSelectedTrack] = useState<Track | undefined>()
  const [selectedSection, setSelectedSection] = useState<
    | {
        date: string
        startTime: number
        endTime: number
        duration: number
        tracks: Track[]
      }
    | undefined
  >()

  const selectionActor = useMemo(() => createActor(selectionMachine), [])

  useEffect(() => {
    selectionActor.start()
    return () => {
      selectionActor.stop()
    }
  }, [selectionActor])

  const handleSelectFile = useCallback(
    (file: MediaFile) => {
      selectionActor.send({ type: "SELECT_FILE", file })
    },
    [selectionActor],
  )

  const handleSelectTrack = useCallback(
    (track: Track) => {
      selectionActor.send({ type: "SELECT_TRACK", track })
    },
    [selectionActor],
  )

  const handleSelectSection = useCallback(
    (section: {
      date: string
      startTime: number
      endTime: number
      duration: number
      tracks: Track[]
    }) => {
      selectionActor.send({ type: "SELECT_SECTION", section })
    },
    [selectionActor],
  )

  const handleClearSelection = useCallback(() => {
    selectionActor.send({ type: "CLEAR_SELECTION" })
  }, [selectionActor])

  useEffect(() => {
    const subscription = selectionActor.subscribe((state) => {
      setSelectedFile(state.context.selectedFile)
      setSelectedTrack(state.context.selectedTrack)
      setSelectedSection(state.context.selectedSection)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [selectionActor])

  const value = {
    selectedFile,
    selectedTrack,
    selectedSection,
    handleSelectFile,
    handleSelectTrack,
    handleSelectSection,
    handleClearSelection,
  }

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export const SelectionContext = React.createContext<{
  selectedFile?: MediaFile
  selectedTrack?: Track
  selectedSection?: {
    date: string
    startTime: number
    endTime: number
    duration: number
    tracks: Track[]
  }
  handleSelectFile: (file: MediaFile) => void
  handleSelectTrack: (track: Track) => void
  handleSelectSection: (section: {
    date: string
    startTime: number
    endTime: number
    duration: number
    tracks: Track[]
  }) => void
  handleClearSelection: () => void
} | null>(null)

export function useSelection() {
  const context = React.useContext(SelectionContext)
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider")
  }
  return context
}
