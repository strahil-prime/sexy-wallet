"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Coins, Ellipsis, Repeat } from "lucide-react";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import { coins, initialCrypto, money, walk, type Coin } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { BuySheet, type Tradable } from "./buy-sheet";
import { CoinSheet } from "./coin-sheet";
import { CryptoTopPicks, LivePrice } from "./crypto-picks";
import { AssetLogo, Change, Sparkline } from "./kit";

const ease = [0.16, 1, 0.3, 1] as const;

const actions: QuickAction[] = [
  { label: "Trade", icon: Repeat, href: "/crypto/trade", primary: true },
  { label: "Receive", icon: ArrowDownLeft },
  { label: "Send", icon: ArrowUpRight },
  { label: "More", icon: Ellipsis },
];

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
  const [buying, setBuying] = useState<Coin | null>(null);
  const [viewing, setViewing] = useState<Coin | null>(null);

  const total = Object.entries(held).reduce((s, [t, q]) => s + q * prices[t], 0);
  const dayMove = Object.entries(held).reduce((s, [t, q]) => {
    const c = coins.find((x) => x.ticker === t)!;
    return s + q * prices[t] * (c.change / (100 + c.change));
  }, 0);

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
                <LivePrice value={total} />
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
                      <button type="button" onClick={() => setViewing(c)} className="focus-ring group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04]">
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
                        <ChevronRight className="-mr-1 size-4 shrink-0 text-mist transition-colors group-hover:text-fog" />
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
            <CryptoTopPicks prices={prices} onBuy={setBuying} />
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
                      onClick={() => setViewing(c)}
                      className="focus-ring flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
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

      <CoinSheet
        coin={viewing}
        price={viewing ? prices[viewing.ticker] : 0}
        held={viewing ? (held[viewing.ticker] ?? 0) : 0}
        onClose={() => setViewing(null)}
        onBuy={(c) => {
          setViewing(null);
          setBuying(c);
        }}
      />
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
