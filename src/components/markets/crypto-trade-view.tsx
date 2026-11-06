"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { coins, cryptoWatchlist, money, walk, type Coin } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { BuySheet } from "./buy-sheet";
import { coinTradable, useLivePrices } from "./crypto-view";
import { AssetLogo, Change, Sparkline } from "./kit";

const ease = [0.16, 1, 0.3, 1] as const;

function Rise({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.55, ease }}>
      {children}
    </motion.section>
  );
}

export function CryptoTradeView() {
  const prices = useLivePrices();
  const [query, setQuery] = useState("");
  const [movers, setMovers] = useState<"up" | "down">("up");
  const [open, setOpen] = useState<Coin | null>(null);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => coins.filter((c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)), [q]);
  const top = useMemo(
    () => [...coins].filter((c) => (movers === "up" ? c.change > 0 : c.change < 0)).sort((a, b) => (movers === "up" ? b.change - a.change : a.change - b.change)).slice(0, 8),
    [movers],
  );

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Trade crypto" subtitle="Buy and sell around the clock" back="/crypto" />

      <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-4 sm:px-8 lg:px-10">
        <Rise delay={0}>
          <div className="flex items-center gap-3 rounded-full border border-hairline bg-white/[0.05] px-4 focus-within:border-electric/60">
            <Search className="size-5 shrink-0 text-mist" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coins"
              aria-label="Search coins"
              className="h-[52px] min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-mist"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="grid size-7 place-items-center rounded-full bg-white/10 text-fog">
                <X className="size-4" />
              </button>
            )}
          </div>
        </Rise>

        {q ? (
          <Rise delay={0}>
            {results.length ? (
              <Panel spotlight={false} className="p-2 sm:p-3">
                <ul>{results.map((c) => <CoinRow key={c.ticker} c={c} price={prices[c.ticker]} onOpen={setOpen} />)}</ul>
              </Panel>
            ) : (
              <Panel spotlight={false} className="p-8 text-center text-[15px] text-mist">
                No coin matches “{query}”. Try Bitcoin or SOL.
              </Panel>
            )}
          </Rise>
        ) : (
          <>
            <Rise delay={0.06}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">Watchlist</h2>
              <Panel spotlight={false} className="p-2 sm:p-3">
                <ul>
                  {cryptoWatchlist.map((t) => (
                    <CoinRow key={t} c={coins.find((c) => c.ticker === t)!} price={prices[t]} onOpen={setOpen} />
                  ))}
                </ul>
              </Panel>
            </Rise>

            <Rise delay={0.12}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">Top movers</h2>
              <Panel spotlight={false} className="p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-1 rounded-full bg-white/[0.06] p-1">
                  {(["up", "down"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMovers(m)}
                      className={cn("focus-ring rounded-full py-2.5 text-[14.5px] transition-colors", movers === m ? "bg-white/15 text-white" : "text-mist hover:text-white")}
                    >
                      {m === "up" ? "Top gainers" : "Top losers"}
                    </button>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-4 gap-y-5 sm:grid-cols-8">
                  {top.map((c, i) => (
                    <motion.button
                      key={movers + c.ticker}
                      type="button"
                      onClick={() => setOpen(c)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      className="focus-ring flex flex-col items-center gap-1.5 rounded-2xl py-1"
                    >
                      <AssetLogo logo={c.logo} className="size-14 text-[18px]" />
                      <span className="mt-1 text-[13.5px] text-white">{c.ticker}</span>
                      <Change value={c.change} className="text-[12px]" />
                    </motion.button>
                  ))}
                </div>
              </Panel>
            </Rise>

            <Rise delay={0.18}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">All coins</h2>
              <Panel spotlight={false} className="p-2 sm:p-3">
                <ul>{coins.map((c) => <CoinRow key={c.ticker} c={c} price={prices[c.ticker]} onOpen={setOpen} />)}</ul>
              </Panel>
            </Rise>
          </>
        )}

        <p className="text-center text-[12px] text-mist">Prices are illustrative, not live market data. Crypto is volatile; only put in what you can afford to lose.</p>
      </div>

      <BuySheet item={open ? coinTradable(open, prices[open.ticker]) : null} onClose={() => setOpen(null)} />
    </div>
  );
}

function CoinRow({ c, price, onOpen }: { c: Coin; price: number; onOpen: (c: Coin) => void }) {
  return (
    <li>
      <button type="button" onClick={() => onOpen(c)} className="focus-ring flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04] sm:gap-4">
        <AssetLogo logo={c.logo} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15.5px] text-white">{c.name}</span>
          <span className="block text-[12.5px] text-mist">{c.ticker} to EUR</span>
        </span>
        <Sparkline points={walk(c.ticker + "s", 24, c.price, c.change)} up={c.change >= 0} className="hidden sm:block" />
        <span className="w-[100px] shrink-0 text-right">
          <span className="block text-[15px] text-white tabular">{money(price)}</span>
          <Change value={c.change} className="text-[12.5px]" />
        </span>
      </button>
    </li>
  );
}
