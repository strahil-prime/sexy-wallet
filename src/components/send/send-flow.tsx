"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, LayoutGroup, animate, motion, useAnimate, useMotionValue, useTransform } from "motion/react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Delete,
  Fingerprint,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { comingSoon } from "@/components/shell/coming-soon";
import { ContactAvatar } from "@/components/ui/avatar";
import { Panel } from "@/components/ui/panel";
import { contacts, type Contact } from "@/lib/data";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR } from "@/lib/utils";

type Step = "recipient" | "amount" | "review" | "processing" | "success";
const steps: { id: Step; label: string }[] = [
  { id: "recipient", label: "Recipient" },
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
];
const order: Step[] = ["recipient", "amount", "review", "processing", "success"];

const ease = [0.16, 1, 0.3, 1] as const;

export function SendFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { balance, send } = useWallet();

  const preset = contacts.find((c) => c.id === params.get("to")) ?? null;
  const presetAmount = params.get("amount");
  const [step, setStep] = useState<Step>(preset && presetAmount ? "review" : preset ? "amount" : "recipient");
  const [direction, setDirection] = useState(1);
  const [to, setTo] = useState<Contact | null>(preset);
  const [raw, setRaw] = useState(presetAmount ?? "");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; at: Date; balanceAfter: number } | null>(null);

  const amount = Number(raw.replace(",", ".")) || 0;

  const go = useCallback((next: Step) => {
    setDirection(order.indexOf(next) >= order.indexOf(step) ? 1 : -1);
    setStep(next);
  }, [step]);

  const confirm = () => {
    if (!to) return;
    go("processing");
    setTimeout(() => {
      const tx = send(to, amount, note);
      setReceipt({ id: tx.id.replace("tx_", "SW-").toUpperCase(), at: new Date(), balanceAfter: balance - amount });
      setDirection(1);
      setStep("success");
    }, 1700);
  };

  const restart = () => {
    setTo(null);
    setRaw("");
    setNote("");
    setReceipt(null);
    router.replace("/send");
    go("recipient");
  };

  const back = () => {
    const i = order.indexOf(step);
    if (i > 0 && step !== "processing" && step !== "success") go(order[i - 1]);
  };

  // Mobile scrolls the whole page, so start each step from the top.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) window.scrollTo({ top: 0 });
  }, [step]);

  const canGoBack = step === "amount" || step === "review";

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader
        title="Send money"
        subtitle="Instant transfers across Europe, no fees"
        compactOnMobile
        onMobileBack={canGoBack ? back : undefined}
      />

      <LayoutGroup>
        <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Panel spotlight={false} className="overflow-hidden lg:min-h-[640px]">
            {step !== "success" && step !== "processing" && (
              <Stepper step={step} onBack={step !== "recipient" ? back : undefined} />
            )}
            <div className="relative">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: d * 48, filter: "blur(6px)" }),
                    center: { opacity: 1, x: 0, filter: "blur(0px)" },
                    exit: (d: number) => ({ opacity: 0, x: d * -48, filter: "blur(6px)" }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease }}
                >
                  {step === "recipient" && (
                    <RecipientStep
                      selected={to}
                      onPick={(c) => {
                        setTo(c);
                        setTimeout(() => go("amount"), 260);
                      }}
                    />
                  )}
                  {step === "amount" && to && (
                    <AmountStep
                      to={to}
                      raw={raw}
                      setRaw={setRaw}
                      note={note}
                      setNote={setNote}
                      balance={balance}
                      onNext={() => go("review")}
                    />
                  )}
                  {step === "review" && to && (
                    <ReviewStep to={to} amount={amount} note={note} balance={balance} onEdit={() => go("amount")} onConfirm={confirm} />
                  )}
                  {step === "processing" && to && <Processing to={to} amount={amount} />}
                  {step === "success" && to && receipt && <Success to={to} amount={amount} note={note} receipt={receipt} onAgain={restart} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Panel>

          <Summary to={to} amount={amount} balance={step === "success" && receipt ? receipt.balanceAfter + amount : balance} step={step} />
        </div>
      </LayoutGroup>
    </div>
  );
}

