"use client";

import Link from "next/link";
import Image from "next/image";
import { ProfileAvatar } from "./top-actions";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { WalletProvider } from "@/lib/wallet-store";
import { PersonaProvider, usePersona } from "@/components/teller/persona";
import { MobileNav } from "./mobile-nav";
import { Preloader } from "./preloader";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Inner pages (Send, Card, ...) start with their own back arrow and title on mobile, so the
  // top bar is home-only to save height.
  const home = usePathname() === "/";
  return (
    <WalletProvider>
      <PersonaProvider>
      <MotionConfig reducedMotion="user">
        <Preloader>
        {/* Ambient backdrop outside the app frame */}
        <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
          <Image src="/backdrop.jpg" alt="" fill priority className="scale-110 object-cover opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,transparent,rgb(3_8_12/0.85))]" />
        </div>

        <MobileTopBar home={home} />

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
      </PersonaProvider>
    </WalletProvider>
  );
}

/** Phone top bar, home only. Same colour as the top of the teller's video, split from it by the ask bar's hairline. */
function MobileTopBar({ home }: { home: boolean }) {
  const { persona } = usePersona();
  return (
    <header
      className={cn("sticky top-0 z-30 h-16 items-center justify-between border-b border-hairline px-5 lg:hidden", home ? "flex" : "hidden")}
      style={{ background: persona.edgeColor }}
    >
      <Link href="/" aria-label="Home" className="text-white">
        <Logo className="size-7" glow />
      </Link>
      <span className="text-sm font-medium tracking-wide text-fog">Sexy Wallet</span>
      <ProfileAvatar size={36} />
    </header>
  );
}
