"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowDownLeft, Check, Copy, Landmark, Link2, QrCode, Send, Share2, Sparkles, Zap } from "lucide-react";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { BrandMark } from "@/components/brand/brand-mark";
import { ContactAvatar } from "@/components/ui/avatar";
import { Panel } from "@/components/ui/panel";
import { contacts, type Contact } from "@/lib/data";
import { account, payUrl } from "@/lib/profile";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR, formatEUR0, formatWhen } from "@/lib/utils";
import { PayQR } from "./qr";

const ease = [0.16, 1, 0.3, 1] as const;

type Mode = "request" | "qr" | "bank";
const modes: { id: Mode; label: string; icon: typeof Send }[] = [
  { id: "request", label: "Request", icon: Send },
  { id: "qr", label: "QR code", icon: QrCode },
  { id: "bank", label: "Bank details", icon: Landmark },
];

export function ReceiveView() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("mode") as Mode) ?? "request";
  const [mode, setMode] = useState<Mode>(modes.some((m) => m.id === initial) ? initial : "request");

  const pick = (m: Mode) => {
    setMode(m);
    router.replace(m === "request" ? "/receive" : `/receive?mode=${m}`, { scroll: false });
  };

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Receive money" subtitle="Get paid by anyone, in seconds" />

      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <PayMeCard />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease }}>
            <Panel spotlight={false} className="overflow-hidden">
              <div className="px-4 pt-4 sm:px-7 sm:pt-6">
                <div role="tablist" aria-label="How to get paid" className="grid grid-cols-3 gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
                  {modes.map((m) => {
                    const on = m.id === mode;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => pick(m.id)}
                        className={cn(
                          "focus-ring relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-[13.5px] transition-colors sm:text-[14px]",
                          on ? "text-ink-950" : "text-fog hover:text-white",
                        )}
                      >
                        {on && (
                          <motion.span layoutId="recv-tab" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                        )}
                        <m.icon className="relative hidden size-4 sm:block" strokeWidth={2} />
                        <span className="relative font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease }}
                >
                  {mode === "request" && <RequestMode />}
                  {mode === "qr" && <QrMode />}
                  {mode === "bank" && <BankMode />}
                </motion.div>
              </AnimatePresence>
            </Panel>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }} className="min-w-0">
          <ComingIn />
        </motion.div>
      </div>
    </div>
  );
}

/* ───────────────────────── Pay-me card ───────────────────────── */

async function share(text: string, url?: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title: `Pay ${account.fullName}`, text, url });
      return;
    }
  } catch {
    return; // the viewer closed the share sheet
  }
  await copy(url ?? text, "Link copied");
}

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
  toast(label, { description: text, id: "copy" });
}

/** Your personal pay link, front and centre: the quickest way to get paid. */
function PayMeCard() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-panel)] p-5 ring-1 ring-white/10 sm:p-7">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_140%_at_0%_0%,#1550c8_0%,#0b2a6e_38%,#07131c_75%)]" />
      <motion.div
        aria-hidden
        className="absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-cyan/25 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center gap-4">
        <span className="relative">
          <span className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-cyan via-white/60 to-electric opacity-80" />
          <Image src={account.photo} alt="" width={56} height={56} className="relative size-14 rounded-full object-cover ring-2 ring-ink-900" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium tracking-[0.16em] text-white/60 uppercase">Your pay link</div>
          <div className="truncate text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">{account.payLink}</div>
        </div>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-white/70">
        Anyone can pay you through it, with a card, Apple Pay or their bank. No app needed.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => share(`Pay me with ${account.payLink}`, payUrl())}
          className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white/90"
        >
          <Share2 className="size-4" strokeWidth={2.2} /> Share link
        </button>
        <button
          type="button"
          onClick={() => copy(payUrl(), "Pay link copied")}
          className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 text-[14px] text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15"
        >
          <Link2 className="size-4" strokeWidth={2} /> Copy
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Request ───────────────────────── */

const presets = [10, 25, 50, 100];
const reasons = ["Dinner", "Drinks", "Taxi", "Tickets", "Rent", "Gift"];

