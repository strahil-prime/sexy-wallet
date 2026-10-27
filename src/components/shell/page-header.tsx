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
      <div className="absolute -top-40 left-[10%] size-[620px] rounded-full bg-electric/15 blur-[140px]" />
      <div className="absolute top-[30%] -right-40 size-[520px] rounded-full bg-cyan/10 blur-[140px]" />
      <div className="absolute -bottom-60 left-[30%] size-[560px] rounded-full bg-violet/10 blur-[160px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgb(255_255_255)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_20%,#000,transparent_70%)]" />
    </div>
  );
}
