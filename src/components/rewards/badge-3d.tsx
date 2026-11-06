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
  onyx: ["#4a4a4a", "#2c2c2c", "#1a1a1a", "#0b0b0b"],
} satisfies Record<string, Metal>;

const LOCKED: Metal = ["#9aa6ae", "#56636c", "#323d45", "#141b20"];

const LAYERS = 6;

/* ── The hexagon ─────────────────────────────────────── */

/** A pointy-top regular polygon (6 = hexagon, 4 = diamond) with softly rounded corners, centred in a 100×100 box. */
function polyPath(n: number, R: number, round = 0.16) {
  const v = Array.from({ length: n }, (_, i) => {
    const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
    return [50 + R * Math.cos(a), 50 + R * Math.sin(a)];
  });
  const lerp = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const f = (n: number) => n.toFixed(2);
  let d = "";
  for (let i = 0; i < n; i++) {
    const cur = v[i];
    const prev = v[(i + n - 1) % n];
    const next = v[(i + 1) % n];
    const a = lerp(cur, prev, round);
    const b = lerp(cur, next, round);
    d += `${i ? "L" : "M"}${f(a[0])} ${f(a[1])} Q${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])} `;
  }
  return `${d}Z`;
}

function hexPath(R: number, round = 0.16) {
  return polyPath(6, R, round);
}

type ShapeFn = (R: number, round: number) => string;

const RIM = hexPath(48, 0.07);
const RIM_IN = hexPath(45.6, 0.07);
const GROOVE = hexPath(44.6, 0.07);
const ENAMEL = hexPath(44, 0.07);


function useIds() {
  const base = useId().replace(/:/g, "");
  return { rim: `${base}r`, rimIn: `${base}i`, gold: `${base}g`, enamel: `${base}e`, shade: `${base}s`, clip: `${base}c` };
}

/** Brushed brass gold with hard stops, so edges read crisp rather than soft. */
function GoldDefs({ ids }: { ids: ReturnType<typeof useIds> }) {
  return (
    <>
      <linearGradient id={ids.rim} gradientUnits="userSpaceOnUse" x1="14" y1="4" x2="86" y2="96">
        <stop offset="0" stopColor="#fbf0c2" />
        <stop offset="0.3" stopColor="#d8bd6c" />
        <stop offset="0.3" stopColor="#b8984a" />
        <stop offset="0.62" stopColor="#8a6d2c" />
        <stop offset="0.62" stopColor="#c7a957" />
        <stop offset="1" stopColor="#6e5420" />
      </linearGradient>
      <linearGradient id={ids.rimIn} gradientUnits="userSpaceOnUse" x1="86" y1="96" x2="14" y2="4">
        <stop offset="0" stopColor="#f4e2a0" />
        <stop offset="0.5" stopColor="#a8893f" />
        <stop offset="1" stopColor="#5e4718" />
      </linearGradient>
      <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6e7ad" />
        <stop offset="0.45" stopColor="#d2b462" />
        <stop offset="0.45" stopColor="#b8984a" />
        <stop offset="1" stopColor="#8c6f2e" />
      </linearGradient>
    </>
  );
}

/* ── Faces ───────────────────────────────────────────── */

/**
 * The front: crisp brass rim with a bevelled inner edge, matte enamel lit softly from the top,
 * and a gold line icon raised off the enamel. No gloss, no blur, so it stays cheap to draw.
 */
export function Face({ enamel: [hi, mid, lo, deep], icon: Icon, size, dim }: { enamel: Metal; icon: LucideIcon; size: number; dim?: boolean }) {
  const ids = useIds();
  const px = size / 100; // one unit of the 100-box in pixels
  const stroke = Math.max(1.5, Math.min(1.9, 160 / size));
  const iconProps = { strokeLinecap: "square" as const, strokeLinejoin: "miter" as const, className: "absolute inset-0 size-full" };
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <GoldDefs ids={ids} />
          {/* Matte enamel: an even field, a touch lighter at the top, never shiny */}
          <linearGradient id={ids.enamel} x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0" stopColor={mix(hi, mid)} />
            <stop offset="0.45" stopColor={mid} />
            <stop offset="1" stopColor={mix(mid, lo)} />
          </linearGradient>
          <clipPath id={ids.clip}>
            <path d={ENAMEL} />
          </clipPath>
        </defs>

        {/* Rim: outer gold band, a hard bevel line, then a thin dark seat for the enamel */}
        <path d={RIM} fill={`url(#${ids.rim})`} />
        <path d={RIM_IN} fill={`url(#${ids.rimIn})`} />
        <path d={GROOVE} fill={deep} />
        <path d={ENAMEL} fill={`url(#${ids.enamel})`} />
        {/* Soft shade where the enamel meets the rim, like the reference's gentle edge falloff */}
        <g clipPath={`url(#${ids.clip})`}>
          <path d={ENAMEL} fill="none" stroke={deep} strokeOpacity="0.35" strokeWidth="5" />
          <path d={ENAMEL} fill="none" stroke={deep} strokeOpacity="0.25" strokeWidth="2.2" transform="translate(0 0.8)" />
        </g>
      </svg>

      {/* Raised gold line icon: hard shadow, dark base, gold body, crisp top edge */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative" style={{ width: size * 0.42, height: size * 0.42, opacity: dim ? 0.8 : 1 }}>
          <Icon {...iconProps} color={deep} strokeOpacity={0.7} strokeWidth={stroke + 0.5} style={{ transform: `translate(${px * 0.5}px, ${px * 1.1}px)` }} />
          <Icon {...iconProps} color="#4f3a10" strokeWidth={stroke + 0.45} />
          <Icon {...iconProps} color={`url(#${ids.gold})`} strokeWidth={stroke} />
          <Icon
            {...iconProps}
            color="rgb(255 246 214 / 0.7)"
            strokeWidth={stroke * 0.22}
            style={{ transform: `translate(${-px * 0.3}px, ${-px * 0.4}px)` }}
          />
        </div>
      </div>
      {dim && (
        <span
          className="absolute grid place-items-center rounded-full bg-ink-900 ring-1 ring-[#b8984a]/80"
          style={{ right: "17%", bottom: "13%", width: size * 0.22, height: size * 0.22 }}
        >
          <Lock style={{ width: size * 0.11, height: size * 0.11 }} color="#d2b462" strokeWidth={2.2} />
        </span>
      )}
    </div>
  );
}

