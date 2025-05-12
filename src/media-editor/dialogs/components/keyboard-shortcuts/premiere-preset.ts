import { CreatePresetsFunction, ShortcutCategory } from "./types"

// Функция для создания предустановки Adobe Premier Pro
export const createPremierePreset: CreatePresetsFunction = (t: any): ShortcutCategory[] => [
  {
    id: "preferences",
    name: t("dialogs.keyboardShortcuts.categories.preferences", "Настройки"),
    shortcuts: [
      {
        id: "preferences",
        name: t("dialogs.keyboardShortcuts.shortcuts.preferences", "Настройки пользователя"),
        keys: "⇧⌘S",
      },
      {
        id: "project-settings",
        name: t("dialogs.keyboardShortcuts.shortcuts.project-settings", "Настройки проекта"),
        keys: "⇧⌘P",
      },
      {
        id: "shortcuts",
        name: t("dialogs.keyboardShortcuts.shortcuts.shortcuts", "Быстрые клавиши"),
        keys: "⌘K",
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
        id: "import",
        name: t("dialogs.keyboardShortcuts.shortcuts.import", "Импорт"),
        keys: "⌘I",
      },
    ],
  },
  // Здесь можно добавить другие категории для Premier Pro
]
