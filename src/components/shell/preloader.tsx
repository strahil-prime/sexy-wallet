"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Volume2 } from "lucide-react";
import { NUDGE_BLUE, NudgeLogotype } from "@/components/brand/nudge";
import { NW_LEGS, NW_STAR } from "@/components/brand/nudge-paths";

const ease = [0.16, 1, 0.3, 1] as const;

/** A tenth of a second of silence, to ask the browser whether sound may autoplay. */
const SILENCE =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

const ReadyContext = createContext(false);

/** True once the preloader has handed over to the page. Clips and count-ups wait for it. */
export function usePreloaded() {
  return useContext(ReadyContext);
}

// Something that wants to start media from the tap that dismisses the preloader (iOS only lets a
// video play with sound if play() is called inside the gesture itself).
let primer: (() => void) | null = null;
export function registerPrimer(fn: (() => void) | null) {
  primer = fn;
}

async function soundAllowed() {
  type Policy = (type: "mediaelement") => "allowed" | "allowed-muted" | "disallowed";
  const policy = (navigator as Navigator & { getAutoplayPolicy?: Policy }).getAutoplayPolicy;
  if (policy) return policy.call(navigator, "mediaelement") === "allowed";
  try {
    await new Audio(SILENCE).play();
    return true;
  } catch {
    return false;
  }
}

type Phase = "loading" | "gate" | "leaving" | "done";

/**
 * Logo intro shown on every full page load. When it ends it checks whether the browser lets
 * Bella speak out loud; if not, it waits for one tap ("Tap to enter"), which unlocks sound.
 */
export function Preloader({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("loading");
  const tapped = useRef(false);

  const enter = useCallback(() => {
    primer?.();
    setPhase("leaving");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const markTap = () => (tapped.current = true);
    window.addEventListener("pointerdown", markTap, { capture: true });
    const minTime = new Promise((r) => setTimeout(r, reduced ? 600 : 2300));
    const loaded = new Promise((r) => (document.readyState === "complete" ? r(null) : window.addEventListener("load", r, { once: true })));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    // Never hold the site hostage to a slow asset.
    const cap = new Promise((r) => setTimeout(r, 6000));

    Promise.race([Promise.all([minTime, loaded, fonts]), cap])
      .then(async () => tapped.current || (await soundAllowed()))
      .then((allowed) => {
        if (cancelled) return;
        if (allowed) enter();
        else setPhase("gate");
      });
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", markTap, { capture: true });
    };
  }, [reduced, enter]);

  // Keyboard users can enter too.
  useEffect(() => {
    if (phase !== "gate") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, enter]);

  // The page wakes as the curtain lifts, so the greeting starts during the reveal.
  const ready = phase === "leaving" || phase === "done";

  return (
    <ReadyContext.Provider value={ready}>
      {children}
      <AnimatePresence onExitComplete={() => setPhase("done")}>
        {phase !== "leaving" && phase !== "done" && (
          <motion.div
            key="preloader"
            role="status"
            aria-label="Loading Nudge"
            onClick={phase === "gate" ? enter : undefined}
            exit={{ opacity: 0, transition: { duration: 0.8, ease, delay: 0.15 } }}
            className="fixed inset-0 z-[100] grid cursor-default place-items-center overflow-hidden bg-ink-950 select-none data-[gate=true]:cursor-pointer"
            data-gate={phase === "gate"}
          >
            {/* Ambient light */}
            <motion.div
              aria-hidden
              className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(42_209_230/0.22),rgb(31_123_255/0.08)_45%,transparent_70%)] blur-2xl"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.05, 1], opacity: 1 }}
              exit={{ scale: 2.4, opacity: 0, transition: { duration: 0.9, ease } }}
              transition={{ duration: 1.8, ease }}
            />

            <div className="relative flex flex-col items-center">
              <motion.div
                className="relative grid size-40 place-items-center"
                exit={{ scale: 9, opacity: 0, filter: "blur(10px)", transition: { duration: 0.9, ease: [0.7, 0, 0.84, 0] } }}
              >
                {/* Orbit */}
                <motion.svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 size-full"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 270 }}
                  transition={{ opacity: { delay: 0.5, duration: 0.6 }, rotate: { duration: 3.2, ease: "linear", repeat: Infinity } }}
                >
                  <defs>
                    <linearGradient id="pl-orbit" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#5ef0ff" stopOpacity="0" />
                      <stop offset="100%" stopColor="#5ef0ff" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="47" fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="0.6" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="47"
                    fill="none"
                    stroke="url(#pl-orbit)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 0.32 }}
                    transition={{ delay: 0.5, duration: 1.2, ease }}
                  />
                </motion.svg>

                <NudgeIntro />
              </motion.div>

              {/* Logotype */}
              <motion.div
                className="mt-5 text-white"
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.35 } }}
                transition={{ delay: 1.15, duration: 0.8, ease }}
              >
                <NudgeLogotype className="h-[30px]" />
              </motion.div>

              {/* Progress hairline, then the tap prompt if the browser needs one for sound */}
              <div className="mt-8 grid h-11 place-items-center">
                <AnimatePresence mode="wait">
                  {phase === "loading" ? (
                    <motion.div
                      key="bar"
                      className="h-px w-28 overflow-hidden rounded-full bg-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 1.3, duration: 0.4 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan to-electric"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1.3, duration: 1, ease: "easeInOut" }}
                      />
                    </motion.div>
                  ) : (
                    <motion.button
                      key="enter"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        enter();
                      }}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.5, ease }}
                      className="focus-ring relative flex h-11 cursor-pointer items-center gap-2.5 rounded-full bg-white px-5 text-[14px] font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgb(17_92_225/0.7)] transition-colors hover:bg-white/90"
                    >
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full ring-1 ring-white/70"
                        animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      <Volume2 className="size-4" style={{ color: NUDGE_BLUE }} strokeWidth={2.2} />
                      Tap to enter
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ReadyContext.Provider>
  );
}

