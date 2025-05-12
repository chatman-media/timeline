import { Folder, Info } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  const { t } = useTranslation()
  const [selectedSocialNetwork, setSelectedSocialNetwork] = useState<string>("youtube")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background h-[66%] w-[50%] max-w-[1200px] gap-0 overflow-hidden p-0 dark:bg-[#1b1a1f] [&>button]:hidden flex flex-col">
        <div className="flex items-center justify-center border-b py-2">
          <h2 className="text-base font-semibold">{t("dialogs.export.title")}</h2>
        </div>

        <Tabs defaultValue="local" className="flex flex-col flex-1">
          <div className="bg-gray-50 dark:bg-[#1b1a1f]">
            <TabsList className="mx-4 mt-2 mb-2 h-8 w-auto bg-transparent">
              <TabsTrigger
                value="local"
                className="rounded-sm px-3 py-1 text-sm data-[state=active]:bg-[#00CCC0] data-[state=active]:text-black dark:data-[state=active]:bg-[#00CCC0] dark:data-[state=active]:text-black"
              >
                {t("dialogs.export.local")}
              </TabsTrigger>
              <TabsTrigger
                value="device"
                className="rounded-sm px-3 py-1 text-sm data-[state=active]:bg-[#00CCC0] data-[state=active]:text-black dark:data-[state=active]:bg-[#00CCC0] dark:data-[state=active]:text-black"
              >
                {t("dialogs.export.device")}
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="rounded-sm px-3 py-1 text-sm data-[state=active]:bg-[#00CCC0] data-[state=active]:text-black dark:data-[state=active]:bg-[#00CCC0] dark:data-[state=active]:text-black"
              >
                {t("dialogs.export.socialNetworks")}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="local" className="h-full px-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                    <div className="text-muted-foreground">{t("dialogs.export.cover")}</div>
                  </div>
                  <Button variant="outline" className="w-full">
                    {t("dialogs.export.edit")}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("dialogs.export.outputSettings")}</Label>
                    <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                      <Input
                        placeholder={t("dialogs.export.name")}
                        defaultValue={t("project.untitledExport", { number: 1 })}
                      />
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.saveTo")}</Label>
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      <Input defaultValue="/Users/aleksandrkireev/" />
                      <Button variant="outline" size="icon">
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.preset")}</Label>
                    <Select defaultValue="match">
                      <SelectTrigger>
                        <SelectValue placeholder={t("dialogs.export.defaultPreset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">{t("dialogs.export.defaultPreset")}</SelectItem>
                        <SelectItem value="custom">{t("dialogs.export.custom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.format")}</Label>
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
                      <Label>{t("dialogs.export.quality")}</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="normal" />
                          <Label htmlFor="normal">{t("dialogs.export.normal")}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="good" defaultChecked />
                          <Label htmlFor="good">{t("dialogs.export.good")}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="best" />
                          <Label htmlFor="best">{t("dialogs.export.best")}</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("dialogs.export.resolution")}</Label>
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
                      <Label>{t("dialogs.export.frameRate")}</Label>
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
                        <Label>{t("dialogs.export.advancedCompression")}</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>{t("dialogs.export.cloudBackup")}</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>{t("dialogs.export.enableGPUEncoding")}</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="device" className="h-full overflow-y-auto px-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                    <div className="text-muted-foreground">{t("dialogs.export.cover")}</div>
                  </div>
                  <Button variant="outline" className="w-full">
                    {t("dialogs.export.edit")}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("dialogs.export.titles")}</Label>
                    <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                      <Input
                        placeholder={t("dialogs.export.name")}
                        defaultValue="Room"
                      />
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.saveTo")}</Label>
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      <Input defaultValue="/Users/aleksandrkireev/Movies/Wondershare Filmora Mac/Output" />
                      <Button variant="outline" size="icon">
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.preset")}</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue placeholder={t("dialogs.export.defaultPreset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t("dialogs.export.defaultPreset")}</SelectItem>
                        <SelectItem value="custom">{t("dialogs.export.custom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("dialogs.export.device")}</Label>
                      <Select defaultValue="iphone">
                        <SelectTrigger>
                          <SelectValue placeholder="iPhone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iphone">{t("dialogs.export.device_types.iphone")}</SelectItem>
                          <SelectItem value="ipad">{t("dialogs.export.device_types.ipad")}</SelectItem>
                          <SelectItem value="android">{t("dialogs.export.device_types.android")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("dialogs.export.resolution")}</Label>
                      <Select defaultValue="1080">
                        <SelectTrigger>
                          <SelectValue placeholder="1920*1080" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1080">1920*1080</SelectItem>
                          <SelectItem value="720">1280*720</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.codec")}</Label>
                    <Select defaultValue="h264">
                      <SelectTrigger>
                        <SelectValue placeholder="H.264" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h264">H.264</SelectItem>
                        <SelectItem value="h265">H.265</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">30 {t("dialogs.export.fps")}</span>
                      <span className="text-sm mx-2">•</span>
                      <span className="text-sm">6000 {t("dialogs.export.kbps")}</span>
                      <span className="text-sm mx-2">•</span>
                      <span className="text-sm">{t("dialogs.export.sdr")}</span>
                    </div>
                    <Button variant="link" className="text-[#00CCC0]">
                      {t("dialogs.export.additional")} →
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>{t("dialogs.export.advancedCompression")}</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>{t("dialogs.export.enableGPUEncoding")}</Label>
                        <Info className="text-muted-foreground h-4 w-4" />
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="h-full overflow-y-auto px-6 pt-4">
              <div className="grid grid-cols-[250px,1fr] gap-6">
                <div className="space-y-2">
                  <div
                    className={`flex cursor-pointer items-center gap-2 rounded p-2 ${selectedSocialNetwork === "youtube" ? "bg-accent" : "hover:bg-accent"}`}
                    onClick={() => setSelectedSocialNetwork("youtube")}
                  >
                    <Image src="/youtube-new.svg" width={24} height={24} className="h-6 w-6" alt="YouTube" />
                    <div>
                      <div>{t("dialogs.export.youtube")}</div>
                      <div className="text-muted-foreground text-xs">{t("dialogs.export.notLoggedIn")}</div>
                    </div>
                  </div>
                  <div
                    className={`flex cursor-pointer items-center gap-2 rounded p-2 ${selectedSocialNetwork === "tiktok" ? "bg-accent" : "hover:bg-accent"}`}
                    onClick={() => setSelectedSocialNetwork("tiktok")}
                  >
                    <Image src="/tiktok-new.svg" width={24} height={24} className="h-6 w-6" alt="TikTok" />
                    <div>
                      <div>{t("dialogs.export.tiktok")}</div>
                      <div className="text-muted-foreground text-xs">{t("dialogs.export.notLoggedIn")}</div>
                    </div>
                  </div>
                  <div
                    className={`flex cursor-pointer items-center gap-2 rounded p-2 ${selectedSocialNetwork === "telegram" ? "bg-accent" : "hover:bg-accent"}`}
                    onClick={() => setSelectedSocialNetwork("telegram")}
                  >
                    <Image src="/telegram.svg" width={24} height={24} className="h-6 w-6" alt="Telegram" />
                    <div>
                      <div>{t("dialogs.export.telegram")}</div>
                      <div className="text-muted-foreground text-xs">{t("dialogs.export.notLoggedIn")}</div>
                    </div>
                  </div>
                  {/* {t("dialogs.export.otherNetworks")} */}
                </div>
                <div className="flex items-center justify-center">
                  {selectedSocialNetwork === "youtube" && (
                    <div className="space-y-4 text-center">
                      <Image src="/youtube-new.svg" width={96} height={96} className="mx-auto h-24 w-24" alt="YouTube" />
                      <div>
                        {t("dialogs.export.loginPrompt.youtube")}
                      </div>
                      <Button>{t("dialogs.export.login")}</Button>
                    </div>
                  )}
                  {selectedSocialNetwork === "tiktok" && (
                    <div className="space-y-4 text-center">
                      <Image src="/tiktok-new.svg" width={96} height={96} className="mx-auto h-24 w-24" alt="TikTok" />
                      <div>
                        {t("dialogs.export.loginPrompt.tiktok")}
                      </div>
                      <Button>{t("dialogs.export.login")}</Button>
                    </div>
                  )}
                  {selectedSocialNetwork === "telegram" && (
                    <div className="space-y-4 text-center">
                      <Image src="/telegram.svg" width={96} height={96} className="mx-auto h-24 w-24" alt="Telegram" />
                      <div>
                        {t("dialogs.export.loginPrompt.telegram")}
                      </div>
                      <Button>{t("dialogs.export.login")}</Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="use-last-settings" />
            <label htmlFor="use-last-settings" className="text-sm">
              {t("dialogs.export.useLastSettings")}
            </label>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span>{t("dialogs.export.length")}: 00:16:44</span>
              <span className="mx-2">•</span>
              <span>{t("dialogs.export.size")}: 4813.87 MB ({t("dialogs.export.approximate")})</span>
            </div>
            <Button className="cursor-pointer bg-[#00CCC0] px-6 text-black hover:bg-[#00AAA0]">
              {t("dialogs.export.title")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
