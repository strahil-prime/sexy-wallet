"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { comingSoon } from "./coming-soon";

export function SearchField({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => comingSoon("Search")}
      className={cn(
        "group focus-ring glass flex h-12 flex-1 cursor-text items-center gap-3 rounded-full px-5 text-left text-[15px] text-mist transition-colors hover:border-hairline-strong",
        className,
      )}
    >
      <Search className="size-5 text-fog transition-transform duration-300 group-hover:scale-110" strokeWidth={1.7} />
      <span className="flex-1">Search anything...</span>
      <kbd className="hidden rounded-md border border-hairline bg-white/5 px-1.5 py-0.5 font-sans text-[11px] text-mist xl:inline">⌘K</kbd>
    </button>
  );
}

const tellers = [
  { id: "bella", name: "Bella", role: "Lead teller", available: true },
  { id: "teller-2", name: "Teller two", role: "Arriving soon", available: false },
  { id: "teller-3", name: "Teller three", role: "Arriving soon", available: false },
];

/** Teller switcher. Only Bella is live in v1. */
export function TellerMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger className="focus-ring group flex shrink-0 cursor-pointer items-center gap-2 rounded-full p-0.5 pr-1">
        <span className="relative">
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-cyan via-electric to-violet opacity-80 blur-[1px] transition-opacity group-hover:opacity-100" />
          <Image
            src="/teller/bella-avatar.jpg"
            alt="Bella"
            width={52}
            height={52}
            className="relative size-[52px] rounded-full object-cover ring-2 ring-ink-900"
          />
          <span className="absolute right-0 bottom-0.5 size-3 rounded-full bg-positive ring-2 ring-ink-900" />
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-fog">
          <ChevronDown className="size-5" strokeWidth={1.8} />
        </motion.span>
      </Dropdown.Trigger>
      <AnimatePresence>
        {open && (
          <Dropdown.Portal forceMount>
            <Dropdown.Content asChild align="end" sideOffset={10} forceMount>
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="glass-strong z-50 w-64 origin-top-right rounded-2xl p-1.5"
              >
                <div className="px-3 pt-2 pb-1.5 text-[11px] font-medium tracking-wider text-mist uppercase">Your teller</div>
                {tellers.map((t) => (
                  <Dropdown.Item
                    key={t.id}
                    disabled={!t.available}
                    onSelect={(e) => {
                      if (!t.available) e.preventDefault();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none",
                      t.available ? "cursor-pointer data-[highlighted]:bg-white/[0.06]" : "opacity-50",
                    )}
                  >
                    {t.available ? (
                      <Image src="/teller/bella-avatar.jpg" alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-9 place-items-center rounded-full bg-white/[0.06]">
                        <Lock className="size-4 text-mist" />
                      </span>
                    )}
                    <span className="flex-1">
                      <span className="block text-sm text-white">{t.name}</span>
                      <span className="block text-xs text-mist">{t.role}</span>
                    </span>
                    {t.available && <Check className="size-4 text-cyan" />}
                  </Dropdown.Item>
                ))}
              </motion.div>
            </Dropdown.Content>
          </Dropdown.Portal>
        )}
      </AnimatePresence>
    </Dropdown.Root>
  );
}
