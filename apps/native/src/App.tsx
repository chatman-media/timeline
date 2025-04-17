import { MediaEditorView } from "@repo/ui/views/media-editor-view"
import { TauriThemeProvider } from "@repo/ui/components/tauri-theme-provider"

function App() {
  return (
    <TauriThemeProvider>
      <MediaEditorView />
    </TauriThemeProvider>
  )
}

export default App
