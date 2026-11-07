"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { LogoSpec } from "@/lib/markets";
import { money, walk } from "@/lib/markets";
import { cn } from "@/lib/utils";
import { AreaChart, AssetLogo, Change, primaryButton, Sheet } from "./kit";

export type Tradable = {
  ticker: string;
  name: string;
  about: string;
  price: number;
  currency: "€" | "$";
  change: number;
  logo: LogoSpec;
  /** a line under the name, e.g. "Stock · NASDAQ" */
  tag: string;
};

const QUICK = [25, 50, 100, 250];
const MIN = 1;
const MAX = 50_000;

const eur = (v: number) => `€${v.toLocaleString("en-IE", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Keeps what was typed to digits and one decimal separator with at most two decimals. */
function clean(raw: string) {
  let s = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  s = s.replace(/^0+(?=\d)/, "");
  return s.slice(0, 9);
}

/** Price, a month of history and a buy for any amount. Orders are pretend: they only show a toast. */
export function BuySheet({
  item,
  onClose,
  onBought,
}: {
  item: Tradable | null;
  onClose: () => void;
  onBought?: (item: Tradable, eur: number) => void;
}) {
  return (
    <Sheet open={!!item} onClose={onClose} label={item ? `Buy ${item.name}` : "Buy"}>
      {item && <BuyBody key={item.ticker} item={item} onClose={onClose} onBought={onBought} />}
    </Sheet>
  );
}

function BuyBody({ item, onClose, onBought }: { item: Tradable; onClose: () => void; onBought?: (item: Tradable, eur: number) => void }) {
  const [text, setText] = useState("100");
  const [typing, setTyping] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // A month of daily closes; the month's move is a few times the day's.
  const points = useMemo(() => walk(item.ticker, 31, item.price, item.change * 3.2, 0.02), [item.ticker, item.price, item.change]);

  const amount = Number(text) || 0;
  const tooLow = amount < MIN;
  const tooHigh = amount > MAX;
  const ok = !tooLow && !tooHigh;
  const units = amount / item.price;

  const buy = () => {
    if (!ok) return;
    input.current?.blur();
    onBought?.(item, amount);
    toast(`Bought ${eur(amount)} of ${item.ticker}`, { description: "Filled at the market price. This is a demo order." });
    onClose();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        buy();
      }}
    >
      <div className="flex items-center gap-3 pr-12">
        <AssetLogo logo={item.logo} className="size-11" />
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold text-white">{item.name}</div>
          <div className="text-[13px] text-mist">
            {item.ticker} · {item.tag}
          </div>
        </div>
      </div>

      {/* While the keyboard is up on a phone, the chart steps aside so Buy stays in view. */}
      <div className={cn(typing && "max-sm:hidden")}>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[26px] leading-none font-semibold tracking-tight text-white tabular sm:text-[30px]">
              {money(scrub === null ? item.price : points[scrub], item.currency)}
            </div>
            <div className="mt-1.5 text-[13px] text-mist">
              {scrub === null ? <Change value={item.change} /> : `${30 - scrub} days ago`}
              {scrub === null && <span className="ml-1.5">today</span>}
            </div>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-mist">1 month</span>
        </div>
        <AreaChart points={points} color={item.change >= 0 ? "#3ee39a" : "#ff6b7a"} onScrub={setScrub} className="mt-2 h-24 sm:h-36" />
      </div>

      <label
        className={cn(
          "mt-4 flex cursor-text flex-col items-center rounded-[22px] bg-white/[0.04] px-4 pt-3 pb-3 ring-1 transition-colors",
          ok ? "ring-white/[0.08] focus-within:ring-electric/60" : "ring-[#ff6b7a]/50",
        )}
      >
        <span className="text-[12px] font-medium tracking-[0.12em] text-mist uppercase">Amount</span>
        <span className="mt-0.5 flex items-baseline justify-center text-[40px] leading-tight font-semibold tracking-tight text-white tabular">
          <span className={cn(!text && "text-mist")}>€</span>
          <input
            ref={input}
            value={text}
            onChange={(e) => setText(clean(e.target.value))}
            onFocus={(e) => {
              setTyping(true);
              e.currentTarget.select();
            }}
            onBlur={() => setTyping(false)}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="0"
            aria-label={`Amount in euros to buy of ${item.ticker}`}
            className="ml-0.5 min-w-[1ch] bg-transparent text-left outline-none placeholder:text-mist"
            style={{ width: `${Math.max(1, text.length) + 0.15}ch` }}
          />
        </span>
        <span className={cn("text-[12.5px] tabular", ok ? "text-mist" : "text-[#ff8b96]")}>
          {tooLow
            ? `Enter at least €${MIN}`
            : tooHigh
              ? `The most per order is €${MAX.toLocaleString("en-IE")}`
              : `About ${units.toLocaleString("en-IE", { maximumFractionDigits: item.price > 1000 ? 6 : 4 })} ${item.ticker}${item.currency === "$" ? " (converted from €)" : ""}`}
        </span>
      </label>

      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {QUICK.map((a) => (
          <button
            key={a}
            type="button"
            // Keeps the keyboard up when a chip is tapped mid-typing.
            onPointerDown={(e) => typing && e.preventDefault()}
            onClick={() => setText(String(a))}
            className={cn(
              "focus-ring rounded-full py-2 text-[14px] tabular ring-1 transition-colors",
              amount === a ? "bg-electric/20 text-white ring-electric/50" : "bg-white/[0.04] text-fog ring-white/[0.08] hover:text-white",
            )}
          >
            €{a}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={!ok}
        onPointerDown={(e) => typing && e.preventDefault()}
        className={`${primaryButton} mt-4`}
      >
        {ok ? `Buy ${eur(amount)} of ${item.ticker}` : `Buy ${item.ticker}`}
      </button>

      <p className={cn("mt-3 text-[13.5px] leading-relaxed text-fog", typing && "max-sm:hidden")}>{item.about}</p>
      <p className={cn("mt-2 text-center text-[11.5px] text-mist", typing && "max-sm:hidden")}>Prices are illustrative. Capital at risk.</p>
    </form>
  );
}
