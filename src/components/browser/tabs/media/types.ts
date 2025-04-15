import { MediaFile } from "@/types/videos"

export type ViewMode = "list" | "grid" | "thumbnails"
export type SortOrder = "asc" | "desc"
export type GroupBy = "none" | "type" | "date" | "duration"
export type FilterType = "all" | "video" | "audio" | "image"
export type SortBy = "name" | "size" | "duration" | "date"

export interface GroupedMediaFiles {
  title: string
  files: MediaFile[]
}

export interface MediaSettings {
  viewMode: ViewMode
  groupBy: GroupBy
  sortBy: SortBy
  sortOrder: SortOrder
  filterType: FilterType
}

export interface MediaProbeData {
  format?: {
    duration?: number
    filename?: string
    format_name?: string
    size?: number
    tags?: {
      creation_time?: string
    }
  }
  streams?: Array<{
    codec_type?: string
    codec_name?: string
    width?: number
    height?: number
    r_frame_rate?: string
    index?: number
  }>
  chapters?: any[]
}
