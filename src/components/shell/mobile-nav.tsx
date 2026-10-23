"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { comingSoon } from "./coming-soon";
import { isActive, navItems } from "./nav";

const tabs = ["/", "/card", "/send", "/activity", "/profile"];

export function MobileNav() {
  const pathname = usePathname();
  const items = tabs.map((t) => navItems.find((n) => n.href === t)!);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="glass-strong flex h-[68px] items-center justify-around rounded-[24px] px-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          if (item.href === "/send") {
            return (
              <Link key={item.href} href="/send" aria-label="Send" className="focus-ring -mt-7 rounded-full">
                <motion.span
                  whileTap={{ scale: 0.9 }}
                  className="grid size-14 place-items-center rounded-full bg-electric text-white shadow-[0_10px_30px_-6px_rgb(31_123_255/0.8)] ring-4 ring-ink-950"
                >
                  <ArrowUpRight className="size-6" strokeWidth={2} />
                </motion.span>
              </Link>
            );
          }
          const inner = (
            <>
              {active && (
                <motion.span layoutId="mnav-dot" className="absolute -top-1 h-1 w-6 rounded-full bg-cyan shadow-[0_0_12px_#2ad1e6]" />
              )}
              <item.icon className={cn("size-[22px]", active ? "text-white" : "text-mist")} strokeWidth={1.7} />
              <span className={cn("text-[10.5px]", active ? "text-white" : "text-mist")}>{item.label}</span>
            </>
          );
          const cls = "focus-ring relative flex w-14 flex-col items-center gap-1 rounded-xl py-1";
          return item.live ? (
            <Link key={item.href} href={item.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={item.href} type="button" className={cls} onClick={() => comingSoon(item.label)}>
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
