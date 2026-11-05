"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Coins,
  Eye,
  FileText,
  Fingerprint,
  Globe,
  KeyRound,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Pencil,
  Phone,
  ShieldCheck,
  Share2,
  Smartphone,
  User,
  UserPlus,
} from "lucide-react";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { comingSoon } from "@/components/shell/coming-soon";
import { usePersona } from "@/components/teller/persona";
import { Panel } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import { personas } from "@/lib/personas";
import { account } from "@/lib/profile";
import { useWallet } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

function Rise({ delay = 0, children, className }: { delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease }} className={cn("min-w-0", className)}>
      {children}
    </motion.div>
  );
}

export function ProfileView() {
  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Profile" subtitle="Your account, security and preferences" />
      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6 xl:self-start">
          <Rise>
            <Identity />
          </Rise>
          <Rise delay={0.08}>
            <SecurityScore />
          </Rise>
        </div>
        <div className="grid min-w-0 content-start gap-5 2xl:grid-cols-2">
          <Rise delay={0.1}>
            <Personal />
          </Rise>
          <Rise delay={0.14}>
            <TellerPick />
          </Rise>
          <Rise delay={0.18}>
            <Security />
          </Rise>
          <Rise delay={0.22}>
            <Preferences />
          </Rise>
          <Rise delay={0.26} className="2xl:col-span-2">
            <Support />
          </Rise>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Identity ───────────────────────── */

function Identity() {
  const { portfolio } = useWallet();
  const stats = [
    { label: "Member since", value: "2024" },
    { label: "Rewards", value: "Gold", href: "/rewards" },
    { label: "Invested", value: `€${(portfolio / 1000).toFixed(1)}k`, href: "/invest" },
  ];
  return (
    <Panel spotlight={false} className="overflow-hidden">
      {/* Cover */}
      <div className="relative h-28 overflow-hidden rounded-t-[inherit]">
        <div className="absolute inset-0 bg-[radial-gradient(90%_140%_at_15%_0%,#1a5fe0_0%,#0b2a6e_45%,transparent_80%),radial-gradient(70%_120%_at_100%_0%,rgb(42_209_230/0.45),transparent_70%)]" />
        <motion.div
          aria-hidden
          className="absolute -inset-x-10 top-0 h-full bg-[linear-gradient(105deg,transparent_35%,rgb(255_255_255/0.12)_50%,transparent_65%)]"
          animate={{ x: ["-60%", "60%"] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
      </div>

      <div className="relative -mt-14 flex flex-col items-center px-6 pb-6 text-center">
        <div className="relative">
          <Image
            src={account.portrait}
            alt={account.fullName}
            width={112}
            height={112}
            priority
            className="relative size-28 rounded-full object-cover ring-4 ring-ink-900"
          />
          <span className="absolute right-1 bottom-1 grid size-8 place-items-center rounded-full bg-electric text-white ring-4 ring-ink-900">
            <BadgeCheck className="size-[18px]" strokeWidth={2.2} />
          </span>
        </div>
        <h2 className="mt-4 text-[24px] font-semibold tracking-tight text-white">{account.fullName}</h2>
        <div className="mt-0.5 text-[14px] text-mist">
          {account.tag} · Dublin, Ireland
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#3a4652,#9aa8b3_45%,#e9eef2_55%,#6d7a86)] p-px">
          <span className="flex items-center gap-1.5 rounded-full bg-ink-900/90 px-3 py-1 text-[12px] font-medium tracking-[0.12em] text-fog uppercase">
            <span className="size-1.5 rounded-full bg-[linear-gradient(135deg,#e9eef2,#6d7a86)]" />
            {account.plan} member
          </span>
        </div>

        <div className="mt-6 grid w-full grid-cols-3 divide-x divide-hairline rounded-2xl bg-white/[0.03] py-3 ring-1 ring-white/[0.06]">
          {stats.map((s) => {
            const inner = (
              <>
                <span className="block text-[17px] font-semibold text-white tabular">{s.value}</span>
                <span className="block text-[12px] text-mist">{s.label}</span>
              </>
            );
            return s.href ? (
              <Link key={s.label} href={s.href} className="focus-ring rounded-lg transition-colors hover:bg-white/[0.03]">
                {inner}
              </Link>
            ) : (
              <div key={s.label}>{inner}</div>
            );
          })}
        </div>

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => comingSoon("Editing your profile")}
            className="focus-ring flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white/90"
          >
            <Pencil className="size-4" strokeWidth={2.2} /> Edit profile
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`https://${account.payLink}`);
              } catch {}
              toast("Your tag is copied", { description: `${account.tag} · ${account.payLink}`, id: "copy" });
            }}
            className="focus-ring flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[14px] text-white transition-colors hover:bg-white/[0.13]"
          >
            <Share2 className="size-4" strokeWidth={2} /> Share tag
          </button>
        </div>
      </div>
    </Panel>
  );
}

