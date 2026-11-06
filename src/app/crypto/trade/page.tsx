import type { Metadata } from "next";
import { CryptoTradeView } from "@/components/markets/crypto-trade-view";

export const metadata: Metadata = { title: "Trade crypto · Nobby" };

export default function CryptoTradePage() {
  return <CryptoTradeView />;
}
