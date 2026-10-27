"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { comingSoon } from "./coming-soon";
import { isActive, navItems } from "./nav";

const tabs = ["/", "/card", "/send", "/activity", "/profile"];

export function MobileNav() {
  const pathname = usePathname();
  const items = tabs.map((t) => navItems.find((n) => n.href === t)!);
  const shown = useShowOnScroll(pathname);

  return (
    // Sits 15px lower than it used to: flush with the bottom edge and 3px shorter.
    // Hidden until the viewer scrolls down, so it never covers the bottom of a page on arrival.
    <motion.nav
      initial={false}
      animate={{ y: shown ? 0 : "130%", opacity: shown ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      aria-hidden={!shown}
      inert={!shown}
      className="fixed inset-x-3 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="glass-strong flex h-[65px] items-center justify-around rounded-[24px] px-2">
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
    </motion.nav>
  );
}

/**
 * Shown once the page is scrolled down, hidden again back at the top. A swipe up also shows it,
 * so pages that fit on screen without scrolling can still reach it. Each new page starts hidden.
 */
function useShowOnScroll(pathname: string) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(window.scrollY > 24);
    let startY = 0;
    const onScroll = () => setShown(window.scrollY > 24);
    const onStart = (e: TouchEvent) => (startY = e.touches[0].clientY);
    const onMove = (e: TouchEvent) => {
      if (startY - e.touches[0].clientY > 30) setShown(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
    };
  }, [pathname]);

  return shown;
}
