import { Sliders } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Options() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <h3 className="text-xs font-medium">Опции</h3>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Sliders className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto"></div>
    </div>
  )
} 