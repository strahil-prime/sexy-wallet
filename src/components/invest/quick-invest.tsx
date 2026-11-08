"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { Check, Fingerprint, ShieldCheck, Sprout } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { buyable, funds, insights, type Ticker } from "@/lib/invest";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR, formatEUR0 } from "@/lib/utils";
import { FundInsight } from "./fund-insight";

const HOLD_MS = 750;
const presets = [100, 250, 500, 1000];

/** Put money into a fund: pick it, pick an amount, press and hold to confirm. */
export const QuickInvest = forwardRef<HTMLDivElement, { fund: Ticker; onFund: (t: Ticker) => void }>(function QuickInvest(
  { fund, onFund },
  ref,
) {
  const { balance, safetyNet, invest } = useWallet();
  const [amount, setAmount] = useState(250);
  const [done, setDone] = useState<{ amount: number; ticker: Ticker } | null>(null);
  const f = funds[fund];
  const free = Math.max(0, balance - safetyNet);
  const problem =
    amount <= 0 ? "Enter an amount" : amount > balance ? "More than your balance" : amount > free ? `Keeps less than your ${formatEUR0(safetyNet)} safety net` : null;

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 2600);
    return () => clearTimeout(t);
  }, [done]);

  const confirm = () => {
    if (problem) return;
    if (!invest(fund, amount)) return;
    setDone({ amount, ticker: fund });
    toast(`${formatEUR0(amount)} invested in ${fund}`, { description: `About ${(amount / f.price).toFixed(2)} shares of ${f.name}.` });
  };

  return (
    <Panel ref={ref} className="scroll-mt-6 p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium text-white">Top picks</h2>
        <span className="text-[12.5px] text-mist">
          Available <span className="text-white tabular">{formatEUR0(free)}</span>
        </span>
      </div>

      {/* Fund picker */}
      <div role="radiogroup" aria-label="Fund" className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
        {buyable.map((t) => {
          const on = t === fund;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onFund(t)}
              className={cn(
                "focus-ring relative flex h-9 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full px-1.5 text-[13px] transition-colors",
                on ? "text-white" : "bg-white/[0.04] text-fog ring-1 ring-white/[0.06] hover:bg-white/[0.07]",
              )}
            >
              {on && (
                <motion.span
                  layoutId="qi-fund"
                  className="absolute inset-0 rounded-full ring-1"
                  style={{ background: `${funds[t].color}26`, boxShadow: `inset 0 0 0 1px ${funds[t].color}88, 0 0 18px -6px ${funds[t].color}` }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative size-2.5 shrink-0 rounded-full" style={{ background: funds[t].color, boxShadow: `0 0 8px ${funds[t].color}` }} />
              <span className="relative font-medium">{t}</span>
            </button>
          );
        })}
      </div>
      <FundInsight fund={fund} />

      {/* Amount */}
      <label className="mt-5 flex items-baseline gap-1 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06] focus-within:ring-[#8b6dff]/60">
        <span className="text-[28px] font-semibold text-mist">€</span>
        <input
          inputMode="numeric"
          aria-label="Amount to invest"
          value={amount ? amount.toLocaleString("en-IE") : ""}
          onChange={(e) => setAmount(Math.min(1_000_000, Number(e.target.value.replace(/[^\d]/g, "")) || 0))}
          className="w-full min-w-0 bg-transparent text-[32px] font-semibold tracking-tight text-white tabular outline-none placeholder:text-mist/50"
          placeholder="0"
        />
        <span className="shrink-0 text-[12.5px] text-mist tabular">≈ {(amount / f.price).toFixed(2)} sh</span>
      </label>
      <div className="mt-2.5 flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={cn(
              "focus-ring h-9 flex-1 cursor-pointer rounded-full text-[13px] tabular transition-colors",
              amount === p ? "bg-white text-ink-950" : "bg-white/[0.06] text-fog hover:bg-white/[0.1] hover:text-white",
            )}
          >
            {formatEUR0(p)}
          </button>
        ))}
      </div>

      {amount > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl px-3 py-2.5 text-[13px] leading-snug" style={{ background: `${f.color}14` }}>
          <Sprout className="mt-px size-4 shrink-0" style={{ color: f.color }} strokeWidth={2} />
          <span className="text-fog">
            Left alone for 10 years, {formatEUR0(amount)} could grow to about{" "}
            <span className="font-semibold text-white tabular">{formatEUR0(amount * Math.pow(1 + insights[fund].outlook, 10))}</span>.{" "}
            <span className="text-mist">A rough guide at {(insights[fund].outlook * 100).toFixed(1)}% a year, not a promise.</span>
          </span>
        </div>
      )}

      <div className="mt-3 flex min-h-5 items-center gap-1.5 text-[12.5px]">
        {problem ? (
          <span className="text-[#ffb547]">{problem}</span>
        ) : safetyNet ? (
          <span className="flex items-center gap-1.5 text-mist">
            <ShieldCheck className="size-3.5 text-cyan" strokeWidth={2.2} />
            Your {formatEUR0(safetyNet)} safety net stays in cash
          </span>
        ) : (
          <span className="text-mist">From your balance of {formatEUR(balance)}</span>
        )}
      </div>

      <HoldButton
        disabled={!!problem}
        done={done ? `${formatEUR0(done.amount)} in ${done.ticker}` : null}
        label={`Hold to invest ${formatEUR0(amount)}`}
        color={f.color}
        onConfirm={confirm}
      />
    </Panel>
  );
});

/** Press and hold to confirm, so money never moves on a stray tap. Enter or Space confirm straight away. */
function HoldButton({
  label,
  done,
  disabled,
  color,
  onConfirm,
}: {
  label: string;
  done: string | null;
  disabled: boolean;
  color: string;
  onConfirm: () => void;
}) {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (p) => `${p * 100}%`);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  const start = () => {
    if (disabled || done) return;
    anim.current?.stop();
    anim.current = animate(progress, 1, {
      duration: (HOLD_MS / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        onConfirm();
        progress.set(0);
      },
    });
  };
  const cancel = () => {
    anim.current?.stop();
    animate(progress, 0, { duration: 0.25 });
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          if (!disabled && !done) onConfirm();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "focus-ring relative mt-4 flex h-14 w-full cursor-pointer touch-none items-center justify-center gap-2 overflow-hidden rounded-full text-[15px] font-medium text-white select-none",
        "disabled:cursor-not-allowed disabled:opacity-45",
        done ? "bg-positive/15 text-positive ring-1 ring-positive/30" : "bg-white/[0.08] ring-1 ring-white/10",
      )}
    >
      {!done && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 left-0"
          style={{ width, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 30px ${color}` }}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative flex items-center gap-2">
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Check className="size-4" strokeWidth={2.6} />
            </motion.span>
            {done}
          </motion.span>
        ) : (
          <motion.span key="label" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative flex items-center gap-2">
            <Fingerprint className="size-[18px]" strokeWidth={1.8} />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
