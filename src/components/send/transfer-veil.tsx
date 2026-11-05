"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * The "Transferring money" moment that sits over the Review step after Hold to send.
 *
 * 1. build: the card blurs, a colourful glow rises from the bottom with sparks drifting up,
 *    while the status line cycles.
 * 2. flood: the glow surges up and fills the whole card. `onCovered` fires once it is
 *    fully covered so the parent can swap in the result underneath.
 * 3. lift: the colour sweeps up and away, revealing the "Money sent" card.
 */

type Phase = "build" | "flood" | "lift";

const ease = [0.16, 1, 0.3, 1] as const;
const labels = [
  "Transferring money…",
  "Verifying recipient…",
  "Securing your transfer…",
];

const blobs = [
  {
    color: "#ff4fd8",
    left: "-18%",
    bottom: "-30%",
    w: "78%",
    dx: 14,
    dur: 5.2,
    o: 0.9,
  },
  {
    color: "#7c5cff",
    left: "42%",
    bottom: "-22%",
    w: "72%",
    dx: -12,
    dur: 6.1,
    o: 0.95,
  },
  {
    color: "#1f7bff",
    left: "14%",
    bottom: "-12%",
    w: "64%",
    dx: 10,
    dur: 4.6,
    o: 0.85,
  },
  {
    color: "#2ad1e6",
    left: "68%",
    bottom: "-34%",
    w: "56%",
    dx: -16,
    dur: 5.6,
    o: 0.85,
  },
  {
    color: "#ffb35c",
    left: "30%",
    bottom: "-38%",
    w: "42%",
    dx: 18,
    dur: 4.2,
    o: 0.95,
  },
];

