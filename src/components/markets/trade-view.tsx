"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChartPie, Gem, Landmark, Search, TrendingUp, X, type LucideIcon } from "lucide-react";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { assets, money, mostTraded, recentlyViewed, walk, type Asset, type AssetKind } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { BuySheet, type Tradable } from "./buy-sheet";
import { AssetLogo, Change, Sparkline } from "./kit";

const ease = [0.16, 1, 0.3, 1] as const;

const filters: { id: AssetKind; label: string; icon: LucideIcon }[] = [
  { id: "Stock", label: "Stocks", icon: TrendingUp },
  { id: "ETF", label: "ETFs", icon: ChartPie },
  { id: "Bond ETF", label: "Bonds", icon: Landmark },
  { id: "Commodity", label: "Commodities", icon: Gem },
];

const bySymbol = (t: string) => assets.find((a) => a.ticker === t)!;

function toTradable(a: Asset): Tradable {
  return { ...a, tag: a.kind };
}

function Rise({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.55, ease }} className={className}>
      {children}
    </motion.section>
  );
}

export function TradeView() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AssetKind | null>(null);
  const [open, setOpen] = useState<Asset | null>(null);
  const [recent, setRecent] = useState(recentlyViewed);

  const view = (a: Asset) => {
    setOpen(a);
    setRecent((r) => [a.ticker, ...r.filter((t) => t !== a.ticker)].slice(0, 5));
  };

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () => assets.filter((a) => (!kind || a.kind === kind) && (!q || a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))),
    [q, kind],
  );
  const browsing = !q && !kind;
  const movers = useMemo(() => [...assets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5), []);

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Trade" subtitle="Stocks, ETFs, bonds and gold" back="/invest" />

      <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-4 sm:px-8 lg:px-10">
        <Rise delay={0}>
          <div className="flex items-center gap-3 rounded-full border border-hairline bg-white/[0.05] px-4 focus-within:border-electric/60">
            <Search className="size-5 shrink-0 text-mist" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks and ETFs"
              aria-label="Search assets"
              className="h-[52px] min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-mist"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="grid size-7 place-items-center rounded-full bg-white/10 text-fog">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((f) => {
              const on = kind === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setKind(on ? null : f.id)}
                  className={cn(
                    "focus-ring flex items-center gap-2 rounded-full px-4 py-2.5 text-[14.5px] ring-1 transition-colors",
                    on ? "bg-white text-ink-950 ring-white" : "bg-white/[0.05] text-white ring-white/[0.07] hover:bg-white/[0.09]",
                  )}
                >
                  <f.icon className="size-4" strokeWidth={2} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </Rise>

        {browsing ? (
          <>
            <Rise delay={0.06}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">Recently viewed</h2>
              <Panel spotlight={false} className="p-4 sm:p-5">
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                  {recent.map((t) => {
                    const a = bySymbol(t);
                    return (
                      <button key={t} type="button" onClick={() => view(a)} className="focus-ring flex w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl py-1">
                        <AssetLogo logo={a.logo} className="size-14 text-[18px]" />
                        <span className="mt-1 text-[14px] font-medium text-white">{a.ticker}</span>
                        <Change value={a.change} className="text-[12.5px]" />
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </Rise>

            <Rise delay={0.12}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">Most traded</h2>
              <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
                {mostTraded.slice(0, 5).map((t, i) => {
                  const a = bySymbol(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => view(a)}
                      className={cn(
                        "focus-ring group relative flex h-[188px] w-[210px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-white/[0.05] p-4 text-left ring-1 ring-white/[0.07] transition-colors hover:bg-white/[0.08] lg:w-auto",
                        i > 2 && "lg:hidden",
                      )}
                    >
                      <span aria-hidden className="absolute -top-3 right-3 text-[96px] leading-none font-bold text-white/[0.07] tabular">
                        {i + 1}
                      </span>
                      <AssetLogo logo={a.logo} />
                      <span className="mt-auto line-clamp-2 text-[15.5px] leading-snug font-medium text-white">{a.name}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-mist">
                        {a.ticker}
                        <span className="rounded bg-white/10 px-1 text-[11px]">{a.currency}</span>
                      </span>
                      <span className="mt-1.5 flex items-baseline gap-2 text-[14px] text-white tabular">
                        {money(a.price, a.currency)}
                        <Change value={a.change} className="text-[12.5px]" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </Rise>

            <Rise delay={0.18}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">Top movers today</h2>
              <AssetList items={movers} onOpen={view} />
            </Rise>

            <Rise delay={0.22}>
              <h2 className="mb-3 text-[19px] font-semibold text-white">Everything</h2>
              <AssetList items={assets} onOpen={view} />
            </Rise>
          </>
        ) : (
          <Rise delay={0}>
            <div className="mb-3 text-[13px] text-mist">
              {results.length} {results.length === 1 ? "result" : "results"}
            </div>
            {results.length ? (
              <AssetList items={results} onOpen={view} />
            ) : (
              <Panel spotlight={false} className="p-8 text-center text-[15px] text-mist">
                Nothing matches “{query}”. Try a name like Apple or a ticker like VWCE.
              </Panel>
            )}
          </Rise>
        )}

        <p className="text-center text-[12px] text-mist">Prices are illustrative, not live market data. Capital at risk.</p>
      </div>

      <BuySheet item={open ? toTradable(open) : null} onClose={() => setOpen(null)} />
    </div>
  );
}

function AssetList({ items, onOpen }: { items: Asset[]; onOpen: (a: Asset) => void }) {
  return (
    <Panel spotlight={false} className="p-2 sm:p-3">
      <ul>
        {items.map((a) => (
          <li key={a.ticker}>
            <button
              type="button"
              onClick={() => onOpen(a)}
              className="focus-ring flex w-full items-center gap-3 rounded-2xl px-2.5 py-3 text-left transition-colors hover:bg-white/[0.04] sm:gap-4 sm:px-3"
            >
              <AssetLogo logo={a.logo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] text-white">{a.name}</span>
                <span className="block text-[12.5px] text-mist">
                  {a.ticker} · {a.kind}
                </span>
              </span>
              <Sparkline points={walk(a.ticker + "d", 24, a.price, a.change)} up={a.change >= 0} className="hidden sm:block" />
              <span className="w-[92px] shrink-0 text-right">
                <span className="block text-[15px] text-white tabular">{money(a.price, a.currency)}</span>
                <Change value={a.change} className="text-[12.5px]" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
