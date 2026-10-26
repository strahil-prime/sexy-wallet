"use client";

import { useEffect, useState } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useWallet } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";

const currencies = [
  { code: "EUR", rate: 1, label: "Euro" },
  { code: "USD", rate: 1.084, label: "US Dollar" },
  { code: "GBP", rate: 0.842, label: "British Pound" },
] as const;

type Code = (typeof currencies)[number]["code"];

export function Balance({ className }: { className?: string }) {
  const { balance } = useWallet();
  const [code, setCode] = useState<Code>("EUR");
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 450);
    return () => clearTimeout(t);
  }, []);

  const rate = currencies.find((c) => c.code === code)!.rate;
  const value = mounted ? Math.round(balance * rate * 100) / 100 : 0;
  const whole = Math.trunc(value);
  const cents = Math.round((value - whole) * 100);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4"
      >
        <span className="text-lg whitespace-nowrap text-fog/90 lg:text-[21px]">Total balance</span>
        <CurrencyPicker code={code} onChange={setCode} />
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => setHidden((h) => !h)}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          className="focus-ring grid size-9 cursor-pointer place-items-center rounded-full text-mist transition-colors hover:bg-white/5 hover:text-white"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hidden ? "off" : "on"}
              initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
            >
              {hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <motion.div
        className="mt-2 flex items-baseline font-semibold tracking-[-0.045em] text-white tabular"
        animate={{ filter: hidden ? "blur(18px)" : "blur(0px)", opacity: hidden ? 0.6 : 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        aria-label={hidden ? "Balance hidden" : undefined}
      >
        <NumberFlowGroup>
          <NumberFlow
            value={whole}
            locales="en-IE"
            format={{ style: "currency", currency: code, maximumFractionDigits: 0, minimumFractionDigits: 0 }}
            className="text-[clamp(45px,10cqw,83px)] leading-none drop-shadow-[0_4px_30px_rgb(0_0_0/0.5)]"
            transformTiming={{ duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            spinTiming={{ duration: 1400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
          <NumberFlow
            value={cents}
            prefix="."
            format={{ minimumIntegerDigits: 2 }}
            className="text-[clamp(24px,5.36cqw,45px)] leading-none text-white/45"
            spinTiming={{ duration: 1400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </NumberFlowGroup>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-5 inline-flex h-11 items-center gap-2.5 rounded-full border border-positive/15 bg-positive/[0.08] px-4 text-positive backdrop-blur-md"
      >
        <ArrowUpRight className="size-[18px]" strokeWidth={2} />
        <span className="text-[16px] font-medium">+24.6% this month</span>
      </motion.div>
    </div>
  );
}

function CurrencyPicker({ code, onChange }: { code: Code; onChange: (c: Code) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-full border border-hairline-strong bg-ink-900/50 px-4 text-[16px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/[0.06]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={code} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
            {code}
          </motion.span>
        </AnimatePresence>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="size-4" strokeWidth={2} />
        </motion.span>
      </Dropdown.Trigger>
      <AnimatePresence>
        {open && (
          <Dropdown.Portal forceMount>
            <Dropdown.Content asChild align="start" sideOffset={8} forceMount>
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="glass-strong z-50 w-52 origin-top-left rounded-2xl p-1.5"
              >
                {currencies.map((c) => (
                  <Dropdown.Item
                    key={c.code}
                    onSelect={() => onChange(c.code)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-none data-[highlighted]:bg-white/[0.06]"
                  >
                    <span className="w-10 text-sm font-semibold text-white">{c.code}</span>
                    <span className="flex-1 text-sm text-mist">{c.label}</span>
                    {c.code === code && <Check className="size-4 text-cyan" />}
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