function Stepper({ step, onBack }: { step: Step; onBack?: () => void }) {
  const current = steps.findIndex((s) => s.id === step);
  return (
    // Desktop only: on mobile it costs too much height, and the page header's back arrow steps back instead.
    <div className="hidden items-center gap-4 border-b border-hairline px-5 py-4 sm:px-8 lg:flex">
      <motion.button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        whileTap={{ scale: 0.9 }}
        aria-label="Previous step"
        className="focus-ring grid size-9 cursor-pointer place-items-center rounded-full text-fog transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-0"
      >
        <ArrowLeft className="size-[18px]" />
      </motion.button>
      <ol className="flex flex-1 items-center gap-2">
        {steps.map((s, i) => (
          <li key={s.id} className="flex flex-1 flex-col gap-2">
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan to-electric"
                initial={false}
                animate={{ width: i <= current ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease }}
              />
            </div>
            <span className={cn("text-[12px] transition-colors", i <= current ? "text-white" : "text-mist")}>
              {i + 1}. {s.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────── Recipient ───────────────────────── */

function RecipientStep({ selected, onPick }: { selected: Contact | null; onPick: (c: Contact) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () => contacts.filter((c) => (c.name + c.handle).toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  const favourites = contacts.filter((c) => c.favourite);

  return (
    <div className="px-5 py-5 sm:px-8 lg:py-6">
      <h2 className="text-[22px] font-semibold tracking-tight text-white">Who are you sending to?</h2>

      <label className="group mt-5 flex h-14 items-center gap-3 rounded-2xl bg-white/[0.04] px-4 ring-1 ring-white/[0.07] transition focus-within:bg-white/[0.06] focus-within:ring-cyan/40">
        <Search className="size-5 text-mist transition-colors group-focus-within:text-cyan" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, @handle or IBAN"
          className="h-full flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-mist"
        />
        <AnimatePresence>
          {q && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-[12px] text-mist">
              {list.length} found
            </motion.span>
          )}
        </AnimatePresence>
      </label>

      <AnimatePresence initial={false}>
        {!q && (
          <motion.div
            // Clip only while collapsing or expanding, so the hover glow isn't cut off once open.
            initial={{ opacity: 0, height: 0, overflow: "hidden" }}
            animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }}
            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
          >
            <div className="mt-7 flex items-center gap-2 text-[13px] text-mist">
              <Star className="size-3.5 text-cyan" /> Favourites
            </div>
            {/* A scroll row clips on both axes, so it gets room for the glow: padding, pulled back with negative margins. */}
            <div className="no-scrollbar -mx-6 -mt-2 flex gap-2 overflow-x-auto px-6 pt-5 pb-4">
              {favourites.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c)}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.94 }}
                  className="group focus-ring flex w-[92px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl py-2"
                >
                  <span className="relative">
                    <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan to-electric opacity-0 blur-md transition-opacity group-hover:opacity-60" />
                    {selected?.id === c.id ? (
                      <motion.span layoutId={`avatar-${c.id}`} className="relative block">
                        <ContactAvatar contact={c} className="size-16 text-base" />
                      </motion.span>
                    ) : (
                      <ContactAvatar contact={c} className="relative size-16 text-base" />
                    )}
                  </span>
                  <span className="text-[13px] text-fog group-hover:text-white">{c.name.split(" ")[0]}</span>
                </motion.button>
              ))}
              <motion.button
                type="button"
                onClick={() => comingSoon("New recipient")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease }}
                whileHover={{ y: -4 }}
                className="group focus-ring flex w-[92px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl py-2"
              >
                <span className="grid size-16 place-items-center rounded-full border border-dashed border-white/20 text-mist transition-colors group-hover:border-cyan/60 group-hover:text-cyan">
                  <Plus className="size-6" />
                </span>
                <span className="text-[13px] text-mist">New</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 mb-1 text-[13px] text-mist">{q ? "Results" : "All contacts"}</div>
      <motion.ul layout className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          {list.map((c, i) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.035, duration: 0.4, ease } }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
            >
              <button
                type="button"
                onClick={() => onPick(c)}
                className="group focus-ring relative flex w-full cursor-pointer items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <ContactAvatar contact={c} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] text-white">{c.name}</span>
                  <span className="block truncate text-[13px] text-mist">
                    {c.handle} · {c.iban.slice(0, 4)} •••• {c.iban.replace(/\s/g, "").slice(-4)}
                  </span>
                </span>
                <ArrowRight className="size-4 -translate-x-2 text-cyan opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {list.length === 0 && (
          <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 py-10 text-center">
            <Building2 className="size-8 text-mist" strokeWidth={1.4} />
            <span className="text-[15px] text-white">No one by that name yet</span>
            <button type="button" onClick={() => comingSoon("Send to IBAN")} className="cursor-pointer text-[13px] text-cyan hover:underline">
              Send to a new IBAN instead
            </button>
          </motion.li>
        )}
      </motion.ul>
    </div>
  );
}

