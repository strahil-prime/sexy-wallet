"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { registerPrimer, usePreloaded } from "@/components/shell/preloader";
import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/personas";
import { clipFor, clipOf, type Clip, type ClipId, type TellerState } from "./machine";
import type { TellerSound } from "./sound";
import { setVoiced } from "./voice";

/**
 * Backdrop colour per teller, sampled from the idle video's left and right edges. The square
 * video frame sits on this flat colour and its sides fade into the same colour, so the frame has
 * no visible edge. Painted, not a CSS mask (see the frame comment below).
 */
const EDGE: Record<string, string> = {
  bella: "#001a23",
  sebastian: "#0b2330",
  michael: "#062631",
};

/**
 * The teller: a still, the idle loop on top of it, and the one-off clips (greeting,
 * answers) on top of that.
 */
export function TellerStage({
  persona,
  state,
  sound,
  onClipEnded,
  className,
}: {
  persona: Persona;
  state: TellerState;
  sound: TellerSound;
  onClipEnded: () => void;
  className?: string;
}) {
  const clipId = clipFor(state);
  const clip = clipOf(persona, clipId);
  // The poster is the idle loop's first frame, so the still and the video line up exactly.
  const portrait = persona.poster;

  // The light behind the teller drifts a little with the pointer (the portrait itself stays still).
  const px = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 20 });
  const glowX = useTransform(sx, (v) => `${50 + v * 12}%`);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px]);

  const edge = EDGE[persona.id] ?? persona.edgeColor;
  const stageRef = useRef<HTMLDivElement>(null);
  const box = useDesktopFrame(stageRef);

  const speaking = (state.status === "talking" && !state.clipDone) || state.status === "intro";
  const phone = usePhoneLayout();
  const ready = usePreloaded();

  // Once the greeting is over, quietly fetch the three answer clips so a quick question starts
  // playing at once instead of buffering. Fetches the same format the video element will pick.
  const idle = state.status === "idle";
  const warmed = useRef(false);
  useEffect(() => {
    if (!idle || !ready || warmed.current) return;
    const t = window.setTimeout(() => {
      warmed.current = true;
      const probe = document.createElement("video");
      for (const q of persona.questions) {
        const url = sourceFor(probe, q.clip, phone);
        if (url) fetch(url, { priority: "low" } as RequestInit).catch(() => {});
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [idle, ready, phone, persona]);

  return (
    <div ref={stageRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Backdrop in the video's own edge colour, so wide windows grow the background around the
          square portrait instead of cropping it, with no visible seam at the frame's edges. */}
      <div
        className="absolute inset-0"
        style={{ background: edge }}
      />

      {/* The portrait frame. Kept deliberately plain: no transform, mask, filter, blend or
          animation on it or any ancestor, and one <video> element that swaps clips. Safari and
          Chrome on Mac drew a video inside a translated, masked or scaled layer at the wrong
          offset (the right half of the frame repeated, shifted sideways).
          Phones: the frame fills the stage and the crop comes from object-position.
          Desktop: a square, full stage height, placed in pixels (measured, not translated). */}
      <div className="absolute" style={phone ? { inset: 0 } : box ?? { inset: 0, visibility: "hidden" }}>
        <Image
          src={portrait}
          alt={`${persona.name}, your teller`}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className={cn("object-cover", phone ? PHONE_CROP : "object-top")}
        />
        <OverlayClip clipId={clipId} clip={clip} idle={persona.idle} poster={portrait} sound={sound} onEnded={onClipEnded} phone={phone} />
        {!phone && (
          <>
            <div aria-hidden className="absolute inset-y-0 -left-px w-[16%]" style={{ background: `linear-gradient(90deg, ${edge}, transparent)` }} />
            <div aria-hidden className="absolute inset-y-0 -right-px w-[16%]" style={{ background: `linear-gradient(270deg, ${edge}, transparent)` }} />
          </>
        )}
      </div>

      {/* Light that breathes harder while she speaks */}
      <motion.div
        aria-hidden
        className="absolute top-[18%] h-[50%] w-[60%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(42_209_230/0.16),transparent)]"
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

/** Where the phone crop of the square portrait sits. Tablets match the desktop frame's offset;
 *  phones (under 640px) shift the crop so the teller's face sits in the middle of the screen. */
const PHONE_CROP = "object-[79%_0%] max-sm:object-[62%_0%]";

/** WebM when the browser can play it (smaller), MP4 otherwise. Phones always get the H.264 MP4,
 *  which iPhones decode in hardware. */
function sourceFor(video: HTMLVideoElement, clip: Clip, preferMp4 = false) {
  if (preferMp4 && clip.src) return clip.src;
  return clip.webm && video.canPlayType('video/webm; codecs="vp9, opus"') ? clip.webm : clip.src;
}

/**
 * One video element for every one-off clip, so a browser that has allowed it sound once keeps
 * allowing it. It plays with sound when the viewer wants it; if the browser refuses, it plays
 * muted and asks for a tap (see SoundToggle). The first tap anywhere also unlocks sound.
 */
function OverlayClip({
  clipId,
  clip,
  idle,
  poster,
  sound,
  onEnded,
  phone,
}: {
  clipId: ClipId;
  clip: Clip;
  idle: Clip;
  poster: string;
  sound: TellerSound;
  onEnded: () => void;
  /** Phones get the MP4 (hardware decode on iPhone) and their own crop. */
  phone: boolean;
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
      v.src = sourceFor(v, c, phone) ?? "";
      v.currentTime = 0;
    },
    [clipId, clip, phone],
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
      if (idle.src) {
        load(v, "idle", idle);
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
  }, [ready, active, idle, load, onEnded, setBlocked]);

  // Tell the cards' equaliser when her voice is audible: playing, unmuted, in a spoken stretch.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      const t = v.currentTime;
      setVoiced(
        active && !v.paused && !v.ended && !v.muted && v.dataset.clip === clipId &&
          !!clip.voice?.some(([a, b]) => t >= a && t < b),
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      setVoiced(false);
    };
  }, [active, clipId, clip]);

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
    // The one video element: idle loop between clips, then the greeting and answers. Nothing
    // animates around it (Safari loses a video's geometry inside animated or transformed parents).
    <video
      ref={ref}
      muted
      playsInline
      poster={poster}
      preload="auto"
      onEnded={() => active && onEnded()}
      onError={() => active && onEnded()}
      className={cn("absolute inset-0 size-full object-cover", phone ? PHONE_CROP : "object-top")}
    />
  );
}

/** Desktop portrait frame in pixels: a square as tall as the stage, its top 7% above the stage
 *  and its left edge so the face sits at about 58% across. Measured instead of using percentage
 *  translates, which Safari applied to the video at a stale offset. */
function useDesktopFrame(ref: React.RefObject<HTMLDivElement | null>) {
  const [box, setBox] = useState<React.CSSProperties | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      setBox({ top: Math.round(-0.07 * H), left: Math.round(0.58 * W - 0.62 * H), width: H, height: H });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

// Remembered after the first check, so a stage mounted later (switching teller) starts with the
// right setup instead of loading the desktop WebM for one render on a phone.
let knownPhone: boolean | null = null;

/** Below the desktop breakpoint, where the stage switches to its simpler phone setup. */
function usePhoneLayout() {
  const [phone, setPhone] = useState(knownPhone ?? false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setPhone((knownPhone = mq.matches));
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
