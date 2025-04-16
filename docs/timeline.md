## Timeline (Таймлайн)

**Состояние:** Управляется через `timelineMachine`
- Управление дорожками (треками)
- Работа с секциями по датам
- Управление видеофрагментами
- Поддержка undo/redo
- Горячие клавиши для управления
- Синхронизация с медиаплеером

**Компоненты:**
- `timeline/` - компоненты таймлайна
  - `timeline.tsx` - корневой компонент
  - `timeline-bar.tsx` - панель управления
  - `timeline-scale.tsx` - шкала времени
  - `timeline-controls.tsx` - элементы управления
  - `track/` - компоненты треков
    - `video-track.tsx` - видео трек
    - `audio-track.tsx` - аудио трек
    - `track-header.tsx` - заголовок трека
    - `track-content.tsx` - содержимое трека
  - `clip/` - компоненты клипов
    - `video-clip.tsx` - видео клип
    - `audio-clip.tsx` - аудио клип
    - `clip-controls.tsx` - элементы управления клипом

**Дополнительные компоненты:**
- `icons/` - иконки интерфейса
  - `play-icon.tsx` - иконка воспроизведения
  - `pause-icon.tsx` - иконка паузы
  - `record-icon.tsx` - иконка записи
  - `stop-icon.tsx` - иконка остановки
  - `volume-icon.tsx` - иконка громкости
  - `fullscreen-icon.tsx` - иконка полноэкранного режима

**Файлы состояния:**
- `machines/timeline-machine.ts` - машина состояний
- `providers/timeline-provider.tsx` - провайдер контекста

**Описание машины состояний:**
`timelineMachine` управляет временной шкалой проекта. Она отвечает за создание и управление треками, размещение клипов, работу с историей изменений (undo/redo) и синхронизацию с медиаплеером. Машина также контролирует активный трек и текущее время на таймлайне.

**Контекст timelineMachine:**
- `tracks: Track[]` - все треки
- `activeTrackId: string | null` - ID активного трека
- `activeVideo: MediaFile | null` - активное видео
- `currentTime: number` - текущее время
- `history: TimelineState[]` - история состояний для undo/redo
- `historyIndex: number` - текущий индекс в истории
- `sections: TimelineSection[]` - секции по датам
- `isRecording: boolean` - состояние записи

**Методы timelineMachine:**
- `setTracks` - установка треков
- `setActiveTrack` - установка активного трека
- `addTrack` - добавление трека
- `removeTrack` - удаление трека
- `updateTrack` - обновление трека
- `setVideo` - установка видео на треке
- `removeVideo` - удаление видео с трека
- `undo` - отмена действия
- `redo` - повтор действия
- `seek` - перемещение по временной шкале