/* ───────────────────────── Amount ───────────────────────── */

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
const notes = ["🍕 Dinner", "🎁 Gift", "🏠 Rent", "✈️ Trip"];

function AmountStep({
  to,
  raw,
  setRaw,
  note,
  setNote,
  balance,
  onNext,
}: {
  to: Contact;
  raw: string;
  setRaw: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  balance: number;
  onNext: () => void;
}) {
  const [scope, animateShake] = useAnimate();
  const amount = Number(raw) || 0;
  const over = amount > balance;
  const valid = amount > 0 && !over;

  const press = useCallback(
    (k: string) => {
      let next = raw;
      if (k === "del") next = raw.slice(0, -1);
      else if (k === ".") next = raw.includes(".") ? raw : (raw || "0") + ".";
      else {
        const [, dec] = raw.split(".");
        if (dec !== undefined && dec.length >= 2) next = raw;
        else if (raw === "0") next = k;
        else next = raw + k;
      }
      if (Number(next) > 99999) next = raw;
      if (next === raw && k !== "del") animateShake(scope.current, { x: [0, -8, 7, -4, 0] }, { duration: 0.35 });
      setRaw(next);
    },
    [raw, setRaw, animateShake, scope],
  );

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "." || e.key === ",") press(".");
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Enter" && valid) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, valid, onNext]);

  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;

  return (
    <div className="flex flex-col items-center px-5 py-4 short:py-3 sm:px-8 lg:py-6">
      <div className="flex items-center gap-3 rounded-full bg-white/[0.04] py-1.5 pr-4 pl-1.5 ring-1 ring-white/[0.06]">
        <motion.span layoutId={`avatar-${to.id}`}>
          <ContactAvatar contact={to} className="size-9 text-xs" />
        </motion.span>
        <span className="text-[14px] text-fog">
          To <span className="text-white">{to.name}</span>
        </span>
      </div>

      <motion.div ref={scope} className={cn("mt-3 flex h-[72px] items-center font-semibold short:mt-1 short:h-[52px] lg:mt-8 lg:h-[96px] tracking-[-0.04em] tabular transition-colors", over ? "text-negative" : amount ? "text-white" : "text-white/30")}>
        <NumberFlow
          value={amount}
          locales="en-IE"
          format={{ style: "currency", currency: "EUR", minimumFractionDigits: decimals, maximumFractionDigits: 2 }}
          suffix={raw.endsWith(".") ? "." : undefined}
          className="text-[54px] leading-none short:text-[42px] sm:text-[64px] lg:text-[80px]"
        />
        <motion.span
          aria-hidden
          className="ml-1 h-[46px] w-[3px] rounded-full bg-cyan short:h-[36px] lg:h-[60px]"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={over ? "over" : "ok"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={cn("mt-1 text-[14px] lg:mt-2", over ? "text-negative" : "text-mist")}
        >
          {over ? `That's more than your ${formatEUR(balance)} balance` : `Available ${formatEUR(balance)}`}
        </motion.p>
      </AnimatePresence>

      <div className="mt-3 flex flex-wrap justify-center gap-2 short:hidden lg:mt-5">
        {[10, 25, 50, 100].map((v) => (
          <motion.button
            key={v}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setRaw(String(v))}
            className={cn(
              "focus-ring h-9 cursor-pointer rounded-full px-4 text-[14px] ring-1 transition-colors",
              amount === v ? "bg-electric/20 text-white ring-electric/50" : "text-fog ring-white/10 hover:bg-white/5 hover:text-white",
            )}
          >
            €{v}
          </motion.button>
        ))}
      </div>

      {/* Phones: key height grows with the screen, so the keypad uses the room the hidden nav freed up. */}
      <div className="mt-3 grid w-full max-w-[340px] grid-cols-3 gap-2 short:mt-3 short:gap-1 lg:mt-6">
        {keys.map((k) => (
          <motion.button
            key={k}
            type="button"
            onClick={() => press(k)}
            whileTap={{ scale: 0.9, backgroundColor: "rgba(42,209,230,0.16)" }}
            aria-label={k === "del" ? "Delete" : k}
            className="focus-ring grid h-[clamp(48px,calc((100svh-500px)/4),68px)] cursor-pointer place-items-center rounded-2xl text-[26px] short:h-10 short:text-[22px] lg:h-14 lg:text-[24px] font-medium text-white transition-colors hover:bg-white/[0.05]"
          >
            {k === "del" ? <Delete className="size-6 text-fog" strokeWidth={1.6} /> : k}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 w-full max-w-[440px] short:mt-2 lg:mt-5">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 40))}
          placeholder="What's it for? (optional)"
          className="h-11 w-full rounded-2xl bg-white/[0.04] px-4 text-[16px] short:h-10 lg:h-12 lg:text-[15px] text-white ring-1 ring-white/[0.07] outline-none transition placeholder:text-mist focus:ring-cyan/40"
        />
        {/* Note suggestions are desktop only; mobile keeps the field and saves the row. */}
        <div className="mt-2 hidden flex-wrap gap-1.5 lg:flex">
          {notes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              className={cn(
                "focus-ring h-8 cursor-pointer rounded-full px-3 text-[12.5px] transition-colors",
                note === n ? "bg-white/15 text-white" : "bg-white/[0.04] text-mist hover:text-white",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <PrimaryButton className="mt-4 w-full max-w-[440px] short:mt-3 short:h-12 lg:mt-7" disabled={!valid} onClick={onNext}>
        Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </PrimaryButton>
    </div>
  );
}

function PrimaryButton({ className, children, ...props }: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group focus-ring relative flex h-14 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-electric text-[16px] font-medium text-white shadow-[0_14px_34px_-12px_rgb(31_123_255/0.9)] transition-[background-color,opacity,box-shadow] hover:bg-electric-soft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-mist disabled:shadow-none",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-enabled:group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">{children as React.ReactNode}</span>
    </motion.button>
  );
}

/* ───────────────────────── Review ───────────────────────── */

function ReviewStep({
  to,
  amount,
  note,
  balance,
  onEdit,
  onConfirm,
}: {
  to: Contact;
  amount: number;
  note: string;
  balance: number;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const rows: [string, React.ReactNode][] = [
    ["From", "Main account · EUR"],
    ["To", <span key="to" className="font-mono text-[13px]">{to.iban}</span>],
    ["Fee", <span key="fee" className="text-positive">Free</span>],
    ["Arrives", <span key="arr" className="inline-flex items-center gap-1.5"><Zap className="size-3.5 text-cyan" /> Instantly</span>],
    ["Balance after", formatEUR(balance - amount)],
  ];
  if (note) rows.splice(2, 0, ["Note", note]);

  return (
    <div className="flex flex-col items-center px-5 py-5 short:py-3 sm:px-8 lg:py-8">
      <motion.span layoutId={`avatar-${to.id}`} className="relative">
        <span className="absolute -inset-3 animate-pulse-ring rounded-full ring-2 ring-cyan/30" />
        <ContactAvatar contact={to} className="size-16 text-lg short:size-12 short:text-sm lg:size-20 lg:text-xl" />
      </motion.span>
      <div className="mt-3 text-[15px] text-mist short:mt-2 short:text-[13px] lg:mt-4">You&apos;re sending</div>
      <div className="mt-1 text-[46px] leading-none short:text-[38px] lg:text-[56px] font-semibold tracking-[-0.04em] text-white tabular">{formatEUR(amount)}</div>
      <div className="mt-2 text-[15px] text-fog">
        to <span className="text-white">{to.name}</span>
        <button type="button" onClick={onEdit} className="focus-ring ml-2 cursor-pointer rounded text-cyan hover:underline">
          Edit
        </button>
      </div>

      <dl className="mt-5 w-full max-w-[460px] short:mt-3 lg:mt-8 rounded-2xl bg-white/[0.03] px-5 ring-1 ring-white/[0.06]">
        {rows.map(([k, v], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.45, ease }}
            className="flex items-center justify-between gap-4 py-3 text-[14.5px] short:py-2 short:text-[13.5px] lg:py-3.5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-hairline"
          >
            <dt className="text-mist">{k}</dt>
            <dd className="truncate text-right text-white">{v}</dd>
          </motion.div>
        ))}
      </dl>

      <HoldToSend className="mt-5 w-full max-w-[460px] short:mt-3 short:h-14 lg:mt-8" onConfirm={onConfirm} />
      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-mist">
        <ShieldCheck className="size-3.5 text-positive" /> Protected by device verification
      </p>
    </div>
  );
}

function HoldToSend({ onConfirm, className }: { onConfirm: () => void; className?: string }) {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (v) => `${v * 100}%`);
  const [holding, setHolding] = useState(false);
  const done = useRef(false);
  const ctrl = useRef<ReturnType<typeof animate>>(null);

  const start = () => {
    if (done.current) return;
    setHolding(true);
    ctrl.current?.stop();
    ctrl.current = animate(progress, 1, {
      duration: 1.1 * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        done.current = true;
        onConfirm();
      },
    });
  };
  const cancel = () => {
    if (done.current) return;
    setHolding(false);
    ctrl.current?.stop();
    ctrl.current = animate(progress, 0, { duration: 0.35, ease: [0.16, 1, 0.3, 1] });
  };

  return (
    <motion.button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={cancel}
      onContextMenu={(e) => e.preventDefault()}
      animate={{ scale: holding ? 0.97 : 1 }}
      className={cn(
        "focus-ring relative h-16 cursor-pointer touch-none overflow-hidden rounded-full bg-white/[0.07] text-[16px] font-medium text-white ring-1 ring-white/10 select-none",
        className,
      )}
    >
      <motion.span className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan to-electric" style={{ width }} />
      <span className="relative flex items-center justify-center gap-2.5">
        <Fingerprint className={cn("size-5 transition-transform", holding && "scale-110")} />
        {holding ? "Keep holding…" : "Hold to send"}
      </span>
    </motion.button>
  );
}

/* ───────────────────────── Processing / Success ───────────────────────── */

function Processing({ to, amount }: { to: Contact; amount: number }) {
  return (
    <div className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center lg:min-h-[600px]">
      <div className="relative grid size-40 place-items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-cyan/40"
            animate={{ scale: [0.6, 1.3], opacity: [0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}
        <motion.span
          className="absolute inset-4 rounded-full border-2 border-transparent border-t-cyan border-r-electric"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.span layoutId={`avatar-${to.id}`}>
          <ContactAvatar contact={to} className="size-20 text-xl" />
        </motion.span>
      </div>
      <p className="mt-8 text-[20px] font-medium text-white">Sending {formatEUR(amount)}</p>
      <p className="text-shimmer mt-1 text-[14px]">Securing your transfer to {to.name.split(" ")[0]}</p>
    </div>
  );
}

function Success({
  to,
  amount,
  note,
  receipt,
  onAgain,
}: {
  to: Contact;
  amount: number;
  note: string;
  receipt: { id: string; at: Date };
  onAgain: () => void;
}) {
  const burst = useRef<HTMLDivElement>(null);

  // Particle burst behind the check mark
  useEffect(() => {
    const el = burst.current;
    if (!el) return;
    const colors = ["#5ef0ff", "#2ad1e6", "#1f7bff", "#7c5cff", "#3ee39a", "#ffffff"];
    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < 36; i++) {
      const s = document.createElement("span");
      const size = 4 + Math.random() * 6;
      Object.assign(s.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${size}px`,
        height: `${size * (Math.random() > 0.5 ? 1 : 2.4)}px`,
        borderRadius: "999px",
        background: colors[i % colors.length],
        boxShadow: `0 0 10px ${colors[i % colors.length]}`,
      });
      el.appendChild(s);
      nodes.push(s);
    }
    const ctx = gsap.context(() => {
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 90 + Math.random() * 120;
        gsap.fromTo(
          n,
          { x: 0, y: 0, scale: 0, opacity: 1, rotation: (angle * 180) / Math.PI + 90 },
          {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            scale: 1,
            opacity: 0,
            duration: 1.1 + Math.random() * 0.6,
            delay: 0.25,
            ease: "expo.out",
          },
        );
      });
    }, el);
    return () => {
      ctx.revert();
      nodes.forEach((n) => n.remove());
    };
  }, []);

  const rows: [string, string][] = [
    ["Reference", receipt.id],
    ["Date", receipt.at.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
    ["Fee", "€0.00"],
  ];
  if (note) rows.push(["Note", note]);

  return (
    <div className="flex flex-col items-center px-5 py-6 text-center sm:px-8 lg:min-h-[600px] lg:py-10">
      <div className="relative grid size-32 place-items-center">
        <div ref={burst} className="pointer-events-none absolute inset-0" />
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className="absolute inset-3 rounded-full bg-gradient-to-br from-positive to-cyan shadow-[0_0_60px_-6px_rgb(62_227_154/0.8)]"
        />
        <svg viewBox="0 0 52 52" className="relative size-14 text-ink-950">
          <motion.path
            d="M14 27l8 8 16-18"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease }}>
        <div className="mt-4 text-[40px] leading-none lg:mt-6 lg:text-[44px] font-semibold tracking-[-0.04em] text-white tabular">{formatEUR(amount)}</div>
        <p className="mt-3 text-[16px] text-fog">
          sent to <span className="text-white">{to.name}</span>. It&apos;s already there.
        </p>
      </motion.div>

      <motion.dl
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease }}
        className="relative mt-5 w-full max-w-[420px] rounded-2xl lg:mt-8 bg-white/[0.03] px-5 text-left ring-1 ring-white/[0.06]"
      >
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-3 text-[14px] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-dashed [&:not(:last-child)]:border-hairline">
            <dt className="text-mist">{k}</dt>
            <dd className="font-medium text-white">{v}</dd>
          </div>
        ))}
      </motion.dl>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.6, ease }}
        className="mt-5 flex w-full max-w-[420px] flex-col gap-2.5 lg:mt-8"
      >
        <Link
          href="/"
          className="group focus-ring flex h-14 items-center justify-center gap-2 rounded-full bg-electric text-[16px] font-medium text-white shadow-[0_14px_34px_-12px_rgb(31_123_255/0.9)] transition-colors hover:bg-electric-soft"
        >
          Back to home
        </Link>
        <div className="flex gap-2.5">
          <button type="button" onClick={onAgain} className="focus-ring h-12 flex-1 cursor-pointer rounded-full bg-white/[0.06] text-[14.5px] text-white ring-1 ring-white/10 transition-colors hover:bg-white/10">
            Send again
          </button>
          <button
            type="button"
            onClick={() => comingSoon("Sharing receipts")}
            className="focus-ring flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] text-[14.5px] text-white ring-1 ring-white/10 transition-colors hover:bg-white/10"
          >
            <Share2 className="size-4" /> Share receipt
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Summary rail ───────────────────────── */

function Summary({ to, amount, balance, step }: { to: Contact | null; amount: number; balance: number; step: Step }) {
  const show = step !== "success";
  return (
    <div className="hidden xl:block">
      <Panel className="sticky top-6 p-6">
        <div className="relative text-[13px] font-medium tracking-wider text-mist uppercase">Transfer summary</div>
        <div className="relative mt-5 flex items-center gap-3.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {to ? (
              <motion.div key={to.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}>
                <ContactAvatar contact={to} />
              </motion.div>
            ) : (
              <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="size-12 rounded-full border border-dashed border-white/20" />
            )}
          </AnimatePresence>
          <div className="min-w-0">
            <div className="truncate text-[15.5px] text-white">{to?.name ?? "Choose a recipient"}</div>
            <div className="text-[13px] text-mist">{to ? to.handle : "Anyone with an IBAN"}</div>
          </div>
        </div>

        <div className="relative mt-6 border-t border-hairline pt-5">
          <div className="text-[13px] text-mist">Amount</div>
          <NumberFlow
            value={amount}
            locales="en-IE"
            format={{ style: "currency", currency: "EUR", minimumFractionDigits: 2 }}
            className="mt-1 text-[34px] font-semibold tracking-tight text-white"
          />
        </div>

        <dl className="relative mt-4 space-y-3 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-mist">Fee</dt>
            <dd className="text-positive">Free</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mist">Arrives</dt>
            <dd className="flex items-center gap-1 text-white">
              <Zap className="size-3.5 text-cyan" /> Instantly
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mist">Balance after</dt>
            <dd className="text-white">
              <NumberFlow
                value={show ? Math.max(0, balance - amount) : balance - amount}
                locales="en-IE"
                format={{ style: "currency", currency: "EUR", minimumFractionDigits: 2 }}
              />
            </dd>
          </div>
        </dl>

        <div className="relative mt-6 flex items-start gap-3 rounded-2xl bg-cyan/[0.06] p-4 ring-1 ring-cyan/15">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-cyan" />
          <p className="text-[13px] leading-relaxed text-fog">
            We check every new recipient&apos;s name against their bank before you send.
          </p>
        </div>
      </Panel>
    </div>
  );
}
