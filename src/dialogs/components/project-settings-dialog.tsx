import { Button } from "@/components/ui/button"
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
import { useProject } from "@/project-settings/project-machine"
import { ASPECT_RATIOS, ColorSpace, FrameRate, Resolution } from "@/types/project"

interface ProjectSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSettingsDialog({ open, onOpenChange }: ProjectSettingsDialogProps) {
  const { settings, updateSettings } = useProject()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm dark:bg-[#1b1a1f] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-md text-center">Настройки проекта</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-1">
          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">Соотношение сторон:</Label>
            <Select
              value={settings.aspectRatio.label}
              onValueChange={(value: string) =>
                updateSettings({ aspectRatio: ASPECT_RATIOS.find((item) => item.label === value)! })
              }
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                {ASPECT_RATIOS.map((item) => (
                  <SelectItem key={item.label} value={item.label} className="">
                    {item.label} {item.textLabel ? `(${item.textLabel})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">Разрешение:</Label>
            <Select
              value={settings.resolution}
              onValueChange={(value: Resolution) => updateSettings({ resolution: value })}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="1280x720" className="">
                  1280x720 (HD)
                </SelectItem>
                <SelectItem value="1920x1080" className="">
                  1920x1080 (Full HD)
                </SelectItem>
                <SelectItem value="3840x2160" className="">
                  3840x2160 (4k UHD)
                </SelectItem>
                <SelectItem value="4096x2160" className="">
                  4096x2160 (DCI 4k)
                </SelectItem>
                <SelectItem value="custom" className="">
                  Пользовательское
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">Частота кадров:</Label>
            <Select
              value={settings.frameRate}
              onValueChange={(value: FrameRate) => updateSettings({ frameRate: value })}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="23.97" className="">
                  23.97 fps
                </SelectItem>
                <SelectItem value="24" className="">
                  24 fps
                </SelectItem>
                <SelectItem value="25" className="">
                  25 fps
                </SelectItem>
                <SelectItem value="29.97" className="">
                  29.97 fps
                </SelectItem>
                <SelectItem value="30" className="">
                  30 fps
                </SelectItem>
                <SelectItem value="50" className="">
                  50 fps
                </SelectItem>
                <SelectItem value="59.94" className="">
                  59.94 fps
                </SelectItem>
                <SelectItem value="60" className="">
                  60 fps
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">Цветовое пространство:</Label>
            <Select
              value={settings.colorSpace}
              onValueChange={(value: ColorSpace) => updateSettings({ colorSpace: value })}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="sdr" className="">
                  SDR - Rec.709
                </SelectItem>
                <SelectItem value="dci-p3" className="">
                  DCI-P3
                </SelectItem>
                <SelectItem value="p3-d65" className="">
                  P3-D65
                </SelectItem>
                <SelectItem value="hdr-hlg" className="">
                  HDR - Rec.2100HLG
                </SelectItem>
                <SelectItem value="hdr-pq" className="">
                  HDR - Rec.2100PQ
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between space-x-4">
          <Button
            variant="default"
            className="flex-1 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Отменить
          </Button>
          <Button
            variant="default"
            className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
