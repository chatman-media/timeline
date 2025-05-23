# Компоненты системы Timeline Editor

## Основные компоненты

Timeline Editor состоит из пяти основных компонентов, каждый из которых отвечает за определенную часть функциональности:

1. **Browser (Браузер)** - управление медиафайлами
2. **Timeline (Таймлайн)** - временная шкала с дорожками
3. **Media Player (Плеер)** - воспроизведение видео
4. **Options (Настройки)** - конфигурация проекта
5. **Top Navigation Bar (Верхняя панель)** - навигация и управление

## Взаимодействие компонентов

```
+----------------+        +----------------+
|                |        |                |
|     Browser    |<------>|  Media Player  |
|                |        |                |
+----------------+        +----------------+
        ^                        ^
        |                        |
        v                        v
+----------------+        +----------------+
|                |        |                |
|    Timeline    |<------>|    Options     |
|                |        |                |
+----------------+        +----------------+
        ^                        ^
        |                        |
        +----------+-------------+
                   |
                   v
           +----------------+
           |                |
           | Top Navigation |
           |                |
           +----------------+
```

## Browser (Браузер)

**Назначение**: Управление медиафайлами, их отображение, фильтрация и добавление на таймлайн.

**Основные функции**:

- Отображение списка медиафайлов (видео, аудио, изображения)
- Предпросмотр файлов
- Сортировка и фильтрация
- Добавление файлов на таймлайн
- Управление эффектами, переходами, фильтрами

**Ключевые компоненты**:

- `browser.tsx` - корневой компонент
- `media-list.tsx` - список медиафайлов
- `media-preview.tsx` - предпросмотр
- `media-toolbar.tsx` - панель инструментов

**Машина состояний**: `mediaMachine`

## Timeline (Таймлайн)

**Назначение**: Управление дорожками и клипами, монтаж видео.

**Основные функции**:

- Управление дорожками (треками)
- Размещение и редактирование клипов
- Управление временной шкалой
- Синхронизация с плеером
- Поддержка undo/redo

**Ключевые компоненты**:

- `timeline.tsx` - корневой компонент
- `timeline-scale.tsx` - шкала времени
- `video-track.tsx` - видео дорожка
- `audio-track.tsx` - аудио дорожка
- `video-clip.tsx` - видео клип

**Машина состояний**: `timelineMachine`

## Media Player (Плеер)

**Назначение**: Воспроизведение видео и управление просмотром.

**Основные функции**:

- Воспроизведение/пауза
- Перемотка
- Управление громкостью
- Синхронизация с таймлайном
- Поддержка записи

**Ключевые компоненты**:

- `media-player.tsx` - корневой компонент
- `player-controls.tsx` - элементы управления
- `player-timeline.tsx` - временная шкала
- `player-volume.tsx` - управление громкостью

**Машина состояний**: `playerMachine`

## Options (Настройки)

**Назначение**: Управление настройками проекта и экспорта.

**Основные функции**:

- Настройки проекта
- Управление экспортом
- Конфигурация системы
- Пользовательские настройки

**Ключевые компоненты**:

- `options.tsx` - корневой компонент
- `project-settings.tsx` - настройки проекта
- `export-settings.tsx` - настройки экспорта
- `user-settings.tsx` - пользовательские настройки

**Машина состояний**: `projectMachine`

## Top Navigation Bar (Верхняя панель)

**Назначение**: Навигация по основным разделам и управление проектом.

**Основные функции**:

- Навигация по основным разделам
- Быстрый доступ к настройкам
- Управление проектом
- Информация о текущем состоянии

**Ключевые компоненты**:

- `top-nav.tsx` - верхняя панель навигации
- `nav-item.tsx` - элемент навигации
- `nav-dropdown.tsx` - выпадающее меню

**Машина состояний**: `modalMachine`

## Дополнительные компоненты

### Dialogs (Диалоги)

**Назначение**: Модальные окна для различных операций.

**Ключевые компоненты**:

- `camera-recording.tsx` - запись с камеры
- `export-dialog.tsx` - диалог экспорта
- `project-settings-dialog.tsx` - диалог настроек проекта

### Icons (Иконки)

**Назначение**: Иконки интерфейса.

**Ключевые компоненты**:

- `play-icon.tsx` - иконка воспроизведения
- `pause-icon.tsx` - иконка паузы
- `record-icon.tsx` - иконка записи
- `stop-icon.tsx` - иконка остановки

## Технические детали

### Структура компонентов

Каждый основной компонент имеет следующую структуру:

```
/component-name/
  ├── components/       # Подкомпоненты
  ├── machines/         # Машины состояний
  ├── providers/        # Провайдеры контекста
  ├── contexts/         # Контексты
  ├── hooks/            # Хуки
  ├── utils/            # Утилиты
  ├── types/            # Типы
  └── index.ts          # Точка входа
```

### Взаимодействие с API

Компоненты взаимодействуют с API через хуки и сервисы:

- `useMedia` - хук для работы с медиафайлами
- `usePlayer` - хук для управления плеером
- `useTimeline` - хук для работы с таймлайном
- `useProject` - хук для управления проектом

### Оптимизация производительности

Для оптимизации производительности используются:

- `React.memo` - для предотвращения лишних перерендеров
- `useCallback` и `useMemo` - для мемоизации функций и значений
- Виртуализация списков - для эффективного отображения большого количества элементов
- Ленивая загрузка - для оптимизации начальной загрузки

## Связанные документы

- [Обзор архитектуры](overview.md)
- [Машины состояний](state-machines.md)
- [Документация по компонентам](../components/)
