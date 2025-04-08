# Состояние и события таймлайна

## Типы данных

### TimelineTrack
```typescript
interface TimelineTrack {
  id: string
  index: number
  isActive: boolean
  isVisible: boolean
  isLocked: boolean
  isMuted: boolean
  height: number
  videos: TimelineVideo[]
  combinedDuration: number
  timeRanges: TimeRange[]
  startTime: number
  endTime: number
}
```

### TimelineVideo
```typescript
interface TimelineVideo {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  path: string
  metadata: {
    filename: string
    codecName: string
    width: number
    height: number
    aspectRatio: string
    bitrate: number
    duration: number
  }
  position: {
    x: number
    width: number
  }
}
```

### TimelineSection
```typescript
interface TimelineSection {
  date: string
  startTime: number
  endTime: number
  duration: number
  tracks: TimelineTrack[]
}
```

## Состояние

### Глобальное состояние (RootStore)
```typescript
interface RootStore {
  // Медиафайлы
  mediaFiles: MediaFile[]
  timelineFiles: MediaFile[]
  
  // Треки
  tracks: TimelineTrack[]
  
  // Активные элементы
  activeTrackId: string | null
  activeVideoId: string | null
  currentTime: number
  
  // Кэши
  metadataCache: Map<string, any>
  thumbnailCache: Map<string, string>
}
```

### Состояние таймлайна
```typescript
interface TimelineState {
  // Временной диапазон
  startTime: number
  endTime: number
  duration: number
  
  // Масштаб и позиция
  scale: number
  scrollPosition: number
  
  // Активные элементы
  activeSection: string | null
  activeTrack: string | null
  activeVideo: string | null
}
```

## События

### Управление треками
- `addTrack()` - добавление нового трека
- `removeTrack(trackId: string)` - удаление трека
- `toggleTrackVisibility(trackId: string)` - переключение видимости трека
- `toggleTrackLock(trackId: string)` - переключение блокировки трека
- `toggleTrackMute(trackId: string)` - переключение звука трека
- `setTrackHeight(trackId: string, height: number)` - установка высоты трека

### Управление видео
- `addVideoToTrack(trackId: string, video: MediaFile)` - добавление видео на трек
- `removeVideoFromTrack(trackId: string, videoId: string)` - удаление видео с трека
- `moveVideo(videoId: string, newTrackId: string, newStartTime: number)` - перемещение видео
- `trimVideo(videoId: string, newStartTime: number, newEndTime: number)` - обрезка видео

### Управление временем
- `setCurrentTime(time: number)` - установка текущего времени
- `setScale(scale: number)` - изменение масштаба
- `setScrollPosition(position: number)` - установка позиции прокрутки
- `setActiveSection(date: string)` - установка активной секции

### Управление воспроизведением
- `play()` - начало воспроизведения
- `pause()` - пауза
- `stop()` - остановка
- `seek(time: number)` - переход к указанному времени

## Обработчики событий

### События мыши
- `onTrackClick(trackId: string)` - клик по треку
- `onVideoClick(videoId: string)` - клик по видео
- `onTimelineClick(time: number)` - клик по таймлайну
- `onTrackDragStart(trackId: string)` - начало перетаскивания трека
- `onVideoDragStart(videoId: string)` - начало перетаскивания видео

### События клавиатуры
- `onKeyDown(event: KeyboardEvent)` - нажатие клавиши
- `onKeyUp(event: KeyboardEvent)` - отпускание клавиши

### События колесика мыши
- `onWheel(event: WheelEvent)` - прокрутка колесика мыши

## Вспомогательные функции

### Форматирование времени
```typescript
function formatTimeWithMilliseconds(
  time: number,
  showDate: boolean = false,
  showMilliseconds: boolean = false,
  useMonospace: boolean = false
): string
```

### Расчет позиций
```typescript
function calculateVideoPosition(
  video: TimelineVideo,
  scale: number,
  containerWidth: number
): { x: number, width: number }
```

### Группировка по датам
```typescript
function groupVideosByDate(
  videos: TimelineVideo[]
): Map<string, TimelineSection>
``` 