"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { Snowflake, Wifi } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { VisaMark } from "@/components/brand/visa";
import type { WalletCard } from "@/lib/data";
import { cn } from "@/lib/utils";

const finishes: Record<WalletCard["finish"], string> = {
  aurora:
    "bg-[linear-gradient(118deg,#0b1922_0%,#0d2230_34%,#0f5d7a_52%,#1f7bff_63%,#53c6ff_70%,#7c5cff_82%,#2a1f5c_100%)]",
  obsidian:
    "bg-[linear-gradient(135deg,#1a1d22_0%,#0b0d10_45%,#20242b_60%,#0a0b0d_100%)]",
};

export function Chip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 46 34" className={cn("h-[34px] w-[46px]", className)} aria-hidden>
      <defs>
        <linearGradient id="chip-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9dee2" />
          <stop offset="0.5" stopColor="#8b959c" />
          <stop offset="1" stopColor="#c7cdd2" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="45" height="33" rx="7" fill="url(#chip-g)" />
      <g fill="none" stroke="#5b656c" strokeWidth="1.1" opacity="0.85">
        <path d="M0.5 11.5H14M0.5 22.5H14M32 11.5H45.5M32 22.5H45.5" />
        <rect x="14" y="7" width="18" height="20" rx="4" />
        <path d="M23 0.5V7M23 27V33.5" />
      </g>
    </svg>
  );
}

type Props = {
  card: WalletCard;
  frozen?: boolean;
  flipped?: boolean;
  /** show full number/cvv on the back */
  revealed?: boolean;
  /** rendered over the masked values while revealing (GSAP scramble target ids) */
  interactive?: boolean;
  className?: string;
  backSlot?: React.ReactNode;
};

/**
 * Payment card with pointer tilt, holographic sheen, flip and freeze states.
 */
export function PaymentCard({ card, frozen, flipped, interactive = true, className, backSlot }: Props) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 180, damping: 18 });
  const sheenX = useTransform(mx, (v) => `${v * 100}%`);
  const sheenY = useTransform(my, (v) => `${v * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgb(255 255 255 / 0.28), transparent 45%)`;
  const holo = useMotionTemplate`linear-gradient(${useTransform(mx, [0, 1], [100, 160])}deg, transparent 20%, rgb(94 240 255 / 0.18) 40%, rgb(124 92 255 / 0.2) 50%, rgb(255 120 200 / 0.12) 58%, transparent 75%)`;

  return (
    <div
      className={cn("@container relative aspect-[1.586] w-full [perspective:1400px]", className)}
      onPointerMove={(e) => {
        if (!interactive) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
    >
      <motion.div className="relative size-full [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry }}>
        <motion.div
          className="relative size-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, mass: 1.1 }}
        >
          {/* Front */}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[18px] ring-1 ring-white/20 [backface-visibility:hidden]",
              "shadow-[0_30px_60px_-25px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.04)_inset]",
              finishes[card.finish],
            )}
          >
            {card.finish === "obsidian" && (
              <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(90deg,transparent_0_2px,rgb(255_255_255/0.025)_2px_3px)]" />
            )}
            <motion.div className="absolute inset-0 mix-blend-color-dodge" style={{ background: holo }} />
            <motion.div className="absolute inset-0" style={{ background: sheen }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255/0.08),transparent_40%)]" />

            <div className="relative flex h-full flex-col justify-between p-[7%]">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase">{card.name}</span>
                <Logo className="-mt-1 -mr-1 h-auto w-[18%] text-ink-950/90 drop-shadow-[0_1px_0_rgb(255_255_255/0.25)]" />
              </div>
              <div className="flex items-center gap-3">
                <Chip className="h-auto w-[15%]" />
                <Wifi className="size-5 rotate-90 text-white/60" strokeWidth={1.6} />
              </div>
              <div className="flex items-end justify-between">
                <span className="font-mono text-[clamp(13px,4.5cqw,19px)] tracking-[0.12em] text-white/90 tabular">
                  •• •• {card.last4}
                </span>
                <VisaMark className="h-[clamp(14px,4.2cqw,22px)] text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.4)]" />
              </div>
            </div>
          </div>

          {/* Back */}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[18px] ring-1 ring-white/20 [backface-visibility:hidden] [transform:rotateY(180deg)]",
              finishes[card.finish],
            )}
          >
            <div className="absolute inset-0 bg-ink-950/45" />
            <div className="absolute inset-x-0 top-[13%] h-[17%] bg-black/85" />
            <div className="relative flex h-full flex-col justify-end p-[7%]">{backSlot}</div>
          </div>
        </motion.div>

        {/* Frozen overlay */}
        <AnimatePresence>
          {frozen && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(5px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 grid place-items-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,rgb(200_240_255/0.35),rgb(120_200_255/0.15)_40%,rgb(220_250_255/0.3))] ring-1 ring-white/40 [transform:translateZ(1px)]"
            >
              <div className="absolute inset-0 opacity-50 mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
              <motion.div
                initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                className="relative flex flex-col items-center gap-1.5 text-white"
              >
                <span className="grid size-12 place-items-center rounded-full bg-white/25 ring-1 ring-white/50 backdrop-blur">
                  <Snowflake className="size-6" strokeWidth={1.8} />
                </span>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase drop-shadow">Frozen</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