function RequestMode() {
  const { request } = useWallet();
  const [raw, setRaw] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [split, setSplit] = useState(true);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<{ people: Contact[]; each: number } | null>(null);

  const amount = Number(raw) || 0;
  const people = contacts.filter((c) => picked.includes(c.id));
  const many = people.length > 1;
  const each = many && split ? Math.round((amount / people.length) * 100) / 100 : amount;
  const total = many && !split ? amount * people.length : amount;
  const ready = amount > 0 && people.length > 0;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = () => {
    if (!ready) return;
    people.forEach((c) => request(c, each, note || "Request"));
    setSent({ people, each });
  };

  const reset = () => {
    setSent(null);
    setRaw("");
    setPicked([]);
    setNote("");
  };

  if (sent) return <RequestSent people={sent.people} each={sent.each} onAgain={reset} />;

  const names = people.map((p) => p.name.split(" ")[0]);
  const who = names.length <= 2 ? names.join(" & ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;

  return (
    <div className="px-4 pt-5 pb-5 sm:px-7 sm:pb-7">
      {/* Amount */}
      <label className="flex items-baseline gap-1 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06] transition focus-within:ring-cyan/50">
        <span className="text-[30px] font-semibold text-mist">€</span>
        <input
          inputMode="decimal"
          aria-label="Amount to request"
          value={raw}
          onChange={(e) => setRaw(e.target.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").slice(0, 8))}
          placeholder="0"
          className="w-full min-w-0 bg-transparent text-[36px] font-semibold tracking-tight text-white tabular outline-none placeholder:text-mist/40"
        />
        <AnimatePresence>
          {many && amount > 0 && (
            <motion.span initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="shrink-0 text-[13px] text-mist tabular">
              {split ? `${formatEUR(each)} each` : `${formatEUR(total)} total`}
            </motion.span>
          )}
        </AnimatePresence>
      </label>
      <div className="mt-2.5 flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setRaw(String(p))}
            className={cn(
              "focus-ring h-9 flex-1 cursor-pointer rounded-full text-[13px] tabular transition-colors",
              amount === p ? "bg-white text-ink-950" : "bg-white/[0.06] text-fog hover:bg-white/[0.1] hover:text-white",
            )}
          >
            {formatEUR0(p)}
          </button>
        ))}
      </div>

      {/* People */}
      <div className="mt-6 flex items-baseline justify-between">
        <span className="text-[14px] font-medium text-white">From</span>
        <span className="text-[12.5px] text-mist">{people.length ? `${people.length} selected` : "Pick one or more"}</span>
      </div>
      <div className="no-scrollbar -mx-4 mt-1 flex gap-1 overflow-x-auto px-3 pt-2 pb-2 sm:-mx-7 sm:px-6">
        {contacts.map((c) => {
          const on = picked.includes(c.id);
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={on}
              whileTap={{ scale: 0.92 }}
              className="group focus-ring flex w-[74px] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl py-1.5"
            >
              <span className="relative">
                <motion.span
                  className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-cyan to-electric"
                  initial={false}
                  animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.85 }}
                />
                <ContactAvatar contact={c} className={cn("relative size-14 ring-2 ring-ink-900 transition", !on && picked.length > 0 && "opacity-55")} />
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-cyan text-ink-950 ring-2 ring-ink-900"
                    >
                      <Check className="size-3" strokeWidth={3.2} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className={cn("text-[12.5px] transition-colors", on ? "text-white" : "text-mist group-hover:text-fog")}>{c.name.split(" ")[0]}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {many && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
              {[
                { on: true, label: "Split the total" },
                { on: false, label: "Same from each" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setSplit(o.on)}
                  className={cn("focus-ring relative h-9 cursor-pointer rounded-full text-[13px] transition-colors", split === o.on ? "text-white" : "text-mist hover:text-fog")}
                >
                  {split === o.on && <motion.span layoutId="recv-split" className="absolute inset-0 rounded-full bg-white/[0.1] ring-1 ring-white/10" />}
                  <span className="relative">{o.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What for */}
      <div className="mt-5">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 40))}
          placeholder="What's it for?"
          aria-label="What's it for?"
          className="h-12 w-full rounded-2xl bg-white/[0.04] px-4 text-[15px] text-white ring-1 ring-white/[0.06] outline-none placeholder:text-mist focus:ring-cyan/50"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setNote(r)}
              className={cn(
                "focus-ring h-8 cursor-pointer rounded-full px-3 text-[12.5px] transition-colors",
                note === r ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40" : "bg-white/[0.05] text-mist hover:text-white",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-2.5 lg:justify-end">
      <button
        type="button"
        onClick={() => {
          setRaw("");
          setPicked([]);
          setSplit(true);
          setNote("");
        }}
        className="focus-ring h-14 shrink-0 cursor-pointer rounded-full bg-white/[0.06] px-6 text-[15px] font-medium text-white ring-1 ring-white/10 transition-colors hover:bg-white/10 lg:px-8"
      >
        Cancel
      </button>
      <motion.button
        type="button"
        disabled={!ready}
        onClick={submit}
        whileTap={ready ? { scale: 0.98 } : undefined}
        className="focus-ring flex h-14 min-w-0 flex-1 cursor-pointer items-center lg:min-w-[260px] lg:flex-none lg:px-8 justify-center gap-2 rounded-full bg-[radial-gradient(circle_at_30%_0%,#4c97ff,#1f7bff_60%,#1660d6)] text-[15.5px] font-medium text-white shadow-[0_14px_34px_-12px_rgb(31_123_255/0.9),inset_0_1px_0_rgb(255_255_255/0.3)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        <ArrowDownLeft className="size-[18px] shrink-0" strokeWidth={2.2} />
        <span className="truncate">
          {ready ? (
            <>
              Request {formatEUR(total)}
              <span className="max-sm:hidden"> from {who}</span>
            </>
          ) : amount > 0 ? "Pick who pays" : "Enter an amount"}
        </span>
      </motion.button>
      </div>
    </div>
  );
}

function RequestSent({ people, each, onAgain }: { people: Contact[]; each: number; onAgain: () => void }) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-10 pb-8 text-center sm:px-7">
      <div className="relative flex h-24 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute size-20 rounded-full ring-1 ring-cyan/50"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 2.2], opacity: [0.8, 0] }}
            transition={{ delay: 0.2 + i * 0.35, duration: 1.6, repeat: Infinity, repeatDelay: 0.6, ease: "easeOut" }}
          />
        ))}
        <div className="flex -space-x-3">
          {people.slice(0, 4).map((c, i) => (
            <motion.span
              key={c.id}
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 380, damping: 22 }}
            >
              <ContactAvatar contact={c} className="size-16 ring-4 ring-ink-900" />
            </motion.span>
          ))}
        </div>
      </div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="mt-6 text-[22px] font-semibold tracking-tight text-white"
      >
        {people.length > 1 ? "Requests sent" : "Request sent"}
      </motion.h3>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-1.5 max-w-sm text-[14.5px] text-mist">
        {people.length > 1
          ? `${formatEUR(each)} each from ${people.map((p) => p.name.split(" ")[0]).join(", ")}.`
          : `${formatEUR(each)} from ${people[0].name.split(" ")[0]}.`}{" "}
        We&apos;ll give them a friendly nudge if they forget.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease }} className="mt-6 flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 text-[13px] text-fog ring-1 ring-white/[0.06]">
        <Zap className="size-3.5 text-cyan" /> Watch it land under Coming in
      </motion.div>
      <button
        type="button"
        onClick={onAgain}
        className="focus-ring mt-6 h-11 cursor-pointer rounded-full bg-white/[0.08] px-6 text-[14px] text-white transition-colors hover:bg-white/[0.13]"
      >
        New request
      </button>
    </div>
  );
}

