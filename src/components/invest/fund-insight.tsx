"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChevronDown, CircleCheck, TriangleAlert } from "lucide-react";
import { funds, insights, type Ticker } from "@/lib/invest";
import { cn } from "@/lib/utils";

const RISK_WORDS = [
  "",
  "Very low",
  "Low",
  "Low to medium",
  "Medium",
  "Medium to high",
  "High",
  "Very high",
];

/** The quick read on a top pick: why it's here, how bumpy it is, what it costs and what's inside. */
export function FundInsight({ fund }: { fund: Ticker }) {
  const f = funds[fund];
  const i = insights[fund];
  const feePer1000 = (f.ter / 100) * 1000;
  // Stays open or closed as the viewer flicks between funds.
  const [more, setMore] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={fund}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 rounded-[22px] bg-white/[0.03] p-4 ring-1 ring-white/[0.06]"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-medium text-white">{f.name}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em] uppercase"
            style={{
              color: f.color,
              background: `${f.color}1f`,
              boxShadow: `inset 0 0 0 1px ${f.color}55`,
            }}
          >
            {i.type}
          </span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-fog">
            {f.kind}
          </span>
        </div>
        <p className="mt-1 text-[13.5px] leading-snug text-fog">{i.why}</p>

        {/* Risk, on the 1–7 scale every EU fund publishes */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="text-mist">Risk</span>
            <span className="text-white">
              {RISK_WORDS[i.risk]}{" "}
              <span className="text-mist tabular">· {i.risk} of 7</span>
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1" aria-hidden>
            {Array.from({ length: 7 }, (_, k) => (
              <motion.span
                key={k}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.04 * k, duration: 0.25 }}
                className="h-1.5 origin-left rounded-full"
                style={{
                  background:
                    k < i.risk ? riskColor(k) : "rgb(255 255 255 / 0.08)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Three numbers that matter */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            label="Last 5 years"
            value={`${i.fiveYear > 0 ? "+" : ""}${i.fiveYear.toFixed(1)}%`}
            sub="avg a year"
            tone={i.fiveYear >= 0 ? "up" : "down"}
          />
          <Stat
            label="Yearly fee"
            value={`€${feePer1000.toFixed(2)}`}
            sub="per €1,000"
          />
          <Stat
            label="Spread over"
            value={i.holdings}
            sub={fund === "AGGH" ? "bonds" : "companies"}
          />
        </div>

        {/* The deeper read, folded away until asked for */}
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
          className="focus-ring mt-4 flex w-full cursor-pointer items-center justify-between rounded-2xl bg-white/[0.04] px-3.5 py-3 text-left text-[13.5px] text-white transition-colors hover:bg-white/[0.07]"
        >
          <span>
            What&apos;s inside{" "}
            <span className="text-mist">and who it suits</span>
          </span>
          <motion.span
            animate={{ rotate: more ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown className="size-4 text-fog" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {more && (
            <motion.div
              key="more"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-1 pt-4 pb-1">
                {/* Where the money goes */}
                <div>
                  <div className="text-[12.5px] text-mist">
                    Where your money goes
                  </div>
                  <div className="mt-1.5 flex h-2 gap-[3px] overflow-hidden rounded-full">
                    {i.regions.map((r, k) => (
                      <motion.span
                        key={r.label}
                        initial={{ flexGrow: 0 }}
                        animate={{ flexGrow: r.pct }}
                        transition={{
                          duration: 0.5,
                          delay: 0.05 * k,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="h-full basis-0 rounded-full"
                        style={{ background: f.color, opacity: 1 - k * 0.17 }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-fog">
                    {i.regions.map((r, k) => (
                      <span key={r.label} className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: f.color, opacity: 1 - k * 0.17 }}
                        />
                        {r.label}{" "}
                        <span className="text-mist tabular">{r.pct}%</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2.5 text-[12.5px] text-mist">
                    Biggest:{" "}
                    {i.top.map((t, k) => (
                      <span key={t.name} className="text-fog">
                        {t.name}{" "}
                        <span className="text-mist tabular">{t.pct}%</span>
                        {k < i.top.length - 1 && (
                          <span className="text-mist">, </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* The honest two-liner */}
                <ul className="mt-4 space-y-2 text-[13px] leading-snug">
                  <li className="flex gap-2 text-fog">
                    <CircleCheck
                      className="mt-px size-4 shrink-0 text-positive"
                      strokeWidth={2}
                    />
                    <span>
                      <span className="text-white">Good for: </span>
                      {i.goodFor}
                    </span>
                  </li>
                  <li className="flex gap-2 text-fog">
                    <TriangleAlert
                      className="mt-px size-4 shrink-0 text-[#ffb547]"
                      strokeWidth={2}
                    />
                    <span>
                      <span className="text-white">Keep in mind: </span>
                      {i.keepInMind}
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function riskColor(k: number) {
  // Calm teal for the low end, through amber, to coral at the top.
  return [
    "#2ad1e6",
    "#3ee3b0",
    "#7ee36a",
    "#d8d65a",
    "#ffb547",
    "#ff8a4c",
    "#ff6b7a",
  ][k];
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.04] px-3 py-2.5">
      <div className="truncate text-[11.5px] text-mist">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-[17px] font-semibold text-white tabular",
          tone === "up" && "text-positive",
          tone === "down" && "text-[#ff8b96]",
        )}
      >
        {value}
      </div>
      <div className="truncate text-[11px] text-mist">{sub}</div>
    </div>
  );
}