/**
 * The N builds from left to right (left leg, diagonal, right leg), then the star pops in and
 * blinks. White symbol; star centre in the 217 x 123 artboard is at (139.8, 29.7).
 */
function NudgeIntro() {
  return (
    <div className="relative w-[104px]">
      <svg viewBox="0 0 217 123" className="relative block w-full overflow-visible drop-shadow-[0_0_16px_rgb(94_240_255/0.35)]">
        <defs>
          <clipPath id="pl-wipe">
            <motion.rect
              x="-10"
              y="-10"
              height="150"
              initial={{ width: 0 }}
              animate={{ width: 250 }}
              transition={{ delay: 0.25, duration: 1.05, ease: [0.65, 0, 0.35, 1] }}
            />
          </clipPath>
        </defs>
        <g clipPath="url(#pl-wipe)">
          {NW_LEGS.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="white"
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.28, duration: 0.7, ease }}
            />
          ))}
        </g>
        <motion.path
          d={NW_STAR}
          fill="white"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ scale: 0, rotate: -90, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1, 1, 1, 1], rotate: [-90, 0, 0, 0, 0, 0], opacity: [0, 1, 1, 0.2, 1, 1] }}
          transition={{ delay: 1.25, duration: 1.1, times: [0, 0.3, 0.45, 0.62, 0.8, 1], ease: "easeOut" }}
        />
      </svg>
      {/* The blink's flash, sitting on the star */}
      <motion.span
        aria-hidden
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_22px_8px_rgb(94_240_255/0.7)]"
        style={{ left: "64.4%", top: "24.1%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 0, 1.2, 0], opacity: [0, 1, 0, 0.9, 0] }}
        transition={{ delay: 1.4, duration: 1.1, times: [0, 0.2, 0.45, 0.65, 1], ease: "easeOut" }}
      />
    </div>
  );
}
