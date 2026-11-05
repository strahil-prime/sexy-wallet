"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Four stops from highlight to deep shadow: the whole metal look comes from these. */
export type Metal = [string, string, string, string];

export const metals = {
  gold: ["#fff3c8", "#f5c76a", "#b4832b", "#5e3f0c"],
  emerald: ["#dbffef", "#3ee39a", "#139162", "#073f2a"],
  violet: ["#f1e9ff", "#a98bff", "#6844de", "#26145f"],
  copper: ["#ffe4cf", "#ff9a5b", "#c2541f", "#521d06"],
  ice: ["#e9feff", "#6ef2ff", "#1b9fb8", "#083c48"],
  rose: ["#ffe6ee", "#ff92b2", "#c84b72", "#4d1428"],
  platinum: ["#ffffff", "#d3dbe1", "#8796a1", "#2f3a43"],
  cobalt: ["#dfeaff", "#5b9dff", "#1452c4", "#08214f"],
} satisfies Record<string, Metal>;

export type Shape = "circle" | "hex" | "shield";

const clips: Record<Shape, string> = {
  circle: "circle(50% at 50% 50%)",
  hex: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
  shield: "polygon(50% 0%, 96% 14%, 92% 58%, 50% 100%, 8% 58%, 4% 14%)",
};

const LAYERS = 9;

type FaceProps = {
  metal: Metal;
  shape: Shape;
  icon: LucideIcon;
  locked?: boolean;
  /** -1..1, how far the light has moved across the face */
  light: MotionValue<number>;
};

function shapeStyle(shape: Shape): React.CSSProperties {
  // Circles use a radius: Chrome can drop a circle() clip on layers it promotes for 3D.
  return shape === "circle" ? { borderRadius: "50%", overflow: "hidden" } : { clipPath: clips[shape] };
}

