"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-6 w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-cyan to-electric" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="Monthly limit"
        className="focus-ring block size-5 cursor-grab rounded-full border-2 border-white bg-electric shadow-[0_0_0_6px_rgb(31_123_255/0.18),0_4px_14px_rgb(0_0_0/0.5)] transition-transform active:scale-110 active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  );
}
