"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Plus } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { funds, type Ticker } from "@/lib/invest";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR0 } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export function FundTile({ ticker, className }: { ticker: Ticker; className?: string }) {
  const f = funds[ticker];
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-[12px] text-[10px] font-bold tracking-wide text-white", className)}
      style={{ background: `linear-gradient(140deg, ${f.color}, ${f.color}99)`, boxShadow: `0 6px 18px -8px ${f.color}` }}
    >
      {ticker}
    </span>
  );
}

export function Holdings({ onBuyMore }: { onBuyMore: (t: Ticker) => void }) {
  const { holdings, portfolio } = useWallet();
  const [open, setOpen] = useState<Ticker | null>(null);
  const sorted = [...holdings].sort((a, b) => b.value - a.value);

  return (
    <Panel className="p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium text-white">Holdings</h2>
        <span className="text-[12.5px] text-mist">
          {holdings.length} funds · {formatEUR0(portfolio)}
        </span>
      </div>

      {/* Allocation */}
      <div className="mt-4 flex h-3 gap-[3px] overflow-hidden rounded-full">
        {sorted.map((h, i) => (
          <motion.span
            key={h.ticker}
            layout
            initial={{ width: 0 }}
            animate={{ width: `${(h.value / portfolio) * 100}%` }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ background: funds[h.ticker].color, boxShadow: `0 0 14px ${funds[h.ticker].color}55` }}
            title={`${h.ticker} ${Math.round((h.value / portfolio) * 100)}%`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {sorted.map((h) => (
          <span key={h.ticker} className="flex items-center gap-1.5 text-[12px] text-mist">
            <span className="size-2 rounded-full" style={{ background: funds[h.ticker].color }} />
            {funds[h.ticker].kind}
            <span className="text-fog tabular">{Math.round((h.value / portfolio) * 100)}%</span>
          </span>
        ))}
      </div>

      <ul className="mt-4 -mx-2">
        {sorted.map((h, i) => {
          const f = funds[h.ticker];
          const gain = h.value - h.invested;
          const gainPct = (gain / h.invested) * 100;
          const isOpen = open === h.ticker;
          const isNew = h.month === 0 && Math.abs(gain) < 0.5;
          return (
            <motion.li
              key={h.ticker}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease }}
              className="border-b border-hairline last:border-0"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : h.ticker)}
                aria-expanded={isOpen}
                className="focus-ring flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <FundTile ticker={h.ticker} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[15px] text-white">
                    <span className="truncate">{f.name}</span>
                    {isNew && (
                      <span className="shrink-0 rounded-full bg-[#8b6dff]/20 px-1.5 py-px text-[10px] font-semibold tracking-wider text-[#c4b5fd] uppercase">
                        New
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[12.5px] text-mist">
                    {f.kind} · {Math.round((h.value / portfolio) * 100)}%
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[15px] text-white tabular">{formatEUR0(h.value)}</span>
                  <span className={cn("block text-[12.5px] tabular", isNew ? "text-mist" : gain >= 0 ? "text-positive" : "text-negative")}>
                    {isNew ? "Bought today" : `${gain >= 0 ? "+" : ""}${gainPct.toFixed(1)}%`}
                  </span>
                </span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="hidden text-mist sm:block">
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-4">
                      <p className="text-[13px] leading-relaxed text-fog">{f.about}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          ["Put in", formatEUR0(h.invested)],
                          ["Growth", formatEUR0(gain, { sign: true })],
                          ["This month", h.month ? formatEUR0(h.month, { sign: true }) : "–"],
                          ["Shares", `${(h.value / f.price).toFixed(2)}`],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.05]">
                            <dt className="text-[11px] text-mist">{k}</dt>
                            <dd className="mt-0.5 text-[14px] text-white tabular">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[12px] text-mist">
                          {f.ticker} · {f.ter.toFixed(2)}% a year in fees
                        </span>
                        <button
                          type="button"
                          onClick={() => onBuyMore(h.ticker)}
                          className="focus-ring flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white transition-colors hover:bg-white/[0.13]"
                        >
                          <Plus className="size-3.5" strokeWidth={2.2} />
                          Buy more
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </Panel>
  );
}