function Face({ metal: [hi, mid, lo, deep], shape, icon: Icon, locked, light }: FaceProps) {
  const sheenX = useTransform(light, [-1, 1], ["-30%", "130%"]);
  const glare = useMotionTemplate`linear-gradient(115deg, transparent 20%, rgb(255 255 255 / 0.0) ${useTransform(light, [-1, 1], [10, 70])}%, rgb(255 255 255 / 0.75) ${useTransform(light, [-1, 1], [25, 85])}%, transparent ${useTransform(light, [-1, 1], [40, 100])}%)`;
  const holo = useTransform(light, [-1, 1], [0, 220]);
  const holoBg = useMotionTemplate`conic-gradient(from ${holo}deg at 50% 50%, #ff7ad9, #7af0ff, #b0ff7a, #ffe27a, #ff7ad9)`;
  return (
    <div className="absolute inset-0" style={shapeStyle(shape)}>
      {/* Brushed metal */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 30% 18%, ${hi} 0%, transparent 46%), conic-gradient(from 200deg, ${mid}, ${hi}, ${lo}, ${mid}, ${hi}, ${lo}, ${mid})`,
        }}
      />
      {/* Bevel: an inner plate cut slightly lower than the rim */}
      <div
        className="absolute inset-[11%]"
        style={{
          ...shapeStyle(shape),
          background: `radial-gradient(100% 100% at 70% 85%, ${hi} 0%, transparent 40%), linear-gradient(160deg, ${lo}, ${mid} 45%, ${lo} 75%, ${deep})`,
          boxShadow: `inset 0 2px 6px ${deep}, inset 0 -2px 4px ${hi}`,
        }}
      />
      <div className="absolute inset-[15%]" style={{ ...shapeStyle(shape), background: `radial-gradient(90% 80% at 35% 25%, ${hi}, ${mid} 40%, ${lo} 85%)` }} />
      {/* Embossed symbol */}
      <div className="absolute inset-0 grid place-items-center">
        {locked ? (
          <Lock className="size-[30%]" style={{ color: deep, filter: `drop-shadow(0 1px 0 ${hi}) drop-shadow(0 -1px 0 rgb(0 0 0 / 0.35))` }} strokeWidth={2.2} />
        ) : (
          <Icon className="size-[38%]" style={{ color: deep, filter: `drop-shadow(0 1.5px 0 ${hi}) drop-shadow(0 -1px 0 rgb(0 0 0 / 0.4))` }} strokeWidth={2.1} />
        )}
      </div>
      {/* Holographic film and a moving glare */}
      <motion.div className="absolute inset-0 opacity-[0.18] mix-blend-color-dodge" style={{ background: holoBg }} />
      <motion.div className="absolute inset-0 mix-blend-overlay" style={{ background: glare }} />
      <motion.div
        className="absolute inset-y-0 w-[45%] -skew-x-12 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.55),transparent)] mix-blend-soft-light"
        style={{ left: sheenX }}
      />
    </div>
  );
}

function Back({ metal: [hi, mid, lo, deep], shape, caption }: { metal: Metal; shape: Shape; caption: string }) {
  return (
    <div className="absolute inset-0" style={shapeStyle(shape)}>
      <div className="absolute inset-0" style={{ background: `conic-gradient(from 20deg, ${mid}, ${lo}, ${hi}, ${mid}, ${lo}, ${hi}, ${mid})` }} />
      <div className="absolute inset-[12%]" style={{ ...shapeStyle(shape), background: `linear-gradient(200deg, ${hi}, ${mid} 50%, ${lo})` }} />
      <div className="absolute inset-0 grid place-items-center px-[22%] text-center">
        <span
          className="text-[clamp(7px,0.075em,14px)] leading-tight font-bold tracking-[0.18em] uppercase"
          style={{ color: deep, textShadow: `0 1px 0 ${hi}` }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
}

/**
 * A metal badge with real thickness: a front face, a back face and a stack of rim slices
 * between them, all in one preserve-3d group. Light and holo film follow the rotation.
 */
export function Badge3D({
  metal,
  shape = "circle",
  icon,
  size,
  locked = false,
  caption = "",
  rotateX,
  rotateY,
  className,
}: {
  metal: Metal;
  shape?: Shape;
  icon: LucideIcon;
  size: number;
  locked?: boolean;
  caption?: string;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  className?: string;
}) {
  const m: Metal = locked ? ["#7b8790", "#4a565f", "#2a333a", "#11181d"] : metal;
  const thick = Math.max(6, size * 0.075);
  const light = useTransform(rotateY, (v) => Math.sin((v * Math.PI) / 180));
  // the em size lets the back caption scale with the badge
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size, perspective: size * 5, fontSize: size }}>
      <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {Array.from({ length: LAYERS }, (_, i) => {
          const z = -thick / 2 + (thick * (i + 0.5)) / LAYERS;
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                ...shapeStyle(shape),
                transform: `translateZ(${z}px)`,
                background: `linear-gradient(160deg, ${m[2]}, ${m[3]} 60%, ${m[2]})`,
              }}
            />
          );
        })}
        <div className="absolute inset-0" style={{ transform: `translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          <Face metal={m} shape={shape} icon={icon} locked={locked} light={light} />
        </div>
        <div className="absolute inset-0" style={{ transform: `rotateY(180deg) translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          <Back metal={m} shape={shape} caption={caption} />
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
    if (!idle) return;
    // Every few seconds, a lazy full turn so it never looks static.
    const id = setInterval(() => {
      if (drag.current) return;
      const v = Math.round(rotateY.get() / 360) * 360;
      anim.current?.stop();
      anim.current = animate(rotateY, v + 360, { duration: 2.4, ease: [0.65, 0, 0.35, 1] });
    }, 7000);
    return () => {
      clearInterval(id);
      anim.current?.stop();
    };
  }, [intro, idle, rotateY]);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
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
    onPointerUp: () => {
      const d = drag.current;
      drag.current = null;
      rotateX.set(0);
      settle(d?.v ?? 0);
    },
    onPointerCancel: () => {
      drag.current = null;
      rotateX.set(0);
      settle(0);
    },
  };

  return { rotateX, rotateY, handlers, spin: () => settle(1400) };
}
