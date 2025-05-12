// Типы для локализации
export type Language = "ru" | "en"

// Интерфейс для локализации UI
export interface UITranslations {
  // Верхняя панель навигации
  topNavBar: {
    layout: string
    keyboardShortcuts: string
    projectSettings: string
    saveChanges: string
    allChangesSaved: string
    publish: string
    publicationTasks: string
    editingTasks: string
    projectTasks: string
    userSettings: string
    export: string
  }

  // Диалоги
  dialogs: {
    // Настройки проекта
    projectSettings: {
      title: string
      aspectRatio: string
      resolution: string
      frameRate: string
      colorSpace: string
      cancel: string
      save: string
    }

    // Настройки пользователя
    userSettings: {
      title: string
      interfaceLanguage: string
      screenshotsPath: string
      selectFolder: string
      selectFolderPrompt: string
      clearPath: string
      defaultPathHint: string
      customPathHint: string
      cancel: string
      save: string
    }

    // Экспорт
    export: {
      title: string
      local: string
      device: string
      socialNetworks: string
      dvd: string
    }
  }

  // Шаблоны
  templates: {
    // Общие названия шаблонов
    verticalSplit: string
    horizontalSplit: string
    diagonalSplit: string
    grid2x2: string
    grid3x3: string
    grid4x4: string
  }
}

// Интерфейс для всех переводов
export interface Translations {
  ui: UITranslations
}
