"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { createPortal } from "react-dom";
import {
  Anchor,
  ChartPie,
  Crown,
  Earth,
  Flame,
  Handshake,
  PiggyBank,
  Rocket,
  Scissors,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Ambient, PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { useWallet } from "@/lib/wallet-store";
import { cn, formatEUR } from "@/lib/utils";
import { Badge3D, BadgeStatic, metals, useSpinBadge, type BadgeArt, type Metal } from "./badge-3d";

const GOLD_INK = "#f6d98d";
const SILVER_INK = "#e4ebf2";
const art = {
  gold: { slug: "gold", ink: GOLD_INK, box: "24%" },
  first: { slug: "day-one", ink: SILVER_INK, box: "20% 21%" },
  saver: { slug: "super-saver", ink: GOLD_INK, box: "20% 21%" },
  streak: { slug: "on-fire", ink: GOLD_INK, box: "40% 22% 12%" },
  travel: { slug: "globetrotter", ink: SILVER_INK, box: "21%" },
  locked: { slug: "locked", ink: SILVER_INK, box: "21%" },
} satisfies Record<string, BadgeArt>;

const ease = [0.16, 1, 0.3, 1] as const;

const POINTS = 2480;
const NEXT_TIER = 3000;

type Badge = {
  id: string;
  name: string;
  about: string;
  icon: LucideIcon;
  metal: Metal;
  earned?: string;
  /** Artwork for the earned badge; badges without it use the drawn style. */
  art?: BadgeArt;
  /** What the back of the badge says. */
  back?: string;
  progress?: { have: number; need: number; unit?: string; how: string; href?: string };
  points: number;
};

/** Badges that react to what you actually do in the app. */
function useBadges(): Badge[] {
  const { holdings, cancelled, activity, investLog } = useWallet();
  const requested = activity.some((a) => a.id.startsWith("rq_"));
  const funds = holdings.length;
  const stayed = investLog.some((e) => e.kind === "hold");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const list: Badge[] = [
    { id: "first", name: "Day One", about: "Opened your account and made your first payment.", icon: Rocket, metal: metals.cobalt, earned: "12 Mar 2024", points: 100, art: art.first, back: "Welcome to the club" },
    { id: "saver", name: "Super Saver", about: "Saved money six months in a row.", icon: PiggyBank, metal: metals.gold, earned: "2 Sep 2024", points: 300, art: art.saver, back: "Keep stacking them racks, big saver" },
    { id: "streak", name: "On Fire", about: "Checked in with your teller 30 days running.", icon: Flame, metal: metals.copper, earned: "18 Oct 2026", points: 150, art: art.streak, back: "You are on fire today" },
    { id: "travel", name: "Globetrotter", about: "Paid in three countries without a single fee.", icon: Earth, metal: metals.ice, earned: "24 Oct 2026", points: 200, art: art.travel, back: "Think global, act local" },
    {
      id: "tidy",
      name: "Clean Sweep",
      about: "Cancelled a subscription you'd forgotten about.",
      icon: Scissors,
      metal: metals.teal,
     
      earned: cancelled.length ? today : undefined,
      progress: { have: cancelled.length ? 1 : 0, need: 1, how: "Ask Bella about forgotten subscriptions", href: "/" },
      points: 150,
    },
    {
      id: "split",
      name: "Fair Share",
      about: "Split a bill with a friend.",
      icon: Handshake,
      metal: metals.rose,
     
      earned: requested ? today : undefined,
      progress: { have: requested ? 1 : 0, need: 1, how: "Request money from a friend", href: "/receive" },
      points: 100,
    },
    {
      id: "diverse",
      name: "Diversifier",
      about: "Held four different funds at the same time.",
      icon: ChartPie,
      metal: metals.violet,
     
      earned: funds >= 4 ? today : undefined,
      progress: { have: Math.min(funds, 4), need: 4, unit: "funds", how: "Add a fund on Invest", href: "/invest" },
      points: 250,
    },
    {
      id: "steady",
      name: "Steady Hands",
      about: "Stayed the course when the market wobbled.",
      icon: Anchor,
      metal: metals.indigo,
     
      earned: stayed ? today : undefined,
      progress: { have: stayed ? 1 : 0, need: 1, how: "Ask Michael how your portfolio is doing", href: "/" },
      points: 200,
    },
  ];
  // Only badges with finished artwork can be earned for now; the rest stay padlocked.
  return list.map((b) => (b.art ? b : { ...b, earned: undefined }));
}

export function RewardsView() {
  const badges = useBadges();
  const [open, setOpen] = useState<Badge | null>(null);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="relative isolate min-h-full pb-10 max-lg:-mb-28 max-lg:min-h-lvh max-lg:pb-28">
      <Ambient />
      <PageHeader title="Rewards" subtitle="Points, perks and badges you've earned" />

      <div className="grid gap-5 px-4 sm:px-8 lg:px-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <TierHero />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease }}>
            <Panel spotlight={false} className="p-5 sm:p-7">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[17px] font-medium text-white">Your badges</h2>
                <span className="text-[13px] text-mist">
                  <span className="text-white tabular">{earned}</span> of {badges.length} earned
                </span>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                {badges.map((b, i) => (
                  <BadgeTile key={b.id} badge={b} index={i} onOpen={() => setOpen(b)} />
                ))}
              </ul>
            </Panel>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6, ease }} className="flex min-w-0 flex-col gap-5">
          <Perks />
          <Cashback />
        </motion.div>
      </div>

      <BadgeDialog badge={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ───────────────────────── Tier hero ───────────────────────── */

function TierHero() {
  const { rotateX, rotateY, handlers } = useSpinBadge();
  const [pts, setPts] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPts(POINTS), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <Panel spotlight={false} className="relative overflow-hidden p-5 sm:p-8">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_18%_40%,rgb(245_199_106/0.22),transparent_70%),radial-gradient(60%_80%_at_100%_0%,rgb(31_123_255/0.18),transparent_70%)]" />
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <div className="relative shrink-0">
          <motion.div
            aria-hidden
            className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgb(245_199_106/0.4),rgb(245_199_106/0.12)_50%,transparent)]"
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div {...handlers} className="relative cursor-grab touch-pan-y select-none active:cursor-grabbing" aria-label="Gold tier badge, drag to spin">
            <Badge3D metal={metals.onyx} art={art.gold} icon={Crown} size={190} caption="Gold member since 2026" rotateX={rotateX} rotateY={rotateY} />
          </div>
          <motion.div
            aria-hidden
            className="mx-auto mt-4 h-3 w-28 rounded-[50%] bg-black/60 blur-md"
            animate={{ scaleX: [1, 0.85, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="w-full min-w-0 flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f5c76a]/40 bg-[#f5c76a]/10 px-3 py-1 text-[12px] font-semibold tracking-[0.12em] text-[#f5c76a] uppercase">
            <Star className="size-3 fill-current" /> Gold tier
          </div>
          <div className="mt-3 flex items-baseline justify-center gap-2 sm:justify-start">
            <span className="text-[44px] leading-none font-semibold tracking-tight text-white tabular sm:text-[52px]">
              <NumberFlow value={pts} locales="en-IE" />
            </span>
            <span className="text-[15px] text-mist">points</span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="relative h-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#b4832b,#f5c76a,#fff3c8)]"
              initial={{ width: 0 }}
              animate={{ width: `${(POINTS / NEXT_TIER) * 100}%` }}
              transition={{ delay: 0.4, duration: 1.2, ease }}
            >
              <motion.span
                className="absolute inset-y-0 w-10 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.8),transparent)]"
                animate={{ left: ["-20%", "110%"] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
          <div className="mt-2 flex justify-between text-[13px] text-mist">
            <span>
              <span className="text-white tabular">{(NEXT_TIER - POINTS).toLocaleString("en-IE")}</span> to Platinum
            </span>
            <span className="tabular">{NEXT_TIER.toLocaleString("en-IE")}</span>
          </div>
          <p className="mt-4 text-[13px] text-mist">Drag the badge to spin it.</p>
        </div>
      </div>
    </Panel>
  );
}

/* ───────────────────────── Badge tiles ───────────────────────── */

function BadgeTile({ badge, index, onOpen }: { badge: Badge; index: number; onOpen: () => void }) {
  const locked = !badge.earned;
  const p = badge.progress;
  return (
    <motion.li
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.06, duration: 0.6, ease }}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group focus-ring relative flex w-full cursor-pointer touch-manipulation flex-col items-center rounded-[20px] px-3 pt-5 pb-4 text-center ring-1 transition-colors",
          locked ? "bg-white/[0.02] ring-white/[0.05] hover:bg-white/[0.04]" : "bg-white/[0.04] ring-white/[0.07] hover:bg-white/[0.07]",
        )}
      >
        {!locked && (
          <span
            aria-hidden
            className="absolute top-0 left-1/2 size-36 -translate-x-1/2 rounded-full opacity-40 transition-opacity group-hover:opacity-70"
            style={{ background: `radial-gradient(closest-side, ${badge.metal[1]}, transparent)` }}
          />
        )}
        {/* Still on purpose: the grid stays light so a tap opens the badge straight away */}
        <BadgeStatic
          metal={badge.metal}
          icon={badge.icon}
          size={96}
          locked={locked}
          art={badgeArt(badge)}
          className="transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
        />
        <span aria-hidden className="mt-3 h-2 w-14 rounded-[50%] bg-black/50 blur-[5px]" />
        <span className={cn("mt-2 text-[14.5px] font-medium", locked ? "text-fog" : "text-white")}>{badge.name}</span>
        {locked && p ? (
          <span className="mt-2 w-full max-w-[120px]">
            <span className="block h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <span className="block h-full rounded-full bg-gradient-to-r from-electric to-cyan" style={{ width: `${(p.have / p.need) * 100}%` }} />
            </span>
            <span className="mt-1 block text-[11.5px] text-mist tabular">
              {p.have} of {p.need}
              {p.unit ? ` ${p.unit}` : ""}
            </span>
          </span>
        ) : (
          <span className="mt-0.5 text-[12px] text-mist">+{badge.points} pts</span>
        )}
      </button>
    </motion.li>
  );
}

