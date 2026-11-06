import type { Metadata } from "next";
import { RewardsView } from "@/components/rewards/rewards-view";

export const metadata: Metadata = { title: "Rewards · Nobby" };

export default function RewardsPage() {
  return <RewardsView />;
}