/** Account health at a glance, with the one thing left to do. */
function SecurityScore() {
  const done = 4;
  const total = 5;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <Panel className="flex items-center gap-4 p-5">
      <div className="relative size-16 shrink-0">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="5" />
          <motion.circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="url(#sec-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - done / total) }}
            transition={{ delay: 0.4, duration: 1.2, ease }}
          />
          <defs>
            <linearGradient id="sec-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3ee39a" />
              <stop offset="1" stopColor="#2ad1e6" />
            </linearGradient>
          </defs>
        </svg>
        <ShieldCheck className="absolute inset-0 m-auto size-6 text-positive" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-white">Well protected</div>
        <div className="text-[13px] text-mist">
          {done} of {total} done. Add someone you trust to help you get back in.
        </div>
      </div>
      <button
        type="button"
        onClick={() => comingSoon("Recovery contacts")}
        aria-label="Add a recovery contact"
        className="focus-ring grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-white/[0.13]"
      >
        <UserPlus className="size-[18px]" strokeWidth={1.9} />
      </button>
    </Panel>
  );
}

/* ───────────────────────── Building blocks ───────────────────────── */

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Panel className={cn("px-2 pt-5 pb-2 sm:px-3", className)}>
      <h3 className="px-3 pb-2 text-[12px] font-medium tracking-[0.14em] text-mist uppercase">{title}</h3>
      <ul className="relative">{children}</ul>
    </Panel>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  tone = "#2ad1e6",
  badge,
  onClick,
  control,
}: {
  icon: typeof User;
  label: string;
  value?: string;
  tone?: string;
  badge?: string;
  onClick?: () => void;
  control?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px]" style={{ background: `${tone}1f`, color: tone }}>
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2 text-[15px] text-white">
          {label}
          {badge && <span className="rounded-full bg-positive/12 px-2 py-0.5 text-[11px] font-medium text-positive">{badge}</span>}
        </span>
        {value && <span className="block truncate text-[13px] text-mist">{value}</span>}
      </span>
      {control ?? <ChevronRight className="size-4 shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-white" />}
    </>
  );
  return (
    <li className="[&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:right-3 [&:not(:last-child)]:after:left-[66px] [&:not(:last-child)]:after:h-px [&:not(:last-child)]:after:bg-hairline relative">
      {control ? (
        <div className="flex items-center gap-3.5 rounded-2xl px-3 py-3">{body}</div>
      ) : (
        <button type="button" onClick={onClick} className="group focus-ring flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]">
          {body}
        </button>
      )}
    </li>
  );
}

function Toggle({ initial, label }: { initial: boolean; label: string }) {
  const [on, setOn] = useState(initial);
  return (
    <Switch
      checked={on}
      aria-label={label}
      onCheckedChange={(v) => {
        setOn(v);
        toast(`${label} ${v ? "on" : "off"}`, { id: `pref-${label}` });
      }}
    />
  );
}

/* ───────────────────────── Sections ───────────────────────── */

function Personal() {
  return (
    <Section title="Personal details">
      <Row icon={User} label="Full name" value={account.fullName} onClick={() => comingSoon("Editing your name")} />
      <Row icon={Mail} label="Email" value={account.email} badge="Verified" tone="#7c5cff" onClick={() => comingSoon("Changing your email")} />
      <Row icon={Phone} label="Phone" value={account.phone} tone="#3ee39a" onClick={() => comingSoon("Changing your phone")} />
      <Row icon={MapPin} label="Address" value={account.address} tone="#ffb547" onClick={() => comingSoon("Changing your address")} />
    </Section>
  );
}

