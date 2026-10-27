"use client";

import Link from "next/link";
import Image from "next/image";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { Logo } from "@/components/brand/logo";
import { WalletProvider } from "@/lib/wallet-store";
import { MobileNav } from "./mobile-nav";
import { Preloader } from "./preloader";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <MotionConfig reducedMotion="user">
        <Preloader>
        {/* Ambient backdrop outside the app frame */}
        <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
          <Image src="/backdrop.jpg" alt="" fill priority className="scale-110 object-cover opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,transparent,rgb(3_8_12/0.85))]" />
        </div>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-gradient-to-b from-ink-950/90 to-transparent px-5 lg:hidden">
          <Link href="/" aria-label="Home" className="text-white">
            <Logo className="size-7" glow />
          </Link>
          <span className="text-sm font-medium tracking-wide text-fog">Sexy Wallet</span>
          <Image src="/teller/bella-v3-avatar.jpg" alt="Bella" width={36} height={36} className="size-9 rounded-full object-cover ring-2 ring-cyan/40" />
        </header>

        {/* Desktop frame */}
        <div className="lg:fixed lg:inset-4 lg:flex lg:overflow-hidden lg:rounded-[30px] lg:border lg:border-hairline-strong lg:bg-ink-900 lg:shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] xl:inset-6">
          <Sidebar />
          <main className="relative min-w-0 flex-1 pb-28 lg:overflow-y-auto lg:pb-0">{children}</main>
        </div>

        <MobileNav />
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!glass-strong !rounded-2xl !border-hairline !text-white !font-sans",
              description: "!text-mist",
            },
          }}
        />
        </Preloader>
      </MotionConfig>
    </WalletProvider>
  );
}
