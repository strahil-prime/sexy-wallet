"use client";

import { useEffect, useId, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Enamel colour, four stops from highlight to deep shadow. The rim and the embossed icon are
 * always gold; this only colours the enamel field.
 */
export type Metal = [string, string, string, string];

export const metals = {
  gold: ["#fff0bf", "#efc25e", "#b17c24", "#5c3c0b"],
  emerald: ["#9cf5cf", "#22c47e", "#0b7a4c", "#043823"],
  violet: ["#d7c6ff", "#8a5cff", "#5126d1", "#220c63"],
  copper: ["#ffc2a3", "#ff6a3d", "#c43418", "#5a1206"],
  ice: ["#b8f8ff", "#22c6e0", "#0a7f9c", "#053a4a"],
  rose: ["#ffc2d6", "#f2447e", "#b3184f", "#520823"],
  cobalt: ["#bcd6ff", "#2f7bff", "#1449c4", "#071f5c"],
  teal: ["#b2fff0", "#1bc7a8", "#0b8371", "#043b33"],
  indigo: ["#c9ccff", "#5560f0", "#2c33b8", "#10145a"],
} satisfies Record<string, Metal>;

const LOCKED: Metal = ["#9aa6ae", "#56636c", "#323d45", "#141b20"];

const LAYERS = 9;

/* ── The hexagon ─────────────────────────────────────── */

/** A pointy-top hexagon with softly rounded corners, centred in a 100×100 box. */
function hexPath(R: number, round = 0.16) {
  const v = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return [50 + R * Math.cos(a), 50 + R * Math.sin(a)];
  });
  const lerp = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const f = (n: number) => n.toFixed(2);
  let d = "";
  for (let i = 0; i < 6; i++) {
    const cur = v[i];
    const prev = v[(i + 5) % 6];
    const next = v[(i + 1) % 6];
    const a = lerp(cur, prev, round);
    const b = lerp(cur, next, round);
    d += `${i ? "L" : "M"}${f(a[0])} ${f(a[1])} Q${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])} `;
  }
  return `${d}Z`;
}

const RIM = hexPath(48);
const GROOVE = hexPath(44.4);
const ENAMEL = hexPath(43.2);

/** CSS clip for the HTML layers that sit on the badge (matches the outer rim). */
const RIM_CLIP = `path("${RIM}")`;

function useIds() {
  const base = useId().replace(/:/g, "");
  return { rim: `${base}r`, gold: `${base}g`, enamel: `${base}e`, clip: `${base}c`, gloss: `${base}s`, glare: `${base}l`, outer: `${base}o` };
}

function GoldDefs({ ids }: { ids: ReturnType<typeof useIds> }) {
  return (
    <>
      <linearGradient id={ids.rim} gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="90" y2="100">
        <stop offset="0" stopColor="#fff2c4" />
        <stop offset="0.22" stopColor="#d9a845" />
        <stop offset="0.45" stopColor="#7d5414" />
        <stop offset="0.62" stopColor="#e7bf62" />
        <stop offset="0.82" stopColor="#8c5f18" />
        <stop offset="1" stopColor="#f3d27f" />
      </linearGradient>
      <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff3c9" />
        <stop offset="0.35" stopColor="#e2b453" />
        <stop offset="0.7" stopColor="#a8741f" />
        <stop offset="1" stopColor="#f0cd78" />
      </linearGradient>
    </>
  );
}

/* ── Faces ───────────────────────────────────────────── */

