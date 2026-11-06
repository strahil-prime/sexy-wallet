"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { AlertTriangle, Coffee, Home, ShieldCheck, Smartphone } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-mark";
import { cn, formatEUR } from "@/lib/utils";
import { useWallet } from "@/lib/wallet-store";
import { answerText, CardActions, ease, Spoken } from "./card-kit";

/** Sebastian's three answer cards. Their numbers match what he says in the clips. */

type CardProps = { reply?: string; onClose: () => void };

const panel = "mt-4 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.06]";
const caption = "text-[11px] font-medium tracking-[0.12em] text-mist uppercase";

// ---------------------------------------------------------------------------------------------
// Bills coming up

const LEFT_AFTER_BILLS = 410;

const bills = [
  { id: "rent", name: "Rent", amount: 950, weekday: 5, icon: Home, color: "#1f7bff" },
  { id: "phone", name: "Phone", amount: 25, weekday: 3, icon: Smartphone, color: "#7c5cff" },
  { id: "netflix", name: "Netflix", amount: 13.99, weekday: 6, icon: null, color: "#e50914" },
] as const;

/** The next 7 days from today, with the bills that fall on each. */
function useWeek() {
  return useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      return { date: d, today: i === 0, bills: bills.filter((b) => b.weekday === d.getDay()) };
    });
  }, []);
}

