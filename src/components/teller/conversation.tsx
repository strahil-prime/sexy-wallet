"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { ArrowRight, Check, ChevronRight, MessageCircleMore, PieChart, Repeat, Sparkles, Split, X } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand/brand-mark";
import { ContactAvatar } from "@/components/ui/avatar";
import { contacts, initialActivity, lastDinnerId, subscriptions, teller, type Contact, type Subscription } from "@/lib/data";
import { useWallet } from "@/lib/wallet-store";
import { useVoiced } from "./voice";
import { cn, formatEUR, formatWhen } from "@/lib/utils";
import type { Intent, TellerState } from "./machine";

const questions: { intent: Intent; label: string; short: string; icon: typeof PieChart }[] = [
  { intent: "money-went", label: "Where did my money go this month?", short: "Where did my money go?", icon: PieChart },
  { intent: "subscriptions", label: "Any subscriptions I forgot about?", short: "Forgotten subscriptions?", icon: Repeat },
  { intent: "split-dinner", label: "Split last night’s dinner with Janet", short: "Split dinner with Janet", icon: Split },
];

export function QuestionChips({ state, onAsk, className }: { state: TellerState; onAsk: (i: Intent) => void; className?: string }) {
  const busy = state.status === "thinking";
  const activeIntent = state.status === "thinking" || state.status === "talking" ? state.intent : null;
  return (
    <div className={cn("no-scrollbar -mx-1.5 flex gap-2 overflow-x-auto px-1.5 py-1.5 [mask-image:linear-gradient(90deg,#000_92%,transparent)] lg:flex-wrap lg:overflow-visible lg:[mask-image:none]", className)}>
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
            transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "group focus-ring relative flex h-10 shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-full border px-4 text-[13.5px] backdrop-blur-xl transition-colors disabled:cursor-wait",
              "border-white bg-white font-medium text-ink-950 shadow-[0_8px_24px_-12px_rgb(255_255_255/0.55)] hover:bg-[#eef6f8]",
              active && "ring-2 ring-cyan ring-offset-2 ring-offset-ink-900",
            )}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <q.icon className="relative size-4 text-electric" strokeWidth={2} />
            <span className="relative hidden sm:inline">{q.label}</span>
            <span className="relative sm:hidden">{q.short}</span>
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
      transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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

function Header({ onClose }: { onClose?: () => void }) {
  // Bars move only while her voice is actually audible; otherwise they rest at the bottom.
  const speaking = useVoiced();
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
  { name: "Groceries", value: 412.18, color: "#2ad1e6", note: "Lidl, 9 visits" },
  { name: "Travel", value: 312, color: "#1f7bff", note: "Airbnb in Lisbon" },
  { name: "Shopping", value: 289.95, color: "#7c5cff", note: "Zara and two online orders" },
  { name: "Dining & coffee", value: 272.8, color: "#5ef0ff", note: "Includes last night's dinner" },
  { name: "Subscriptions", value: 85.93, color: "#8ea3ad", note: "4 active" },
];

