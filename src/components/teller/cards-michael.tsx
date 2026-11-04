"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { answerText, CardActions, ease, Spoken } from "./card-kit";

/** Michael's three answer cards. Their numbers match what he says in the clips. */

type CardProps = { reply?: string; onClose: () => void };

/** Whole euros: €8,000, €4,400. */
const eur0 = (v: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const panel = "mt-4 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.06]";
const caption = "text-[11px] font-medium tracking-[0.12em] text-mist uppercase";

// ---------------------------------------------------------------------------------------------
// Where should I invest? €5,000 into VWCE, Vanguard's global ETF. Keep at least €3,000 as an emergency fund.

const SAVINGS = 8000;
const INVEST = 5000;
const CASH = SAVINGS - INVEST; // €3,000

/** An illustrative five-year path for a global equity ETF: up overall, with a dip on the way. */
const VWCE_5Y = [100, 104, 109, 113, 108, 117, 122, 118, 111, 104, 109, 114, 112, 119, 125, 129, 127, 134, 139, 137, 144, 150, 147, 155, 161];

function Spark({ values, color, id }: { values: number[]; color: string; id: string }) {
  const w = 56;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / (max - min)) * (h - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.g
        initial={{ clipPath: "inset(-20% 100% -20% -5%)" }}
        animate={{ clipPath: "inset(-20% -10% -20% -5%)" }}
        transition={{ delay: 1.1, duration: 1.1, ease }}
      >
        <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lx} cy={ly} r="2.2" fill={color} />
      </motion.g>
    </svg>
  );
}

