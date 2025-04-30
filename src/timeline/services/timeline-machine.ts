import { assign, createMachine } from "xstate"

import { createTracksFromFiles, Sector } from "@/browser/utils/media-files"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimeRange } from "@/types/time-range"

interface TimelineContext {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  sectors: Sector[]
  history: TimelineContext[]
  historyIndex: number
  future: TimelineContext[]
  canUndo: boolean
  canRedo: boolean
  videoRefs: Record<string, HTMLVideoElement | null>
  loadedVideos: Record<string, boolean>
}

type TimelineEvent =
  | { type: "zoom"; level: number }
  | { type: "setTimeRanges"; ranges: Record<string, TimeRange[]> }
  | { type: "setLayoutMode"; mode: string }
  | { type: "setMontageSchema"; schema: any[] }
  | { type: "setTime"; time: number }
  | { type: "setPlaying"; playing: boolean }
  | { type: "setRecording"; recording: boolean }
  | { type: "setActiveVideo"; videoId: string | null }
  | { type: "seek"; time: number }
  | { type: "setDuration"; duration: number }
  | { type: "setActiveTrack"; trackId: string | null }
  | { type: "setVolume"; volume: number }
  | { type: "setTrackVolume"; trackId: string; volume: number }
  | { type: "setSeeking"; isSeeking: boolean }
  | { type: "resetChangingCamera" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "setLayout"; layout: string }
  | { type: "addMediaFiles"; files: MediaFile[] }
  | { type: "removeFromAddedFiles"; fileId: string }
  | { type: "stopRecordingSchema" }
  | { type: "startRecordingSchema"; trackId: string; time: number }
  | { type: "setVideoRef"; fileId: string; video: HTMLVideoElement | null }
  | { type: "setLoadedVideo"; fileId: string; loaded: boolean }
  | { type: "preloadAllVideos" }
  | { type: "setTracks"; tracks: Track[] }

export const timelineMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMAbVA7MAdKhFmAMQBaA8lQLIDaADALqKgAOA9rKmp7mxAAPRAFoA7AFYCjAGwBGWZMbKATABZxGyQBoQAT0SyAnKoIBmdbIWXJqgBzjj5gL4u9aTDnxES5WGDIACoYYABKAIa4MLBMrEggXDx8AgkiCOb28gSO9uaqjPJO9uryqnqGCOKyjASSWZn2ksrG8ubGbh6h3oTEpGQAygCiQQD6QWEAggDCANKjAGpUADIAqrRDcYJJvKj8guny6vYWhaXGdir2jMayFUbmsgRtGlrG4uaMjObinSCe2DwvT8gxGo2GQ1mAEkAHIAcS2CR2KQOYkUxgI70U9hs4nEDXs9wQklk5me8m+qkeSgc6j+AJ6vn6YSGwzG0wAEpN4bC4aNppMNlNERxuLt9mlEJkngpxPJ5MYvqSqXcDEZVNlSUplOZJJ88q53P9ukCmf5ApMAMZoABuYCCACcIpaANYixJilGS4llZ7qBzmCmvOWqyqWWqPdr+0rYhz0k0+PrkVYwgAiVHdyL2qVA6VE8jsBDx1Q1x3y6kkxiJ0ZkjBxdgcBcs9njXlNSbILPTmc92dRCHzeQICkk8iy+Out2MhLVCADBFUsiabWuON1j1bgMTIIiEAgtEgqAiADFUKRYixtr2JbnEMYMdZ1Cp1Jp1LcvuYiaoNJi9WU5IG2iOJujIdiytBUAsQyjMeYR0KMkypqmQypjBULLKyPbJH23r+kSZQnG+97To29gOJIvx-LgnAQHAggMkCV7YTewhiFSmoFmORT2JOJgzpUohPF8wlvkqhSqO8IHtn4THijmrEIG0GLFrqSiOHIeL4WUZIOOI6jmI805WB0bguEAA */
  id: "timeline",
  initial: "idle",
  context: {
    isDirty: false,
    zoomLevel: 1,
    timeRanges: {},
    activeTrackId: null,
    trackVolumes: {},
    isSeeking: false,
    isChangingCamera: false,
    tracks: [],
    sectors: [],
    history: [],
    historyIndex: -1,
    future: [],
    canUndo: false,
    canRedo: false,
    videoRefs: {},
    loadedVideos: {},
  } as TimelineContext,
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  states: {
    idle: {
      on: {
        zoom: {
          actions: assign({
            zoomLevel: ({ event }) => event.level,
          }),
        },
        setActiveTrack: {
          actions: assign({
            activeTrackId: ({ event }) => event.trackId,
          }),
        },
        seek: {
          actions: assign({
            isSeeking: true,
          }),
        },
        setPlaying: {
          actions: assign({
            isSeeking: false,
          }),
        },
        setTrackVolume: {
          actions: assign({
            trackVolumes: ({ context, event }) => ({
              ...context.trackVolumes,
              [event.trackId]: event.volume,
            }),
          }),
        },
        setSeeking: {
          actions: assign({
            isSeeking: ({ event }) => event.isSeeking,
          }),
        },
        setTimeRanges: {
          actions: assign({
            timeRanges: ({ event }) => event.ranges,
          }),
        },
        setVideoRef: {
          actions: assign({
            videoRefs: ({ context, event }) => ({
              ...context.videoRefs,
              [event.fileId]: event.video,
            }),
          }),
        },
        setLoadedVideo: {
          actions: assign({
            loadedVideos: ({ context, event }) => ({
              ...context.loadedVideos,
              [event.fileId]: event.loaded,
            }),
          }),
        },
        preloadAllVideos: {
          actions: ({ context }) => {
            Object.entries(context.videoRefs).forEach(([fileId, video]) => {
              if (video && !context.loadedVideos[fileId]) {
                context.loadedVideos[fileId] = true
              }
            })
          },
        },
        undo: {
          actions: assign(({ context }) => {
            if (context.historyIndex > 0) {
              const newIndex = context.historyIndex - 1
              return {
                ...context.history[newIndex],
                historyIndex: newIndex,
              }
            }
            return {}
          }),
        },
        addMediaFiles: {
          actions: assign(({ context, event }) => {
            console.log("Timeline machine received addMediaFiles event:", event.files)

            // Создаем новые сектора из файлов
            const newSectors = createTracksFromFiles(event.files, context.tracks)
            console.log("Creating new sectors:", newSectors)

            return {
              sectors: [...context.sectors, ...newSectors],
              isDirty: true,
            }
          }),
        },
        removeFromAddedFiles: {
          actions: assign({
            sectors: ({ context, event }) => {
              // Удаляем трек из всех секторов
              const updatedSectors = context.sectors.map((sector) => ({
                ...sector,
                tracks: sector.tracks.filter((track) => track.id !== event.fileId),
              }))

              // Удаляем пустые сектора
              return updatedSectors.filter((sector) => sector.tracks.length > 0)
            },
          }),
        },
        setTracks: {
          actions: assign({
            tracks: ({ event }) => event.tracks,
          }),
        },
      },
    },
  },
  entry: assign(({ context }) => {
    if (context.isDirty) {
      const newHistory = context.history.slice(0, context.historyIndex + 1)
      newHistory.push({ ...context })
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: false,
      }
    }
    return {}
  }),
})
