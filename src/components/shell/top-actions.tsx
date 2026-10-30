"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersona } from "@/components/teller/persona";
import { personas, upcomingPersonas } from "@/lib/personas";
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

/** The signed-in user's photo. Profile itself is not live in v1. */
export function ProfileAvatar({ size = 52, className }: { size?: number; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => comingSoon("Profile")}
      aria-label="Your profile"
      className={cn("focus-ring relative shrink-0 cursor-pointer rounded-full transition-transform hover:scale-[1.04]", className)}
    >
      <Image
        src="/profile/strahil.jpg"
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-1 ring-white/15"
      />
      <span className="absolute right-0 bottom-0 size-3 rounded-full bg-positive ring-2 ring-ink-900" />
    </button>
  );
}

/** Teller switcher, beside the sound button: the active teller's face plus a chevron. */
export function TellerMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { persona, choose } = usePersona();
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger
        aria-label="Choose your teller"
        className={cn("focus-ring group flex shrink-0 cursor-pointer items-center gap-1 rounded-full", className)}
      >
        <span className="relative">
          <span className="absolute -inset-[2px] rounded-full bg-gradient-to-tr from-cyan via-electric to-violet opacity-80 transition-opacity group-hover:opacity-100" />
          <Image
            src={persona.avatar}
            alt=""
            width={40}
            height={40}
            className="relative size-10 rounded-full object-cover ring-2 ring-ink-900"
          />
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-fog transition-colors group-hover:text-white">
          <ChevronDown className="size-4" strokeWidth={2} />
        </motion.span>
      </Dropdown.Trigger>
      <AnimatePresence>
        {open && (
          <Dropdown.Portal forceMount>
            <Dropdown.Content asChild align="start" sideOffset={10} forceMount>
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="glass-strong z-50 w-64 origin-top-left rounded-2xl p-1.5"
              >
                <div className="px-3 pt-2 pb-1.5 text-[11px] font-medium tracking-wider text-mist uppercase">Your teller</div>
                {personas.map((p) => (
                  <Dropdown.Item
                    key={p.id}
                    onSelect={() => choose(p.id)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none data-[highlighted]:bg-white/[0.06]"
                  >
                    <Image src={p.avatar} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
                    <span className="flex-1">
                      <span className="block text-sm text-white">{p.name}</span>
                      <span className="block text-xs text-mist">{p.role}</span>
                    </span>
                    {p.id === persona.id && <Check className="size-4 text-cyan" />}
                  </Dropdown.Item>
                ))}
                {upcomingPersonas.map((t) => (
                  <Dropdown.Item key={t.id} disabled className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-50 outline-none">
                    <span className="grid size-9 place-items-center rounded-full bg-white/[0.06]">
                      <Lock className="size-4 text-mist" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm text-white">{t.name}</span>
                      <span className="block text-xs text-mist">{t.role}</span>
                    </span>
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
