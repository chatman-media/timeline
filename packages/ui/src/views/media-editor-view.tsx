import { FC } from "react"
import { Label } from "@repo/ui/components/label"
import { Input } from "@repo/ui/components/input"
import { TauriThemeToggle } from "@repo/ui/components/tauri-theme-toggle"

export const MediaEditorView: FC = () => {
  return (
    <div className="container">
      <TauriThemeToggle />
      <div className="flex flex-col gap-2">
        <Label>Выберите файл</Label>
        <Input type="file" />
      </div>
    </div>
  )
}
