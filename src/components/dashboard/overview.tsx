"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Home as HomeIcon, Plane, Smartphone, Sparkles, Star } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-mark";
import { comingSoon } from "@/components/shell/coming-soon";
import { SpendingDonut, spendingCategories } from "@/components/teller/conversation";
import { usePersona } from "@/components/teller/persona";
import { Panel } from "@/components/ui/panel";
import { cn, formatEUR } from "@/lib/utils";
import { Balance } from "./balance";

/**
 * The Dashboard view: the wallet at a glance, in place of the teller. Numbers line up with the
 * rest of the demo (October's spending, Sebastian's bills, the balance).
 */

const ease = [0.16, 1, 0.3, 1] as const;

/** Six months ending last month, oldest first. */
function useMonths() {
  return useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) =>
      new Date(now.getFullYear(), now.getMonth() - 6 + i, 1).toLocaleDateString("en-GB", { month: "short" }),
    );
  }, []);
}

const spentByMonth = [1290.4, 1512.7, 1655.2, 1401.3, 1388.4, 1462.82];
const inByMonth = [3600, 3720, 3600, 3985, 3600, 3850];
/** Balance over the last 30 days, for the sparkline (ends at today's balance). */
const balanceTrend = [19.8, 19.6, 20.1, 20.4, 20.2, 20.9, 21.3, 21.1, 21.6, 22.4, 22.1, 22.8, 23.2, 23.0, 23.9, 24.68];

function Card({ className, delay = 0, children }: { className?: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease }}
      className={cn("min-w-0", className)}
    >
      <Panel className="h-full p-5 sm:p-6">{children}</Panel>
    </motion.div>
  );
}

