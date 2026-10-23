"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Panel } from "@/components/ui/panel";
import { comingSoon } from "@/components/shell/coming-soon";
import type { Activity } from "@/lib/data";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR, formatWhen } from "@/lib/utils";

export function ActivityRow({ a, index = 0 }: { a: Activity; index?: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: 0.35 + index * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex items-center gap-4 py-3.5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-hairline"
    >
      <span className="absolute -inset-x-3 inset-y-1 rounded-2xl bg-white/[0.03] opacity-0 transition-opacity group-hover:opacity-100" />
      <motion.span whileHover={{ scale: 1.08, rotate: -4 }} className="relative">
        <BrandMark activity={a} />
      </motion.span>
      <div className="relative min-w-0 flex-1">
        <div className="truncate text-[16px] text-white">{a.title}</div>
        <div className="mt-0.5 text-[13px] text-mist" suppressHydrationWarning>
          {formatWhen(new Date(a.at))}
        </div>
      </div>
      <div className={cn("relative text-[16px] font-medium tabular", a.amount > 0 ? "text-positive" : "text-white")}>
        {formatEUR(a.amount, { sign: true })}
      </div>
    </motion.li>
  );
}

export function ActivityList({ className, limit = 4 }: { className?: string; limit?: number }) {
  const { activity } = useWallet();
  return (
    <Panel className={cn("px-7 pt-6 pb-3", className)}>
      <div className="relative mb-1 flex items-center justify-between">
        <span className="text-[17px] font-medium text-white">Recent activity</span>
        <button
          type="button"
          onClick={() => comingSoon("Activity")}
          className="group focus-ring flex cursor-pointer items-center gap-1 rounded-md text-[13px] text-fog hover:text-white"
        >
          See all <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <ul className="relative">
        <AnimatePresence initial={true}>
          {activity.slice(0, limit).map((a, i) => (
            <ActivityRow key={a.id} a={a} index={i} />
          ))}
        </AnimatePresence>
      </ul>
    </Panel>
  );
}
