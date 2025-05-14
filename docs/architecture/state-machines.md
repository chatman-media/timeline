# Машины состояний (XState) в Timeline Editor

## Введение в XState

Timeline Editor использует библиотеку XState для управления сложной логикой приложения. XState предоставляет формальный способ моделирования и управления состояниями на основе конечных автоматов (finite state machines).

Основные преимущества использования XState:
- Предсказуемое поведение приложения
- Явное моделирование состояний и переходов
- Упрощение обработки сложных пользовательских сценариев
- Улучшение тестируемости кода

## Основные машины состояний

В Timeline Editor используются следующие основные машины состояний:

1. **mediaMachine** - управление медиафайлами
2. **timelineMachine** - управление таймлайном
3. **playerMachine** - управление плеером
4. **projectMachine** - управление проектом
5. **modalMachine** - управление модальными окнами

## mediaMachine

**Назначение**: Управление медиафайлами, их отображением, фильтрацией и добавлением на таймлайн.

**Контекст**:
```typescript
interface MediaContext {
  media: MediaFile[];
  filteredMedia: MediaFile[];
  selectedMedia: MediaFile | null;
  filter: string;
  sortBy: 'name' | 'date' | 'size' | 'duration';
  sortDirection: 'asc' | 'desc';
  view: 'list' | 'grid' | 'thumbnails';
  isLoading: boolean;
  error: string | null;
}
```

**Состояния**:
- `idle` - начальное состояние
- `loading` - загрузка медиафайлов
- `loaded` - медиафайлы загружены
- `filtering` - фильтрация медиафайлов
- `sorting` - сортировка медиафайлов
- `error` - ошибка загрузки

**Основные события**:
- `LOAD` - загрузка медиафайлов
- `SELECT` - выбор медиафайла
- `FILTER` - фильтрация медиафайлов
- `SORT` - сортировка медиафайлов
- `ADD_TO_TIMELINE` - добавление на таймлайн
- `CHANGE_VIEW` - изменение вида отображения

## timelineMachine

**Назначение**: Управление дорожками и клипами, монтаж видео.

**Контекст**:
```typescript
interface TimelineContext {
  tracks: Track[];
  activeTrackId: string | null;
  activeVideo: MediaFile | null;
  currentTime: number;
  history: TimelineState[];
  historyIndex: number;
  sections: TimelineSection[];
  isRecording: boolean;
}
```

**Состояния**:
- `idle` - начальное состояние
- `editing` - редактирование таймлайна
- `recording` - запись
- `playing` - воспроизведение
- `seeking` - перемотка

**Основные события**:
- `ADD_TRACK` - добавление дорожки
- `REMOVE_TRACK` - удаление дорожки
- `SET_ACTIVE_TRACK` - установка активной дорожки
- `ADD_CLIP` - добавление клипа
- `REMOVE_CLIP` - удаление клипа
- `MOVE_CLIP` - перемещение клипа
- `RESIZE_CLIP` - изменение размера клипа
- `SEEK` - перемотка
- `UNDO` - отмена действия
- `REDO` - повтор действия

## playerMachine

**Назначение**: Воспроизведение видео и управление просмотром.

**Контекст**:
```typescript
interface PlayerContext {
  video: MediaFile | null;
  currentTime: number;
  duration: number;
  volume: number;
  isPlaying: boolean;
  isSeeking: boolean;
  isChangingCamera: boolean;
  isRecording: boolean;
  videoRefs: Record<string, HTMLVideoElement>;
  videos: Record<string, TimelineVideo>;
}
```

**Состояния**:
- `idle` - начальное состояние
- `loading` - загрузка видео
- `ready` - видео готово к воспроизведению
- `playing` - воспроизведение
- `paused` - пауза
- `seeking` - перемотка
- `changingCamera` - смена камеры
- `recording` - запись
- `error` - ошибка воспроизведения

**Основные события**:
- `LOAD` - загрузка видео
- `PLAY` - воспроизведение
- `PAUSE` - пауза
- `SEEK` - перемотка
- `CHANGE_CAMERA` - смена камеры
- `RECORD` - запись
- `STOP_RECORD` - остановка записи
- `SET_VOLUME` - установка громкости

## projectMachine

**Назначение**: Управление настройками проекта и экспорта.

**Контекст**:
```typescript
interface ProjectContext {
  name: string;
  resolution: Resolution;
  frameRate: number;
  exportSettings: ExportSettings;
  userSettings: UserSettings;
  isDirty: boolean;
  lastSaved: Date | null;
}
```

**Состояния**:
- `idle` - начальное состояние
- `editing` - редактирование настроек
- `saving` - сохранение настроек
- `exporting` - экспорт проекта
- `error` - ошибка

**Основные события**:
- `UPDATE_SETTINGS` - обновление настроек
- `SAVE` - сохранение настроек
- `EXPORT` - экспорт проекта
- `RESET` - сброс настроек

## modalMachine

**Назначение**: Управление модальными окнами и навигацией.

**Контекст**:
```typescript
interface ModalContext {
  isOpen: boolean;
  content: ReactNode;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
}
```

**Состояния**:
- `closed` - модальное окно закрыто
- `opening` - открытие модального окна
- `opened` - модальное окно открыто
- `closing` - закрытие модального окна

**Основные события**:
- `OPEN` - открытие модального окна
- `CLOSE` - закрытие модального окна
- `CHANGE_CONTENT` - изменение содержимого

## Взаимодействие машин состояний

Машины состояний взаимодействуют между собой через события и сервисы:

```
+----------------+        +----------------+
|                |        |                |
|  mediaMachine  |------->| timelineMachine|
|                |        |                |
+----------------+        +----------------+
        |                        |
        |                        |
        v                        v
+----------------+        +----------------+
|                |        |                |
|  playerMachine |<------>| projectMachine |
|                |        |                |
+----------------+        +----------------+
        ^                        ^
        |                        |
        +----------+-------------+
                   |
                   v
           +----------------+
           |                |
           |  modalMachine  |
           |                |
           +----------------+
```

### Примеры взаимодействия:

1. **Добавление медиафайла на таймлайн**:
   - `mediaMachine` отправляет событие `ADD_TO_TIMELINE`
   - `timelineMachine` получает это событие и добавляет клип на активную дорожку

2. **Воспроизведение с таймлайна**:
   - `timelineMachine` отправляет событие `PLAY`
   - `playerMachine` получает это событие и начинает воспроизведение

3. **Изменение времени в плеере**:
   - `playerMachine` отправляет событие `SEEK`
   - `timelineMachine` получает это событие и обновляет позицию на таймлайне

## Реализация машин состояний

Машины состояний реализованы с использованием XState и хранятся в директории `machines/`:

```
/machines/
  ├── media-machine.ts
  ├── timeline-machine.ts
  ├── player-machine.ts
  ├── project-machine.ts
  └── modal-machine.ts
```

Для доступа к машинам состояний используются провайдеры контекста и хуки:

```
/providers/
  ├── media-provider.tsx
  ├── timeline-provider.tsx
  ├── player-provider.tsx
  ├── project-provider.tsx
  └── modal-provider.tsx

/contexts/
  ├── use-media.ts
  ├── use-timeline.ts
  ├── use-player.ts
  ├── use-project.ts
  └── use-modal.ts
```

## Связанные документы

- [Обзор архитектуры](overview.md)
- [Компоненты системы](components.md)
- [Документация по XState](https://xstate.js.org/docs/)
