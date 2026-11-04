"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { CalendarSync, Check, ChartNoAxesCombined, Hand, Repeat, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { funds } from "@/lib/invest";
import { useWallet, type InvestEvent } from "@/lib/wallet-store";
import { cn, formatEUR0, formatWhen } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/** The two things running in the background: the monthly plan and the cash safety net. */
export function Autopilot({ onAskMichael }: { onAskMichael: () => void }) {
  const { plan, safetyNet, balance } = useWallet();
  const next = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }, []);
  const covered = safetyNet > 0 && balance >= safetyNet;

  return (
    <Panel className="p-5 sm:p-7">
      <h2 className="text-[17px] font-medium text-white">On autopilot</h2>
      <ul className="mt-4 space-y-3">
        <li className="flex items-center gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-cyan/10 text-cyan">
            <CalendarSync className="size-[18px]" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] text-white">Monthly plan</span>
            <span className="block truncate text-[12.5px] text-mist" suppressHydrationWarning>
              Next on {next}
            </span>
          </span>
          <span className="text-[15px] text-white tabular">{formatEUR0(plan)}/mo</span>
        </li>
        <li className="flex items-center gap-3.5">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-[12px]", safetyNet ? "bg-positive/10 text-positive" : "bg-white/[0.06] text-mist")}>
            <ShieldCheck className="size-[18px]" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] text-white">Safety net</span>
            <span className="block truncate text-[12.5px] text-mist">
              {safetyNet ? (covered ? "Kept as cash, never invested" : "Your balance is below it") : "Cash kept for surprises"}
            </span>
          </span>
          {safetyNet ? (
            <span className="flex items-center gap-1.5 text-[15px] text-white tabular">
              {covered && <Check className="size-3.5 text-positive" strokeWidth={2.6} />}
              {formatEUR0(safetyNet)}
            </span>
          ) : (
            <button
              type="button"
              onClick={onAskMichael}
              className="focus-ring h-9 shrink-0 cursor-pointer rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white transition-colors hover:bg-white/[0.13]"
            >
              Ask Michael
            </button>
          )}
        </li>
      </ul>
    </Panel>
  );
}

const icons: Record<InvestEvent["kind"], typeof Repeat> = {
  buy: ChartNoAxesCombined,
  plan: Repeat,
  hold: Hand,
  safety: ShieldCheck,
};

/** Everything that happened on the investing side, newest first, ending with the last two monthly plans. */
export function InvestTimeline() {
  const { investLog } = useWallet();
  const past = useMemo<InvestEvent[]>(() => {
    const d = new Date();
    return [0, 1].map((back) => {
      const at = new Date(d.getFullYear(), d.getMonth() - back, 1, 6, 0);
      return { id: `auto-${back}`, at: at.toISOString(), kind: "buy", title: "Monthly plan", detail: "Your mix", amount: 275 };
    });
  }, []);
  const events = [...investLog, ...past];

  return (
    <Panel className="p-5 sm:p-7">
      <h2 className="text-[17px] font-medium text-white">Investing activity</h2>
      <ol className="relative mt-4">
        <span aria-hidden className="absolute top-3 bottom-3 left-[19px] w-px bg-white/[0.08]" />
        {events.map((e, i) => {
          const Icon = icons[e.kind];
          const color = e.ticker ? funds[e.ticker].color : e.kind === "safety" ? "#3ee39a" : e.kind === "hold" ? "#8ea3ad" : "#2ad1e6";
          return (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.5, ease }}
              className="relative flex items-center gap-3.5 py-2.5"
            >
              <span
                className="relative grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-ink-900"
                style={{ background: `${color}26`, color }}
              >
                <Icon className="size-[17px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] text-white">{e.title}</span>
                <span className="block truncate text-[12.5px] text-mist" suppressHydrationWarning>
                  {formatWhen(new Date(e.at))}
                  {e.detail ? ` · ${e.detail}` : ""}
                </span>
              </span>
              {e.amount ? <span className="text-[14.5px] text-white tabular">{formatEUR0(e.amount)}</span> : null}
            </motion.li>
          );
        })}
      </ol>
    </Panel>
  );
}
