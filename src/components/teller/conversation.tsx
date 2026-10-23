"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { ArrowRight, ChevronRight, MessageCircleMore, PiggyBank, PieChart, Send, X } from "lucide-react";
import { ContactAvatar } from "@/components/ui/avatar";
import { contacts, teller } from "@/lib/data";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR } from "@/lib/utils";
import type { Intent, TellerState } from "./machine";

const questions: { intent: Intent; label: string; short: string; icon: typeof PieChart }[] = [
  { intent: "spent-this-month", label: "How much did I spend this month?", short: "Spent this month?", icon: PieChart },
  { intent: "savings-rate", label: "What's my savings rate?", short: "Savings rate?", icon: PiggyBank },
  { intent: "send-janet", label: "Send €10 to Janet", short: "Send €10 to Janet", icon: Send },
];

export function QuestionChips({ state, onAsk, className }: { state: TellerState; onAsk: (i: Intent) => void; className?: string }) {
  const busy = state.status === "thinking";
  const activeIntent = state.status === "thinking" || state.status === "talking" ? state.intent : null;
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1 [mask-image:linear-gradient(90deg,#000_92%,transparent)]", className)}>
      {questions.map((q, i) => {
        const active = activeIntent === q.intent;
        return (
          <motion.button
            key={q.intent}
            type="button"
            disabled={busy}
            onClick={() => onAsk(q.intent)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "group focus-ring relative flex h-10 shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-full border px-4 text-[13.5px] backdrop-blur-xl transition-colors disabled:cursor-wait",
              active
                ? "border-cyan/40 bg-cyan/15 text-white"
                : "border-hairline-strong bg-ink-900/55 text-fog hover:border-cyan/30 hover:text-white",
            )}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <q.icon className={cn("size-4", active ? "text-cyan" : "text-cyan/80")} strokeWidth={1.8} />
            <span className="hidden sm:inline">{q.label}</span>
            <span className="sm:hidden">{q.short}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** "Ask me anything" is not live in v1: it shows Coming soon and refuses input. */
export function AskBar({ className }: { className?: string }) {
  const [soon, setSoon] = useState(false);
  const [scope, animate] = useAnimate();
  const timer = useRef<number>(undefined);

  const nudge = () => {
    setSoon(true);
    animate(scope.current, { x: [0, -7, 6, -4, 3, 0] }, { duration: 0.45 });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSoon(false), 2400);
  };

  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative", className)}
    >
      <label
        onPointerDown={nudge}
        className="glass group flex h-[84px] cursor-pointer items-center gap-4 rounded-[22px] px-4 transition-colors hover:border-hairline-strong sm:h-[100px] sm:px-5"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.06] sm:size-[62px]">
          <MessageCircleMore className="size-6 text-fog" strokeWidth={1.6} />
        </span>
        <span className="relative min-w-0 flex-1">
          <input
            readOnly
            aria-label="Ask me anything (coming soon)"
            onFocus={nudge}
            onKeyDown={(e) => {
              if (e.key !== "Tab") {
                e.preventDefault();
                nudge();
              }
            }}
            className="peer absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <AnimatePresence mode="wait" initial={false}>
            {soon ? (
              <motion.span
                key="soon"
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                className="block"
              >
                <span className="flex items-center gap-2 text-[17px] font-medium text-white sm:text-[19px]">
                  Coming soon
                  <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-cyan uppercase">Beta</span>
                </span>
                <span className="mt-1 block truncate text-[14px] text-mist">For now, try one of the questions above.</span>
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                className="block"
              >
                <span className="block truncate text-[17px] font-medium text-white sm:text-[19px]">Ask me anything</span>
                <span className="mt-1 block truncate text-[14px] text-mist">Payments, insights, rewards...</span>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <ChevronRight className="size-5 shrink-0 text-fog transition-transform duration-300 group-hover:translate-x-1" />
      </label>
    </motion.div>
  );
}

/** Splits text into words that blur in like captions. */
function Spoken({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.055, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {w + (i < words.length - 1 ? " " : "")}
        </motion.span>
      ))}
    </span>
  );
}

function Header({ onClose, speaking }: { onClose?: () => void; speaking: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="text-[13px] font-semibold tracking-wide text-white">{teller.name}</span>
      <span className="flex h-4 items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-cyan"
            animate={speaking ? { height: [4, 14, 6, 11, 4] } : { height: 4 }}
            transition={speaking ? { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" } : {}}
          />
        ))}
      </span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="focus-ring ml-auto grid size-7 cursor-pointer place-items-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

const spendingCategories = [
  { name: "Groceries", value: 412.18, color: "#2ad1e6" },
  { name: "Travel", value: 312, color: "#1f7bff" },
  { name: "Shopping", value: 289.95, color: "#7c5cff" },
  { name: "Dining & coffee", value: 186.4, color: "#5ef0ff" },
  { name: "Subscriptions", value: 75.98, color: "#8ea3ad" },
];

function SpendAnswer() {
  const { activity } = useWallet();
  const sentToday = useMemo(
    () => activity.filter((a) => a.id.startsWith("tx_")).reduce((s, a) => s - a.amount, 0),
    [activity],
  );
  const cats = sentToday ? [...spendingCategories, { name: "Transfers", value: sentToday, color: "#ff8a5b" }] : spendingCategories;
  const total = cats.reduce((s, c) => s + c.value, 0);
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });
  return (
    <>
      <p className="text-[15.5px] leading-relaxed text-fog">
        <Spoken text={`You've spent ${formatEUR(total)} so far in ${month}. That's 12% less than last month, and groceries are your biggest category.`} />
      </p>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/5">
        {cats.map((c, i) => (
          <motion.span
            key={c.name}
            initial={{ width: 0 }}
            animate={{ width: `${(c.value / total) * 100}%` }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-full first:rounded-l-full last:rounded-r-full [&:not(:last-child)]:mr-[2px]"
            style={{ background: c.color }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-[12.5px]">
        {cats.slice(0, 4).map((c, i) => (
          <motion.li
            key={c.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.06 }}
            className="flex items-center gap-2 text-mist"
          >
            <span className="size-2 rounded-full" style={{ background: c.color }} />
            <span className="flex-1 truncate">{c.name}</span>
            <span className="text-white tabular">{formatEUR(c.value)}</span>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

function SavingsAnswer() {
  const [rate, setRate] = useState(0);
  const target = 31;
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <div className="relative grid size-[84px] shrink-0 place-items-center">
        <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="6" />
          <motion.circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="url(#sav)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - target / 100) }}
            transition={{ delay: 0.4, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            onAnimationStart={() => setRate(target)}
          />
          <defs>
            <linearGradient id="sav" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5ef0ff" />
              <stop offset="1" stopColor="#1f7bff" />
            </linearGradient>
          </defs>
        </svg>
        <NumberFlow value={rate} suffix="%" className="text-xl font-semibold text-white" />
      </div>
      <p className="text-[15.5px] leading-relaxed text-fog">
        <Spoken text="Your savings rate this month is 31%. You've put away €1,780 of €5,740 income, four points above your three-month average." />
      </p>
    </div>
  );
}

function SendAnswer({ onClose }: { onClose: () => void }) {
  const janet = contacts.find((c) => c.id === "janet")!;
  return (
    <>
      <p className="text-[15.5px] leading-relaxed text-fog">
        <Spoken text="Done, I've prepared it. Have a quick look and confirm when you're ready." />
      </p>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 flex items-center gap-3.5 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.06]"
      >
        <ContactAvatar contact={janet} className="size-11" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] text-white">{janet.name}</div>
          <div className="text-[12.5px] text-mist">Instant · No fee</div>
        </div>
        <div className="text-xl font-semibold text-white tabular">€10.00</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-3 flex gap-2"
      >
        <Link
          href="/send?to=janet&amount=10"
          className="group focus-ring flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-electric text-[14.5px] font-medium text-white shadow-[0_8px_24px_-8px_rgb(31_123_255/0.9)] transition-colors hover:bg-electric-soft"
        >
          Review and send
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring h-11 cursor-pointer rounded-full px-5 text-[14.5px] text-fog transition-colors hover:bg-white/5 hover:text-white"
        >
          Not now
        </button>
      </motion.div>
    </>
  );
}

export function TellerBubble({ state, onClose, className }: { state: TellerState; onClose: () => void; className?: string }) {
  const key = state.status === "talking" || state.status === "thinking" ? `${state.status}-${state.intent}` : state.status;
  return (
    <div className={cn("relative", className)} aria-live="polite">
      <AnimatePresence mode="wait">
        {state.status === "intro" && (
          <Bubble key="intro">
            <Header speaking />
            <p className="text-[19px] leading-snug font-medium text-white">
              <Spoken text="Hello Strahil." delay={0.2} />
            </p>
            <p className="mt-1 text-[15px] text-fog">
              <Spoken text="Good to see you. What can I do for you today?" delay={0.6} />
            </p>
          </Bubble>
        )}
        {state.status === "thinking" && (
          <Bubble key={key} compact>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-white">{teller.name}</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-cyan"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
              <span className="text-shimmer text-[13px]">Looking at your accounts</span>
            </div>
          </Bubble>
        )}
        {state.status === "talking" && (
          <Bubble key={key}>
            <Header speaking onClose={onClose} />
            {state.intent === "spent-this-month" && <SpendAnswer />}
            {state.intent === "savings-rate" && <SavingsAnswer />}
            {state.intent === "send-janet" && <SendAnswer onClose={onClose} />}
          </Bubble>
        )}
      </AnimatePresence>
    </div>
  );
}

function Bubble({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(6px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass-strong relative origin-bottom-right overflow-hidden rounded-[22px] rounded-br-md",
        compact ? "inline-flex px-5 py-3.5" : "w-full p-5",
      )}
    >
      <span aria-hidden className="absolute -top-16 -left-10 size-40 rounded-full bg-cyan/15 blur-3xl" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