/** Average of two hex colours, for gentle steps in the enamel. */
function mix(a: string, b: string) {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round((v + y[i]) / 2).toString(16).padStart(2, "0")).join("")}`;
}

/** A still, flat badge for grids: same look as the 3D one, a fraction of the work to draw. */
export function BadgeStatic({
  metal,
  icon,
  size,
  locked = false,
  shadow = true,
  art,
  className,
}: {
  metal: Metal;
  icon: LucideIcon;
  size: number;
  locked?: boolean;
  shadow?: boolean;
  /** Finished badge artwork; replaces the drawn face. */
  art?: BadgeArt;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size, filter: shadow ? "drop-shadow(0 6px 8px rgb(0 0 0 / 0.45))" : undefined }}>
      {art ? <ArtImg src={artSrc(art)} /> : <Face enamel={locked ? LOCKED : metal} icon={icon} size={size} dim={locked} />}
    </div>
  );
}

function Back({ enamel: [, mid, lo, deep], caption, size, round = 0.07, shape = hexPath }: { enamel: Metal; caption: string; size: number; round?: number; shape?: ShapeFn }) {
  const ids = useIds();
  const [rim, rimIn, groove, field, inner] = [48, 45.6, 44.6, 44, 36].map((r) => shape(r, round));
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <GoldDefs ids={ids} />
          <linearGradient id={ids.enamel} x1="0.7" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={mix(mid, lo)} />
            <stop offset="1" stopColor={lo} />
          </linearGradient>
        </defs>
        <path d={rim} fill={`url(#${ids.rim})`} />
        <path d={rimIn} fill={`url(#${ids.rimIn})`} />
        <path d={groove} fill={deep} />
        <path d={field} fill={`url(#${ids.enamel})`} />
        <path d={inner} fill="none" stroke={`url(#${ids.gold})`} strokeWidth="0.9" opacity="0.9" />
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
  art,
  rotateX,
  rotateY,
  className,
}: {
  metal: Metal;
  icon: LucideIcon;
  size: number;
  locked?: boolean;
  caption?: string;
  /** Finished badge artwork (front, back plate and edge silhouettes); replaces the drawn badge. */
  art?: BadgeArt;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  className?: string;
}) {
  const enamel = locked ? LOCKED : metal;
  const thick = Math.max(5, size * 0.06);
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size, perspective: size * 5 }}>
      <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {/* Rim slices are plain filled SVGs: WebKit is far quicker with these than with
            clip-path masks on 3D layers. */}
        {Array.from({ length: LAYERS }, (_, i) => {
          const z = -thick / 2 + (thick * (i + 0.5)) / LAYERS;
          return art ? (
            <div key={i} className="absolute inset-0" style={{ transform: `translateZ(${z}px)` }} aria-hidden>
              <ArtImg src={artSrc(art, `-edge${i % 2}`)} />
            </div>
          ) : (
            <svg key={i} viewBox="0 0 100 100" className="absolute inset-0 size-full" style={{ transform: `translateZ(${z}px)` }} aria-hidden>
              <path d={RIM} fill={["#6f4710", "#8b5c17", "#a8742a", "#8b5c17", "#5e3c0c", "#7a5013"][i % 6]} />
            </svg>
          );
        })}
        <div className="absolute inset-0" style={{ transform: `translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          {art ? <ArtImg src={artSrc(art)} /> : <Face enamel={enamel} icon={icon} size={size} dim={locked} />}
        </div>
        <div className="absolute inset-0" style={{ transform: `rotateY(180deg) translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          {art ? <ArtBack art={art} caption={caption} size={size} /> : <Back enamel={enamel} caption={caption} size={size} />}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Artwork badges ──────────────────────────────────────
   Each piece of art ships as a transparent cut-out plus a back plate and two edge silhouettes in
   the same shape (made from the cut-out), all 600px squares in /rewards/badges. Plain images are
   the cheapest thing for iOS to draw, on the flat grid and in 3D. */

export type BadgeArt = {
  slug: string;
  /** Caption colour on the back plate. */
  ink: string;
  /** Where the caption sits on the back, as CSS insets (the shapes differ). */
  box?: string;
};

const artSrc = (art: BadgeArt, suffix = "") => `/rewards/badges/${art.slug}${suffix}.webp`;

function ArtImg({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" draggable={false} decoding="async" className="pointer-events-none absolute inset-0 size-full select-none" />;
}

function ArtBack({ art, caption, size }: { art: BadgeArt; caption: string; size: number }) {
  return (
    <div className="absolute inset-0">
      <ArtImg src={artSrc(art, "-back")} />
      <div className="absolute grid place-items-center text-center" style={{ inset: art.box ?? "22%" }}>
        <span
          className="leading-[1.25] font-bold tracking-[0.12em] uppercase"
          style={{ fontSize: Math.max(7, Math.min(13, size * 0.056)), color: art.ink, textShadow: "0 1px 0 rgb(0 0 0 / 0.55)" }}
        >
          {caption}
        </span>
      </div>
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
