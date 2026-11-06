import type { Metadata } from "next";
import { TradeView } from "@/components/markets/trade-view";

export const metadata: Metadata = { title: "Trade · Nobby" };

export default function TradePage() {
  return <TradeView />;
}
