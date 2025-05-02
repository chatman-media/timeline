import { Folder, Info } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background flex h-[600px] flex-col sm:max-w-[800px]">
        <DialogHeader className="bg-background">
          <DialogTitle>Экспорт</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="local" className="flex w-full flex-1 flex-col">
          <TabsList className="bg-muted h-10 w-full justify-start p-0">
            <TabsTrigger value="local" className="data-[state=active]:bg-background rounded-none">
              Местный
            </TabsTrigger>
            <TabsTrigger value="device" className="data-[state=active]:bg-background rounded-none">
              Устройство
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-background rounded-none">
              Социальные сети
            </TabsTrigger>
            <TabsTrigger value="dvd" className="data-[state=active]:bg-background rounded-none">
              DVD
            </TabsTrigger>
          </TabsList>

          <div className="bg-background flex-1 overflow-y-auto">
            <TabsContent value="local" className="mt-4 px-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                    <div className="text-muted-foreground">Обложка</div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Редактировать
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Настройки вывода</Label>
                    <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                      <Input placeholder="Имя" defaultValue="Без названия 1" />
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Сохранить в</Label>
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      <Input defaultValue="/Users/aleksandrkireev/" />
                      <Button variant="outline" size="icon">
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Пресет</Label>
                    <Select defaultValue="match">
                      <SelectTrigger>
                        <SelectValue placeholder="Сопоставить с настройками" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Сопоставить с настройками</SelectItem>
                        <SelectItem value="custom">Пользовательский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Формат</Label>
                    <Select defaultValue="mp4">
                      <SelectTrigger>
                        <SelectValue placeholder="MP4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4</SelectItem>
                        <SelectItem value="mov">MOV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Качество</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="normal" />
                          <Label htmlFor="normal">Нормальное</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="good" defaultChecked />
                          <Label htmlFor="good">Хорошее</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="best" />
                          <Label htmlFor="best">Высокое</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Разрешение</Label>
                      <Select defaultValue="4k">
                        <SelectTrigger>
                          <SelectValue placeholder="4096x2160" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4k">4096x2160</SelectItem>
                          <SelectItem value="1080">1920x1080</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Частота кадров</Label>
                      <Select defaultValue="25">
                        <SelectTrigger>
                          <SelectValue placeholder="25 fps" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 fps</SelectItem>
                          <SelectItem value="30">30 fps</SelectItem>
                          <SelectItem value="60">60 fps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Продвинутое сжатие</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Резервное копирование в облако</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Включить кодирование видео с ускорением GPU</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="device" className="mt-4 px-6">
              {/* Аналогичная структура для устройств */}
            </TabsContent>

            <TabsContent value="social" className="mt-4 px-6">
              <div className="grid grid-cols-[250px,1fr] gap-6">
                <div className="space-y-2">
                  <div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded p-2">
                    <Image src="/youtube.svg" className="h-6 w-6" alt="YouTube" />
                    <div>
                      <div>YouTube</div>
                      <div className="text-muted-foreground text-xs">Вход не выполнен</div>
                    </div>
                  </div>
                  <div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded p-2">
                    <Image src="/tiktok.svg" className="h-6 w-6" alt="TikTok" />
                    <div>
                      <div>TikTok</div>
                      <div className="text-muted-foreground text-xs">Вход не выполнен</div>
                    </div>
                  </div>
                  {/* Другие соц. сети */}
                </div>
                <div className="flex items-center justify-center">
                  <div className="space-y-4 text-center">
                    <Image src="/youtube-big.svg" className="mx-auto h-24 w-24" alt="YouTube" />
                    <div>
                      Войдите в свою учетную запись YouTube для получения дополнительной информации.
                    </div>
                    <Button>Войти</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dvd" className="mt-4 px-6">
              {/* Структура для DVD */}
            </TabsContent>
          </div>
        </Tabs>

        <div className="bg-background mt-6 flex items-center justify-between border-t px-6 py-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="use-last-settings" />
            <label htmlFor="use-last-settings" className="text-sm">
              Использовать последние настройки экспорта для локального файл
            </label>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span>Длина: 00:16:44</span>
              <span className="mx-2">•</span>
              <span>Размер: 4813.87 MB (Примерно)</span>
            </div>
            <Button>Экспорт</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
