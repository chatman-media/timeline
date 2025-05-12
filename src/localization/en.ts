import { Translations } from "./types"

const enTranslations: Translations = {
  ui: {
    // Top navigation bar
    topNavBar: {
      layout: "Layout",
      keyboardShortcuts: "Keyboard Shortcuts",
      projectSettings: "Project Settings",
      saveChanges: "Save changes",
      allChangesSaved: "All changes saved",
      publish: "Publish",
      publicationTasks: "Publication Tasks",
      editingTasks: "Editing Tasks",
      projectTasks: "Project Tasks",
      userSettings: "User Settings",
      export: "Export",
    },

    // Dialogs
    dialogs: {
      // Project settings
      projectSettings: {
        title: "Project Settings",
        aspectRatio: "Aspect Ratio:",
        resolution: "Resolution:",
        frameRate: "Frame Rate:",
        colorSpace: "Color Space:",
        cancel: "Cancel",
        save: "OK",
      },

      // User settings
      userSettings: {
        title: "User Settings",
        interfaceLanguage: "Interface Language:",
        screenshotsPath: "Screenshots Save Path:",
        selectFolder: "Select Folder",
        selectFolderPrompt: "Choose a folder to save screenshots or enter your own path:",
        clearPath: "Clear",
        defaultPathHint: "Default path for saving screenshots",
        customPathHint: "Screenshots will be saved to: {{path}}",
        cancel: "Cancel",
        save: "Save",
      },

      // Export
      export: {
        title: "Export",
        local: "Local",
        device: "Device",
        socialNetworks: "Social Networks",
        dvd: "DVD",
      },
    },

    // Templates
    templates: {
      // Common template names
      verticalSplit: "Vertical Split",
      horizontalSplit: "Horizontal Split",
      diagonalSplit: "Diagonal Split",
      grid2x2: "Grid 2×2",
      grid3x3: "Grid 3×3",
      grid4x4: "Grid 4×4",
    },
  },
}

export default enTranslations
