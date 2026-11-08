"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, CircleCheck, Cpu, ShieldCheck, ShoppingBag, TriangleAlert } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { coinFacts, coins, cryptoPicks, money, walk, type Coin } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { AreaChart, AssetLogo, Change } from "./kit";

export const ranges = [
  { id: "1D", label: "24H", n: 36, mult: 1, vol: 0.0035 },
  { id: "1W", label: "1W", n: 42, mult: 2.6, vol: 0.016 },
  { id: "1M", label: "1M", n: 31, mult: 5, vol: 0.03 },
  { id: "1Y", label: "1Y", n: 52, mult: 18, vol: 0.07 },
] as const;

const SWING_WORDS = ["", "Very low", "Low", "Moderate", "Medium", "High", "Very high", "Extreme"];

/**
 * A live price that never clips: plain text that briefly tints green or red when it ticks.
 * (Rolling digits overflowed their line on iOS at large sizes.)
 */
export function LivePrice({ value, className }: { value: number; className?: string }) {
  const prev = useRef(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (value === prev.current) return;
    setDir(value > prev.current ? "up" : "down");
    prev.current = value;
    const t = setTimeout(() => setDir(null), 450);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span className={cn("tabular transition-colors duration-500", dir === "up" ? "text-[#bff5da]" : dir === "down" ? "text-[#ffc9cf]" : "text-white", className)}>
      {money(value)}
    </span>
  );
}

