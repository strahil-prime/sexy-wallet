"use client";

import { useMemo, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { initialHoldings, MONTHLY_PLAN, portfolioHistory, ranges, thin, type Point, type RangeId } from "@/lib/invest";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR0 } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const BASE = initialHoldings.reduce((s, h) => s + h.value, 0);
const DAY = 24 * 60 * 60 * 1000;

/** Monthly-plan deposits baked into the generated history between two times (none in the last 30 days). */
function planDeposits(from: number, to: number) {
  const cutoff = Date.now() - 30 * DAY;
  let n = 0;
  for (let t = from; t < Math.min(to, cutoff); t += DAY) if (new Date(t).getDate() === 1) n++;
  return n * MONTHLY_PLAN;
}

export function PortfolioHero({ onAskMichael }: { onAskMichael: () => void }) {
  const { portfolio, holdings, investLog } = useWallet();
  const [range, setRange] = useState<RangeId>("1M");
  const [scrub, setScrub] = useState<number | null>(null);

  // Three years of daily values ending at the starting portfolio. The chart shows how the market
  // moved that money; cash added today shows as a note, not as a cliff in the line.
  const history = useMemo(() => portfolioHistory(BASE, Date.now() - 60 * 60 * 1000), []);
  const bought = investLog.filter((e) => e.kind === "buy").reduce((s, e) => s + (e.amount ?? 0), 0);
  const points = useMemo(() => {
    const days = ranges.find((r) => r.id === range)!.days;
    return thin(history.slice(-days - 1));
  }, [history, range]);

  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const start = points[0];
  const last = points[points.length - 1];
  const at = scrub !== null ? points[scrub] : last;
  const shownValue = scrub !== null ? at.v : portfolio;
  // Growth only: money put in during the range doesn't count as a gain.
  const added = planDeposits(start.t, at.t);
  const change = at.v - start.v - added;
  // Return on the money at work: what was there at the start plus what went in since.
  const pct = (change / (start.v + added)) * 100;
  const up = change >= 0;
  const label = { "1M": "past month", "6M": "past 6 months", "1Y": "past year", All: "since you started" }[range];

  return (
    <Panel className="overflow-hidden p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[13px] font-medium tracking-[0.12em] text-mist uppercase">Portfolio</div>
          <div className="mt-2 text-[40px] leading-none font-semibold tracking-[-0.04em] text-white tabular sm:text-[52px]">
            <NumberFlow
              value={Math.round(shownValue)}
              locales="en-IE"
              format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
              transformTiming={{ duration: scrub !== null ? 0 : 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              spinTiming={{ duration: scrub !== null ? 0 : 900, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13.5px]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ring-1",
                up ? "bg-positive/10 text-positive ring-positive/20" : "bg-negative/10 text-negative ring-negative/20",
              )}
            >
              {up ? <ArrowUpRight className="size-3.5" strokeWidth={2.4} /> : <ArrowDownRight className="size-3.5" strokeWidth={2.4} />}
              {formatEUR0(change, { sign: true })} · {Math.abs(pct).toFixed(1)}%
            </span>
            <span className="text-mist" suppressHydrationWarning>
              {scrub !== null
                ? new Date(at.t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onAskMichael}
          className="group focus-ring flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white/[0.06] py-1 pr-3.5 pl-1 text-[13px] text-white ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/personas/michael/avatar.jpg" alt="" className="size-7 rounded-full object-cover" />
          <span className="hidden sm:inline">Ask Michael</span>
          <Sparkles className="size-3.5 text-[#c4b5fd] sm:hidden" />
        </button>
      </div>

      <div className="relative">
        <Chart points={points} scrub={scrub} onScrub={setScrub} rangeKey={range} />
        <AnimatePresence>
          {bought > 0 && scrub === null && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1 }}
              className="pointer-events-none absolute top-0 left-0 flex items-center gap-1.5 rounded-full bg-[#8b6dff]/15 px-2.5 py-1 text-[12px] font-medium text-[#c4b5fd] ring-1 ring-[#8b6dff]/30"
            >
              <span className="size-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#a78bfa]" />
              {formatEUR0(bought, { sign: true })} added today
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <RangeTabs value={range} onChange={setRange} />
        <div className="flex gap-4 text-[12.5px] text-mist">
          <span>
            Put in <span className="text-white tabular">{formatEUR0(invested)}</span>
          </span>
          <span>
            Growth <span className="text-positive tabular">{formatEUR0(portfolio - invested, { sign: true })}</span>
          </span>
        </div>
      </div>
    </Panel>
  );
}

function RangeTabs({ value, onChange }: { value: RangeId; onChange: (r: RangeId) => void }) {
  return (
    <div role="tablist" aria-label="Chart range" className="flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
      {ranges.map((r) => (
        <button
          key={r.id}
          role="tab"
          type="button"
          aria-selected={value === r.id}
          onClick={() => onChange(r.id)}
          className={cn(
            "focus-ring relative h-8 min-w-11 cursor-pointer rounded-full px-3 text-[13px] font-medium transition-colors",
            value === r.id ? "text-white" : "text-mist hover:text-white",
          )}
        >
          {value === r.id && (
            <motion.span
              layoutId="invest-range"
              className="absolute inset-0 rounded-full bg-white/[0.1] ring-1 ring-white/10"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{r.id}</span>
        </button>
      ))}
    </div>
  );
}

/** A Catmull-Rom curve through the points, so the line reads as a calm curve rather than a zigzag. */
function smooth(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 3) return pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" ");
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const k = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * k;
    const c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k;
    const c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/** Area chart you can scrub: drag or hover to read any day. */
function Chart({
  points,
  scrub,
  onScrub,
  rangeKey,
}: {
  points: Point[];
  scrub: number | null;
  onScrub: (i: number | null) => void;
  rangeKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const w = 600;
  const h = 200;
  const vals = points.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.12 || 1;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const x = (p: Point) => ((p.t - t0) / (t1 - t0 || 1)) * w;
  const y = (v: number) => h - ((v - (min - pad)) / (max + pad - (min - pad))) * h;
  const line = smooth(points.map((p) => [x(p), y(p.v)] as const));
  const startY = y(points[0].v);
  const active = scrub !== null ? points[scrub] : null;
  const up = points[points.length - 1].v >= points[0].v;

  const pick = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const t = t0 + f * (t1 - t0);
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i;
    onScrub(best);
  };

  return (
    <div
      ref={ref}
      className="relative mt-6 h-[170px] cursor-crosshair touch-pan-y select-none sm:h-[220px]"
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      onPointerLeave={() => onScrub(null)}
      onPointerUp={(e) => e.pointerType !== "mouse" && onScrub(null)}
      onPointerCancel={() => onScrub(null)}
      aria-label="Portfolio value over time. Drag to read a day."
      role="img"
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="pv-stroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#8b6dff" />
            <stop offset="1" stopColor="#5ef0ff" />
          </linearGradient>
          <linearGradient id="pv-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8b6dff" stopOpacity="0.32" />
            <stop offset="1" stopColor="#8b6dff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* where the range started */}
        <line
          x1={0}
          x2={w}
          y1={startY}
          y2={startY}
          stroke="white"
          strokeOpacity={0.16}
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
        />
        <motion.g
          key={rangeKey}
          initial={{ clipPath: "inset(-10% 100% -10% -1%)" }}
          animate={{ clipPath: "inset(-10% -1% -10% -1%)" }}
          transition={{ duration: 1.1, ease }}
        >
          <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#pv-fill)" />
          <path
            d={line}
            fill="none"
            stroke="url(#pv-stroke)"
            strokeWidth={2.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 8px rgb(139 109 255 / 0.55))" }}
          />
        </motion.g>
      </svg>

      {/* End dot, or the scrub cursor */}
      <AnimatePresence>
        {active ? (
          <motion.div key="cursor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
            <span className="absolute top-0 bottom-0 w-px bg-white/25" style={{ left: `${(x(active) / w) * 100}%` }} />
            <span
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_5px_rgb(139_109_255/0.35)]"
              style={{ left: `${(x(active) / w) * 100}%`, top: `${(y(active.v) / h) * 100}%` }}
            />
          </motion.div>
        ) : (
          <motion.span
            key="end"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.9 }}
            className={cn(
              "pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              up ? "bg-aqua shadow-[0_0_0_4px_rgb(94_240_255/0.2),0_0_16px_#5ef0ff]" : "bg-negative",
            )}
            style={{ left: "100%", top: `${(y(points[points.length - 1].v) / h) * 100}%` }}
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-aqua/60" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
