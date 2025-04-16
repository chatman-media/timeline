## Media Player (Медиаплеер)

**Состояние:** Управляется через `playerMachine`
- Воспроизведение/пауза
- Перемотка
- Управление громкостью
- Синхронизация времени между треками
- Обработка ошибок воспроизведения
- Поддержка записи

**Компоненты:**
- `media-player/` - компоненты плеера
  - `media-player.tsx` - корневой компонент
  - `player-controls.tsx` - элементы управления
  - `player-timeline.tsx` - временная шкала
  - `player-volume.tsx` - управление громкостью
  - `player-fullscreen.tsx` - полноэкранный режим
  - `player-progress.tsx` - индикатор прогресса

**Дополнительные компоненты:**
- `dialogs/` - диалоговые окна
  - `camera-capture-dialog.tsx` - диалог захвата с камеры
  - `export-dialog.tsx` - диалог экспорта
  - `project-settings-dialog.tsx` - диалог настроек проекта

**Файлы состояния:**
- `machines/player-machine.ts` - машина состояний
- `providers/player-provider.tsx` - провайдер контекста

**Описание машины состояний:**
`playerMachine` управляет воспроизведением медиафайлов. Она контролирует состояние плеера (воспроизведение, пауза, перемотка), громкость, синхронизацию между треками и процесс записи. Машина также обрабатывает ошибки воспроизведения и управляет ссылками на видеоэлементы.

**Контекст playerMachine:**
- `video: MediaFile | null` - текущее видео
- `currentTime: number` - текущее время воспроизведения
- `duration: number` - длительность видео
- `volume: number` - громкость
- `isPlaying: boolean` - состояние воспроизведения
- `isSeeking: boolean` - состояние перемотки
- `isChangingCamera: boolean` - состояние смены камеры
- `isRecording: boolean` - состояние записи
- `videoRefs: Record<string, HTMLVideoElement>` - ссылки на видеоэлементы
- `videos: Record<string, TimelineVideo>` - все видео в проекте

**Методы playerMachine:**
- `setCurrentTime` - установка текущего времени
- `setIsPlaying` - управление воспроизведением
- `setIsSeeking` - управление перемоткой
- `setIsChangingCamera` - управление сменой камеры
- `setIsRecording` - управление записью
- `setVideoRefs` - установка ссылок на видеоэлементы
- `setVideo` - установка текущего видео
- `setVideos` - установка всех видео
- `setDuration` - установка длительности
- `setVolume` - управление громкостью
