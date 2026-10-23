"use client";

import { motion, useMotionTemplate, useMotionValue, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Glass panel with a cursor-following spotlight on the border and surface.
 */
export function Panel({
  className,
  children,
  spotlight = true,
  ...props
}: HTMLMotionProps<"div"> & { spotlight?: boolean }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const surface = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgb(42 209 230 / 0.07), transparent 60%)`;
  const edge = useMotionTemplate`radial-gradient(260px circle at ${x}px ${y}px, rgb(94 240 255 / 0.35), transparent 70%)`;

  return (
    <motion.div
      onPointerMove={(e) => {
        if (!spotlight) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        x.set(-400);
        y.set(-400);
      }}
      className={cn("glass group/panel relative rounded-[var(--radius-panel)]", className)}
      {...props}
    >
      {spotlight && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ background: surface }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100"
            style={{
              background: edge,
              mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              padding: 1,
            }}
          />
        </>
      )}
      {children as React.ReactNode}
    </motion.div>
  );
}