export function TransferVeil({
  onCovered,
  onDone,
}: {
  onCovered: () => void;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("build");
  const [label, setLabel] = useState(0);
  const phaseRef = useRef<Phase>("build");
  phaseRef.current = phase;
  const cbs = useRef({ onCovered, onDone });
  cbs.current = { onCovered, onDone };

  useEffect(() => {
    const t = reduce
      ? { l1: 500, l2: 900, flood: 1100, cover: 1400, lift: 1700, done: 2500 }
      : {
          l1: 1150,
          l2: 2100,
          flood: 2750,
          cover: 3350,
          lift: 3800,
          done: 5000,
        };
    const timers = [
      setTimeout(() => setLabel(1), t.l1),
      setTimeout(() => setLabel(2), t.l2),
      setTimeout(() => setPhase("flood"), t.flood),
      setTimeout(() => cbs.current.onCovered(), t.cover),
      setTimeout(() => setPhase("lift"), t.lift),
      setTimeout(() => cbs.current.onDone(), t.done),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const lifting = phase === "lift";

  return (
    <div
      className="absolute inset-0 z-30 overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Frosted wash over the review card. It sits outside the masked layer because a mask
          on an ancestor stops backdrop blur from reaching the card underneath. */}
      <motion.div
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[10px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: lifting ? 0 : 1 }}
        transition={
          lifting
            ? { duration: 0.75, delay: 0.25, ease: "easeIn" }
            : { duration: 0.45, ease }
        }
      />

      {/* The lift: a soft edge sweeps from the bottom to the top, clearing the colour as it goes. */}
      <motion.div
        className="absolute inset-0"
        style={
          {
            maskImage:
              "linear-gradient(to top, transparent calc(var(--lift) - 35%), #000 var(--lift))",
            WebkitMaskImage:
              "linear-gradient(to top, transparent calc(var(--lift) - 35%), #000 var(--lift))",
          } as React.CSSProperties
        }
        initial={{ "--lift": "0%" } as never}
        animate={{ "--lift": lifting ? "140%" : "0%" } as never}
        transition={{ duration: 1.05, ease: [0.55, 0, 0.25, 1] }}
      >
        {/* Rising colour */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{
            maskImage:
              "linear-gradient(to top, #000 0%, #000 42%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, #000 0%, #000 42%, transparent 100%)",
          }}
          initial={{ height: "0%", y: "0%", opacity: 1 }}
          animate={
            phase === "build"
              ? { height: "58%", transition: { duration: 1.5, ease } }
              : phase === "flood"
                ? {
                    height: "185%",
                    transition: { duration: 0.75, ease: [0.55, 0, 0.35, 1] },
                  }
                : { height: "185%" }
          }
        >
          {/* Fills the card solid during the flood */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #ff4fd8 0%, #8a5cff 30%, #3f7bff 55%, #2ad1e6 85%)",
              mixBlendMode: "screen",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "build" ? 0 : 0.75 }}
            transition={{ duration: 0.6, ease }}
          />
          {blobs.map((b, i) => (
            <motion.span
              key={i}
              className="absolute aspect-square rounded-full"
              style={{
                left: b.left,
                bottom: b.bottom,
                width: b.w,
                opacity: b.o,
                background: `radial-gradient(circle at 50% 50%, ${b.color} 0%, ${b.color}cc 22%, transparent 66%)`,
                filter: "blur(28px)",
                mixBlendMode: "screen",
              }}
              animate={
                reduce
                  ? undefined
                  : { x: [`${-b.dx}%`, `${b.dx}%`], scale: [1, 1.18, 0.96] }
              }
              transition={{
                duration: b.dur,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        <Sparks phaseRef={phaseRef} reduce={!!reduce} />

        {/* Status line */}
        <motion.div
          className="absolute inset-x-0 top-[38%] flex items-center justify-center gap-2.5 px-6 lg:top-[42%]"
          initial={{ opacity: 0, y: 6 }}
          animate={
            phase === "build" ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }
          }
          transition={{
            duration: 0.4,
            ease,
            delay: phase === "build" ? 0.2 : 0,
          }}
        >
          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={label}
              className="text-[15.5px] font-medium text-white/90"
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease }}
            >
              {labels[label]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* Sparks: tiny glints that drift up out of the glow, faster and denser during the flood. */
function Sparks({
  phaseRef,
  reduce,
}: {
  phaseRef: React.RefObject<Phase>;
  reduce: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || reduce) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      life: number;
      age: number;
      tw: number;
      c: string;
    };
    const colors = [
      "255,255,255",
      "255,255,255",
      "255,255,255",
      "190,245,255",
      "255,200,240",
      "255,226,180",
    ];
    const ps: P[] = [];
    let last = performance.now();
    let carry = 0;
    let fade = 1;
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const phase = phaseRef.current;
      const flood = phase === "flood";
      if (phase === "lift") fade = Math.max(0, fade - dt * 1.6);

      // Spawn
      if (phase !== "lift") {
        carry += dt * (flood ? 140 : 46) * Math.max(1, w / 500);
        while (carry >= 1) {
          carry -= 1;
          const speed = flood
            ? 160 + Math.random() * 240
            : 22 + Math.random() * 52;
          ps.push({
            x: Math.random() * w,
            y: h - Math.random() * h * (flood ? 0.5 : 0.16),
            vx: (Math.random() - 0.5) * 14,
            vy: -speed,
            r: 0.5 + Math.random() * 1.3,
            life: 1.4 + Math.random() * 1.8,
            age: 0,
            tw: Math.random() * Math.PI * 2,
            c: colors[(Math.random() * colors.length) | 0],
          });
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.age += dt;
        p.x += p.vx * dt + Math.sin(p.tw + p.age * 2) * 0.25;
        p.y += p.vy * dt;
        const ceiling = flood ? -20 : h * 0.4;
        if (p.age > p.life || p.y < ceiling) {
          ps.splice(i, 1);
          continue;
        }
        const lifeA = Math.min(1, p.age * 4) * (1 - p.age / p.life);
        const heightA = flood ? 1 : Math.min(1, (p.y - ceiling) / (h * 0.25));
        const twinkle = 0.55 + 0.45 * Math.sin(p.tw + p.age * 9);
        const a = lifeA * heightA * twinkle * fade;
        if (a <= 0.01) continue;
        ctx.fillStyle = `rgba(${p.c},${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.r > 1.2) {
          ctx.fillStyle = `rgba(${p.c},${a * 0.25})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (fade > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phaseRef, reduce]);

  return (
    <canvas
      ref={canvas}
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden
    />
  );
}
