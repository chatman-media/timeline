module.exports = {
  types: [
    { value: 'feat', name: 'feat:     Новая функциональность' },
    { value: 'fix', name: 'fix:      Исправление бага' },
    { value: 'docs', name: 'docs:     Изменения в документации' },
    { value: 'style', name: 'style:    Изменения стилей и форматирования' },
    { value: 'refactor', name: 'refactor: Рефакторинг кода' },
    { value: 'test', name: 'test:     Добавление тестов' },
    { value: 'chore', name: 'chore:    Обновление зависимостей/настроек' }
  ],

  scopes: [
    { name: 'timeline' },
    { name: 'player' },
    { name: 'ui' },
    { name: 'auth' },
    { name: 'core' }
  ],

  messages: {
    type: 'Какие изменения вы вносите?',
    scope: 'Выберите область изменений (опционально):',
    subject: 'Напишите краткое описание изменений:\n',
    body: 'Напишите подробное описание изменений (опционально):\n',
    breaking: 'Список breaking changes (опционально):\n',
    footer: 'Место для мета-данных (тикеты, ссылки и остальное). Например: SECRETMRKT-700, SECRETMRKT-800:\n',
    confirmCommit: 'Вас устраивает получившийся коммит?'
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['footer'],
  subjectLimit: 100
}; 