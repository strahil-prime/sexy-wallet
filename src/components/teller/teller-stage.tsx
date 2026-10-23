"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { clipFor, clips, type TellerState } from "./machine";

/**
 * The teller portrait. Static image today; video-ready via `clips`.
 */
export function TellerStage({
  state,
  onClipEnded,
  className,
}: {
  state: TellerState;
  onClipEnded: () => void;
  className?: string;
}) {
  const clipId = clipFor(state);
  const clip = clips[clipId];

  // Gentle pointer parallax so the still frame feels alive.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 20 });
  const sy = useSpring(py, { stiffness: 40, damping: 20 });
  const x = useTransform(sx, (v) => v * -14);
  const y = useTransform(sy, (v) => v * -10);
  const glowX = useTransform(sx, (v) => `${50 + v * 12}%`);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  const speaking = state.status === "talking" || state.status === "intro";

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute inset-[-3%]"
        style={{ x, y }}
        initial={{ opacity: 0, scale: 1.08, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.018, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/teller/bella.jpg"
            alt="Bella, your teller"
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-[78%_12%] lg:object-[45%_0%]"
          />
          <AnimatePresence>
            {clip.src && (
              <motion.video
                key={clipId}
                src={clip.src}
                autoPlay
                muted={false}
                playsInline
                loop={clip.loop}
                onEnded={onClipEnded}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 size-full object-cover object-[45%_0%]"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Light that breathes harder while she speaks */}
      <motion.div
        aria-hidden
        className="absolute top-[18%] h-[50%] w-[60%] -translate-x-1/2 rounded-full bg-cyan/20 mix-blend-screen blur-[90px]"
        style={{ left: glowX }}
        animate={{ opacity: speaking ? [0.35, 0.7, 0.35] : 0.25 }}
        transition={speaking ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.8 }}
      />

      <Dust />

      {/* Fades into the UI */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-ink-900)_0%,transparent_22%,transparent_78%,rgb(6_15_21/0.6)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-900/60 to-transparent" />
    </div>
  );
}

/** Floating motes of light, Magic UI "particles" style but DOM-light. */
function Dust() {
  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const r = (n: number) => {
          const s = Math.sin(i * 9301 + n * 49297) * 233280;
          return s - Math.floor(s);
        };
        return { left: r(1) * 100, top: 20 + r(2) * 75, size: 1 + r(3) * 2.5, dur: 8 + r(4) * 10, delay: r(5) * -15, drift: (r(6) - 0.5) * 40 };
      }),
    [],
  );
  return (
    <div aria-hidden className="absolute inset-0">
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-aqua shadow-[0_0_8px_2px_rgb(94_240_255/0.6)]"
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size }}
          animate={{ y: [0, -120], x: [0, m.drift], opacity: [0, 0.9, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}
