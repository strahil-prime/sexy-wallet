"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  className,
  tone = "electric",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { tone?: "electric" | "ice" }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "focus-ring relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300",
        checked ? (tone === "ice" ? "bg-cyan/90" : "bg-electric") : "bg-white/10",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 32 }}
          className={cn("block size-6 rounded-full bg-white shadow-[0_2px_8px_rgb(0_0_0/0.4)]", checked ? "ml-auto" : "")}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
