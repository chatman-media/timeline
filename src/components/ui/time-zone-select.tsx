"use client"

import * as React from "react"
import { Check, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const timezones = [
  { value: "UTC", label: "UTC" },
  // Asia
  { value: "Asia/Bangkok", label: "Bangkok" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  // Europe
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Moscow", label: "Moscow" },
  // Americas
  { value: "America/New_York", label: "New York" },
  { value: "America/Chicago", label: "Chicago" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "America/Toronto", label: "Toronto" },
  // Pacific
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "Pacific/Sydney", label: "Sydney" },
].sort((a, b) => a.label.localeCompare(b.label))

export function TimeZoneSelect({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-[140px] justify-between text-xs"
        >
          <Globe className="mr-2 h-3 w-3" />
          {value
            ? timezones.find((timezone) => timezone.value === value)?.label
            : "Select timezone"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search timezone..." className="h-8" />
          <CommandEmpty>No timezone found.</CommandEmpty>
          <CommandGroup>
            {timezones.map((timezone) => (
              <CommandItem
                key={timezone.value}
                value={timezone.value}
                onSelect={(currentValue) => {
                  onValueChange(currentValue)
                  setOpen(false)
                }}
                className="text-sm"
              >
                <Check
                  className={cn(
                    "mr-2 h-3 w-3",
                    value === timezone.value ? "opacity-100" : "opacity-0",
                  )}
                />
                {timezone.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