export function BillsAnswer({ reply, onClose }: CardProps) {
  const week = useWeek();
  const due = bills.reduce((s, b) => s + b.amount, 0);
  const available = due + LEFT_AFTER_BILLS;
  const { billReminders: reminded, setBillReminders } = useWallet();
  const dayOf = (weekday: number) => week.find((d) => d.date.getDay() === weekday)!.date;

  return (
    <>
      <p className={answerText}>
        <Spoken text={reply ?? ""} />
      </p>

      {/* The week ahead, bills pinned to their day */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease }}
        className={panel}
      >
        <div className="grid grid-cols-7 gap-1">
          {week.map((d, i) => {
            const bill = d.bills[0];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + i * 0.05, duration: 0.4 }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2",
                  d.today ? "bg-white/[0.07] ring-1 ring-white/10" : bill ? "bg-white/[0.03]" : "",
                )}
                suppressHydrationWarning
              >
                <span className={cn("text-[10.5px] uppercase", d.today ? "text-white" : "text-mist")} suppressHydrationWarning>
                  {d.date.toLocaleDateString("en-GB", { weekday: "narrow" })}
                </span>
                <span className="text-[13px] font-medium text-white tabular" suppressHydrationWarning>
                  {d.date.getDate()}
                </span>
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: bill ? bill.color : "transparent", boxShadow: bill ? `0 0 8px ${bill.color}` : undefined }}
                />
              </motion.div>
            );
          })}
        </div>

        <ul className="mt-3 space-y-1.5">
          {bills.map((b, i) => (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              {b.icon ? (
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full"
                  style={{ background: `${b.color}22`, color: b.color }}
                >
                  <b.icon className="size-4" strokeWidth={1.9} />
                </span>
              ) : (
                <BrandLogo brand="netflix" className="size-8 [&_svg]:size-4" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-white">{b.name}</span>
                <span className="block text-[12px] text-mist" suppressHydrationWarning>
                  {dayOf(b.weekday).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                </span>
              </span>
              <span className="text-[14px] text-white tabular">{formatEUR(b.amount)}</span>
            </motion.li>
          ))}
        </ul>

        {/* What the bills take out of the balance, and what is left */}
        <div className="mt-3.5 border-t border-hairline pt-3">
          <div className="flex items-baseline justify-between">
            <span className={caption}>After bills</span>
            <span className="text-[12px] text-mist tabular">of {formatEUR(available)}</span>
          </div>
          <div className="mt-2.5 flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-white/5">
            {[
              ...bills.map((b) => ({ id: b.id, value: b.amount, color: b.color })),
              { id: "left", value: LEFT_AFTER_BILLS, color: "var(--color-positive)" },
            ].map((s, i) => (
              <motion.span
                key={s.id}
                initial={{ width: 0 }}
                animate={{ width: `${(s.value / available) * 100}%` }}
                transition={{ delay: 1.35 + i * 0.1, duration: 0.8, ease }}
                className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
                style={{ background: s.color }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[13px] text-mist">
              <span className="text-white tabular">{formatEUR(due)}</span> in bills
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-positive/12 px-2.5 py-1 text-[12.5px] font-medium text-positive ring-1 ring-positive/25">
              <ShieldCheck className="size-3.5" strokeWidth={2.2} />
              {formatEUR(LEFT_AFTER_BILLS)} left
            </span>
          </div>
        </div>
      </motion.div>

      <CardActions
        done={reminded}
        label="Remind me"
        doneLabel="Reminders on"
        delay={1.5}
        onClose={onClose}
        onAction={() => {
          setBillReminders(true);
          toast("Reminders on", { description: "We'll nudge you the day before each bill." });
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Unusual activity: Spotify charged twice

const SPOTIFY = 10.99;
/** The second of yesterday's two Spotify charges, in the activity list. */
const DUPLICATE_CHARGE = "a5b";

export function DoubleChargeAnswer({ reply, onClose }: CardProps) {
  const { refunds, flagRefund } = useWallet();
  const flagged = refunds.includes(DUPLICATE_CHARGE);
  // Six months of Spotify charges, the current one doubled.
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: d.toLocaleDateString("en-GB", { month: "short" }), value: i === 5 ? SPOTIFY * 2 : SPOTIFY, odd: i === 5 };
    });
  }, []);
  const max = SPOTIFY * 2;

  return (
    <>
      <p className={answerText}>
        <Spoken text={reply ?? ""} />
      </p>

      {/* The two identical charges, bracketed together */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease }}
        className={cn(panel, "relative")}
      >
        <div className="flex items-center justify-between">
          <span className={caption}>Yesterday</span>
          <span className="flex items-center gap-1 rounded-full bg-[#ffb547]/15 px-2 py-0.5 text-[10.5px] font-semibold tracking-wider text-[#ffb547] uppercase">
            <AlertTriangle className="size-3" strokeWidth={2.4} />
            Duplicate
          </span>
        </div>
        <div className="relative mt-2.5 space-y-1.5 pl-4">
          <motion.span
            aria-hidden
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1.1, duration: 0.5, ease }}
            className="absolute top-5 bottom-5 left-0 w-[2px] origin-top rounded-full bg-[#ffb547]/70"
          />
          {["07:02", "07:02"].map((time, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.45 }}
              className={cn(
                "flex items-center gap-3 rounded-xl p-2 pr-3 ring-1",
                i ? "bg-[#ffb547]/[0.08] ring-[#ffb547]/30" : "bg-white/[0.03] ring-white/[0.05]",
              )}
            >
              <BrandLogo brand="spotify" className="size-8 [&_svg]:size-4" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-white">Spotify Premium</span>
                <span className={cn("block truncate text-[12px]", i ? "text-[#ffcf85]" : "text-mist")}>
                  {i ? `Charged again · ${time}` : `Virtual card · ${time}`}
                </span>
              </span>
              <span className="text-[14px] text-white tabular">− {formatEUR(SPOTIFY)}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Spotify normally charges once a month: this month stands out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6, ease }}
        className={panel}
      >
        <div className="flex items-baseline justify-between">
          <span className={caption}>Spotify per month</span>
          <span className="text-[12px] text-mist">Usually {formatEUR(SPOTIFY)}</span>
        </div>
        <div className="mt-2 flex h-[76px] items-end gap-2">
          {months.map((m, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              {m.odd && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.9 }}
                  className="text-[11px] font-medium text-[#ffb547] tabular"
                >
                  {formatEUR(m.value)}
                </motion.span>
              )}
              <motion.span
                initial={{ height: 0 }}
                animate={{ height: (m.value / max) * 56 }}
                transition={{ delay: 1.25 + i * 0.07, duration: 0.7, ease }}
                className={cn(
                  "w-full max-w-7 rounded-md",
                  m.odd ? "bg-[#ffb547] shadow-[0_0_14px_rgb(255_181_71/0.5)]" : "bg-[#1ed760]/45",
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2">
          {months.map((m, i) => (
            <span
              key={i}
              className={cn("flex-1 text-center text-[10.5px]", m.odd ? "text-[#ffcf85]" : "text-mist")}
              suppressHydrationWarning
            >
              {m.label}
            </span>
          ))}
        </div>
      </motion.div>

      <CardActions
        done={flagged}
        label={`Flag ${formatEUR(SPOTIFY)}`}
        doneLabel="Refund requested"
        delay={1.5}
        onClose={onClose}
        onAction={() => {
          flagRefund(DUPLICATE_CHARGE, { title: "Spotify refund", amount: SPOTIFY, brand: "spotify" });
          toast("Flagged for a refund", {
            description: `We've asked Spotify to return ${formatEUR(SPOTIFY)}. It usually takes 3 to 5 days.`,
          });
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Money tip of the day: coffee

const coffeeWeeks = [14.2, 17.8, 15.5, 16.5]; // €64.00 last month
const COFFEES = 23;
/** Half the coffees at home, at about 35 cents a cup. */
const HOME_CUP = 0.35;

export function CoffeeTipAnswer({ reply, onClose }: CardProps) {
  const { budgets, setBudget } = useWallet();
  const spent = coffeeWeeks.reduce((s, w) => s + w, 0);
  const withTip = Math.round(spent / 2 + (COFFEES / 2) * HOME_CUP);
  const saved = Math.round(spent - withTip);
  const budget = budgets.coffee === withTip;
  const month = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-GB", { month: "long" });
  }, []);
  const maxWeek = Math.max(...coffeeWeeks);

  return (
    <>
      <p className={answerText}>
        <Spoken text={reply ?? ""} />
      </p>

      {/* Last month's coffee, week by week */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease }}
        className={cn(panel, "flex items-end gap-4")}
      >
        <div className="shrink-0">
          <span className="grid size-10 place-items-center rounded-xl bg-[#c98a5a]/20 text-[#e7a875]">
            <Coffee className="size-5" strokeWidth={1.9} />
          </span>
          <div className="mt-3 text-[24px] leading-none font-semibold text-white tabular">{formatEUR(spent)}</div>
          <div className="mt-1 text-[12px] text-mist" suppressHydrationWarning>
            {COFFEES} coffees in {month}
          </div>
        </div>
        <div className="flex h-[92px] min-w-0 flex-1 items-end gap-2">
          {coffeeWeeks.map((w, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <motion.span
                initial={{ height: 0 }}
                animate={{ height: `${(w / maxWeek) * 78}%` }}
                transition={{ delay: 0.8 + i * 0.08, duration: 0.7, ease }}
                className="w-full max-w-8 rounded-md bg-gradient-to-t from-[#9a5f38] to-[#e7a875]"
              />
              <span className="text-[10.5px] text-mist">W{i + 1}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Now versus brewing half at home */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6, ease }}
        className={panel}
      >
        {[
          { label: "Now", value: spent, bar: "bg-white/30" },
          { label: "Brew half at home", value: withTip, bar: "bg-cyan" },
        ].map((r, i) => (
          <div key={r.label} className={cn(i && "mt-3")}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className={i ? "text-white" : "text-mist"}>{r.label}</span>
              <span className="text-white tabular">{formatEUR(r.value)}/mo</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(r.value / spent) * 100}%` }}
                transition={{ delay: 1.3 + i * 0.15, duration: 0.8, ease }}
                className={cn("h-full rounded-full", r.bar)}
              />
            </div>
          </div>
        ))}
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-hairline pt-3">
          <span className="text-[13px] text-mist">You’d keep</span>
          <span className="text-[14px] font-medium text-positive tabular">
            {formatEUR(saved)}/mo · {formatEUR(saved * 12)}/yr
          </span>
        </div>
      </motion.div>

      <CardActions
        done={budget}
        label={`Set €${withTip} budget`}
        doneLabel="Budget set"
        delay={1.5}
        onClose={onClose}
        onAction={() => {
          setBudget("coffee", withTip);
          toast("Coffee budget set", { description: `${formatEUR(withTip)} a month. We'll tell you when you're close.` });
        }}
      />
    </>
  );
}