/** Four hand-picked coins, each with a live chart, a plain-words read and the honest risks. */
export function CryptoTopPicks({ prices, onBuy }: { prices: Record<string, number>; onBuy: (c: Coin) => void }) {
  const [focus, setFocus] = useState(cryptoPicks[0]);
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("1D");
  const [scrub, setScrub] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const coin = coins.find((c) => c.ticker === focus)!;
  const facts = coinFacts[focus];
  const r = ranges.find((x) => x.id === range)!;
  const points = useMemo(() => walk(coin.ticker + r.id, r.n, coin.price, coin.change * r.mult, r.vol), [coin, r]);
  const move = scrub === null ? coin.change * r.mult : ((points[scrub] - points[0]) / points[0]) * 100;
  const color = move >= 0 ? "#3ee39a" : "#ff6b7a";

  return (
    <Panel spotlight={false} className="overflow-hidden p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium text-white">Top picks</h2>
        <span className="flex items-center gap-1.5 text-[12px] text-mist">
          <span className="size-1.5 animate-pulse rounded-full bg-positive" /> Live
        </span>
      </div>

      <div role="radiogroup" aria-label="Coin" className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
        {cryptoPicks.map((t) => {
          const c = coins.find((x) => x.ticker === t)!;
          const on = t === focus;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setFocus(t);
                setScrub(null);
              }}
              className={cn(
                "focus-ring flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full px-1.5 text-[13.5px] ring-1 transition-colors",
                on ? "bg-white text-ink-950 ring-white" : "bg-white/[0.05] text-fog ring-white/[0.07] hover:text-white",
              )}
            >
              <AssetLogo logo={c.logo} className="size-6 shrink-0 text-[10px] ring-0" />
              <span className="font-medium">{t}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-3">
        <AssetLogo logo={coin.logo} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] text-white">{coin.name}</span>
            <span className="rounded-full bg-[#f7931a]/15 px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#ffb25c] uppercase ring-1 ring-[#f7931a]/35">
              Crypto
            </span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-fog">{facts.category}</span>
          </div>
          <div className="mt-1 text-[32px] leading-[1.15] font-semibold tracking-tight sm:text-[38px]">
            {scrub === null ? <LivePrice value={prices[focus]} /> : <span className="text-white tabular">{money(points[scrub])}</span>}
          </div>
          <div className="mt-0.5 text-[13px]">
            <Change value={move} />{" "}
            <span className="text-mist">{scrub === null ? (r.id === "1D" ? "past 24 hours" : `past ${r.label}`) : "from start of range"}</span>
          </div>
        </div>
      </div>

      <AreaChart points={points} color={color} onScrub={setScrub} className="mt-4" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
          {ranges.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setRange(x.id)}
              className={cn("focus-ring rounded-full px-3 py-1.5 text-[12.5px] transition-colors", range === x.id ? "bg-white/15 text-white" : "text-mist hover:text-white")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onBuy(coin)}
          className="focus-ring flex h-11 shrink-0 items-center gap-2 rounded-full bg-[radial-gradient(circle_at_30%_25%,#4c97ff,#1f7bff_55%,#1660d6)] px-5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgb(31_123_255/0.9)] transition-[filter] hover:brightness-110"
        >
          <ShoppingBag className="size-4" /> Buy {coin.ticker}
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={focus}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 rounded-[22px] bg-white/[0.03] p-4 ring-1 ring-white/[0.06]"
        >
          <p className="text-[13.5px] leading-snug text-fog">{facts.why}</p>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-[12.5px]">
              <span className="text-mist">Price swings</span>
              <span className="text-white">
                {SWING_WORDS[facts.swings]} <span className="text-mist tabular">· often ±{facts.typicalDay}% a day</span>
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1" aria-hidden>
              {Array.from({ length: 7 }, (_, k) => (
                <motion.span
                  key={k}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.04 * k, duration: 0.25 }}
                  className="h-1.5 origin-left rounded-full"
                  style={{ background: k < facts.swings ? ["#2ad1e6", "#3ee3b0", "#7ee36a", "#d8d65a", "#ffb547", "#ff8a4c", "#ff6b7a"][k] : "rgb(255 255 255 / 0.08)" }}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Launched" value={String(facts.launched)} sub={`${new Date().getFullYear() - facts.launched} years ago`} />
            <Stat label="Supply" value={facts.supply} sub={facts.supplySub} />
            <Stat label="Worst fall" value={`${facts.worstFall}%`} sub={facts.worstWhen} down />
          </div>

          <button
            type="button"
            aria-expanded={more}
            onClick={() => setMore((m) => !m)}
            className="focus-ring mt-4 flex w-full items-center justify-between rounded-2xl bg-white/[0.04] px-3.5 py-3 text-left text-[13.5px] text-white transition-colors hover:bg-white/[0.07]"
          >
            <span>
              How it works <span className="text-mist">and who it suits</span>
            </span>
            <motion.span animate={{ rotate: more ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown className="size-4 text-fog" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {more && (
              <motion.div
                key="more"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ul className="space-y-2.5 px-1 pt-4 pb-1 text-[13px] leading-snug">
                  <Line icon={Cpu} tone="text-cyan" label="Used for" text={facts.usedFor} />
                  <Line icon={ShieldCheck} tone="text-electric-soft" label="Kept safe by" text={facts.securedBy} />
                  <Line icon={CircleCheck} tone="text-positive" label="Good for" text={facts.goodFor} />
                  <Line icon={TriangleAlert} tone="text-[#ffb547]" label="Keep in mind" text={facts.keepInMind} />
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </Panel>
  );
}

function Line({ icon: Icon, tone, label, text }: { icon: typeof Cpu; tone: string; label: string; text: string }) {
  return (
    <li className="flex gap-2 text-fog">
      <Icon className={cn("mt-px size-4 shrink-0", tone)} strokeWidth={2} />
      <span>
        <span className="text-white">{label}: </span>
        {text}
      </span>
    </li>
  );
}

function Stat({ label, value, sub, down }: { label: string; value: string; sub: string; down?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.04] px-3 py-2.5">
      <div className="truncate text-[11.5px] text-mist">{label}</div>
      <div className={cn("mt-0.5 truncate text-[17px] font-semibold text-white tabular", down && "text-[#ff8b96]")}>{value}</div>
      <div className="truncate text-[11px] text-mist">{sub}</div>
    </div>
  );
}