function CardTitle({ children, onMore }: { children: React.ReactNode; onMore?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-medium text-white">{children}</h3>
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          aria-label="More"
          className="focus-ring -mr-1.5 grid size-7 cursor-pointer place-items-center rounded-full text-fog transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}

function Change({ value, good }: { value: number; good: boolean }) {
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12.5px] font-medium", good ? "text-positive" : "text-[#ff6b6b]")}>
      <Icon className="size-3.5" strokeWidth={2.2} />
      {value >= 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function Sparkline() {
  const w = 320;
  const h = 96;
  const min = Math.min(...balanceTrend) - 0.4;
  const max = Math.max(...balanceTrend) + 0.2;
  const pts = balanceTrend.map((v, i) => [(i / (balanceTrend.length - 1)) * w, h - ((v - min) / (max - min)) * h] as const);
  // Smooth the line with simple cubic segments between points.
  const d = pts.reduce((acc, [x, y], i) => {
    if (!i) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`-4 -8 ${w + 8} ${h + 12}`} className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2ad1e6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2ad1e6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L${w},${h} L0,${h} Z`}
        fill="url(#spark-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#5ef0ff"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 1.4, ease }}
        style={{ filter: "drop-shadow(0 0 6px rgb(94 240 255 / 0.6))" }}
      />
      <motion.circle cx={lx} cy={ly} r="4" fill="#fff" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.7 }} />
    </svg>
  );
}

function MonthBars({ values, months, color, highlight }: { values: number[]; months: string[]; color: string; highlight: string }) {
  const max = Math.max(...values);
  return (
    <div className="mt-4">
      <div className="flex h-[78px] items-end justify-between gap-2.5">
        {values.map((v, i) => {
          const last = i === values.length - 1;
          return (
            <motion.span
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.7, ease }}
              className="max-w-9 flex-1 rounded-md"
              style={{ background: last ? highlight : color, boxShadow: last ? `0 0 16px ${highlight}66` : undefined }}
              title={`${months[i]}: ${formatEUR(v)}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2.5">
        {months.map((m, i) => (
          <span
            key={i}
            className={cn("max-w-9 flex-1 text-center text-[11px]", i === months.length - 1 ? "text-white" : "text-mist")}
            suppressHydrationWarning
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function Amount({ value }: { value: number }) {
  const [whole, cents] = formatEUR(value).split(".");
  return (
    <span className="text-[26px] font-semibold tracking-tight text-white tabular sm:text-[28px]">
      {whole}
      <span className="text-[0.65em] text-white/45">.{cents}</span>
    </span>
  );
}

const bills = [
  { id: "phone", name: "Phone", amount: 25, weekday: 3, icon: Smartphone, color: "#7c5cff" },
  { id: "rent", name: "Rent", amount: 950, weekday: 5, icon: HomeIcon, color: "#1f7bff" },
  { id: "netflix", name: "Netflix", amount: 13.99, weekday: 6, icon: null, color: "#e50914" },
] as const;

/** `part` lets phones split the dashboard: the balance first, then the right-rail cards, then the rest. */
export function Overview({ onAsk, part = "all" }: { onAsk: () => void; part?: "all" | "balance" | "rest" }) {
  const months = useMonths();
  const { persona } = usePersona();
  const [budgetSet, setBudgetSet] = useState(false);
  const total = spendingCategories.reduce((s, c) => s + c.value, 0);
  const lastMonth = months[months.length - 1];
  const lastMonthLong = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-GB", { month: "long" });
  }, []);
  const spentChange = ((spentByMonth[5] - spentByMonth[4]) / spentByMonth[4]) * 100;
  const inChange = ((inByMonth[5] - inByMonth[4]) / inByMonth[4]) * 100;
  // Same days Sebastian quotes: the next Wednesday, Friday and Saturday.
  const dueOn = (weekday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-3 xl:gap-5">
      {/* Balance with its 30-day trend */}
      {part !== "rest" && (
        <Card className="@xl:col-span-2" delay={0}>
          <div className="@container relative">
            <Balance />
            <div className="pointer-events-none mt-4 h-[90px] @lg:absolute @lg:right-0 @lg:bottom-0 @lg:mt-0 @lg:h-[110px] @lg:w-[48%]">
              <Sparkline />
            </div>
          </div>
        </Card>
      )}

      {part !== "balance" && (
        <>
          {/* A nudge from the active teller */}
          <Card delay={0.05}>
            <div className="relative flex h-full flex-col">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-5 -z-0 rounded-[var(--radius-panel)] sm:-inset-6 bg-[radial-gradient(120%_90%_at_100%_100%,rgb(31_123_255/0.35),transparent_60%)]"
              />
              <div className="relative flex items-center gap-2.5">
                <Image
                  src={persona.avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover ring-1 ring-white/15"
                />
                <span className="text-[15px] font-medium text-white">{persona.name}&apos;s insight</span>
                <Sparkles className="ml-auto size-4 text-cyan" />
              </div>
              <p className="relative mt-3 text-[14.5px] leading-relaxed text-fog">
                <span className="text-white">
                  Dining and coffee came to {formatEUR(272.8)} in {lastMonthLong}.
                </span>{" "}
                A €220 monthly cap would keep about €50 more in your pocket.
              </p>
              <div className="relative mt-auto flex flex-wrap gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setBudgetSet(true);
                    toast("Dining budget set", { description: `€220 a month. We'll tell you when you're close.` });
                  }}
                  disabled={budgetSet}
                  className="focus-ring h-10 cursor-pointer rounded-full bg-white px-4 text-[13.5px] font-medium text-ink-950 transition-colors hover:bg-[#eef6f8] disabled:cursor-default disabled:bg-positive/15 disabled:text-positive"
                >
                  {budgetSet ? "Budget set" : "Set budget"}
                </button>
                <button
                  type="button"
                  onClick={onAsk}
                  className="focus-ring h-10 cursor-pointer rounded-full border border-hairline-strong px-4 text-[13.5px] text-white transition-colors hover:bg-white/5"
                >
                  Ask {persona.name}
                </button>
              </div>
            </div>
          </Card>

          <Card delay={0.1}>
            <CardTitle>Monthly spending</CardTitle>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <Amount value={spentByMonth[5]} />
              <span className="pb-1.5 text-[12px] text-mist">
                <Change value={spentChange} good={spentChange < 0} /> vs {months[4]}
              </span>
            </div>
            <MonthBars values={spentByMonth} months={months} color="rgb(31 123 255 / 0.45)" highlight="#4c97ff" />
          </Card>

          <Card delay={0.15}>
            <CardTitle>Money in</CardTitle>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <Amount value={inByMonth[5]} />
              <span className="pb-1.5 text-[12px] text-mist">
                <Change value={inChange} good={inChange >= 0} /> vs {months[4]}
              </span>
            </div>
            <MonthBars values={inByMonth} months={months} color="rgb(42 209 230 / 0.35)" highlight="#5ef0ff" />
          </Card>

          <Card delay={0.2}>
            <CardTitle onMore={() => comingSoon("Rewards")}>Rewards</CardTitle>
            <div className="mt-3 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-fog">Aurora Rewards</span>
                  <span className="rounded-full border border-[#f5c76a]/40 bg-[#f5c76a]/10 px-2 py-0.5 text-[11px] font-semibold text-[#f5c76a]">
                    Gold
                  </span>
                </div>
                <div className="mt-1.5 text-[28px] font-semibold tracking-tight text-white tabular">
                  2,480 <span className="text-[14px] font-normal text-mist">points</span>
                </div>
              </div>
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#f5c76a] to-[#a8782a] shadow-[0_0_24px_rgb(245_199_106/0.35)] ring-4 ring-[#f5c76a]/15">
                <Star className="size-6 fill-ink-950/70 text-ink-950/70" />
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(2480 / 3000) * 100}%` }}
                transition={{ delay: 0.7, duration: 0.9, ease }}
                className="h-full rounded-full bg-gradient-to-r from-electric to-cyan"
              />
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-mist">
              <span>
                <span className="text-white">520 points</span> to Platinum
              </span>
              <span className="tabular">3,000</span>
            </div>
          </Card>

          {/* Where last month's money went */}
          <Card className="@xl:col-span-2 @5xl:row-span-2" delay={0.25}>
            <CardTitle onMore={() => onAsk()}>Spending by category</CardTitle>
            <p className="mt-1 text-[12.5px] text-mist" suppressHydrationWarning>
              {lastMonthLong} · {formatEUR(total)}
            </p>
            <div className="[&>div]:mt-3">
              <SpendingDonut cats={[...spendingCategories].sort((a, b) => b.value - a.value)} total={total} month={lastMonth} />
            </div>
          </Card>

          <Card delay={0.3}>
            <CardTitle onMore={() => comingSoon("Bills")}>Upcoming bills</CardTitle>
            <ul className="mt-3 space-y-1">
              {bills.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl py-1.5">
                  {b.icon ? (
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full"
                      style={{ background: `${b.color}22`, color: b.color }}
                    >
                      <b.icon className="size-4" strokeWidth={1.9} />
                    </span>
                  ) : (
                    <BrandLogo brand="netflix" className="size-9 [&_svg]:size-4" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-white">{b.name}</span>
                    <span className="block truncate text-[12px] text-mist" suppressHydrationWarning>
                      {dueOn(b.weekday)}
                    </span>
                  </span>
                  <span className="text-[14px] text-white tabular">− {formatEUR(b.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={0.35}>
            <CardTitle onMore={() => comingSoon("Savings goals")}>Savings goal</CardTitle>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-electric/15 text-electric-soft">
                <Plane className="size-[18px]" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <div className="text-[14px] text-fog">Trip to Tokyo</div>
                <div className="text-[20px] font-semibold text-white tabular">
                  €3,200 <span className="text-[14px] font-normal text-mist">/ €5,000</span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "64%" }}
                transition={{ delay: 0.8, duration: 0.9, ease }}
                className="h-full rounded-full bg-gradient-to-r from-cyan to-aqua shadow-[0_0_12px_rgb(94_240_255/0.5)]"
              />
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-mist">
              <span>64% saved</span>
              <span>Target 1 Mar 2027</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