export function InvestAnswer({ reply, onClose }: CardProps) {
  const [done, setDone] = useState(false);
  const share = (v: number) => `${((v / SAVINGS) * 100).toFixed(1)}%`;

  return (
    <>
      <p className={answerText}>
        <Spoken text={reply ?? ""} />
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease }}
        className={panel}
      >
        <div className="flex items-baseline justify-between">
          <span className={caption}>Your {eur0(SAVINGS)}</span>
          <span className="text-[12px] text-mist">Suggested allocation</span>
        </div>

        {/* Allocation bar */}
        <div className="mt-3 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-white/5">
          {[
            { v: INVEST, c: "#7c5cff" },
            { v: CASH, c: "#22d3ee" },
          ].map((p, i) => (
            <motion.span
              key={p.c}
              initial={{ width: 0 }}
              animate={{ width: `${(p.v / SAVINGS) * 100}%` }}
              transition={{ delay: 0.85 + i * 0.15, duration: 0.8, ease }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ background: p.c, boxShadow: `0 0 12px ${p.c}66` }}
            />
          ))}
        </div>

        <ul className="mt-3.5 space-y-2.5">
          {/* The ETF, as a holding row: ticker, name, five-year line, amount */}
          <motion.li
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.05, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(140deg,#8b6dff,#5b3fe0)] text-[9px] font-bold tracking-wide text-white shadow-[0_4px_14px_-4px_rgb(124_92_255/0.8)]">
              ETF
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[14px] text-white">
                VWCE
                <span className="hidden rounded bg-white/[0.08] px-1 py-px text-[10px] font-medium text-fog sm:inline">Global</span>
              </span>
              <span className="block truncate text-[12px] leading-snug text-mist">
                Vanguard<span className="hidden sm:inline"> FTSE All-World</span>
              </span>
            </span>
            <span className="flex flex-col items-end">
              <Spark values={VWCE_5Y} color="#a78bfa" id="vwce-spark" />
              <span className="text-[10px] text-mist">5 years</span>
            </span>
            <span className="w-[62px] text-right">
              <span className="block text-[14px] text-white tabular">{eur0(INVEST)}</span>
              <span className="block text-[11.5px] text-mist tabular">{share(INVEST)}</span>
            </span>
          </motion.li>

          <motion.li
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.15, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-cyan-400/15 text-cyan-300">
              <ShieldCheck className="size-4" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] text-white">Emergency fund</span>
              <span className="block truncate text-[12px] leading-snug text-mist">Cash, ready any time</span>
            </span>
            <span className="w-[62px] text-right">
              <span className="block text-[14px] text-white tabular">{eur0(CASH)}</span>
              <span className="block text-[11.5px] text-mist tabular">{share(CASH)}</span>
            </span>
          </motion.li>
        </ul>
      </motion.div>

      <CardActions
        done={done}
        label={`Invest ${eur0(INVEST)}`}
        doneLabel="Plan set"
        delay={1.4}
        onClose={onClose}
        onAction={() => {
          setDone(true);
          toast("Investment plan set", {
            description: `${eur0(INVEST)} goes into VWCE, ${eur0(CASH)} stays as your emergency fund.`,
          });
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// How's my portfolio? Up 2.4% this month, about €320. Tech led, bonds held.

const GAIN = 320;
const START = Math.round(GAIN / 0.024); // €13,333
const NOW = START + GAIN;
const contributions = [
  { id: "tech", name: "Tech", value: 236, color: "#22d3ee" },
  { id: "global", name: "Other stocks", value: 78, color: "#1f7bff" },
  { id: "bonds", name: "Bonds", value: 6, color: "#a78bfa", note: "held" },
];

/** A month of daily values ending 2.4% up, with a few gentle dips. */
function useMonthCurve() {
  return useMemo(() => {
    const days = 30;
    return Array.from({ length: days + 1 }, (_, i) => {
      const t = i / days;
      const wobble = Math.sin(i * 1.3) * 0.0035 + Math.sin(i * 0.45) * 0.004;
      return START * (1 + 0.024 * t + wobble * Math.sin(Math.PI * t));
    });
  }, []);
}

function Curve({ values, height = 70, color = "#34d399" }: { values: number[]; height?: number; color?: string }) {
  const w = 300;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - 6 - ((v - min) / (max - min)) * (height - 14)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="pf-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${line} L${w},${height} L0,${height} Z`}
        fill="url(#pf-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ delay: 0.8, duration: 1.1, ease }}
        style={{ filter: `drop-shadow(0 0 6px ${color}99)` }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r={3.5}
        fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
      />
    </svg>
  );
}

export function PortfolioAnswer({ reply, onClose }: CardProps) {
  const [done, setDone] = useState(false);
  const curve = useMonthCurve();
  const maxC = Math.max(...contributions.map((c) => c.value));

  return (
    <>
      <p className={answerText}>
        <Spoken text={reply ?? ""} />
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease }}
        className={cn(panel, "mt-3 p-3")}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={caption}>Portfolio · 30 days</span>
            <div className="mt-1 text-[22px] leading-none font-medium text-white tabular">{eur0(NOW)}</div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-positive/12 px-2.5 py-1 text-[12.5px] font-medium text-positive ring-1 ring-positive/25">
            <TrendingUp className="size-3.5" strokeWidth={2.2} />+{eur0(GAIN)} · 2.4%
          </span>
        </div>
        <div className="mt-2 h-[46px]">
          <Curve values={curve} height={46} />
        </div>

        {/* Where this month's gain came from */}
        <div className="mt-2.5 border-t border-hairline pt-2.5">
          <span className={caption}>What moved it</span>
          <ul className="mt-1.5 space-y-1">
            {contributions.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="w-[126px] shrink-0 truncate text-[13px] text-white">
                  {c.name}
                  {c.note && <span className="text-[11px] text-mist"> · {c.note}</span>}
                </span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(3, (c.value / maxC) * 100)}%` }}
                    transition={{ delay: 1.2 + i * 0.1, duration: 0.7, ease }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: c.color, boxShadow: `0 0 10px ${c.color}77` }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right text-[13px] text-positive tabular">+€{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <CardActions
        done={done}
        label="Stay the course"
        doneLabel="Plan kept"
        delay={1.5}
        onClose={onClose}
        onAction={() => {
          setDone(true);
          toast("Plan kept", { description: "Your monthly investment carries on as usual." });
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Retirement check: €400,000 by 65 at this pace; €100 more a month passes €500,000

const AGE = 35;
const RETIRE = 65;
const RATE = 0.065 / 12;
const PER_MONTH = 275;
const EXTRA = 100;

/** Yearly balances from today to 65, investing `monthly` on top of today's portfolio. */
function project(monthly: number) {
  const out: number[] = [];
  let v = NOW;
  for (let m = 0; m <= (RETIRE - AGE) * 12; m++) {
    if (m % 12 === 0) out.push(v);
    v = v * (1 + RATE) + monthly;
  }
  return out;
}

export function RetirementAnswer({ reply, onClose }: CardProps) {
  const [done, setDone] = useState(false);
  const base = useMemo(() => project(PER_MONTH), []);
  const more = useMemo(() => project(PER_MONTH + EXTRA), []);
  const baseEnd = Math.round(base[base.length - 1] / 1000) * 1000; // ≈ €400,000
  const moreEnd = Math.floor(more[more.length - 1] / 1000) * 1000; // ≈ €510,000

  const w = 300;
  const h = 76;
  const top = more[more.length - 1];
  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${i ? "L" : "M"}${((i / (vals.length - 1)) * w).toFixed(1)},${(h - (v / top) * (h - 12)).toFixed(1)}`).join(" ");
  const basePath = toPath(base);
  const morePath = toPath(more);
  const yOf = (v: number) => h - (v / top) * (h - 12);

  return (
    <>
      <p className={answerText}>
        <Spoken text={reply ?? ""} />
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease }}
        className={cn(panel, "mt-3 p-3")}
      >
        <div className="flex items-baseline justify-between">
          <span className={caption}>Pot at {RETIRE}</span>
          <span className="text-[12px] text-mist">6.5% a year, assumed</span>
        </div>

        <div className="relative mt-2 h-[76px] pr-[78px]">
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="rt-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#7c5cff" stopOpacity="0.28" />
                <stop offset="1" stopColor="#7c5cff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="white" strokeOpacity={0.05} vectorEffect="non-scaling-stroke" />
            ))}
            <motion.path
              d={`${morePath} L${w},${h} L0,${h} Z`}
              fill="url(#rt-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
            />
            <motion.path
              d={basePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            />
            <motion.path
              d={morePath}
              fill="none"
              stroke="#a78bfa"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ delay: 1.1, duration: 1.2, ease }}
              style={{ filter: "drop-shadow(0 0 6px rgb(167 139 250 / 0.7))" }}
            />
          </svg>
          {/* End labels, in HTML so the text isn't stretched with the chart */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1 }}
            className="absolute right-0 -translate-y-[80%] rounded-md bg-[#a78bfa]/15 px-1.5 py-0.5 text-[11.5px] font-medium text-[#c4b5fd] tabular"
            style={{ top: `${(yOf(more[more.length - 1]) / h) * 100}%` }}
          >
            {eur0(moreEnd)}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute right-0 -translate-y-[20%] rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[11.5px] font-medium text-cyan-200 tabular"
            style={{ top: `${(yOf(base[base.length - 1]) / h) * 100}%` }}
          >
            {eur0(baseEnd)}
          </motion.span>
        </div>
        <div className="mt-1.5 flex justify-between pr-[78px] text-[10.5px] text-mist">
          <span>Today</span>
          <span>Age 50</span>
          <span>Age {RETIRE}</span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-hairline pt-2.5 text-[12px]">
          <span className="flex items-center gap-2 text-fog">
            <span className="h-0 w-4 border-t-2 border-dashed border-cyan-400" />
            Now {eur0(PER_MONTH)}/mo
          </span>
          <span className="flex items-center gap-2 text-white">
            <span className="h-[3px] w-4 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#a78bfa]" />+{eur0(EXTRA)}/mo
          </span>
          <span className="ml-auto hidden items-center gap-1 text-positive sm:flex">
            <ShieldCheck className="size-3.5" strokeWidth={2.2} />
            +{eur0(moreEnd - baseEnd)}
          </span>
        </div>
      </motion.div>

      <CardActions
        done={done}
        label={`Add ${eur0(EXTRA)}/mo`}
        doneLabel={`${eur0(EXTRA)}/mo added`}
        delay={1.6}
        onClose={onClose}
        onAction={() => {
          setDone(true);
          toast("Monthly investment raised", {
            description: `${eur0(PER_MONTH + EXTRA)} a month from now on. On track for ${eur0(moreEnd)} at ${RETIRE}.`,
          });
        }}
      />
    </>
  );
}
