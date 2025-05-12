import { CreatePresetsFunction, ShortcutCategory } from "./types"

// Функция для создания предустановки Timeline
export const createTimelinePreset: CreatePresetsFunction = (t: any): ShortcutCategory[] => [
  {
    id: "preferences",
    name: t("dialogs.keyboardShortcuts.categories.preferences", "Настройки"),
    shortcuts: [
      {
        id: "preferences",
        name: t("dialogs.keyboardShortcuts.shortcuts.preferences", "Настройки пользователя"),
        keys: "⌥⌘.",
      },
      {
        id: "project-settings",
        name: t("dialogs.keyboardShortcuts.shortcuts.project-settings", "Настройки проекта"),
        keys: "⌥⌘,",
      },
      {
        id: "shortcuts",
        name: t("dialogs.keyboardShortcuts.shortcuts.shortcuts", "Быстрые клавиши"),
        keys: "⌥⌘K",
      },
    ],
  },
  {
    id: "file",
    name: t("dialogs.keyboardShortcuts.categories.file", "Файл"),
    shortcuts: [
      {
        id: "new-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.new-project", "Создать новый проект"),
        keys: "⌘N",
      },
      {
        id: "open-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.open-project", "Открыть Проект"),
        keys: "⌘O",
      },
      {
        id: "save-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.save-project", "Сохранить проект"),
        keys: "⌘S",
      },
      {
        id: "save-as",
        name: t("dialogs.keyboardShortcuts.shortcuts.save-as", "Сохранить проект как"),
        keys: "⇧⌘S",
      },
      {
        id: "archive",
        name: t("dialogs.keyboardShortcuts.shortcuts.archive", "Архивный проект"),
        keys: "⇧⌘A",
      },
      {
        id: "import",
        name: t("dialogs.keyboardShortcuts.shortcuts.import", "Импорт Медиафайлов"),
        keys: "⌘I",
      },
    ],
  },
  {
    id: "edit",
    name: t("dialogs.keyboardShortcuts.categories.edit", "Редактировать"),
    shortcuts: [
      {
        id: "undo",
        name: t("dialogs.keyboardShortcuts.shortcuts.undo", "Отменить"),
        keys: "⌘Z",
      },
      {
        id: "redo",
        name: t("dialogs.keyboardShortcuts.shortcuts.redo", "Повторить"),
        keys: "⇧⌘Z",
      },
      { id: "cut", name: t("dialogs.keyboardShortcuts.shortcuts.cut", "Вырезать"), keys: "⌘X" },
      {
        id: "copy",
        name: t("dialogs.keyboardShortcuts.shortcuts.copy", "Копировать"),
        keys: "⌘C",
      },
      {
        id: "paste",
        name: t("dialogs.keyboardShortcuts.shortcuts.paste", "Вставить"),
        keys: "⌘V",
      },
      {
        id: "delete",
        name: t("dialogs.keyboardShortcuts.shortcuts.delete", "Удалить"),
        keys: "Delete",
      },
      {
        id: "select-all",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-all", "Выбрать все"),
        keys: "⌘A",
      },
    ],
  },
  {
    id: "view",
    name: t("dialogs.keyboardShortcuts.categories.view", "Посмотреть"),
    shortcuts: [
      {
        id: "zoom-in",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-in", "Увеличить"),
        keys: "⌘+",
      },
      {
        id: "zoom-out",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-out", "Уменьшить"),
        keys: "⌘-",
      },
      {
        id: "fit-to-screen",
        name: t("dialogs.keyboardShortcuts.shortcuts.fit-to-screen", "По размеру экрана"),
        keys: "⌘0",
      },
      {
        id: "toggle-browser",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.toggle-browser",
          "Показать/скрыть браузер",
        ),
        keys: "⌘B",
      },
      {
        id: "toggle-timeline",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.toggle-timeline",
          "Показать/скрыть таймлайн",
        ),
        keys: "⌘T",
      },
    ],
  },
  {
    id: "tools",
    name: t("dialogs.keyboardShortcuts.categories.tools", "Инструменты"),
    shortcuts: [
      {
        id: "selection",
        name: t("dialogs.keyboardShortcuts.shortcuts.selection", "Инструмент выделения"),
        keys: "V",
      },
      {
        id: "cut-tool",
        name: t("dialogs.keyboardShortcuts.shortcuts.cut-tool", "Инструмент разрезания"),
        keys: "C",
      },
      {
        id: "hand-tool",
        name: t("dialogs.keyboardShortcuts.shortcuts.hand-tool", "Инструмент рука"),
        keys: "H",
      },
      {
        id: "zoom-tool",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-tool", "Инструмент масштаб"),
        keys: "Z",
      },
    ],
  },
  {
    id: "marker",
    name: t("dialogs.keyboardShortcuts.categories.marker", "Маркер"),
    shortcuts: [
      {
        id: "add-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-marker", "Добавить маркер"),
        keys: "M",
      },
      {
        id: "next-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-marker", "Следующий маркер"),
        keys: "⇧M",
      },
      {
        id: "prev-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.prev-marker", "Предыдущий маркер"),
        keys: "⌥M",
      },
    ],
  },
  {
    id: "multicam",
    name: t("dialogs.keyboardShortcuts.categories.multicam", "Мультикамерный монтаж"),
    shortcuts: [
      {
        id: "switch-camera-1",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.switch-camera-1",
          "Переключиться на камеру 1",
        ),
        keys: "1",
      },
      {
        id: "switch-camera-2",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.switch-camera-2",
          "Переключиться на камеру 2",
        ),
        keys: "2",
      },
      {
        id: "switch-camera-3",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.switch-camera-3",
          "Переключиться на камеру 3",
        ),
        keys: "3",
      },
      {
        id: "switch-camera-4",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.switch-camera-4",
          "Переключиться на камеру 4",
        ),
        keys: "4",
      },
    ],
  },
  {
    id: "other",
    name: t("dialogs.keyboardShortcuts.categories.other", "Прочее"),
    shortcuts: [
      {
        id: "play-pause",
        name: t("dialogs.keyboardShortcuts.shortcuts.play-pause", "Воспроизведение/Пауза"),
        keys: "Space",
      },
      {
        id: "next-frame",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-frame", "Следующий кадр"),
        keys: "→",
      },
      {
        id: "prev-frame",
        name: t("dialogs.keyboardShortcuts.shortcuts.prev-frame", "Предыдущий кадр"),
        keys: "←",
      },
      {
        id: "volume-up",
        name: t("dialogs.keyboardShortcuts.shortcuts.volume-up", "Увеличить громкость"),
        keys: "⌘↑",
      },
      {
        id: "volume-down",
        name: t("dialogs.keyboardShortcuts.shortcuts.volume-down", "Уменьшить громкость"),
        keys: "⌘↓",
      },
      {
        id: "mute",
        name: t("dialogs.keyboardShortcuts.shortcuts.mute", "Отключить звук"),
        keys: "⌘M",
      },
    ],
  },
]