function MoneyAnswer() {
  const { activity } = useWallet();
  const sent = useMemo(
    () => activity.filter((a) => a.id.startsWith("tx_")).reduce((s, a) => s - a.amount, 0),
    [activity],
  );
  const cats = sent ? [...spendingCategories, { name: "Transfers", value: sent, color: "#ff8a5b", note: "Sent from the app" }] : spendingCategories;
  const total = cats.reduce((s, c) => s + c.value, 0);
  const top = [...cats].sort((a, b) => b.value - a.value);
  const pct = (v: number) => Math.round((v / total) * 100);
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });
  return (
    <>
      <p className="text-[15.5px] leading-relaxed text-fog">
        <Spoken
          text={`You've spent ${formatEUR(total)} in ${month}. Most of it went on ${top[0].name.toLowerCase()} (${pct(top[0].value)}%), then ${top[1].name.toLowerCase()}, which was mostly your Airbnb.`}
        />
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
      <ul className="mt-3.5 space-y-2 text-[13px]">
        {top.map((c, i) => (
          <motion.li
            key={c.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.06 }}
            className="flex items-center gap-2.5"
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} />
            <span className="w-[112px] shrink-0 truncate text-white">{c.name}</span>
            <span className="min-w-0 flex-1 truncate text-mist">{c.note}</span>
            <span className="w-9 shrink-0 text-right text-mist tabular">{pct(c.value)}%</span>
            <span className="w-[72px] shrink-0 text-right text-white tabular">{formatEUR(c.value)}</span>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

function SubscriptionsAnswer() {
  const { cancelled, cancelSubscription, restoreSubscription } = useWallet();
  const monthly = subscriptions.reduce((s, x) => s + x.monthly, 0);
  const saving = subscriptions.filter((x) => cancelled.includes(x.id)).reduce((s, x) => s + x.monthly * 12, 0);
  const forgotten = subscriptions.find((x) => x.forgotten)!;

  const cancel = (sub: Subscription) => {
    cancelSubscription(sub.id);
    toast(`${sub.name} cancelled`, {
      description: `No more charges. That's ${formatEUR(sub.monthly * 12)} a year back in your pocket.`,
      action: { label: "Undo", onClick: () => restoreSubscription(sub.id) },
    });
  };

  return (
    <>
      <p className="text-[15.5px] leading-relaxed text-fog">
        <Spoken
          text={`You pay ${formatEUR(monthly)} a month for ${subscriptions.length} subscriptions. One looks forgotten: ${forgotten.name.split(" ")[0]} still charges you, but you haven't listened since July.`}
        />
      </p>
      <ul className="mt-4 space-y-1.5">
        {subscriptions.map((sub, i) => {
          const off = cancelled.includes(sub.id);
          return (
            <motion.li
              key={sub.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-2.5 pr-3 ring-1 transition-colors",
                sub.forgotten && !off ? "bg-[#ffb547]/[0.08] ring-[#ffb547]/30" : "bg-white/[0.03] ring-white/[0.05]",
              )}
            >
              <BrandLogo brand={sub.brand} className={cn("size-9 transition-opacity [&_svg]:size-[18px]", off && "opacity-40")} />
              <div className="min-w-0 flex-1">
                <div className={cn("flex items-center gap-2 text-[14px] text-white", off && "text-mist line-through")}>
                  <span className="truncate">{sub.name}</span>
                  {sub.forgotten && !off && (
                    <span className="hidden shrink-0 rounded-full bg-[#ffb547]/15 px-1.5 2xl:inline py-px text-[10px] font-semibold tracking-wider text-[#ffb547] uppercase">
                      Unused
                    </span>
                  )}
                </div>
                <div className={cn("truncate text-[12px]", sub.forgotten && !off ? "text-[#ffcf85]" : "text-mist")}>
                  <span className="sm:hidden">{formatEUR(sub.monthly)}/mo · </span>
                  {off ? "Cancelled, no more charges" : sub.usage}
                </div>
              </div>
              <span className={cn("hidden text-[13.5px] text-white tabular sm:inline", off && "text-mist line-through")}>{formatEUR(sub.monthly)}</span>
              <AnimatePresence mode="popLayout" initial={false}>
                {off ? (
                  <motion.span
                    key="done"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="grid h-8 w-[72px] place-items-center"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-positive/15 text-positive">
                      <Check className="size-3.5" strokeWidth={2.5} />
                    </span>
                  </motion.span>
                ) : (
                  <motion.button
                    key="cancel"
                    type="button"
                    onClick={() => cancel(sub)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "focus-ring h-8 w-[72px] cursor-pointer rounded-full text-[12.5px] font-medium transition-colors",
                      sub.forgotten
                        ? "bg-white text-ink-950 hover:bg-white/85"
                        : "text-mist ring-1 ring-white/10 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Cancel
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
      <AnimatePresence initial={false}>
        {saving > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center gap-2 text-[13px] text-positive">
              <Sparkles className="size-4" strokeWidth={1.8} />
              You&apos;re saving
              <NumberFlow value={saving} format={{ style: "currency", currency: "EUR" }} locales="en-IE" className="font-semibold tabular" />
              a year
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const me: Contact = { id: "me", name: "Strahil", handle: "@strahil", iban: "", hue: ["#2ad1e6", "#1f7bff"] };

function SplitAnswer({ onClose }: { onClose: () => void }) {
  const { activity, request } = useWallet();
  const janet = contacts.find((c) => c.id === "janet")!;
  const dinner = activity.find((a) => a.id === lastDinnerId) ?? initialActivity.find((a) => a.id === lastDinnerId)!;
  const total = -dinner.amount;
  const half = Math.round((total / 2) * 100) / 100;
  const note = `Dinner at ${dinner.title}`;
  const requested = activity.some((a) => a.pending && a.category === note);

  const send = () => {
    request(janet, half, note);
    toast(`Request sent to ${janet.name.split(" ")[0]}`, { description: `${formatEUR(half)} for your dinner at ${dinner.title}. We'll let you know when Janet pays.` });
  };

  return (
    <>
      <p className="text-[15.5px] leading-relaxed text-fog">
        <Spoken text={`Last night's dinner at ${dinner.title} came to ${formatEUR(total)}. Split evenly, Janet owes you ${formatEUR(half)}.`} />
      </p>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <BrandMark activity={dinner} className="size-10" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] text-white">{dinner.title}</div>
            <div className="text-[12px] text-mist" suppressHydrationWarning>
              {formatWhen(new Date(dinner.at))}
              <span className="hidden sm:inline"> · Aurora card</span>
            </div>
          </div>
          <div className="text-[15px] font-medium text-white tabular">{formatEUR(total)}</div>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {[me, janet].map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: i ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-2.5 py-2"
            >
              <ContactAvatar contact={p} className="size-8 text-[11px]" />
              <div className="min-w-0">
                <div className="truncate text-[12px] text-mist">{i ? "Janet" : "You"}</div>
                <div className="text-[14px] font-medium text-white tabular">{formatEUR(half)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-3 flex gap-2"
      >
        <AnimatePresence mode="wait" initial={false}>
          {requested ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-positive/12 text-[14.5px] font-medium text-positive ring-1 ring-positive/25"
            >
              <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                <Check className="size-4" strokeWidth={2.5} />
              </motion.span>
              Requested {formatEUR(half)}
              <span className="-ml-1 hidden sm:inline">from Janet</span>
            </motion.div>
          ) : (
            <motion.button
              key="ask"
              type="button"
              onClick={send}
              exit={{ opacity: 0, scale: 0.96 }}
              whileTap={{ scale: 0.97 }}
              className="group focus-ring flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-electric text-[14.5px] font-medium text-white shadow-[0_8px_24px_-8px_rgb(31_123_255/0.9)] transition-colors hover:bg-electric-soft"
            >
              Request {formatEUR(half)}
              <span className="-ml-1 hidden sm:inline">from Janet</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring h-11 cursor-pointer rounded-full px-5 text-[14.5px] text-fog transition-colors hover:bg-white/5 hover:text-white"
        >
          {requested ? "Done" : "Not now"}
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
          // Desktop only: on mobile the greeting card would push the quick buttons down. It is
          // hidden on the card itself, so it stays hidden while it animates out too.
          <Bubble key="intro" className="max-lg:hidden">
            <Header />
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
            <Header onClose={onClose} />
            {state.intent === "money-went" && <MoneyAnswer />}
            {state.intent === "subscriptions" && <SubscriptionsAnswer />}
            {state.intent === "split-dinner" && <SplitAnswer onClose={onClose} />}
          </Bubble>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Matches rounded-[22px] rounded-br-md: top-left, top-right, bottom-right, bottom-left. */
const bubbleClip = "inset(0 round 22px 22px 6px 22px)";

/**
 * The frosted glass, its glow and its drop shadow sit on separate layers, and the glass is cut
 * with clip-path. Clipping a backdrop-filter with only border-radius + overflow-hidden is
 * unreliable once the element is animated on the GPU: the blur and glow then show as a square
 * box behind the rounded corners.
 */
function Bubble({ children, compact, className }: { children: React.ReactNode; compact?: boolean; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative origin-bottom-right", compact ? "inline-flex px-5 py-3.5" : "w-full p-5", className)}
    >
      <span aria-hidden className="absolute inset-0 rounded-[22px] rounded-br-md shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]" />
      <span
        aria-hidden
        className="glass-strong absolute inset-0 overflow-hidden rounded-[22px] rounded-br-md shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]"
        style={{ clipPath: bubbleClip, WebkitClipPath: bubbleClip }}
      >
        <span className="absolute -top-16 -left-10 size-40 rounded-full bg-cyan/15 blur-3xl" />
      </span>
      <div className="relative">{children}</div>
    </motion.div>
  );
}
