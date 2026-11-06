import type { Metadata } from "next";
import { CryptoView } from "@/components/markets/crypto-view";

export const metadata: Metadata = { title: "Crypto · Nobby" };

export default function CryptoPage() {
  return <CryptoView />;
}
