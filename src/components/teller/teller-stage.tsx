"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { clipFor, clips, type TellerState } from "./machine";

const PORTRAIT = "/teller/bella-v3.jpg";
/** Width / height of the portrait. Export the video clips at this same ratio (square, 2048×2048 or 1080×1080). */
const PORTRAIT_RATIO = "1 / 1";

/** Feathers the portrait's sides and bottom into the backdrop. */
const featherMask: React.CSSProperties = {
  maskImage:
    "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%), linear-gradient(180deg, #000 72%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%), linear-gradient(180deg, #000 72%, transparent 100%)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

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
      {/* Backdrop that extends past the portrait. It matches the portrait's edge colour, so wide
          windows grow the background instead of cropping Bella. */}
      <div className="absolute inset-0 bg-[radial-gradient(55%_75%_at_60%_35%,#072232_0%,#04151f_55%,var(--color-ink-900)_100%)]" />
      <Image src={PORTRAIT} alt="" aria-hidden fill sizes="40vw" className="scale-125 object-cover opacity-35 blur-[70px]" />

      {/* Fixed-proportion portrait frame: always full stage height, never stretched.
          The still and the video clips share this frame, its object-fit and its edge mask. */}
      <div
        className="absolute top-0 left-1/2 h-full -translate-x-[62%] lg:-top-[7%] lg:left-[58%]"
        style={{ aspectRatio: PORTRAIT_RATIO }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ x, y, ...featherMask }}
          initial={{ opacity: 0, scale: 1.06, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.018, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={PORTRAIT}
              alt="Bella, your teller"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover object-top"
            />
            <AnimatePresence>
              {clip.src && (
                <motion.video
                  key={clipId}
                  src={clip.src}
                  poster={PORTRAIT}
                  autoPlay
                  muted={false}
                  playsInline
                  loop={clip.loop}
                  onEnded={onClipEnded}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 size-full object-cover object-top"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

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