function BadgeDialog({ badge, onClose }: { badge: Badge | null; onClose: () => void }) {
  // Deliberately plain: no dialog library, scroll lock, focus trap, backdrop blur or exit
  // animation. Each of those cost noticeable time on iPhones when the window opened.
  useEffect(() => {
    if (!badge) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [badge, onClose]);
  if (!badge || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-title"
      className="fixed inset-0 z-50 grid touch-none place-items-center bg-black/80 p-4"
      onClick={onClose}
    >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="badge-pop relative w-full max-w-[400px] touch-auto overflow-hidden rounded-[28px] border border-hairline bg-ink-850 px-6 pt-8 pb-6 text-center shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]"
                >
                  <div aria-hidden className="absolute inset-x-0 top-0 h-64" style={{ background: `radial-gradient(60% 70% at 50% 35%, ${badge.metal[1]}55, transparent 70%)` }} />
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="focus-ring absolute top-3 right-3 z-20 grid size-11 cursor-pointer touch-manipulation place-items-center rounded-full bg-white/[0.08] text-fog hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                  <BigBadge badge={badge} />
                  <h2 id="badge-title" className="relative mt-5 text-[24px] font-semibold tracking-tight text-white">{badge.name}</h2>
                  <p className="relative mx-auto mt-1.5 max-w-[300px] text-[14.5px] text-mist">{badge.about}</p>
                  {badge.earned ? (
                    <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[13px] text-fog ring-1 ring-white/[0.08]">
                      <Sparkles className="size-3.5" style={{ color: badge.metal[1] }} /> Earned {badge.earned} · +{badge.points} points
                    </div>
                  ) : (
                    badge.progress && (
                      <div className="relative mt-5">
                        <div className="mx-auto h-1.5 max-w-[220px] overflow-hidden rounded-full bg-white/[0.08]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-electric to-cyan"
                            initial={{ width: 0 }}
                            animate={{ width: `${(badge.progress.have / badge.progress.need) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.8, ease }}
                          />
                        </div>
                        <div className="mt-2 text-[13px] text-mist">
                          {badge.progress.have} of {badge.progress.need} · worth {badge.points} points
                        </div>
                        {badge.progress.href && (
                          <Link
                            href={badge.progress.href}
                            className="focus-ring mt-5 inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white/90"
                          >
                            {badge.progress.how}
                          </Link>
                        )}
                      </div>
                    )
                  )}
                  <p className="relative mt-5 text-[12px] text-mist">Drag to spin</p>
                </div>
    </div>,
    document.body,
  );
}

/** Locked badges all show the padlock art; earned ones their own art, if they have any. */
function badgeArt(badge: Badge): BadgeArt | undefined {
  return badge.earned ? badge.art : art.locked;
}

function BigBadge({ badge }: { badge: Badge }) {
  const { rotateX, rotateY, handlers } = useSpinBadge({ intro: false, idle: false });
  // The window opens with the flat badge, which is quick to draw. The spinnable 3D badge (they
  // look identical face-on) is only built once you start dragging.
  const [live, setLive] = useState(false);
  return (
    <div className="relative mx-auto w-fit">
      <div
        {...handlers}
        onPointerDown={(e) => {
          setLive(true);
          handlers.onPointerDown(e);
        }}
        className="relative cursor-grab touch-none select-none active:cursor-grabbing"
      >
        {live ? (
          <Badge3D
            metal={badge.metal}
            icon={badge.icon}
            size={200}
            locked={!badge.earned}
            art={badgeArt(badge)}
            caption={badge.earned ? (badge.back ?? `${badge.name} · ${badge.earned}`) : "Not earned yet"}
            rotateX={rotateX}
            rotateY={rotateY}
          />
        ) : (
          <BadgeStatic metal={badge.metal} icon={badge.icon} size={200} locked={!badge.earned} art={badgeArt(badge)} shadow={false} />
        )}
      </div>
      <div aria-hidden className="mx-auto mt-4 h-3 w-32 rounded-[50%] bg-black/60 blur-md" />
    </div>
  );
}

/* ───────────────────────── Side column ───────────────────────── */

function Perks() {
  const perks = [
    { label: "1% cashback on card spend", sub: "Paid out on the 1st", on: true },
    { label: "Free cash withdrawals abroad", sub: "Up to €400 a month", on: true },
    { label: "Priority support", sub: "Under 2 minutes", on: true },
    { label: "Airport lounge passes", sub: "Unlocks at Platinum", on: false },
  ];
  return (
    <Panel className="p-5 sm:p-7">
      <h2 className="text-[17px] font-medium text-white">Gold perks</h2>
      <ul className="mt-3 space-y-1">
        {perks.map((p, i) => (
          <motion.li
            key={p.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease }}
            className="flex items-center gap-3 py-2"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full",
                p.on ? "bg-[#f5c76a]/12 text-[#f5c76a]" : "bg-white/[0.05] text-mist",
              )}
            >
              {p.on ? <Star className="size-4 fill-current" /> : <Crown className="size-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[14.5px]", p.on ? "text-white" : "text-mist")}>{p.label}</span>
              <span className="block text-[12.5px] text-mist">{p.sub}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </Panel>
  );
}

/** 1% back on the latest card payments, straight from activity. */
function Cashback() {
  const { activity } = useWallet();
  const rows = useMemo(() => activity.filter((a) => a.card && a.amount < 0 && !a.pending).slice(0, 6), [activity]);
  const month = activity.filter((a) => a.card && a.amount < 0 && new Date(a.at).getMonth() === new Date().getMonth()).reduce((s, a) => s - a.amount * 0.01, 0);
  return (
    <Panel className="p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium text-white">Cashback</h2>
        <span className="text-[13px] text-mist">
          <span className="text-positive tabular">{formatEUR(month)}</span> this month
        </span>
      </div>
      <ul className="mt-3">
        {rows.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-2">
            <BrandMark activity={a} className="size-9 [&_svg]:size-4" />
            <span className="min-w-0 flex-1 truncate text-[14.5px] text-white">{a.title}</span>
            <span className="text-[14px] text-positive tabular">+{formatEUR(-a.amount * 0.01)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
