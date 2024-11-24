interface ElectronAPI {
  openFiles: (options: {
    properties: Array<"openFile" | "multiSelections">
    filters: Array<{ name: string; extensions: string[] }>
  }) => Promise<string[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