function Face({ enamel: [hi, mid, lo, deep], icon: Icon, size, light, dim }: { enamel: Metal; icon: LucideIcon; size: number; light: MotionValue<number>; dim: boolean }) {
  const ids = useIds();
  const glareX = useTransform(light, [-1, 1], [-70, 70]);
  const px = size / 100; // one unit of the 100-box in pixels
  const stroke = Math.max(1.5, Math.min(1.9, 160 / size));
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <GoldDefs ids={ids} />
          <radialGradient id={ids.enamel} cx="0.36" cy="0.26" r="0.86">
            <stop offset="0" stopColor={hi} />
            <stop offset="0.38" stopColor={mid} />
            <stop offset="0.8" stopColor={lo} />
            <stop offset="1" stopColor={deep} />
          </radialGradient>
          <linearGradient id={ids.gloss} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={ids.glare} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={ids.clip}>
            <path d={ENAMEL} />
          </clipPath>
          <clipPath id={ids.outer}>
            <path d={RIM} />
          </clipPath>
        </defs>

        {/* Gold rim, with a bright top edge and a dark groove where it meets the enamel */}
        <path d={RIM} fill={`url(#${ids.rim})`} />
        <path d={RIM} fill="none" stroke="#fff6d6" strokeOpacity="0.55" strokeWidth="0.5" />
        <path d={GROOVE} fill="#2b1a04" opacity="0.85" />

        {/* Glossy enamel */}
        <path d={ENAMEL} fill={`url(#${ids.enamel})`} />
        <g clipPath={`url(#${ids.clip})`}>
          <path d={ENAMEL} fill="none" stroke="#000" strokeOpacity="0.38" strokeWidth="4" style={{ filter: "blur(1.2px)" }} transform="translate(0 1)" />
          <ellipse cx="44" cy="22" rx="34" ry="17" fill={`url(#${ids.gloss})`} />
        </g>

        {/* A glint that slides across as the badge turns */}
        <g clipPath={`url(#${ids.outer})`} style={{ mixBlendMode: "overlay" }}>
          <motion.g style={{ x: glareX }}>
            <rect x="30" y="-10" width="28" height="120" fill={`url(#${ids.glare})`} transform="rotate(20 44 50)" />
          </motion.g>
        </g>
      </svg>

      {/* Embossed gold line icon: drop shadow, dark base, polished body, specular edge */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative" style={{ width: size * 0.4, height: size * 0.4 }}>
          <Icon
            className="absolute inset-0 size-full"
            color="rgb(0 0 0 / 0.5)"
            strokeWidth={stroke + 0.6}
            style={{ transform: `translateY(${px * 1.6}px)`, filter: `blur(${px * 0.9}px)` }}
          />
          <Icon className="absolute inset-0 size-full" color="#5c3a0a" strokeWidth={stroke + 0.55} />
          <Icon className="absolute inset-0 size-full" color={`url(#${ids.gold})`} strokeWidth={stroke} style={dim ? { opacity: 0.75 } : undefined} />
          <Icon
            className="absolute inset-0 size-full"
            color="rgb(255 250 228 / 0.8)"
            strokeWidth={stroke * 0.28}
            style={{ transform: `translate(${-px * 0.35}px, ${-px * 0.45}px)` }}
          />
        </div>
      </div>
      {dim && (
        <span
          className="absolute grid place-items-center rounded-full bg-ink-900 ring-1 ring-[#c99640]/70"
          style={{ right: "17%", bottom: "13%", width: size * 0.22, height: size * 0.22 }}
        >
          <Lock style={{ width: size * 0.11, height: size * 0.11 }} color="#e2b453" strokeWidth={2.2} />
        </span>
      )}
    </div>
  );
}

function Back({ enamel: [, mid, lo, deep], caption, size }: { enamel: Metal; caption: string; size: number }) {
  const ids = useIds();
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <GoldDefs ids={ids} />
          <radialGradient id={ids.enamel} cx="0.62" cy="0.3" r="0.9">
            <stop offset="0" stopColor={mid} />
            <stop offset="0.65" stopColor={lo} />
            <stop offset="1" stopColor={deep} />
          </radialGradient>
        </defs>
        <path d={RIM} fill={`url(#${ids.rim})`} />
        <path d={GROOVE} fill="#2b1a04" opacity="0.85" />
        <path d={ENAMEL} fill={`url(#${ids.enamel})`} />
        <path d={hexPath(36)} fill="none" stroke={`url(#${ids.gold})`} strokeWidth="0.9" opacity="0.9" />
      </svg>
      <div className="absolute inset-0 grid place-items-center px-[24%] text-center">
        <span
          className="leading-tight font-bold tracking-[0.16em] uppercase"
          style={{ fontSize: Math.max(7, Math.min(14, size * 0.072)), color: "#f6d98d", textShadow: "0 1px 0 rgb(0 0 0 / 0.45), 0 -0.5px 0 rgb(255 245 210 / 0.5)" }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
}

/**
 * A hexagonal enamel badge with a raised gold rim and an embossed gold icon, built in real 3D:
 * front face, back face and a stack of rim slices between them in one preserve-3d group.
 */
export function Badge3D({
  metal,
  icon,
  size,
  locked = false,
  caption = "",
  rotateX,
  rotateY,
  className,
}: {
  metal: Metal;
  icon: LucideIcon;
  size: number;
  locked?: boolean;
  caption?: string;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  className?: string;
}) {
  const enamel = locked ? LOCKED : metal;
  const thick = Math.max(5, size * 0.06);
  const light = useTransform(rotateY, (v) => Math.sin((v * Math.PI) / 180));
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size, perspective: size * 5 }}>
      <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {Array.from({ length: LAYERS }, (_, i) => {
          const z = -thick / 2 + (thick * (i + 0.5)) / LAYERS;
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                clipPath: RIM_CLIP,
                transform: `translateZ(${z}px) scale(${size / 100})`,
                transformOrigin: "0 0",
                width: 100,
                height: 100,
                background: ["#6f4710", "#8b5c17", "#a8742a", "#8b5c17", "#5e3c0c"][i % 5],
              }}
            />
          );
        })}
        <div className="absolute inset-0" style={{ transform: `translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          <Face enamel={enamel} icon={icon} size={size} light={light} dim={locked} />
        </div>
        <div className="absolute inset-0" style={{ transform: `rotateY(180deg) translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          <Back enamel={enamel} caption={caption} size={size} />
        </div>
      </motion.div>
    </div>
  );
}

