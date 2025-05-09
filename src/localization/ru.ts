import { Translations } from "./types"

const ruTranslations: Translations = {
  ui: {
    // Верхняя панель навигации
    topNavBar: {
      layout: "Макет",
      keyboardShortcuts: "Быстрые клавиши",
      projectSettings: "Настройки проекта",
      saveChanges: "Сохранить изменения",
      allChangesSaved: "Все изменения сохранены",
      publish: "Опубликовать",
      publicationTasks: "Задачи Публикации",
      editingTasks: "Задачи монтажа",
      projectTasks: "Задачи Проекта",
      userSettings: "Настройки пользователя",
      export: "Экспорт",
    },

    // Диалоги
    dialogs: {
      // Настройки проекта
      projectSettings: {
        title: "Настройки проекта",
        aspectRatio: "Соотношение сторон:",
        resolution: "Разрешение:",
        frameRate: "Частота кадров:",
        colorSpace: "Цветовое пространство:",
        cancel: "Отменить",
        save: "OK",
      },

      // Настройки пользователя
      userSettings: {
        title: "Настройки пользователя",
        interfaceLanguage: "Язык интерфейса:",
        cancel: "Отменить",
        save: "Сохранить",
      },

      // Экспорт
      export: {
        title: "Экспорт",
        local: "Местный",
        device: "Устройство",
        socialNetworks: "Социальные сети",
        dvd: "DVD",
      },
    },

    // Шаблоны
    templates: {
      // Общие названия шаблонов
      verticalSplit: "Вертикальное разделение",
      horizontalSplit: "Горизонтальное разделение",
      diagonalSplit: "Диагональное разделение",
      grid2x2: "Сетка 2×2",
      grid3x3: "Сетка 3×3",
      grid4x4: "Сетка 4×4",
    },
  },
}

export default ruTranslations
