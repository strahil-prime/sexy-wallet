"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const phone = usePhoneLayout();

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Backdrop that extends past the portrait. It matches the portrait's edge colour, so wide
          windows grow the background instead of cropping Bella. */}
      <div className="absolute inset-0 bg-[radial-gradient(55%_75%_at_60%_35%,#072232_0%,#04151f_55%,var(--color-ink-900)_100%)]" />
      <Image src={PORTRAIT} alt="" aria-hidden fill sizes="40vw" className="scale-125 object-cover opacity-35 blur-[70px]" />

      {/* Fixed-proportion portrait frame: always full stage height, never stretched.
          The still and the video clips share this frame, its object-fit and its edge mask. */}
      {/* Phones: the frame simply fills the stage and the crop comes from object-position, so
          Bella's video has no percentage transforms or aspect-ratio box around it. iPhone Safari
          drew the video layer at a stale offset inside the translated square frame. */}
      <div
        className={cn(
          "absolute",
          phone ? "inset-0" : "top-0 left-1/2 h-full -translate-x-[62%] lg:-top-[7%] lg:left-[58%]",
        )}
        style={phone ? undefined : { aspectRatio: PORTRAIT_RATIO }}
      >
        <motion.div
          className="absolute inset-0"
          // On phones the frame is plain: iPhone Safari mis-draws video inside a masked, moving
          // layer (a clip showed as a cut-off strip). The stage's gradients still blend the edges.
          style={phone ? undefined : { x, y, ...featherMask }}
          initial={phone ? false : { opacity: 0, scale: 1.06, filter: "blur(12px)" }}
          // Drop the filter once the entrance ends: iOS Safari mis-draws videos inside an element
          // that has both a mask and a filter (the clip showed as a cut-off strip).
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            animate={phone ? { scale: 1 } : { scale: [1, 1.018, 1] }}
            transition={phone ? { duration: 0 } : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={PORTRAIT}
              alt="Bella, your teller"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className={cn("object-cover", phone ? PHONE_CROP : "object-top")}
            />
            {/* Desktop: the idle loop always plays underneath and other clips fade in on top of it.
                Phones: one video element plays everything, swapping clips, so there is only ever one
                video layer to draw. */}
            {clips.idle.src && !phone && <LoopVideo clip={clips.idle} />}
            <OverlayClip clipId={clipId} clip={clip} sound={sound} onEnded={onClipEnded} single={phone} />
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

/** Where the phone crop of the square portrait sits, matching the desktop frame's offset. */
const PHONE_CROP = "object-[79%_0%]";

/** WebM when the browser can play it (smaller), MP4 otherwise. Phones always get the H.264 MP4,
 *  which iPhones decode in hardware. */
function sourceFor(video: HTMLVideoElement, clip: Clip, preferMp4 = false) {
  if (preferMp4 && clip.src) return clip.src;
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
  single,
}: {
  clipId: ClipId;
  clip: Clip;
  sound: TellerSound;
  onEnded: () => void;
  /** Also plays the idle loop between clips, instead of a separate loop element underneath. */
  single: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const ready = usePreloaded();
  const active = clipId !== "idle" && !!clip.src;
  const wantSound = useRef(sound.on);
  wantSound.current = sound.on;
  const { setBlocked } = sound;

  /** Load the clip unless it's already the one on the element (the preloader may have started it). */
  const load = useCallback(
    (v: HTMLVideoElement, id: ClipId = clipId, c: Clip = clip) => {
      if (v.dataset.clip === id) return;
      v.dataset.clip = id;
      v.loop = c.loop;
      v.src = sourceFor(v, c, single) ?? "";
      v.currentTime = 0;
    },
    [clipId, clip, single],
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
    if (!v) return;
    if (!active) {
      if (single && clips.idle.src) {
        load(v, "idle", clips.idle);
        v.muted = true;
        v.play().catch(() => {});
      } else {
        v.pause();
        delete v.dataset.clip;
      }
      return;
    }
    if (!ready) return;
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
  }, [ready, active, single, load, onEnded, setBlocked]);

  // Follow the sound toggle mid-clip. Toggling is a tap, so the browser allows it.
  useEffect(() => {
    const v = ref.current;
    if (v && v.dataset.clip !== "idle") v.muted = !sound.on || sound.blocked;
  }, [sound.on, sound.blocked]);

  // The first interaction anywhere lets the browser play sound, so take it.
  useEffect(() => {
    if (!sound.blocked) return;
    const unlock = () => {
      const v = ref.current;
      if (v && !v.paused && v.dataset.clip !== "idle") v.muted = !wantSound.current;
      setBlocked(false);
    };
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    return () => window.removeEventListener("pointerdown", unlock, { capture: true });
  }, [sound.blocked, setBlocked]);

  return (
    // The fade runs on a wrapper, not on the <video>: iOS Safari loses a video's geometry when its
    // own opacity is animated inside a masked, transformed parent.
    <motion.div
      initial={false}
      animate={{ opacity: active || single ? 1 : 0 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0"
    >
      <video
        ref={ref}
        muted
        playsInline
        poster={single ? PORTRAIT : undefined}
        style={single ? { objectPosition: "79% 0%" } : undefined}
        preload="auto"
        onEnded={() => active && onEnded()}
        onError={() => active && onEnded()}
        className="absolute inset-0 size-full object-cover object-top"
      />
    </motion.div>
  );
}

/** Below the desktop breakpoint, where the stage switches to its simpler phone setup. */
function usePhoneLayout() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return phone;
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
