"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Volume2 } from "lucide-react";
import { BRAND_BLUE, Logotype } from "@/components/brand/logo";
import { NW_LEGS, NW_STAR } from "@/components/brand/logo-paths";

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

/**
 * Whether the browser will let a video speak without a tap. Never throws and never hangs: some
 * browsers leave the test play() pending forever, which used to freeze the preloader on its bar.
 */
async function soundAllowed(): Promise<boolean> {
  type Policy = (type: "mediaelement") => "allowed" | "allowed-muted" | "disallowed";
  try {
    const policy = (navigator as Navigator & { getAutoplayPolicy?: Policy }).getAutoplayPolicy;
    if (policy) return policy.call(navigator, "mediaelement") === "allowed";
  } catch {}
  const audio = new Audio(SILENCE);
  const test = audio
    .play()
    .then(() => true)
    .catch(() => false);
  const timeout = new Promise<boolean>((r) => setTimeout(() => r(false), 900));
  const allowed = await Promise.race([test, timeout]);
  audio.pause();
  return allowed;
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
    const minTime = new Promise((r) => setTimeout(r, reduced ? 600 : 2900));
    const loaded = new Promise((r) => (document.readyState === "complete" ? r(null) : window.addEventListener("load", r, { once: true })));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    // Never hold the site hostage to a slow asset.
    const cap = new Promise((r) => setTimeout(r, 6000));

    Promise.race([Promise.all([minTime, loaded, fonts]), cap])
      .then(async () => tapped.current || (await soundAllowed()))
      .catch(() => false)
      .then((allowed) => {
        if (cancelled) return;
        if (allowed) enter();
        else setPhase("gate");
      });
    // Belt and braces: whatever happens above, the visitor is never left on the bar.
    const failsafe = setTimeout(() => !cancelled && setPhase((p) => (p === "loading" ? "gate" : p)), 8000);
    return () => {
      cancelled = true;
      clearTimeout(failsafe);
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
            aria-label="Loading Neville"
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
                {/* Orbit: a faint ring with a soft sheen gliding round it, fading in and out at both ends */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
                  <circle cx="50" cy="50" r="47" fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="0.6" />
                </svg>
                <motion.div
                  aria-hidden
                  className="absolute inset-[3%] rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgb(160 225 255 / 0) 0deg, rgb(160 225 255 / 0) 150deg, rgb(160 225 255 / 0.12) 215deg, rgb(205 240 255 / 0.42) 270deg, rgb(160 225 255 / 0.1) 320deg, rgb(160 225 255 / 0) 360deg)",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1.1px), #000 calc(100% - 0.2px), transparent 100%)",
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1.1px), #000 calc(100% - 0.2px), transparent 100%)",
                  }}
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  transition={{ opacity: { delay: 0.5, duration: 1.2 }, rotate: { duration: 9, ease: "linear", repeat: Infinity } }}
                />

                <MarkIntro />
              </motion.div>

              {/* Logotype */}
              <motion.div
                className="mt-5 text-white"
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.35 } }}
                transition={{ delay: 1.15, duration: 0.8, ease }}
              >
                <Logotype className="h-[30px]" />
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
                      <Volume2 className="size-4" style={{ color: BRAND_BLUE }} strokeWidth={2.2} />
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
 * The N is written as one pen stroke: up the left column, down the middle, up the right
 * (a stroked path in a mask draws on, so the three columns read as a single letter). Then the
 * star bursts on with a flare and blinks. White symbol, 217 x 123 artboard; star centre at
 * (139.8, 29.7).
 */
const PEN = "M5.2 148.4 L71.4 29.4 L80.3 29.4 L131.9 122.2 L145.6 122.2 L211.8 3.2";
const WRITE_AT = 0.3;
const WRITE_FOR = 1.25;
const STAR_AT = WRITE_AT + WRITE_FOR - 0.25;

function MarkIntro() {
  return (
    <div className="relative -top-[3px] w-[104px]">
      <svg viewBox="0 0 217 123" className="relative block w-full overflow-visible drop-shadow-[0_0_16px_rgb(94_240_255/0.35)]">
        <defs>
          <mask id="pl-pen" maskUnits="userSpaceOnUse" x="-20" y="-20" width="257" height="180">
            <motion.path
              d={PEN}
              fill="none"
              stroke="white"
              strokeWidth="46"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: WRITE_AT, duration: WRITE_FOR, ease: [0.55, 0.05, 0.35, 1] }}
            />
          </mask>
        </defs>
        <g mask="url(#pl-pen)">
          {NW_LEGS.map((d, i) => (
            <path key={i} d={d} fill="white" />
          ))}
        </g>
        <motion.path
          d={NW_STAR}
          fill="white"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ scale: 0, rotate: -120, opacity: 0 }}
          animate={{
            scale: [0, 1.9, 0.85, 1.35, 1],
            rotate: [-120, 0, 0, 0, 0],
            opacity: [0, 1, 0.35, 1, 1],
          }}
          transition={{ delay: STAR_AT, duration: 1.1, times: [0, 0.28, 0.5, 0.7, 1], ease: "easeOut" }}
        />
      </svg>

      {/* Star burst: flash, shock ring and lens flare, all centred on the star */}
      <div aria-hidden className="pointer-events-none absolute size-0" style={{ left: "64.4%", top: "24.1%" }}>
        <motion.span
          className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-white shadow-[0_0_30px_12px_rgb(255_255_255/0.85),0_0_70px_26px_rgb(94_240_255/0.55)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2.2, 0.3, 1.6, 0], opacity: [0, 1, 0.2, 1, 0] }}
          transition={{ delay: STAR_AT + 0.05, duration: 1.15, times: [0, 0.22, 0.48, 0.68, 1], ease: "easeOut" }}
        />
        <motion.span
          className="absolute -top-5 -left-5 size-10 rounded-full ring-2 ring-white/80"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 0.4, 3.4], opacity: [0, 0.9, 0] }}
          transition={{ delay: STAR_AT + 0.1, duration: 0.75, times: [0, 0.08, 1], ease: "easeOut" }}
        />
        <motion.span
          className="absolute -top-px -left-[90px] h-0.5 w-[180px] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.95),transparent)] blur-[0.5px]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 0.4, 1, 0], opacity: [0, 1, 0.3, 0.9, 0] }}
          transition={{ delay: STAR_AT + 0.05, duration: 1.15, times: [0, 0.22, 0.48, 0.68, 1], ease: "easeOut" }}
        />
        <motion.span
          className="absolute -top-[50px] -left-px h-[100px] w-0.5 bg-[linear-gradient(180deg,transparent,rgb(255_255_255/0.9),transparent)] blur-[0.5px]"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0.4, 1, 0], opacity: [0, 1, 0.3, 0.9, 0] }}
          transition={{ delay: STAR_AT + 0.05, duration: 1.15, times: [0, 0.22, 0.48, 0.68, 1], ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
