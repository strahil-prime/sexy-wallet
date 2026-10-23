"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { comingSoon } from "./coming-soon";
import { isActive, navItems } from "./nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 hidden w-[200px] shrink-0 flex-col border-r border-hairline bg-ink-900/55 px-4 pt-7 pb-6 backdrop-blur-xl lg:flex">
      <Link href="/" className="focus-ring mb-10 ml-2.5 inline-flex w-fit rounded-lg text-white" aria-label="Home">
        <motion.span
          whileHover={{ rotate: 90, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="inline-flex"
        >
          <Logo className="size-9" glow />
        </motion.span>
      </Link>

      <nav className="flex flex-col gap-1.5">
        {navItems.map((item, i) => {
          const active = isActive(pathname, item.href);
          const content = (
            <>
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-[14px] bg-white/[0.07] ring-1 ring-white/[0.06]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <item.icon
                className={cn(
                  "relative size-[22px] transition-transform duration-300 group-hover:scale-110",
                  active ? "text-white" : "text-fog/80 group-hover:text-white",
                )}
                strokeWidth={1.6}
              />
              <span className={cn("relative text-[15px]", active ? "font-medium text-white" : "text-fog/85 group-hover:text-white")}>
                {item.label}
              </span>
            </>
          );
          const cls =
            "group focus-ring relative flex h-[52px] items-center gap-3.5 rounded-[14px] px-3.5 transition-colors hover:bg-white/[0.03]";
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.045, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {item.live ? (
                <Link href={item.href} className={cls} aria-current={active ? "page" : undefined}>
                  {content}
                </Link>
              ) : (
                <button type="button" className={cn(cls, "w-full cursor-pointer text-left")} onClick={() => comingSoon(item.label)}>
                  {content}
                </button>
              )}
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-auto px-2">
        <div className="flex items-center gap-2 text-[11px] tracking-wide text-mist/70 uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-positive/70" />
            <span className="relative size-1.5 rounded-full bg-positive" />
          </span>
          All systems normal
        </div>
      </div>
    </aside>
  );
}
