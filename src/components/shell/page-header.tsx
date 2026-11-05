"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchField } from "./top-actions";

const backClass = "group focus-ring glass grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition-colors hover:border-hairline-strong";
const backIcon = <ArrowLeft className="size-5 text-fog transition-transform group-hover:-translate-x-0.5 group-hover:text-white" />;

export function PageHeader({
  title,
  subtitle,
  back = "/",
  onMobileBack,
  compactOnMobile = false,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  /** On mobile, the back arrow runs this instead of leaving the page (e.g. a previous step). */
  onMobileBack?: () => void;
  /** Tighter header without the subtitle below lg, for pages that need the vertical room. */
  compactOnMobile?: boolean;
}) {
  return (
    <header className={cn("flex items-center gap-4 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-6 sm:px-8 lg:px-10 lg:pt-8", compactOnMobile && "pb-3 lg:pb-6")}>
      {onMobileBack && (
        <button type="button" onClick={onMobileBack} aria-label="Back" className={cn(backClass, "lg:hidden")}>
          {backIcon}
        </button>
      )}
      <Link href={back} aria-label="Back" className={cn(backClass, onMobileBack && "hidden lg:grid")}>
        {backIcon}
      </Link>
      <div className="min-w-0 flex-1">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn("text-[14px] text-mist", compactOnMobile && "hidden lg:block")}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      <SearchField className="hidden max-w-[340px] lg:flex" />
    </header>
  );
}

/** Ambient lighting for journey pages, no teller. */
export function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Soft pools of light drawn as gradients, not blurred shapes: blur filters this large are
          very slow to repaint on iPhones. */}
      <div className="absolute -top-[380px] left-[calc(10%-280px)] size-[1180px] rounded-full bg-[radial-gradient(closest-side,rgb(31_123_255/0.15),rgb(31_123_255/0.05)_45%,transparent)]" />
      <div className="absolute top-[calc(30%-240px)] -right-[420px] size-[1000px] rounded-full bg-[radial-gradient(closest-side,rgb(42_209_230/0.1),rgb(42_209_230/0.035)_45%,transparent)]" />
      <div className="absolute -bottom-[560px] left-[calc(30%-300px)] size-[1160px] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.1),rgb(124_92_255/0.035)_45%,transparent)]" />
    </div>
  );
}
