"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Ellipsis } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { comingSoon } from "@/components/shell/coming-soon";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Send", icon: ArrowUpRight, href: "/send", primary: true },
  { label: "Receive", icon: ArrowDownLeft },
  { label: "Buy", icon: CreditCard },
  { label: "More", icon: Ellipsis },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <Panel className={cn("px-4 py-6 sm:px-6", className)}>
      <div className="relative grid grid-cols-4 gap-2">
        {actions.map((a, i) => {
          const circle = (
            <motion.span
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={cn(
                "relative grid size-[68px] place-items-center rounded-full sm:size-20",
                a.primary
                  ? "bg-[radial-gradient(circle_at_30%_25%,#4c97ff,#1f7bff_55%,#1660d6)] text-white shadow-[0_12px_32px_-8px_rgb(31_123_255/0.9),inset_0_1px_0_rgb(255_255_255/0.35)]"
                  : "bg-white/[0.06] text-white ring-1 ring-white/[0.06] transition-colors group-hover:bg-white/[0.1]",
              )}
            >
              {a.primary && <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-electric/60" />}
              <a.icon
                className="size-7 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                strokeWidth={1.7}
              />
            </motion.span>
          );
          const label = <span className="text-[15px] text-fog transition-colors group-hover:text-white">{a.label}</span>;
          const cls = "group focus-ring flex flex-col items-center gap-3 rounded-2xl";
          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {a.href ? (
                <Link href={a.href} className={cls}>
                  {circle}
                  {label}
                </Link>
              ) : (
                <button type="button" className={cn(cls, "w-full cursor-pointer")} onClick={() => comingSoon(a.label)}>
                  {circle}
                  {label}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}
