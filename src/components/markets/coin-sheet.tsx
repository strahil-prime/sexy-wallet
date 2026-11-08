"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, ShoppingBag } from "lucide-react";
import { comingSoon } from "@/components/shell/coming-soon";
import { coinFacts, money, walk, type Coin } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { LivePrice } from "./crypto-picks";
import { AreaChart, AssetLogo, Change, primaryButton, Sheet } from "./kit";

const RANGES = [
  { id: "1W", n: 42, mult: 2.6, vol: 0.016, label: "1W" },
  { id: "1M", n: 31, mult: 5, vol: 0.03, label: "1M" },
  { id: "1Y", n: 52, mult: 18, vol: 0.07, label: "1Y" },
] as const;

/** One coin up close: what you hold, how it's moving, and buy more. Opens over the page like the buy sheet. */
export function CoinSheet({
  coin,
  price,
  held,
  onClose,
  onBuy,
}: {
  coin: Coin | null;
  price: number;
  held: number;
  onClose: () => void;
  onBuy: (c: Coin) => void;
}) {
  return (
    <Sheet open={!!coin} onClose={onClose} label={coin ? coin.name : "Coin"}>
      {coin && <Body key={coin.ticker} coin={coin} price={price} held={held} onBuy={onBuy} />}
    </Sheet>
  );
}

function Body({ coin, price, held, onBuy }: { coin: Coin; price: number; held: number; onBuy: (c: Coin) => void }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("1M");
  const [scrub, setScrub] = useState<number | null>(null);
  const r = RANGES.find((x) => x.id === range)!;
  const points = useMemo(() => walk(coin.ticker + r.id, r.n, coin.price, coin.change * r.mult, r.vol), [coin, r]);
  const move = scrub === null ? coin.change * r.mult : ((points[scrub] - points[0]) / points[0]) * 100;
  const facts = coinFacts[coin.ticker];
  const value = held * price;
  // What today's move did to the holding.
  const today = value * (coin.change / (100 + coin.change));

  return (
    <>
      <div className="flex items-center gap-3 pr-12">
        <AssetLogo logo={coin.logo} className="size-11" />
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold text-white">{coin.name}</div>
          <div className="text-[13px] text-mist">
            {coin.ticker} · {facts?.category ?? "Crypto"}
          </div>
        </div>
      </div>

      {held > 0 ? (
        <div className="mt-4 rounded-[22px] bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/[0.06]">
          <div className="text-[12px] font-medium tracking-[0.12em] text-mist uppercase">You own</div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <LivePrice value={value} className="text-[28px] leading-tight font-semibold tracking-tight" />
            <span className={cn("text-[13.5px] tabular", today >= 0 ? "text-positive" : "text-[#ff8b96]")}>
              {today >= 0 ? "+" : "−"}
              {money(Math.abs(today))} today
            </span>
          </div>
          <div className="mt-0.5 text-[13px] text-mist tabular">
            {held.toLocaleString("en-IE", { maximumFractionDigits: 6 })} {coin.ticker}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[22px] bg-white/[0.03] px-4 py-3 text-[13.5px] text-mist ring-1 ring-white/[0.05]">You don&apos;t own any {coin.name} yet.</div>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[13px] text-mist">Price</div>
          <div className="text-[22px] leading-tight font-semibold tracking-tight">
            {scrub === null ? <LivePrice value={price} /> : <span className="text-white tabular">{money(points[scrub])}</span>}
          </div>
          <div className="mt-0.5 text-[13px]">
            <Change value={move} /> <span className="text-mist">{scrub === null ? `past ${r.label}` : "from start of range"}</span>
          </div>
        </div>
        <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
          {RANGES.map((x) => (
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
      </div>
      <AreaChart points={points} color={move >= 0 ? "#3ee39a" : "#ff6b7a"} onScrub={setScrub} className="mt-2 h-28 sm:h-36" />

      <p className="mt-3 text-[13.5px] leading-relaxed text-fog">{coin.about}</p>

      <button type="button" className={`${primaryButton} mt-5`} onClick={() => onBuy(coin)}>
        <ShoppingBag className="size-[18px]" /> {held > 0 ? `Buy more ${coin.ticker}` : `Buy ${coin.ticker}`}
      </button>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[
          { label: "Sell", icon: Banknote, soon: "Selling crypto" },
          { label: "Send", icon: ArrowUpRight, soon: "Sending crypto" },
          { label: "Receive", icon: ArrowDownLeft, soon: "Receiving crypto" },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => comingSoon(a.soon)}
            className="focus-ring flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] text-[14px] text-white ring-1 ring-white/[0.07] transition-colors hover:bg-white/[0.1]"
          >
            <a.icon className="size-4 text-fog" /> {a.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[11.5px] text-mist">Prices are illustrative. Crypto can lose most of its value.</p>
    </>
  );
}
