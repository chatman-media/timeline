import { Track } from "./videos";

// Базовые типы для временной шкалы
export interface VideoMetadata {
  filename: string;
  codecName: string;
  width: number;
  height: number;
  aspectRatio: string;
  bitrate: number;
  duration: number;
}

export interface TrackSliceData {
  id: string;
  x: number;
  y: number;
  width: string | number;
  height: number;
  trackIndex: number;
  startTime?: number;
  duration?: number;
}

export interface SeekbarState {
  width: number;
  height: number;
  y: number;
  x: number;
}

export interface TimelineSection {
  date: string;
  startTime: number;
  endTime: number;
  duration: number;
  tracks: Track[];
}
