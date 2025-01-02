import { Grid, LayoutGrid, List } from "lucide-react"

import { Button } from "../ui/button"

type ViewMode = "list" | "grid" | "thumbnails"

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 cursor-pointer ${currentView === "list" ? "bg-accent" : ""}`}
        onClick={() => onViewChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 cursor-pointer ${currentView === "grid" ? "bg-accent" : ""}`}
        onClick={() => onViewChange("grid")}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 cursor-pointer ${currentView === "thumbnails" ? "bg-accent" : ""}`}
        onClick={() => onViewChange("thumbnails")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}
