"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Coins, Ellipsis, Repeat, ShoppingBag } from "lucide-react";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import { coins, initialCrypto, money, walk, type Coin } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { BuySheet, type Tradable } from "./buy-sheet";
import { AreaChart, AssetLogo, Change, Sparkline } from "./kit";

const ease = [0.16, 1, 0.3, 1] as const;

const actions: QuickAction[] = [
  { label: "Trade", icon: Repeat, href: "/crypto/trade", primary: true },
  { label: "Receive", icon: ArrowDownLeft },
  { label: "Send", icon: ArrowUpRight },
  { label: "More", icon: Ellipsis },
];

const ranges = [
  { id: "1D", label: "24H", n: 36, mult: 1, vol: 0.0035 },
  { id: "1W", label: "1W", n: 42, mult: 2.6, vol: 0.016 },
  { id: "1M", label: "1M", n: 31, mult: 5, vol: 0.03 },
  { id: "1Y", label: "1Y", n: 52, mult: 18, vol: 0.07 },
] as const;

export const coinTradable = (c: Coin, price = c.price): Tradable => ({ ...c, price, currency: "€", tag: "Crypto" });

/** Prices tick a little every couple of seconds, so the page feels live. Illustrative only. */
export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(() => Object.fromEntries(coins.map((c) => [c.ticker, c.price])));
  useEffect(() => {
    const t = setInterval(() => {
      setPrices((p) => {
        const next: Record<string, number> = {};
        for (const c of coins) {
          const cur = p[c.ticker];
          // Small random step, gently pulled back toward the base price.
          next[c.ticker] = cur * (1 + (Math.random() - 0.5) * 0.0024) + (c.price - cur) * 0.08;
        }
        return next;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return prices;
}

function Rise({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease }} className="min-w-0">
      {children}
    </motion.div>
  );
}

export function CryptoView() {
  const prices = useLivePrices();
  const [held, setHeld] = useState(initialCrypto);
  const [focus, setFocus] = useState("BTC");
  const [buying, setBuying] = useState<Coin | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const total = Object.entries(held).reduce((s, [t, q]) => s + q * prices[t], 0);
  const dayMove = Object.entries(held).reduce((s, [t, q]) => {
    const c = coins.find((x) => x.ticker === t)!;
    return s + q * prices[t] * (c.change / (100 + c.change));
  }, 0);

  const pick = (t: string) => {
    setFocus(t);
    if (window.innerWidth < 1280) chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Crypto" subtitle="Bitcoin, Ethereum and more, in plain words" />

      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Rise delay={0}>
            <Panel spotlight={false} className="relative overflow-hidden p-5 sm:p-7">
              <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_0%_0%,rgb(247_147_26/0.18),transparent_70%),radial-gradient(60%_80%_at_100%_100%,rgb(98_126_234/0.2),transparent_70%)]" />
              <div className="text-[14px] text-mist">Your crypto</div>
              <div className="mt-1.5 text-[40px] leading-none font-semibold tracking-tight text-white tabular sm:text-[46px]">
                <NumberFlow value={total} locales="en-IE" format={{ style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 2 }} />
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[13.5px]">
                <span className={cn("tabular", dayMove >= 0 ? "text-positive" : "text-negative")}>
                  {dayMove >= 0 ? "+" : "−"}
                  {money(Math.abs(dayMove))}
                </span>
                <span className="text-mist">today</span>
                <span className="ml-auto flex items-center gap-1.5 text-[12px] text-mist">
                  <span className="size-1.5 animate-pulse rounded-full bg-positive" /> Live prices
                </span>
              </div>
              <Allocation held={held} prices={prices} />
            </Panel>
          </Rise>

          <Rise delay={0.06}>
            <QuickActions actions={actions} />
          </Rise>

          <Rise delay={0.1}>
            <Panel spotlight={false} className="p-2 sm:p-3">
              <div className="px-3 pt-3 pb-1 text-[17px] font-medium text-white">Your coins</div>
              <ul>
                {Object.entries(held).map(([t, q]) => {
                  const c = coins.find((x) => x.ticker === t)!;
                  return (
                    <li key={t}>
                      <button type="button" onClick={() => pick(t)} className="focus-ring flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/[0.04]">
                        <AssetLogo logo={c.logo} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15.5px] text-white">{c.name}</span>
                          <span className="block text-[12.5px] text-mist tabular">
                            {q.toLocaleString("en-IE", { maximumFractionDigits: 6 })} {t}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-[15px] text-white tabular">{money(q * prices[t])}</span>
                          <Change value={c.change} className="text-[12.5px]" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </Rise>

          <Rise delay={0.14}>
            <AutoCrypto />
          </Rise>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Rise delay={0.08}>
            <div ref={chartRef} className="scroll-mt-4">
              <Spotlight coin={coins.find((c) => c.ticker === focus)!} price={prices[focus]} onPick={setFocus} onBuy={setBuying} />
            </div>
          </Rise>
          <Rise delay={0.14}>
            <Panel spotlight={false} className="p-2 sm:p-3">
              <div className="flex items-baseline justify-between px-3 pt-3 pb-1">
                <span className="text-[17px] font-medium text-white">Market</span>
                <span className="text-[12px] text-mist">24h</span>
              </div>
              <ul>
                {coins.map((c) => (
                  <li key={c.ticker}>
                    <button
                      type="button"
                      onClick={() => pick(c.ticker)}
                      className={cn("focus-ring flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]", focus === c.ticker && "bg-white/[0.05]")}
                    >
                      <AssetLogo logo={c.logo} className="size-10" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-white">{c.name}</span>
                        <span className="block text-[12.5px] text-mist">{c.ticker}</span>
                      </span>
                      <Sparkline points={walk(c.ticker + "s", 24, c.price, c.change)} up={c.change >= 0} className="hidden w-16 sm:block" />
                      <span className="w-[96px] shrink-0 text-right">
                        <span className="block text-[14.5px] text-white tabular">{money(prices[c.ticker])}</span>
                        <Change value={c.change} className="text-[12px]" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </Rise>
          <p className="text-center text-[12px] text-mist">Prices are illustrative, not live market data. Crypto is volatile; only put in what you can afford to lose.</p>
        </div>
      </div>

      <BuySheet
        item={buying ? coinTradable(buying, prices[buying.ticker]) : null}
        onClose={() => setBuying(null)}
        onBought={(item, eur) => setHeld((h) => ({ ...h, [item.ticker]: (h[item.ticker] ?? 0) + eur / item.price }))}
      />
    </div>
  );
}

/** The logo's background, or its foreground when the background is too dark to see (Solana). */
function barColor(l: { bg: string; fg: string }) {
  const h = l.bg.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum < 50 ? l.fg : l.bg;
}

function Allocation({ held, prices }: { held: Record<string, number>; prices: Record<string, number> }) {
  const parts = Object.entries(held).map(([t, q]) => ({ t, v: q * prices[t], c: barColor(coins.find((x) => x.ticker === t)!.logo) }));
  const sum = parts.reduce((s, p) => s + p.v, 0);
  return (
    <div className="mt-6">
      <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full">
        {parts.map((p) => (
          <motion.span key={p.t} className="h-full rounded-full" style={{ background: p.c }} initial={{ width: 0 }} animate={{ width: `${(p.v / sum) * 100}%` }} transition={{ duration: 0.9, ease }} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-fog">
        {parts.map((p) => (
          <span key={p.t} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: p.c }} />
            {p.t} <span className="text-mist tabular">{Math.round((p.v / sum) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The coin in focus: live price, a chart you can scrub, and Buy. */
function Spotlight({ coin, price, onPick, onBuy }: { coin: Coin; price: number; onPick: (t: string) => void; onBuy: (c: Coin) => void }) {
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("1D");
  const [scrub, setScrub] = useState<number | null>(null);
  const r = ranges.find((x) => x.id === range)!;
  const points = useMemo(() => walk(coin.ticker + r.id, r.n, coin.price, coin.change * r.mult, r.vol), [coin, r]);
  const shown = scrub === null ? price : points[scrub];
  const move = scrub === null ? (coin.change * r.mult) : ((points[scrub] - points[0]) / points[0]) * 100;
  const color = move >= 0 ? "#3ee39a" : "#ff6b7a";

  return (
    <Panel spotlight={false} className="overflow-hidden p-5 sm:p-7">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {coins.slice(0, 8).map((c) => (
          <button
            key={c.ticker}
            type="button"
            onClick={() => onPick(c.ticker)}
            className={cn(
              "focus-ring flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-[13.5px] ring-1 transition-colors",
              c.ticker === coin.ticker ? "bg-white text-ink-950 ring-white" : "bg-white/[0.05] text-fog ring-white/[0.07] hover:text-white",
            )}
          >
            <AssetLogo logo={c.logo} className="size-6 text-[10px] ring-0" />
            {c.ticker}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3">
        <AssetLogo logo={coin.logo} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] text-fog">{coin.name}</div>
          <div className="text-[32px] leading-tight font-semibold tracking-tight text-white tabular sm:text-[38px]">
            <NumberFlow value={shown} locales="en-IE" format={{ style: "currency", currency: "EUR", maximumFractionDigits: shown >= 1000 ? 0 : shown >= 1 ? 2 : 4, minimumFractionDigits: shown >= 1000 ? 0 : shown >= 1 ? 2 : 4 }} />
          </div>
          <div className="mt-0.5 text-[13px]">
            <Change value={move} /> <span className="text-mist">{scrub === null ? `past ${r.label.toLowerCase() === "24h" ? "24 hours" : r.label}` : "from start of range"}</span>
          </div>
        </div>
      </div>

      <AreaChart points={points} color={color} onScrub={setScrub} className="mt-4" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
          {ranges.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setRange(x.id)}
              className={cn("focus-ring rounded-full px-3 py-1.5 text-[12.5px] transition-colors", range === x.id ? "bg-white/15 text-white" : "text-mist hover:text-white")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onBuy(coin)}
          className="focus-ring flex h-11 items-center gap-2 rounded-full bg-[radial-gradient(circle_at_30%_25%,#4c97ff,#1f7bff_55%,#1660d6)] px-5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgb(31_123_255/0.9)] transition-[filter] hover:brightness-110"
        >
          <ShoppingBag className="size-4" /> Buy {coin.ticker}
        </button>
      </div>
      <p className="mt-4 text-[13.5px] leading-relaxed text-fog">{coin.about}</p>
    </Panel>
  );
}

/** Two easy ways in: round up card payments, or buy a little every week. */
function AutoCrypto() {
  const [roundUps, setRoundUps] = useState(false);
  const [weekly, setWeekly] = useState(false);
  const rows = [
    {
      id: "round",
      icon: Coins,
      color: "#f7931a",
      title: "Round-ups to Bitcoin",
      sub: roundUps ? "On · about €4.20 a week from your card spend" : "Spare change from card payments goes into BTC",
      on: roundUps,
      set: (v: boolean) => {
        setRoundUps(v);
        toast(v ? "Round-ups on" : "Round-ups off", { description: v ? "Every card payment rounds up to the next euro, into Bitcoin." : "No more spare change into Bitcoin." });
      },
    },
    {
      id: "weekly",
      icon: Repeat,
      color: "#627eea",
      title: "€25 every Monday",
      sub: weekly ? "On · split 70% BTC, 30% ETH" : "Buy a little each week, whatever the price",
      on: weekly,
      set: (v: boolean) => {
        setWeekly(v);
        toast(v ? "Weekly buy on" : "Weekly buy off", { description: v ? "€25 every Monday, 70% Bitcoin and 30% Ethereum." : "Your weekly buy is paused." });
      },
    },
  ];
  return (
    <Panel spotlight={false} className="p-5 sm:p-6">
      <div className="text-[17px] font-medium text-white">On autopilot</div>
      <div className="mt-1 text-[13px] text-mist">Small, regular amounts take the guesswork out of timing.</div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `${r.color}22`, color: r.color }}>
              <r.icon className="size-5" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] text-white">{r.title}</span>
              <span className="block text-[12.5px] text-mist">{r.sub}</span>
            </span>
            <Switch checked={r.on} onCheckedChange={r.set} aria-label={r.title} />
          </div>
        ))}
      </div>
    </Panel>
  );
}
