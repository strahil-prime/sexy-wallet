"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Nfc,
  RefreshCcw,
  ScanFace,
  ShoppingBag,
  Snowflake,
  Wallet,
} from "lucide-react";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { comingSoon } from "@/components/shell/coming-soon";
import { ActivityRow } from "@/components/dashboard/activity-list";
import { Panel } from "@/components/ui/panel";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { walletCards } from "@/lib/data";
import { useWallet, type CardSettings } from "@/lib/wallet-store";
import { cn, formatEUR } from "@/lib/utils";
import { PaymentCard } from "./payment-card";

gsap.registerPlugin(ScrambleTextPlugin);

const REVEAL_SECONDS = 30;

export function CardView() {
  const { cards, updateCard, activity } = useWallet();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const card = walletCards[index];
  const settings = cards[card.id];

  const [phase, setPhase] = useState<"hidden" | "verifying" | "revealed">("hidden");
  const hide = useCallback(() => setPhase("hidden"), []);
  const reveal = useCallback(() => setPhase("revealed"), []);

  const select = (i: number) => {
    if (i === index) return;
    setDirection(i > index ? 1 : -1);
    setPhase("hidden");
    setIndex(i);
  };

  const toggleFreeze = () => {
    const frozen = !settings.frozen;
    updateCard(card.id, { frozen });
    if (frozen) setPhase("hidden");
    toast(frozen ? `${card.name} card frozen` : `${card.name} card is active again`, {
      description: frozen ? "Payments will be declined until you unfreeze it." : "You can pay with it straight away.",
      action: frozen ? { label: "Undo", onClick: () => updateCard(card.id, { frozen: false }) } : undefined,
      id: "freeze",
    });
  };

  const cardTx = activity.filter((a) => a.card).slice(0, 5);

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Your cards" subtitle="Manage, freeze and secure your cards" />

      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Left: card stage */}
        <div className="flex flex-col gap-5">
          <Panel className="overflow-hidden px-5 pt-5 pb-7 sm:px-8">
            <CardTabs index={index} onSelect={select} />

            <div className="relative mx-auto mt-8 w-full max-w-[440px]">
              <div aria-hidden className="absolute inset-x-6 -bottom-8 h-16 rounded-full bg-electric/30 blur-3xl" />
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={card.id}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ x: d * 120, opacity: 0, rotateY: d * -25, scale: 0.92 }),
                    center: { x: 0, opacity: 1, rotateY: 0, scale: 1 },
                    exit: (d: number) => ({ x: d * -120, opacity: 0, rotateY: d * 25, scale: 0.92 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  className="[perspective:1200px]"
                >
                  <PaymentCard
                    card={card}
                    frozen={settings.frozen}
                    flipped={phase === "revealed"}
                    backSlot={<CardDetails key={card.id} card={card} active={phase === "revealed"} />}
                  />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {phase === "verifying" && <VerifyOverlay onDone={reveal} />}
              </AnimatePresence>
            </div>

            <div className="mx-auto mt-10 grid max-w-[520px] grid-cols-4 gap-2">
              <CardAction
                icon={phase === "revealed" ? EyeOff : Eye}
                label={phase === "revealed" ? "Hide details" : "Show details"}
                disabled={settings.frozen}
                active={phase === "revealed"}
                onClick={() => setPhase((p) => (p === "hidden" ? "verifying" : "hidden"))}
              >
                {phase === "revealed" && <Countdown seconds={REVEAL_SECONDS} onEnd={hide} />}
              </CardAction>
              <CardAction icon={Snowflake} label={settings.frozen ? "Unfreeze" : "Freeze"} active={settings.frozen} tone="ice" onClick={toggleFreeze} />
              <CardAction icon={Wallet} label="Add to Wallet" onClick={() => comingSoon("Apple Wallet")} />
              <CardAction icon={RefreshCcw} label="Replace" onClick={() => comingSoon("Card replacement")} />
            </div>
          </Panel>

          <SpendPanel limit={settings.monthlyLimit} />
        </div>

        {/* Right: controls */}
        <div className="flex flex-col gap-5">
          <ControlsPanel settings={settings} onChange={(p) => updateCard(card.id, p)} />
          <Panel className="px-6 pt-5 pb-2 sm:px-7">
            <div className="relative mb-1 flex items-center justify-between">
              <span className="text-[17px] font-medium text-white">Card payments</span>
              <span className="text-[13px] text-mist">•• {card.last4}</span>
            </div>
            <ul className="relative">
              {cardTx.map((a, i) => (
                <ActivityRow key={a.id} a={a} index={i} />
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CardTabs({ index, onSelect }: { index: number; onSelect: (i: number) => void }) {
  return (
    <div className="relative mx-auto flex w-fit rounded-full bg-white/[0.05] p-1 ring-1 ring-white/[0.06]">
      {walletCards.map((c, i) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "focus-ring relative h-10 cursor-pointer rounded-full px-5 text-[14px] transition-colors",
            i === index ? "text-white" : "text-mist hover:text-fog",
          )}
        >
          {i === index && (
            <motion.span
              layoutId="card-tab"
              className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">
            {c.name} <span className="text-mist">· {c.kind}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function CardAction({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  tone = "electric",
  children,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "electric" | "ice";
  children?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      className="group focus-ring flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl disabled:cursor-not-allowed disabled:opacity-35"
    >
      <span
        className={cn(
          "relative grid size-14 place-items-center rounded-full ring-1 transition-all duration-300 sm:size-16",
          active
            ? tone === "ice"
              ? "bg-cyan/20 text-aqua ring-cyan/40 shadow-[0_0_30px_-4px_rgb(42_209_230/0.6)]"
              : "bg-electric/20 text-electric-soft ring-electric/40"
            : "bg-white/[0.06] text-white ring-white/[0.06] group-hover:bg-white/[0.1] group-enabled:group-hover:-translate-y-0.5",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Icon className="size-6" strokeWidth={1.7} />
          </motion.span>
        </AnimatePresence>
        {children}
      </span>
      <span className="text-center text-[12.5px] leading-tight text-fog sm:text-[13.5px]">{label}</span>
    </motion.button>
  );
}

/** Ring that drains while card details are visible. */
function Countdown({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  useEffect(() => {
    const t = setTimeout(onEnd, seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds, onEnd]);
  return (
    <svg viewBox="0 0 64 64" className="pointer-events-none absolute inset-0 -rotate-90">
      <motion.circle
        cx="32"
        cy="32"
        r="30.5"
        fill="none"
        stroke="#4c97ff"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 1 }}
        animate={{ pathLength: 0 }}
        transition={{ duration: seconds, ease: "linear" }}
      />
    </svg>
  );
}

function VerifyOverlay({ onDone }: { onDone: () => void }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setOk(true), 1300);
    const b = setTimeout(onDone, 1900);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-20 grid place-items-center rounded-[18px] bg-ink-950/70 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative grid size-20 place-items-center">
          <AnimatePresence mode="popLayout">
            {ok ? (
              <motion.span
                key="ok"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="grid size-16 place-items-center rounded-full bg-positive/20 text-positive ring-1 ring-positive/50"
              >
                <Check className="size-8" strokeWidth={2.4} />
              </motion.span>
            ) : (
              <motion.span key="scan" exit={{ scale: 0.6, opacity: 0 }} className="relative text-aqua">
                <ScanFace className="size-16" strokeWidth={1.2} />
                <motion.span
                  className="absolute inset-x-0 h-0.5 rounded-full bg-aqua shadow-[0_0_14px_3px_rgb(94_240_255/0.7)]"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[14px] text-fog">{ok ? "Verified" : "Confirming it's you"}</span>
      </div>
    </motion.div>
  );
}

function CardDetails({ card, active }: { card: (typeof walletCards)[number]; active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!active || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-scramble]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { scrambleText: { text: el.dataset.mask!, chars: "0123456789" } },
          {
            delay: 0.45 + i * 0.12,
            duration: 1.1,
            scrambleText: { text: el.dataset.scramble!, chars: "0123456789", speed: 0.6, revealDelay: 0.25 },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, [active]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.number.replace(/\s/g, ""));
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div ref={root} className="flex flex-col gap-[6%] text-white">
      <div>
        <div className="text-[10px] tracking-[0.2em] text-white/50 uppercase">Card number</div>
        <div className="mt-1 flex items-center gap-2">
          <span
            data-scramble={card.number}
            data-mask={"•••• •••• •••• " + card.last4}
            className="font-mono text-[clamp(14px,5.2cqw,22px)] tracking-[0.08em] tabular"
          >
            {active ? card.number : "•••• •••• •••• " + card.last4}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy card number"
            className="focus-ring grid size-8 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={copied ? "y" : "n"} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
                {copied ? <Check className="size-4 text-positive" /> : <Copy className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
      <div className="flex gap-8">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/50 uppercase">Expires</div>
          <div data-scramble={card.expiry} data-mask="••/••" className="mt-1 font-mono text-[clamp(13px,4.4cqw,18px)] tabular">
            {active ? card.expiry : "••/••"}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/50 uppercase">CVV</div>
          <div data-scramble={card.cvv} data-mask="•••" className="mt-1 font-mono text-[clamp(13px,4.4cqw,18px)] tabular">
            {active ? card.cvv : "•••"}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] tracking-[0.2em] text-white/50 uppercase">Holder</div>
          <div className="mt-1 text-[clamp(13px,4.4cqw,18px)]">{card.holder}</div>
        </div>
      </div>
    </div>
  );
}

const controls: { key: keyof CardSettings; label: string; hint: string; icon: typeof Globe }[] = [
  { key: "online", label: "Online payments", hint: "Shopping and subscriptions", icon: ShoppingBag },
  { key: "contactless", label: "Contactless", hint: "Tap to pay in stores", icon: Nfc },
  { key: "atm", label: "ATM withdrawals", hint: "Cash from any ATM", icon: Landmark },
  { key: "abroad", label: "Payments abroad", hint: "Outside the eurozone", icon: Globe },
];

function ControlsPanel({ settings, onChange }: { settings: CardSettings; onChange: (p: Partial<CardSettings>) => void }) {
  const presets = [1000, 2500, 5000];
  return (
    <Panel className="px-6 py-5 sm:px-7">
      <div className="relative flex items-center justify-between">
        <span className="text-[17px] font-medium text-white">Security and controls</span>
        <AnimatePresence>
          {settings.frozen && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 rounded-full bg-cyan/15 px-2.5 py-1 text-[12px] font-medium text-aqua"
            >
              <Snowflake className="size-3.5" /> Frozen
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <ul className={cn("relative mt-3 transition-opacity duration-500", settings.frozen && "pointer-events-none opacity-40")}>
        {controls.map((c, i) => {
          const on = settings[c.key] as boolean;
          return (
            <motion.li
              key={c.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 py-3.5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-hairline"
            >
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-2xl ring-1 transition-colors duration-300",
                  on ? "bg-electric/15 text-electric-soft ring-electric/25" : "bg-white/[0.05] text-mist ring-white/[0.06]",
                )}
              >
                <c.icon className="size-5" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-white">{c.label}</span>
                <span className="block text-[13px] text-mist">{c.hint}</span>
              </span>
              <Switch checked={on} onCheckedChange={(v) => onChange({ [c.key]: v })} aria-label={c.label} />
            </motion.li>
          );
        })}
      </ul>

      <div className={cn("relative mt-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.05] transition-opacity", settings.frozen && "pointer-events-none opacity-40")}>
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] text-fog">Monthly spending limit</span>
          <NumberFlow
            value={settings.monthlyLimit}
            locales="en-IE"
            format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
            className="text-xl font-semibold text-white"
          />
        </div>
        <Slider
          className="mt-4"
          min={250}
          max={10000}
          step={250}
          value={[settings.monthlyLimit]}
          onValueChange={([v]) => onChange({ monthlyLimit: v })}
        />
        <div className="mt-3 flex gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ monthlyLimit: p })}
              className={cn(
                "focus-ring h-8 cursor-pointer rounded-full px-3 text-[12.5px] ring-1 transition-colors",
                settings.monthlyLimit === p ? "bg-electric/20 text-white ring-electric/40" : "text-mist ring-white/10 hover:text-white",
              )}
            >
              {formatEUR(p).replace(".00", "")}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

const daily = [42, 18, 64, 9, 120, 36, 22, 312, 15, 48, 89.95, 27, 61, 49];

function SpendPanel({ limit }: { limit: number }) {
  const spent = 1276.51;
  const max = Math.max(...daily);
  const pct = Math.min(100, (spent / limit) * 100);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <Panel className="px-6 py-5 sm:px-7">
      <div className="relative flex items-end justify-between gap-4">
        <div>
          <div className="text-[14px] text-mist">Spent this month</div>
          <div className="mt-1 text-[28px] font-semibold tracking-tight text-white tabular">
            {formatEUR(spent)}
            <span className="ml-2 text-[15px] font-normal text-mist">of {formatEUR(limit).replace(".00", "")}</span>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", pct > 85 ? "bg-negative/15 text-negative" : "bg-positive/10 text-positive")}>
          {Math.round(pct)}% used
        </span>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan to-electric"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="relative mt-6 flex h-28 items-end gap-1.5" onPointerLeave={() => setHover(null)}>
        {daily.map((v, i) => (
          <div key={i} className="relative flex h-full flex-1 items-end" onPointerEnter={() => setHover(i)}>
            <AnimatePresence>
              {hover === i && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-ink-950"
                >
                  {formatEUR(v)}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              className={cn(
                "w-full rounded-t-md rounded-b-sm transition-colors",
                hover === i ? "bg-aqua" : i === daily.length - 1 ? "bg-electric" : "bg-white/15",
              )}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(6, (v / max) * 100)}%` }}
              transition={{ delay: 0.2 + i * 0.03, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="relative mt-2 flex justify-between text-[11.5px] text-mist">
        <span>14 days ago</span>
        <span>Today</span>
      </div>
    </Panel>
  );
}
