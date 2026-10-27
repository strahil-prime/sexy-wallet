"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { registerPrimer, usePreloaded } from "@/components/shell/preloader";
import { cn } from "@/lib/utils";
import { clipFor, clips, type Clip, type ClipId, type TellerState } from "./machine";
import type { TellerSound } from "./sound";

/** First frame of the idle loop, so the still and the video line up exactly. */
const PORTRAIT = "/teller/clips/idle-poster.jpg";
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
 * The teller: a still, the idle loop on top of it, and the one-off clips (greeting,
 * answers) on top of that.
 */
export function TellerStage({
  state,
  sound,
  onClipEnded,
  className,
}: {
  state: TellerState;
  sound: TellerSound;
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

  const speaking = (state.status === "talking" && !state.clipDone) || state.status === "intro";

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
            {/* The idle loop always plays underneath; other clips fade in on top of it and back out. */}
            {clips.idle.src && <LoopVideo clip={clips.idle} />}
            <OverlayClip clipId={clipId} clip={clip} sound={sound} onEnded={onClipEnded} />
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

/** WebM when the browser can play it (smaller), MP4 otherwise. */
function sourceFor(video: HTMLVideoElement, clip: Clip) {
  return clip.webm && video.canPlayType('video/webm; codecs="vp9, opus"') ? clip.webm : clip.src;
}

function LoopVideo({ clip }: { clip: Clip }) {
  // React sets `muted` as a property after hydration, which some browsers see too late for
  // autoplay, so start playback explicitly once mounted.
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.src = sourceFor(v, clip) ?? "";
    v.play().catch(() => {});
  }, [clip]);
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="auto"
      poster={PORTRAIT}
      className="absolute inset-0 size-full object-cover object-top"
    />
  );
}

/**
 * One video element for every one-off clip, so a browser that has allowed it sound once keeps
 * allowing it. It plays with sound when the viewer wants it; if the browser refuses, it plays
 * muted and asks for a tap (see SoundToggle). The first tap anywhere also unlocks sound.
 */
function OverlayClip({
  clipId,
  clip,
  sound,
  onEnded,
}: {
  clipId: ClipId;
  clip: Clip;
  sound: TellerSound;
  onEnded: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const ready = usePreloaded();
  const active = clipId !== "idle" && !!clip.src;
  const wantSound = useRef(sound.on);
  wantSound.current = sound.on;
  const { setBlocked } = sound;

  /** Load the clip unless it's already the one on the element (the preloader may have started it). */
  const load = useCallback(
    (v: HTMLVideoElement) => {
      if (v.dataset.clip === clipId) return;
      v.dataset.clip = clipId;
      v.src = sourceFor(v, clip) ?? "";
      v.currentTime = 0;
    },
    [clipId, clip],
  );

  // The tap that dismisses the preloader starts the greeting inside the gesture, which is what
  // iOS needs before it lets this element play with sound, now and for every later clip.
  useEffect(() => {
    if (!active) return;
    registerPrimer(() => {
      const v = ref.current;
      if (!v || !wantSound.current) return;
      load(v);
      v.muted = false;
      v.play().catch(() => {});
    });
    return () => registerPrimer(null);
  }, [active, load]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !ready) return;
    if (!active) {
      v.pause();
      delete v.dataset.clip;
      return;
    }
    load(v);
    v.muted = !wantSound.current;
    v.play()
      .then(() => setBlocked(false))
      .catch((err: DOMException) => {
        if (err.name !== "NotAllowedError") return;
        // No sound allowed yet: play muted and let the viewer opt in.
        v.muted = true;
        setBlocked(wantSound.current);
        v.play().catch(onEnded);
      });
  }, [ready, active, load, onEnded, setBlocked]);

  // Follow the sound toggle mid-clip. Toggling is a tap, so the browser allows it.
  useEffect(() => {
    const v = ref.current;
    if (v) v.muted = !sound.on || sound.blocked;
  }, [sound.on, sound.blocked]);

  // The first interaction anywhere lets the browser play sound, so take it.
  useEffect(() => {
    if (!sound.blocked) return;
    const unlock = () => {
      const v = ref.current;
      if (v && !v.paused) v.muted = !wantSound.current;
      setBlocked(false);
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    return () => window.removeEventListener("pointerdown", unlock, { capture: true });
  }, [sound.blocked, setBlocked]);

  return (
    <motion.video
      ref={ref}
      playsInline
      preload="auto"
      onEnded={() => active && onEnded()}
      onError={() => active && onEnded()}
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 size-full object-cover object-top"
    />
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