/* ───────────────────────── QR ───────────────────────── */

const qrAmounts = [0, 10, 25, 50];

function QrMode() {
  const [amount, setAmount] = useState(0);
  const url = payUrl(amount || undefined);

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-6 sm:px-7 sm:pb-8">
      <div className="flex flex-wrap justify-center gap-1.5">
        {qrAmounts.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(a)}
            className={cn(
              "focus-ring relative h-9 cursor-pointer rounded-full px-4 text-[13px] tabular transition-colors",
              amount === a ? "text-ink-950" : "bg-white/[0.06] text-fog hover:text-white",
            )}
          >
            {amount === a && <motion.span layoutId="qr-amt" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{a ? formatEUR0(a) : "Any amount"}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-6">
        <motion.div
          aria-hidden
          className="absolute -inset-6 rounded-[44px] bg-[conic-gradient(from_0deg,#2ad1e6,#1f7bff,#7c5cff,#2ad1e6)] opacity-40 blur-2xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative overflow-hidden rounded-[30px] bg-white p-4 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] sm:p-5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease }}
            >
              <PayQR value={url} className="size-[220px] sm:size-[240px]" />
            </motion.div>
          </AnimatePresence>
          {/* Scan line */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 h-10 bg-[linear-gradient(180deg,transparent,rgb(31_123_255/0.16),transparent)]"
            animate={{ top: ["0%", "88%", "0%"] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-[13px] text-mist">{amount ? "They'll pay exactly" : "They choose how much"}</div>
        <div className="mt-0.5 text-[26px] font-semibold tracking-tight text-white tabular">{amount ? formatEUR(amount) : account.fullName}</div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[12.5px] text-mist">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-positive/70" />
            <span className="relative size-2 rounded-full bg-positive" />
          </span>
          Ready to scan · works with any phone camera
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => share(amount ? `Pay me ${formatEUR(amount)}` : "Pay me", url)}
          className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white/90"
        >
          <Share2 className="size-4" strokeWidth={2.2} /> Share
        </button>
        <button
          type="button"
          onClick={() => copy(url, "Link copied")}
          className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] text-white transition-colors hover:bg-white/[0.13]"
        >
          <Copy className="size-4" strokeWidth={2} /> Copy link
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Bank details ───────────────────────── */

function BankMode() {
  const rows = [
    { label: "Account holder", value: account.fullName },
    { label: "IBAN", value: account.iban, mono: true },
    { label: "BIC", value: account.bic, mono: true },
  ];
  const all = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
  return (
    <div className="px-4 pt-5 pb-5 sm:px-7 sm:pb-7">
      <ul className="divide-y divide-hairline rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
        {rows.map((r, i) => (
          <motion.li
            key={r.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease }}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] text-mist">{r.label}</span>
              <span className={cn("block truncate text-[15.5px] text-white", r.mono && "font-mono tracking-wide")}>{r.value}</span>
            </span>
            <CopyButton text={r.value} label={r.label} />
          </motion.li>
        ))}
      </ul>
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-cyan/[0.06] px-4 py-3 ring-1 ring-cyan/15">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-cyan" />
        <p className="text-[13px] leading-relaxed text-fog">
          Euro transfers from any bank in Europe land in seconds with SEPA Instant. No fees on our side.
        </p>
      </div>
      <button
        type="button"
        onClick={() => share(all)}
        className="focus-ring mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white/90"
      >
        <Share2 className="size-4" strokeWidth={2.2} /> Share all details
      </button>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {}
        setDone(true);
      }}
      className={cn(
        "focus-ring grid size-10 shrink-0 cursor-pointer place-items-center rounded-full transition-colors",
        done ? "bg-positive/15 text-positive" : "bg-white/[0.06] text-fog hover:bg-white/[0.1] hover:text-white",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={String(done)} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.15 }}>
          {done ? <Check className="size-4" strokeWidth={2.6} /> : <Copy className="size-4" strokeWidth={1.9} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/* ───────────────────────── Coming in ───────────────────────── */

/** Requests still out there, then money that has landed. Updates live as people pay. */
function ComingIn() {
  const { activity } = useWallet();
  const pending = useMemo(() => activity.filter((a) => a.pending && a.amount > 0), [activity]);
  const landed = useMemo(() => activity.filter((a) => !a.pending && a.amount > 0 && !a.invest).slice(0, 5), [activity]);
  const onTheWay = pending.reduce((s, a) => s + a.amount, 0);

  return (
    <Panel className="p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium text-white">Coming in</h2>
        <span className="text-[12.5px] text-mist">
          {pending.length ? (
            <>
              <span className="text-white tabular">{formatEUR(onTheWay)}</span> on the way
            </>
          ) : (
            "Nothing pending"
          )}
        </span>
      </div>

      <ul className="mt-3">
        <AnimatePresence initial={false}>
          {pending.map((a) => {
            const c = contacts.find((x) => x.name === a.peer?.name);
            return (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 py-2.5"
              >
                <span className="relative">
                  {c ? <ContactAvatar contact={c} className="size-10" /> : <BrandMark activity={a} className="size-10" />}
                  <span className="absolute -inset-1 animate-pulse-ring rounded-full ring-1 ring-cyan/60" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] text-white">{a.peer?.name.split(" ")[0] ?? a.title}</span>
                  <span className="block truncate text-[12.5px] text-mist">
                    {a.category} · waiting
                    <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }}>
                      …
                    </motion.span>
                  </span>
                </span>
                <span className="text-[14.5px] text-mist tabular">{formatEUR(a.amount)}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {pending.length > 0 && <div className="my-2 h-px bg-hairline" />}
      <div className="mt-2 text-[12.5px] text-mist">Received</div>
      <ul className="mt-1">
        <AnimatePresence initial={false}>
          {landed.map((a) => {
            const c = contacts.find((x) => x.name.split(" ")[0] === (a.peer?.name ?? "").split(" ")[0]);
            return (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.96, backgroundColor: "rgb(62 227 154 / 0.12)" }}
                animate={{ opacity: 1, scale: 1, backgroundColor: "rgb(62 227 154 / 0)" }}
                transition={{ duration: 1.2, ease }}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                {c ? (
                  <ContactAvatar contact={c} className="size-10" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full bg-positive/10 text-positive">
                    <ArrowDownLeft className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] text-white">{a.title}</span>
                  <span className="block truncate text-[12.5px] text-mist" suppressHydrationWarning>
                    {formatWhen(new Date(a.at))}
                  </span>
                </span>
                <span className="text-[14.5px] font-medium text-positive tabular">{formatEUR(a.amount, { sign: true })}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Panel>
  );
}