/** Idle sway plus a tilt toward the pointer. For badges in a grid. */
export function useTiltBadge(seed = 0) {
  const idle = useMotionValue(0);
  const tx = useSpring(0, { stiffness: 160, damping: 16 });
  const ty = useSpring(0, { stiffness: 160, damping: 16 });
  const rotateY = useTransform([idle, ty], ([a, b]: number[]) => a + b);
  const rotateX = tx;

  useEffect(() => {
    const c = animate(idle, [-16, 16], { duration: 3.4 + (seed % 3) * 0.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: seed * 0.25 });
    return () => c.stop();
  }, [idle, seed]);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ty.set(px * 50);
    tx.set(-py * 40);
  };
  const onPointerLeave = () => {
    tx.set(0);
    ty.set(0);
  };
  return { rotateX, rotateY, onPointerMove, onPointerLeave };
}

/**
 * Drag to spin, with momentum; when let go it keeps turning and settles face-forward.
 * `intro` spins it in on mount.
 */
export function useSpinBadge({ intro = true, idle = true }: { intro?: boolean; idle?: boolean } = {}) {
  const rotateY = useMotionValue(intro ? -720 : 0);
  const rotateX = useSpring(0, { stiffness: 120, damping: 14 });
  const drag = useRef<{ x: number; y: number; t: number; v: number; last: number } | null>(null);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  const settle = (velocity: number) => {
    const v = rotateY.get();
    const ahead = v + velocity * 0.35;
    const target = Math.round(ahead / 360) * 360;
    anim.current?.stop();
    anim.current = animate(rotateY, target, { type: "spring", velocity, stiffness: 40, damping: 11, restDelta: 0.5 });
  };

  useEffect(() => {
    if (intro) {
      anim.current = animate(rotateY, 0, { type: "spring", stiffness: 30, damping: 9, mass: 1.1 });
    }
    // Safety net: if a gesture ended without telling us (it happens on iOS), let go after a
    // quiet second and settle face-forward.
    const watchdog = setInterval(() => {
      const d = drag.current;
      if (d && performance.now() - d.t > 1200) {
        drag.current = null;
        rotateX.set(0);
        settle(0);
      }
    }, 500);
    if (!idle) return () => clearInterval(watchdog);
    // Every few seconds, a lazy full turn so it never looks static.
    const id = setInterval(() => {
      if (drag.current) return;
      const v = Math.round(rotateY.get() / 360) * 360;
      anim.current?.stop();
      anim.current = animate(rotateY, v + 360, { duration: 2.4, ease: [0.65, 0, 0.35, 1] });
    }, 7000);
    return () => {
      clearInterval(id);
      clearInterval(watchdog);
      anim.current?.stop();
    };
    // settle only reads refs and motion values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro, idle, rotateY]);

  // Ends a drag however it ends (lifted finger, cancelled gesture, lost capture) and always
  // settles face-forward, so the badge can never be left stuck edge-on.
  const release = (velocity: number) => {
    if (!drag.current) return;
    drag.current = null;
    rotateX.set(0);
    settle(velocity);
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      anim.current?.stop();
      drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), v: 0, last: e.clientX };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d) return;
      const now = performance.now();
      const dx = e.clientX - d.last;
      rotateY.set(rotateY.get() + dx * 0.9);
      rotateX.set(Math.max(-25, Math.min(25, -(e.clientY - d.y) * 0.25)));
      const dt = Math.max(1, now - d.t);
      d.v = d.v * 0.6 + ((dx * 0.9) / dt) * 1000 * 0.4;
      d.t = now;
      d.last = e.clientX;
    },
    onPointerUp: () => release(drag.current?.v ?? 0),
    onPointerCancel: () => release(0),
    onLostPointerCapture: () => release(drag.current?.v ?? 0),
  };

  return { rotateX, rotateY, handlers, spin: () => settle(1400) };
}
