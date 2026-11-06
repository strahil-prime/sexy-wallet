"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { LogoSpec } from "@/lib/markets";
import { money, walk } from "@/lib/markets";
import { AmountPicker, AreaChart, AssetLogo, Change, primaryButton, Sheet } from "./kit";

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

const AMOUNTS = [25, 50, 100, 250];

/** Price, a month of history and a one-tap buy. Orders are pretend: they only show a toast. */
export function BuySheet({
  item,
  onClose,
  onBought,
}: {
  item: Tradable | null;
  onClose: () => void;
  onBought?: (item: Tradable, eur: number) => void;
}) {
  const [amount, setAmount] = useState(100);
  const [scrub, setScrub] = useState<number | null>(null);
  // A month of daily closes; the month's move is a few times the day's.
  const points = useMemo(() => (item ? walk(item.ticker, 31, item.price, item.change * 3.2, 0.02) : []), [item]);

  return (
    <Sheet open={!!item} onClose={onClose} label={item ? `Buy ${item.name}` : "Buy"}>
      {item && (
        <>
          <div className="flex items-center gap-3 pr-12">
            <AssetLogo logo={item.logo} className="size-12" />
            <div className="min-w-0">
              <div className="truncate text-[17px] font-semibold text-white">{item.name}</div>
              <div className="text-[13px] text-mist">
                {item.ticker} · {item.tag}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-[30px] leading-none font-semibold tracking-tight text-white tabular">
                {money(scrub === null ? item.price : points[scrub], item.currency)}
              </div>
              <div className="mt-1.5 text-[13px] text-mist">
                {scrub === null ? <Change value={item.change} /> : `${30 - scrub} days ago`}
                {scrub === null && <span className="ml-1.5">today</span>}
              </div>
            </div>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-mist">1 month</span>
          </div>

          <AreaChart points={points} color={item.change >= 0 ? "#3ee39a" : "#ff6b7a"} onScrub={setScrub} className="mt-3 h-36 sm:h-40" />

          <p className="mt-3 text-[14px] leading-relaxed text-fog">{item.about}</p>

          <div className="mt-5 text-[12px] font-medium tracking-[0.12em] text-mist uppercase">Amount</div>
          <div className="mt-2.5">
            <AmountPicker amounts={AMOUNTS} value={amount} onChange={setAmount} />
          </div>
          <div className="mt-2 text-[12.5px] text-mist tabular">
            About {(amount / item.price).toLocaleString("en-IE", { maximumFractionDigits: item.price > 1000 ? 6 : 4 })} {item.ticker}
            {item.currency === "$" && " (converted from €)"}
          </div>

          <button
            type="button"
            className={`${primaryButton} mt-5`}
            onClick={() => {
              onBought?.(item, amount);
              toast(`Bought €${amount} of ${item.ticker}`, { description: "Filled at the market price. This is a demo order." });
              onClose();
            }}
          >
            Buy €{amount} of {item.ticker}
          </button>
          <p className="mt-3 text-center text-[11.5px] text-mist">Prices are illustrative. Capital at risk.</p>
        </>
      )}
    </Sheet>
  );
}
