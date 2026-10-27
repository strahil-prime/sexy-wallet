"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Volume2 } from "lucide-react";

/** Same four-point star as <Logo />, rotated into an X. */
const STAR =
  "M12 0.5C12.6 8.2 15.8 11.4 23.5 12 15.8 12.6 12.6 15.8 12 23.5 11.4 15.8 8.2 12.6 0.5 12 8.2 11.4 11.4 8.2 12 0.5Z";
const WORDMARK = "Sexy Wallet";
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
            aria-label="Loading Sexy Wallet"
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

                {/* Star: outline draws itself, then fills and glows */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="relative size-[76px] text-white"
                  initial={{ rotate: -135, scale: 0.55 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 1.4, ease }}
                >
                  <defs>
                    <filter id="pl-glow" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="1.1" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g transform="rotate(45 12 12)">
                    <motion.path
                      d={STAR}
                      fill="none"
                      stroke="#5ef0ff"
                      strokeWidth="0.35"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 1 }}
                      animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                      transition={{ pathLength: { duration: 1, ease: "easeInOut" }, opacity: { duration: 1.6, times: [0, 0.7, 1] } }}
                    />
                    <motion.path
                      d={STAR}
                      fill="currentColor"
                      filter="url(#pl-glow)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.85, duration: 0.6 }}
                    />
                  </g>
                </motion.svg>

                {/* Glint that sweeps through once the star lands */}
                <motion.span
                  aria-hidden
                  className="absolute size-3 rounded-full bg-white shadow-[0_0_24px_8px_rgb(94_240_255/0.7)]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.6, 0], opacity: [0, 1, 0] }}
                  transition={{ delay: 1.15, duration: 0.7, ease: "easeOut" }}
                />
              </motion.div>

              {/* Wordmark */}
              <motion.div
                className="mt-6 flex text-[15px] font-medium tracking-[0.32em] text-fog uppercase"
                exit={{ opacity: 0, y: 8, transition: { duration: 0.35 } }}
              >
                {WORDMARK.split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: 1 + i * 0.045, duration: 0.6, ease }}
                    className="whitespace-pre"
                  >
                    {ch}
                  </motion.span>
                ))}
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
                      className="glass focus-ring relative flex h-11 cursor-pointer items-center gap-2.5 rounded-full px-5 text-[14px] font-medium text-white"
                    >
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full ring-1 ring-cyan/60"
                        animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      <Volume2 className="size-4 text-cyan" strokeWidth={2} />
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
