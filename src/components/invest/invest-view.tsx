"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowDown, Ellipsis, Plus, TrendingUp } from "lucide-react";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { usePersona } from "@/components/teller/persona";
import type { Ticker } from "@/lib/invest";
import { Autopilot, InvestTimeline } from "./autopilot";
import { FutureYou } from "./future-you";
import { Holdings } from "./holdings";
import { PortfolioHero } from "./portfolio-hero";
import { QuickInvest } from "./quick-invest";

const ease = [0.16, 1, 0.3, 1] as const;

const investActions: QuickAction[] = [
  { label: "Trade", icon: TrendingUp, href: "/invest/trade", primary: true },
  { label: "Add money", icon: Plus },
  { label: "Withdraw", icon: ArrowDown },
  { label: "More", icon: Ellipsis },
];

function Rise({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease }} className="min-w-0">
      {children}
    </motion.div>
  );
}

export function InvestView() {
  const router = useRouter();
  const { choose } = usePersona();
  const [fund, setFund] = useState<Ticker>("VWCE");
  const investRef = useRef<HTMLDivElement>(null);

  const askMichael = () => {
    choose("michael");
    router.push("/");
  };
  const buyMore = (t: Ticker) => {
    setFund(t);
    investRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Invest" subtitle="Your money, quietly growing" />

      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Rise delay={0}>
            <PortfolioHero onAskMichael={askMichael} />
          </Rise>
          <Rise delay={0.04}>
            <QuickActions actions={investActions} />
          </Rise>
          <Rise delay={0.08}>
            <Holdings onBuyMore={buyMore} />
          </Rise>
          {/* On wide screens the activity fills the left column; on phones it comes last */}
          <div className="hidden xl:block">
            <Rise delay={0.12}>
              <InvestTimeline />
            </Rise>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <Rise delay={0.12}>
            <QuickInvest ref={investRef} fund={fund} onFund={setFund} />
          </Rise>
          <Rise delay={0.16}>
            <FutureYou />
          </Rise>
          <Rise delay={0.2}>
            <Autopilot onAskMichael={askMichael} />
          </Rise>
          <div className="xl:hidden">
            <Rise delay={0.24}>
              <InvestTimeline />
            </Rise>
          </div>
        </div>
      </div>
    </div>
  );
}
