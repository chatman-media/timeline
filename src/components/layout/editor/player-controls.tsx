import { Play,SkipBack, SkipForward, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function PlayerControls() {
  return (
    <div className="flex items-center space-x-0">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="cursor-pointer h-6"
            variant="ghost"
            size="icon"
            title="Предыдущий кадр"
          >
            <SkipBack className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" sideOffset={0}>
          <div>
            <h4 className="text-sm font-semibold">Предыдущий кадр</h4>
            <div className="h-10"></div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="cursor-pointer h-6"
            variant="ghost"
            size="icon"
            title="Следующий кадр"
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" sideOffset={0}>
          <div>
            <h4 className="text-sm font-semibold">Следующий кадр</h4>
            <div className="h-10"></div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="cursor-pointer h-6"
            variant="ghost"
            size="icon"
            title="Воспроизвести"
          >
            <Play className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" sideOffset={0}>
          <div>
            <h4 className="text-sm font-semibold">Воспроизвести</h4>
            <div className="h-10"></div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="cursor-pointer h-6"
            variant="ghost"
            size="icon"
            title="Стоп"
          >
            <Square className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" sideOffset={0}>
          <div>
            <h4 className="text-sm font-semibold">Стоп</h4>
            <div className="h-10"></div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 