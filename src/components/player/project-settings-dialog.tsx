import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface ProjectSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSettingsDialog({ open, onOpenChange }: ProjectSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] text-white border-[#333]">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-xl">
            Настройки проекта
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-4">
          <div className="flex justify-between items-center">
            <Label className="text-[#ccc]">Соотношение сторон:</Label>
            <Select defaultValue="16:9">
              <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectItem value="16:9" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  16:9 (Широкоэкранный)
                </SelectItem>
                <SelectItem value="9:16" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  9:16 (Портрет)
                </SelectItem>
                <SelectItem value="1:1" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  1:1 (Instagram)
                </SelectItem>
                <SelectItem value="4:3" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  4:3 (Стандарт)
                </SelectItem>
                <SelectItem value="4:5" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  4:5 (Вертикальный)
                </SelectItem>
                <SelectItem value="21:9" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  21:9 (Кинотеатр)
                </SelectItem>
                <SelectItem value="3:4" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  3:4 (Бизнес)
                </SelectItem>
                <SelectItem
                  value="custom"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  Пользовательское
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <Label className="text-[#ccc]">Разрешение:</Label>
            <Select defaultValue="4096x2160">
              <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectItem
                  value="1280x720"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  1280x720 (HD)
                </SelectItem>
                <SelectItem
                  value="1920x1080"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  1920x1080 (Full HD)
                </SelectItem>
                <SelectItem
                  value="3840x2160"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  3840x2160 (4k UHD)
                </SelectItem>
                <SelectItem
                  value="4096x2160"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  4096x2160 (DCI 4k)
                </SelectItem>
                <SelectItem
                  value="custom"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  Пользовательское
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <Label className="text-[#ccc]">Частота кадров:</Label>
            <Select defaultValue="30">
              <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectItem
                  value="23.97"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  23.97 fps
                </SelectItem>
                <SelectItem value="24" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  24 fps
                </SelectItem>
                <SelectItem value="25" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  25 fps
                </SelectItem>
                <SelectItem
                  value="29.97"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  29.97 fps
                </SelectItem>
                <SelectItem value="30" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  30 fps
                </SelectItem>
                <SelectItem value="50" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  50 fps
                </SelectItem>
                <SelectItem
                  value="59.94"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  59.94 fps
                </SelectItem>
                <SelectItem value="60" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  60 fps
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <Label className="text-[#ccc]">Цветовое пространство:</Label>
            <Select defaultValue="sdr">
              <SelectTrigger className="w-[300px] bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectItem value="sdr" className="text-white hover:bg-[#333] focus:bg-[#333]">
                  SDR - Rec.709
                </SelectItem>
                <SelectItem
                  value="dci-p3"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  DCI-P3
                </SelectItem>
                <SelectItem
                  value="p3-d65"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  P3-D65
                </SelectItem>
                <SelectItem
                  value="hdr-hlg"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  HDR - Rec.2100HLG
                </SelectItem>
                <SelectItem
                  value="hdr-pq"
                  className="text-white hover:bg-[#333] focus:bg-[#333]"
                >
                  HDR - Rec.2100PQ
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between space-x-4">
          <Button
            variant="outline"
            className="flex-1 text-white bg-[#333333] hover:bg-[#444444] border-none"
            onClick={() => onOpenChange(false)}
          >
            Отменить
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-[#00CCC0] hover:bg-[#00AAA0] text-black border-none"
            onClick={() => {
              onOpenChange(false)
              // Здесь логика сохранения настроек
            }}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 