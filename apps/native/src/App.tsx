import { AnalyzeTextView } from "@repo/ui/views/analyzeTextView";
import { TauriThemeProvider } from "@repo/ui/components/tauri-theme-provider";

function App() {
  return (
    <TauriThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <AnalyzeTextView />
      </div>
    </TauriThemeProvider>
  );
}

export default App;
