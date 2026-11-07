"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  siAlgorand,
  siApple,
  siBitcoin,
  siBnbchain,
  siCardano,
  siChainlink,
  siDogecoin,
  siEthereum,
  siGoogle,
  siHedera,
  siLitecoin,
  siMeta,
  siMonero,
  siNear,
  siNetflix,
  siNvidia,
  siPolkadot,
  siSap,
  siSolana,
  siStellar,
  siSui,
  siTesla,
  siTon,
  siXrp,
} from "simple-icons";
import { TrendingDown, TrendingUp, X } from "lucide-react";
import type { LogoSpec } from "@/lib/markets";
import { cn } from "@/lib/utils";

/* Shared bits for the Trade screen and the Crypto page. */

// Named imports only: the whole simple-icons set would bloat the bundle.
const icons: Record<string, { path: string }> = {
  siAlgorand,
  siApple,
  siBitcoin,
  siBnbchain,
  siCardano,
  siChainlink,
  siDogecoin,
  siEthereum,
  siGoogle,
  siHedera,
  siLitecoin,
  siMeta,
  siMonero,
  siNear,
  siNetflix,
  siNvidia,
  siPolkadot,
  siSap,
  siSolana,
  siStellar,
  siSui,
  siTesla,
  siTon,
  siXrp,
};

const AMAZON_SMILE =
  "M2.2 12.9c.2-.3.5-.3.9-.1 2.8 1.6 5.8 2.4 9 2.4 2.4 0 4.7-.5 7-1.4.4-.2.8-.1.9.3.1.3 0 .6-.4.8-2.3 1.3-5 2-7.6 2-3.4 0-6.5-1.2-9.3-3.4-.6-.4-.6-.4-.5-.6Zm17.2-.4c.6-.1 1.9-.2 2.3.3.3.5-.1 1.9-.6 2.9-.1.2-.4.2-.4 0 .2-.7.5-1.8.2-2.1-.3-.3-1.3-.2-1.7-.2-.3 0-.3-.2-.1-.3Z";

export function AssetLogo({ logo, className }: { logo: LogoSpec; className?: string }) {
  let inner: React.ReactNode;
  if ("icon" in logo) {
    const path = icons[logo.icon]?.path;
    inner = (
      <svg viewBox="0 0 24 24" className="size-[52%]" fill={logo.fg} aria-hidden>
        <path d={path} />
      </svg>
    );
  } else if ("custom" in logo) {
    inner =
      logo.custom === "microsoft" ? (
        <svg viewBox="0 0 24 24" className="size-[46%]" aria-hidden>
          <rect x="1" y="1" width="10" height="10" fill="#f25022" />
          <rect x="13" y="1" width="10" height="10" fill="#7fba00" />
          <rect x="1" y="13" width="10" height="10" fill="#00a4ef" />
          <rect x="13" y="13" width="10" height="10" fill="#ffb900" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-[60%]" fill={logo.fg} aria-hidden>
          <path d={AMAZON_SMILE} />
        </svg>
      );
  } else {
    inner = (
      <span className="font-bold tracking-tight" style={{ color: logo.fg, fontSize: logo.text.length > 2 ? "0.62em" : "0.95em" }}>
        {logo.text}
      </span>
    );
  }
  return (
    <span
      className={cn("grid size-11 shrink-0 place-items-center rounded-full text-[15px] ring-1 ring-white/10", className)}
      style={{ background: logo.bg }}
    >
      {inner}
    </span>
  );
}

export function Change({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 tabular", up ? "text-positive" : "text-negative", className)}>
      <Icon className="size-[1.05em]" strokeWidth={2.2} />
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

/** A tiny line, no axes. */
export function Sparkline({ points, up, className }: { points: number[]; up: boolean; className?: string }) {
  const d = useMemo(() => linePath(points, 100, 32), [points]);
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-8 w-20", className)} aria-hidden>
      <path d={d} fill="none" stroke={up ? "var(--color-positive)" : "var(--color-negative)"} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function scale(points: number[], w: number, h: number, pad = 2) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points.map((p, i) => [(i / (points.length - 1)) * w, pad + (1 - (p - min) / span) * (h - pad * 2)] as const);
}

function linePath(points: number[], w: number, h: number) {
  return scale(points, w, h)
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

/**
 * Area chart you can scrub with a finger or the mouse. Calls `onScrub` with the index under the
 * pointer, and null when it leaves.
 */
export function AreaChart({
  points,
  color,
  onScrub,
  className,
}: {
  points: number[];
  color: string;
  onScrub?: (i: number | null) => void;
  className?: string;
}) {
  const id = useId();
  const W = 400;
  const H = 160;
  const xy = useMemo(() => scale(points, W, H, 10), [points]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const [hover, setHover] = useState<number | null>(null);

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (points.length - 1));
    setHover(i);
    onScrub?.(i);
  };
  const leave = () => {
    setHover(null);
    onScrub?.(null);
  };
  const dot = xy[hover ?? xy.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-44 w-full touch-pan-y select-none sm:h-52", className)}
      onPointerMove={pick}
      onPointerDown={pick}
      onPointerLeave={leave}
      onPointerUp={(e) => e.pointerType !== "mouse" && leave()}
      onPointerCancel={leave}
    >
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}a)`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {hover !== null && <line x1={dot[0]} x2={dot[0]} y1="0" y2={H} stroke="white" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />}
      <circle cx={dot[0]} cy={dot[1]} r="4" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A light bottom sheet on phones and a centred card on desktop. No scroll lock or blur, so it opens instantly. */
/**
 * The part of the screen the viewer can actually see. On phones the on-screen keyboard covers the
 * bottom of the page without resizing it, so a bottom sheet pinned to the visual viewport rides
 * up above the keyboard instead of hiding behind it.
 */
function useVisibleArea(active: boolean) {
  const [area, setArea] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setArea({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return area;
}

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const area = useVisibleArea(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-x-0 top-0 z-50 flex h-dvh items-end justify-center bg-black/70 sm:items-center sm:p-4"
      style={area ? { top: area.top, height: area.height } : undefined}
      onClick={onClose}
    >
      <div
        ref={panel}
        onClick={(e) => e.stopPropagation()}
        className="sheet-pop relative max-h-[calc(100%-12px)] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border border-hairline bg-ink-850 px-5 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.8)] sm:max-w-[440px] sm:rounded-[28px] sm:px-6"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="focus-ring absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/[0.07] text-fog transition-colors hover:text-white"
        >
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Amount chips plus a big primary button. */
export function AmountPicker({
  amounts,
  value,
  onChange,
}: {
  amounts: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {amounts.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={cn(
            "focus-ring rounded-full py-2.5 text-[14px] tabular ring-1 transition-colors",
            value === a ? "bg-electric/20 text-white ring-electric/50" : "bg-white/[0.04] text-fog ring-white/[0.08] hover:text-white",
          )}
        >
          €{a}
        </button>
      ))}
    </div>
  );
}

export const primaryButton =
  "focus-ring flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[radial-gradient(circle_at_30%_25%,#4c97ff,#1f7bff_55%,#1660d6)] text-[16px] font-semibold text-white shadow-[0_12px_32px_-10px_rgb(31_123_255/0.9),inset_0_1px_0_rgb(255_255_255/0.3)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-50";
