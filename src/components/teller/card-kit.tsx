"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** The spoken answer leads each card: white and a step larger than the details under it. */
export const answerText = "text-[17px] leading-relaxed font-medium text-white sm:text-[18px]";

export const ease = [0.16, 1, 0.3, 1] as const;

/** Splits text into words that blur in like captions. */
export function Spoken({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.055, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {w + (i < words.length - 1 ? " " : "")}
        </motion.span>
      ))}
    </span>
  );
}

/** A card's main action, which turns into a green confirmation once done, plus a secondary "Not now". */
export function CardActions({
  done,
  label,
  doneLabel,
  onAction,
  onClose,
  delay = 1.2,
}: {
  done: boolean;
  label: React.ReactNode;
  doneLabel: React.ReactNode;
  onAction: () => void;
  onClose: () => void;
  delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} className="mt-3 flex gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-positive/12 px-6 text-[14.5px] font-medium text-positive ring-1 ring-positive/25 sm:flex-none"
          >
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Check className="size-4" strokeWidth={2.5} />
            </motion.span>
            {doneLabel}
          </motion.div>
        ) : (
          <motion.button
            key="act"
            type="button"
            onClick={onAction}
            exit={{ opacity: 0, scale: 0.96 }}
            whileTap={{ scale: 0.97 }}
            className="group focus-ring flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-electric px-6 text-[14.5px] whitespace-nowrap font-medium text-white shadow-[0_8px_24px_-8px_rgb(31_123_255/0.9)] transition-colors hover:bg-electric-soft sm:flex-none"
          >
            {label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={onClose}
        className={cn("focus-ring h-11 cursor-pointer rounded-full px-5 text-[14.5px] text-fog transition-colors hover:bg-white/5 hover:text-white")}
      >
        {done ? "Done" : "Not now"}
      </button>
    </motion.div>
  );
}