function TellerPick() {
  const { persona, choose } = usePersona();
  return (
    <Panel className="p-5">
      <h3 className="text-[12px] font-medium tracking-[0.14em] text-mist uppercase">Your teller</h3>
      <p className="mt-1 text-[13px] text-mist">Who greets you and answers your questions.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {personas.map((p) => {
          const on = p.id === persona.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => choose(p.id)}
              aria-pressed={on}
              className={cn(
                "focus-ring relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-colors",
                on ? "text-white" : "bg-white/[0.03] text-mist ring-1 ring-white/[0.06] hover:bg-white/[0.06]",
              )}
            >
              {on && (
                <motion.span
                  layoutId="teller-pick"
                  className="absolute inset-0 rounded-2xl bg-white/[0.07] ring-1 ring-cyan/50 shadow-[0_0_24px_-8px_rgb(42_209_230/0.7)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Image src={p.avatar} alt="" width={56} height={56} className={cn("relative size-14 rounded-full object-cover transition", !on && "opacity-70 grayscale-[40%]")} />
              <span className="relative text-[14px] font-medium">{p.name}</span>
              <span className="relative -mt-1.5 text-center text-[11.5px] leading-tight text-mist">{p.role}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function Security() {
  return (
    <Section title="Security">
      <Row icon={Fingerprint} label="Face ID" value="Unlock and approve payments" tone="#3ee39a" control={<Toggle initial label="Face ID" />} />
      <Row icon={ShieldCheck} label="Two-step verification" value="Text message to •••• 6630" tone="#3ee39a" control={<Toggle initial label="Two-step verification" />} />
      <Row icon={Smartphone} label="Devices" value="iPhone 15 Pro · this device" tone="#2ad1e6" onClick={() => comingSoon("Devices")} />
      <Row icon={KeyRound} label="Change passcode" value="Last changed 3 months ago" tone="#ffb547" onClick={() => comingSoon("Changing your passcode")} />
    </Section>
  );
}

function Preferences() {
  return (
    <Section title="Preferences">
      <Row icon={Bell} label="Notifications" value="Payments, bills and nudges" tone="#7c5cff" control={<Toggle initial label="Notifications" />} />
      <Row icon={Eye} label="Hide balance on open" value="Tap to reveal it" tone="#8ea3ad" control={<Toggle initial={false} label="Hide balance on open" />} />
      <Row icon={Coins} label="Main currency" value="Euro (EUR)" tone="#ffb547" onClick={() => comingSoon("Currencies")} />
      <Row icon={Globe} label="Language" value="English" tone="#2ad1e6" onClick={() => comingSoon("Languages")} />
      <Row icon={Moon} label="Appearance" value="Dark" tone="#8ea3ad" onClick={() => comingSoon("Appearance")} />
    </Section>
  );
}

function Support() {
  return (
    <Panel className="px-2 pt-5 pb-2 sm:px-3">
      <h3 className="px-3 pb-2 text-[12px] font-medium tracking-[0.14em] text-mist uppercase">Help</h3>
      <ul className="relative grid 2xl:grid-cols-3">
        <Row icon={MessageCircle} label="Chat with us" value="Usually replies in 2 minutes" onClick={() => comingSoon("Support chat")} />
        <Row icon={LifeBuoy} label="Help centre" value="Guides and answers" tone="#7c5cff" onClick={() => comingSoon("Help centre")} />
        <Row icon={FileText} label="Terms and privacy" value="Fees, legal, your data" tone="#8ea3ad" onClick={() => comingSoon("Legal")} />
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-hairline px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={() => comingSoon("Logging out")}
          className="focus-ring flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-[14px] text-negative transition-colors hover:bg-negative/10"
        >
          <LogOut className="size-4" strokeWidth={2} /> Log out
        </button>
        <span className="text-[12px] text-mist">Version 1.0</span>
      </div>
    </Panel>
  );
}
