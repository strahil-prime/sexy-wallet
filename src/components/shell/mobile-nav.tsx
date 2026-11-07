"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { comingSoon } from "./coming-soon";
import { isActive, navItems } from "./nav";

// Send is on the Home quick buttons; Activity is reached from the dashboard's Recent activity "See all" on phones.
const tabs = ["/", "/card", "/crypto", "/invest", "/rewards"];

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
          const inner = (
            <>
              {active && (
                // Same marker as the Assistant / Dashboard tabs, laid on the card's top outline.
                <motion.span
                  layoutId="mnav-dot"
                  aria-hidden
                  className="absolute inset-x-3 -top-px h-px bg-cyan-300 shadow-[0_0_8px_rgb(103_232_249/0.45)]"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <item.icon className={cn("size-[22px]", active ? "text-white" : "text-mist")} strokeWidth={1.7} />
              <span className={cn("text-[10.5px]", active ? "text-white" : "text-mist")}>{item.label}</span>
            </>
          );
          const cls = "focus-ring relative flex h-full w-14 flex-col items-center justify-center gap-1 rounded-xl";
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
