"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// v2: everyone starts with sound on again, whatever they chose before.
const STORAGE_KEY = "sexy-wallet:sound:v2";

export type TellerSound = {
  /** the viewer's preference */
  on: boolean;
  /** the browser refused to start a clip with sound, so it is playing muted */
  blocked: boolean;
  setBlocked: (blocked: boolean) => void;
  toggle: () => void;
};

export function useTellerSound(): TellerSound {
  const [on, setOn] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "off") setOn(false);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    // A blocked clip wants sound: the tap itself is what lets the browser turn it on.
    const next = blocked ? true : !on;
    setBlocked(false);
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {}
  }, [blocked, on]);

  return { on, blocked, setBlocked, toggle };
}

/** Sound on/off for Bella's clips. Shows a "Tap for sound" hint when autoplay with sound was blocked. */
export function SoundToggle({ sound, className }: { sound: TellerSound; className?: string }) {
  const audible = sound.on && !sound.blocked;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex items-center gap-2", className)}
    >
      <button
        type="button"
        onClick={sound.toggle}
        aria-label={audible ? "Mute Bella" : "Turn Bella's sound on"}
        aria-pressed={audible}
        className="glass focus-ring relative grid size-10 cursor-pointer place-items-center rounded-full text-fog transition-colors hover:text-white"
      >
        {sound.blocked && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-cyan"
            animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={audible ? "on" : "off"}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
          >
            {audible ? <Volume2 className="size-[18px]" strokeWidth={1.8} /> : <VolumeX className="size-[18px]" strokeWidth={1.8} />}
          </motion.span>
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {sound.blocked && (
          <motion.button
            type="button"
            onClick={sound.toggle}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="glass cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-medium text-white"
          >
            Tap for sound
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
