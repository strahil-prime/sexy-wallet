"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

/** Button with a springy press, used for most tappable surfaces. */
export function Pressable({ className, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      className={cn("focus-ring cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-40", className)}
      {...props}
    />
  );
}
