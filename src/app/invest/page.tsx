import type { Metadata } from "next";
import { InvestView } from "@/components/invest/invest-view";

export const metadata: Metadata = { title: "Invest · Neville" };

export default function InvestPage() {
  return <InvestView />;
}
