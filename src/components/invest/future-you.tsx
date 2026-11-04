"use client";

import { useEffect, useMemo, useState } from "react";
import NumberFlow from "@number-flow/react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Check, Telescope } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { AGE, project, RATE, RETIRE_AT } from "@/lib/invest";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR0 } from "@/lib/utils";

const MAX = 1000;

/** Drag the monthly amount and watch the pot at 65 move. Saving it updates the monthly plan. */
export function FutureYou() {
  const { portfolio, plan, setPlan } = useWallet();
  const [monthly, setMonthly] = useState(plan);
  useEffect(() => setMonthly(plan), [plan]);

  const current = useMemo(() => project(portfolio, plan), [portfolio, plan]);
  const chosen = useMemo(() => project(portfolio, monthly), [portfolio, monthly]);
  const end = chosen[chosen.length - 1];
  const diff = end - current[current.length - 1];
  const changed = monthly !== plan;

  const w = 300;
  const h = 90;
  // Scale to the higher of the two lines, so the curve always fills the chart.
  const top = Math.max(end, current[current.length - 1], 1) * 1.04;
  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${i ? "L" : "M"}${((i / (vals.length - 1)) * w).toFixed(1)},${(h - (v / top) * (h - 6)).toFixed(1)}`).join(" ");

  return (
    <Panel className="overflow-hidden p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[#8b6dff]/20 blur-[70px]"
      />
      <div className="relative flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-[#8b6dff]/15 text-[#c4b5fd]">
          <Telescope className="size-4" strokeWidth={1.9} />
        </span>
        <h2 className="text-[17px] font-medium text-white">Future you</h2>
        <span className="ml-auto text-[12px] text-mist">Age {RETIRE_AT}</span>
      </div>

      <div className="relative mt-4 text-[13px] text-mist">
        Putting in <span className="text-white tabular">{formatEUR0(monthly)}</span> a month, at {RETIRE_AT} you could have
      </div>
      <div className="relative mt-1 text-[38px] leading-none font-semibold tracking-[-0.04em] text-white tabular sm:text-[44px]">
        <NumberFlow value={Math.round(end / 100) * 100} locales="en-IE" format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} />
      </div>
      <div className="relative mt-2 h-5 text-[13px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={changed ? (diff > 0 ? "more" : "less") : "same"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(changed ? (diff > 0 ? "text-positive" : "text-[#ffb547]") : "text-mist")}
          >
            {changed ? `${formatEUR0(Math.round(diff / 100) * 100, { sign: true })} vs your plan of ${formatEUR0(plan)}/mo` : "That's your current plan"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Your plan (dashed) against what the slider says */}
      <div className="relative mt-3 h-[90px]">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="fy-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#8b6dff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#8b6dff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path animate={{ d: `${toPath(chosen)} L${w},${h} L0,${h} Z` }} transition={{ duration: 0.35 }} fill="url(#fy-fill)" />
          {changed && (
            <path d={toPath(current)} fill="none" stroke="#5ef0ff" strokeOpacity={0.7} strokeWidth={1.6} strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
          )}
          <motion.path
            animate={{ d: toPath(chosen) }}
            transition={{ duration: 0.35 }}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={2.4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 8px rgb(167 139 250 / 0.7))" }}
          />
        </svg>
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-mist">
        <span>Today · {AGE}</span>
        <span>{Math.round((AGE + RETIRE_AT) / 2)}</span>
        <span>{RETIRE_AT}</span>
      </div>

      <SliderPrimitive.Root
        value={[monthly]}
        onValueChange={([v]) => setMonthly(v)}
        min={0}
        max={MAX}
        step={25}
        className="relative mt-5 flex h-8 w-full touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-[#5b3fe0] to-[#a78bfa]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label="Monthly amount"
          className="focus-ring block size-7 cursor-grab rounded-full border-[3px] border-white bg-[#8b6dff] shadow-[0_0_0_8px_rgb(139_109_255/0.2),0_6px_18px_rgb(0_0_0/0.5)] transition-transform active:scale-110 active:cursor-grabbing"
        />
      </SliderPrimitive.Root>
      <div className="mt-1 flex justify-between text-[11px] text-mist tabular">
        <span>€0</span>
        <span>{formatEUR0(MAX)}/mo</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[11.5px] leading-snug text-mist">
          Assumes {(RATE * 100).toFixed(1)}% a year. Not a promise.
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {changed ? (
            <motion.button
              key="save"
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setPlan(monthly);
                toast(`Monthly plan set to ${formatEUR0(monthly)}`, { description: "It goes in on the 1st, from your balance." });
              }}
              className="focus-ring h-10 shrink-0 cursor-pointer rounded-full bg-white px-4 text-[13.5px] font-medium text-ink-950 transition-colors hover:bg-[#eef6f8]"
            >
              Make it {formatEUR0(monthly)}/mo
            </motion.button>
          ) : (
            <motion.span
              key="set"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-10 shrink-0 items-center gap-1.5 text-[13px] text-positive"
            >
              <Check className="size-4" strokeWidth={2.4} />
              Your plan
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}
