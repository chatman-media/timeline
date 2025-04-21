import * as SliderPrimitive from "@radix-ui/react-slider"
import * as React from "react"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none items-center select-none", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full border border-gray-400 bg-gray-200 dark:border-gray-100 dark:bg-gray-800">
      <SliderPrimitive.Range className="absolute h-full bg-gray-900 dark:bg-gray-100" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-[13px] w-[13px] rounded-full border border-[1.5px] border-gray-800 bg-white hover:h-[15px] hover:w-[15px] hover:border-gray-900 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-gray-100 dark:bg-gray-800" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
