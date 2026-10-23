"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { PaymentCard } from "@/components/card/payment-card";
import { walletCards } from "@/lib/data";
import { useWallet } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";

export function CardPreview({ className }: { className?: string }) {
  const { cards } = useWallet();
  const [main, next] = walletCards;
  return (
    <Panel className={cn("overflow-hidden", className)}>
      <Link href="/card" className="group focus-ring flex items-center justify-between rounded-t-[inherit] px-7 pt-6 pb-4">
        <span className="text-[17px] font-medium text-white">Your card</span>
        <ChevronRight className="size-5 text-fog transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
      <div className="relative pr-0 pb-0 pl-7">
        <div className="flex items-end gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 25 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-[86%] shrink-0 translate-y-[10px] [perspective:1000px]"
          >
            <Link href="/card" aria-label="Open your Aurora card" className="focus-ring block rounded-[18px]">
              <PaymentCard card={main} frozen={cards[main.id]?.frozen} />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-[86%] shrink-0 translate-y-[10px] opacity-70"
          >
            <PaymentCard card={next} interactive={false} />
          </motion.div>
        </div>
      </div>
    </Panel>
  );
}
