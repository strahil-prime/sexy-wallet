"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { ArrowDownLeft, ArrowUpRight, CircleAlert, Download, Receipt, Search, Split, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { comingSoon } from "@/components/shell/coming-soon";
import { Panel } from "@/components/ui/panel";
import { contacts, olderActivity, walletCards, type Activity } from "@/lib/data";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type Filter = "all" | "in" | "out" | "card" | "people" | "invest";
const filters: { id: Filter; label: string; test: (a: Activity) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "in", label: "Money in", test: (a) => a.amount > 0 },
  { id: "out", label: "Money out", test: (a) => a.amount < 0 },
  { id: "card", label: "Card", test: (a) => !!a.card },
  { id: "people", label: "People", test: (a) => !!a.peer },
  { id: "invest", label: "Investing", test: (a) => !!a.invest },
];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function dayLabel(d: Date) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (t === start) return "Today";
  if (t === start - 864e5) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** A stable, bank-looking reference made from the row id. */
function reference(id: string) {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `NVL-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function ActivityView() {
  const { activity } = useWallet();
  const all = useMemo(() => [...activity, ...olderActivity].sort((a, b) => +new Date(b.at) - +new Date(a.at)), [activity]);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const wide = useWide();
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useEffect(() => setPortal(document.body), []);

  const shown = useMemo(() => {
    const test = filters.find((f) => f.id === filter)!.test;
    const needle = q.trim().toLowerCase();
    return all.filter((a) => test(a) && (!needle || `${a.title} ${a.category} ${a.peer?.name ?? ""}`.toLowerCase().includes(needle)));
  }, [all, filter, q]);

  const groups = useMemo(() => {
    const out: { key: string; label: string; net: number; items: Activity[] }[] = [];
    for (const a of shown) {
      const d = new Date(a.at);
      const k = dayKey(d);
      let g = out.find((x) => x.key === k);
      if (!g) out.push((g = { key: k, label: dayLabel(d), net: 0, items: [] }));
      g.items.push(a);
      if (!a.pending) g.net += a.amount;
    }
    return out;
  }, [shown]);

  const selected = all.find((a) => a.id === selectedId) ?? (wide ? shown[0] : undefined);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const open = (a: Activity) => {
    setSelectedId(a.id);
    if (!wide) setSheetOpen(true);
  };

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Activity" subtitle="Every euro in and out, in one place" />

      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <MonthSummary all={all} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease }}>
            <Panel spotlight={false} className="px-3 pt-4 pb-2 sm:px-5 sm:pt-5">
              {/* Search + filters */}
              <div className="px-1 sm:px-2">
                <label className="group flex h-12 items-center gap-3 rounded-2xl bg-white/[0.04] px-4 ring-1 ring-white/[0.06] transition focus-within:ring-cyan/40">
                  <Search className="size-[18px] text-mist transition-colors group-focus-within:text-cyan" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search a shop, person or category"
                    aria-label="Search activity"
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-mist"
                  />
                  <AnimatePresence>
                    {q && (
                      <motion.button
                        type="button"
                        onClick={() => setQ("")}
                        aria-label="Clear search"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="grid size-7 cursor-pointer place-items-center rounded-full bg-white/10 text-fog"
                      >
                        <X className="size-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </label>
                <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
                  {filters.map((f) => {
                    const on = f.id === filter;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        aria-pressed={on}
                        className={cn(
                          "focus-ring relative h-9 shrink-0 cursor-pointer rounded-full px-4 text-[13.5px] transition-colors",
                          on ? "text-ink-950" : "bg-white/[0.05] text-fog hover:text-white",
                        )}
                      >
                        {on && <motion.span layoutId="act-filter" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                        <span className="relative font-medium">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grouped list */}
              <div className="mt-2">
                {groups.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 py-14 text-center">
                    <Search className="size-7 text-mist" strokeWidth={1.5} />
                    <span className="text-[15px] text-white">Nothing matches that</span>
                    <span className="text-[13px] text-mist">Try another word or filter</span>
                  </motion.div>
                )}
                {groups.map((g, gi) => (
                  <section key={g.key} className="mt-3 first:mt-1">
                    <div className="sticky top-0 z-10 -mx-1 flex items-baseline justify-between bg-ink-900/80 px-3 py-2 backdrop-blur-md max-lg:top-0 lg:static lg:bg-transparent lg:backdrop-blur-none">
                      <span className="text-[13px] font-medium text-fog">{g.label}</span>
                      <span className={cn("text-[12.5px] tabular", g.net > 0 ? "text-positive" : "text-mist")}>{formatEUR(g.net, { sign: true })}</span>
                    </div>
                    <ul>
                      {g.items.map((a, i) => (
                        <Row key={a.id} a={a} active={wide && selected?.id === a.id} delay={Math.min(gi * 2 + i, 12) * 0.035} onOpen={() => open(a)} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* Details beside the list on wide screens */}
        <div className="hidden min-w-0 xl:block">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }} className="sticky top-6">
            <Panel spotlight={false} className="overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {selected && (
                  <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease }}>
                    <Details a={selected} all={all} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </motion.div>
        </div>
      </div>

      {/* Bottom sheet on phones and tablets, portalled so it sits above the tab bar */}
      {portal && createPortal(
      <AnimatePresence>
        {sheetOpen && selected && !wide && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal
              aria-label={selected.title}
              className="glass-strong fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-[28px] pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setSheetOpen(false);
              }}
            >
              <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1">
                <span className="h-1.5 w-10 rounded-full bg-white/20" />
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/[0.08] text-fog"
              >
                <X className="size-4" />
              </button>
              <Details a={selected} all={all} />
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      portal)}
    </div>
  );
}

function Row({ a, active, delay, onOpen }: { a: Activity; active: boolean; delay: number; onOpen: () => void }) {
  const sub = a.pending ? "Pending" : a.invest ? "Investment" : a.category;
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45, ease }}>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group focus-ring relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition-colors",
          active ? "bg-white/[0.07] ring-1 ring-white/[0.08]" : "hover:bg-white/[0.04]",
        )}
      >
        <BrandMark activity={a} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15.5px] text-white">{a.title}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-mist" suppressHydrationWarning>
            {a.pending && <span className="size-1.5 animate-pulse rounded-full bg-[#ffb547]" />}
            <span className="truncate">
              {sub} · {time(a.at)}
            </span>
          </span>
        </span>
        <span className={cn("text-[15.5px] font-medium tabular", a.pending ? "text-mist" : a.amount > 0 ? "text-positive" : "text-white")}>
          {formatEUR(a.amount, { sign: true })}
        </span>
      </button>
    </motion.li>
  );
}

/* ───────────────────────── Month summary ───────────────────────── */

function MonthSummary({ all }: { all: Activity[] }) {
  const { days, money, out } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const days = Array.from({ length: 30 }, (_, i) => ({ t: start - (29 - i) * 864e5, spent: 0, items: [] as Activity[] }));
    let money = 0;
    let out = 0;
    for (const a of all) {
      if (a.pending) continue;
      const t = new Date(a.at);
      const d = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
      const slot = days.find((x) => x.t === d);
      if (!slot) continue;
      if (a.amount > 0) money += a.amount;
      else if (!a.invest) {
        out += -a.amount;
        slot.spent += -a.amount;
        slot.items.push(a);
      }
    }
    return { days, money, out };
  }, [all]);

  const [hover, setHover] = useState<number | null>(null);
  const chart = useRef<HTMLDivElement>(null);
  // On touch there is no hover: a tap pins the tooltip until the next tap outside the chart.
  useEffect(() => {
    const off = (e: PointerEvent) => {
      if (!chart.current?.contains(e.target as Node)) setHover(null);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, []);
  const max = Math.max(...days.map((d) => d.spent), 1);
  const h = hover ?? days.length - 1;
  const hd = days[h];

  return (
    <Panel className="p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[13px] text-mist">Last 30 days</div>
          <div className="mt-1 flex items-baseline gap-5">
            <div>
              <div className="flex items-center gap-1 text-[12px] text-mist">
                <ArrowDownLeft className="size-3.5 text-positive" /> In
              </div>
              <div className="text-[24px] font-semibold tracking-tight text-white tabular sm:text-[28px]">
                <NumberFlow value={money} format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} locales="en-IE" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[12px] text-mist">
                <ArrowUpRight className="size-3.5 text-[#ff9a8b]" /> Out
              </div>
              <div className="text-[24px] font-semibold tracking-tight text-white tabular sm:text-[28px]">
                <NumberFlow value={out} format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} locales="en-IE" />
              </div>
            </div>
          </div>
        </div>
        <div className="text-right" suppressHydrationWarning>
          <div className="text-[12px] text-mist">{dayLabel(new Date(hd.t))}</div>
          <div className="text-[15px] font-medium text-white tabular">{hd.spent ? `${formatEUR(hd.spent)} spent` : "No spending"}</div>
        </div>
      </div>

      <div
        ref={chart}
        className="relative mt-5 flex h-20 items-end gap-[3px] sm:gap-1"
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        <AnimatePresence>
          {hover !== null && (
            <DayTooltip key="tip" index={hover} count={days.length} day={days[hover]} lift={Math.max(6, (days[hover].spent / max) * 100)} />
          )}
        </AnimatePresence>
        {days.map((d, i) => (
          <div
            key={d.t}
            className="flex h-full flex-1 cursor-pointer items-end"
            onPointerEnter={() => setHover(i)}
            onPointerDown={() => setHover(i)}
          >
            <motion.div
              className={cn("w-full rounded-t-md rounded-b-sm transition-colors", hover === i ? "bg-aqua" : i === h ? "bg-electric" : "bg-white/15")}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(6, (d.spent / max) * 100)}%` }}
              transition={{ delay: 0.2 + i * 0.012, duration: 0.6, ease }}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DayTooltip({
  index,
  count,
  day,
  lift,
}: {
  index: number;
  count: number;
  day: { t: number; spent: number; items: Activity[] };
  lift: number;
}) {
  const centre = ((index + 0.5) / count) * 100;
  // Keep the tooltip inside the card near the edges.
  const align = index < 4 ? "left" : index > count - 5 ? "right" : "centre";
  const items = [...day.items].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const shown = items.slice(0, 5);

  return (
    <motion.div
      role="tooltip"
      className="pointer-events-none absolute z-20 w-[236px]"
      style={{
        bottom: `calc(${lift}% + 10px)`,
        left: align === "right" ? undefined : align === "left" ? 0 : `${centre}%`,
        right: align === "right" ? 0 : undefined,
        x: align === "centre" ? "-50%" : 0,
      }}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease }}
    >
      <div className="rounded-2xl bg-ink-850/95 p-3 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-baseline justify-between gap-3 px-0.5" suppressHydrationWarning>
          <span className="text-[11.5px] text-mist">
            {new Date(day.t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          <span className="text-[12.5px] font-medium text-white tabular">{day.spent ? formatEUR(day.spent) : "€0.00"}</span>
        </div>
        {shown.length ? (
          <ul className="mt-2 space-y-1.5 border-t border-hairline pt-2">
            {shown.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5">
                <BrandMark activity={a} className="size-7 shrink-0 rounded-lg [&_svg]:size-3.5" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-fog">{a.title}</span>
                <span className="text-[13px] text-white tabular">{formatEUR(-a.amount)}</span>
              </li>
            ))}
            {items.length > shown.length && (
              <li className="pl-[38px] text-[12px] text-mist">+{items.length - shown.length} more</li>
            )}
          </ul>
        ) : (
          <p className="mt-1.5 px-0.5 text-[12.5px] text-mist">No purchases this day</p>
        )}
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Details ───────────────────────── */

function Details({ a, all }: { a: Activity; all: Activity[] }) {
  const router = useRouter();
  const when = new Date(a.at);
  const card = a.card ? walletCards[0] : null;
  const same = a.brand ? all.filter((x) => x.brand === a.brand && !x.pending) : [];
  const sameTotal = same.reduce((s, x) => s + x.amount, 0);
  const contact = a.peer ? contacts.find((c) => c.name.split(" ")[0] === a.peer!.name.split(" ")[0]) : undefined;

  const rows: { label: string; value: string }[] = [
    { label: "Status", value: a.pending ? "Pending" : "Completed" },
    { label: "Date", value: when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) },
    { label: "Time", value: time(a.at) },
    { label: "Category", value: a.invest ? "Investment" : a.category },
  ];
  if (card) rows.push({ label: "Paid with", value: `${card.name} card ·· ${card.last4}` });
  if (a.peer) rows.push({ label: a.amount > 0 ? "From" : "To", value: contact?.name ?? a.peer.name });
  rows.push({ label: "Reference", value: reference(a.id) });

  return (
    <div className="px-5 pt-6 pb-6 sm:px-7">
      <div className="flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.8, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          <BrandMark activity={a} className="size-16 [&_svg]:size-7" />
        </motion.div>
        <div className="mt-3 text-[16px] text-fog">{a.title}</div>
        <div className={cn("mt-1 text-[36px] font-semibold tracking-tight tabular", a.amount > 0 ? "text-positive" : "text-white")}>
          {formatEUR(a.amount, { sign: true })}
        </div>
        <span
          className={cn(
            "mt-2 rounded-full px-3 py-1 text-[12px] font-medium",
            a.pending ? "bg-[#ffb547]/12 text-[#ffb547]" : "bg-positive/12 text-positive",
          )}
        >
          {a.pending ? "Pending" : "Completed"}
        </span>
      </div>

      <dl className="mt-6 divide-y divide-hairline rounded-2xl bg-white/[0.03] px-4 ring-1 ring-white/[0.06]">
        {rows.slice(1).map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[13.5px] text-mist">{r.label}</dt>
            <dd className="truncate text-right text-[14px] text-white" suppressHydrationWarning>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {same.length > 1 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-cyan/[0.06] px-4 py-3 ring-1 ring-cyan/15">
          <Receipt className="size-4 shrink-0 text-cyan" />
          <p className="text-[13px] text-fog">
            {same.length} payments to {a.title} lately, {formatEUR(-sameTotal)} in total.
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { icon: Split, label: "Split", run: () => (a.amount < 0 ? router.push("/receive") : comingSoon("Splitting money in")) },
          { icon: Download, label: "Receipt", run: () => comingSoon("Receipts") },
          { icon: CircleAlert, label: "Report", run: () => comingSoon("Reporting a problem") },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.run}
            className="focus-ring flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl bg-white/[0.05] py-3 text-[12.5px] text-fog transition-colors hover:bg-white/[0.09] hover:text-white"
          >
            <b.icon className="size-[18px]" strokeWidth={1.8} />
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
