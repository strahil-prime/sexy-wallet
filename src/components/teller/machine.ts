/**
 * Teller state machine.
 *
 * v1 renders a static portrait for every state. When the video clips arrive,
 * drop the files in /public/teller/clips and fill in `src` below: the stage
 * will crossfade between clips on state changes with no other code changes.
 *
 *   intro    → plays once on load ("Hello Strahil"), then idle
 *   idle     → seamless loop
 *   thinking → short loop while an intent is resolved
 *   talking  → the answer clip for the active intent, then back to idle
 */
import { useCallback, useEffect, useReducer, useRef } from "react";

export type Intent = "spent-this-month" | "savings-rate" | "send-janet";

export type TellerState =
  | { status: "intro" }
  | { status: "idle" }
  | { status: "thinking"; intent: Intent }
  | { status: "talking"; intent: Intent };

export type ClipId = "intro" | "idle" | "thinking" | `answer:${Intent}`;

export type Clip = { src?: string; loop: boolean; /** fallback length when there is no video */ durationMs: number };

export const clips: Record<ClipId, Clip> = {
  intro: { src: undefined, loop: false, durationMs: 3200 },
  idle: { src: undefined, loop: true, durationMs: 0 },
  thinking: { src: undefined, loop: true, durationMs: 900 },
  "answer:spent-this-month": { src: undefined, loop: false, durationMs: 9000 },
  "answer:savings-rate": { src: undefined, loop: false, durationMs: 9000 },
  "answer:send-janet": { src: undefined, loop: false, durationMs: 12000 },
};

export function clipFor(state: TellerState): ClipId {
  switch (state.status) {
    case "intro":
      return "intro";
    case "idle":
      return "idle";
    case "thinking":
      return "thinking";
    case "talking":
      return `answer:${state.intent}`;
  }
}

type Event = { type: "ASK"; intent: Intent } | { type: "RESOLVED" } | { type: "CLIP_ENDED" } | { type: "DISMISS" };

function reducer(state: TellerState, event: Event): TellerState {
  switch (event.type) {
    case "ASK":
      return { status: "thinking", intent: event.intent };
    case "RESOLVED":
      return state.status === "thinking" ? { status: "talking", intent: state.intent } : state;
    case "CLIP_ENDED":
      // Answers stay on screen until dismissed or a new question; only the intro auto-advances.
      return state.status === "intro" ? { status: "idle" } : state;
    case "DISMISS":
      return { status: "idle" };
  }
}

export function useTeller() {
  const [state, dispatch] = useReducer(reducer, { status: "intro" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Without video, emulate clip timing so the flow feels the same.
  useEffect(() => {
    clearTimeout(timer.current);
    const clip = clips[clipFor(state)];
    if (clip.src) return;
    if (state.status === "intro") timer.current = setTimeout(() => dispatch({ type: "CLIP_ENDED" }), clip.durationMs);
    if (state.status === "thinking") timer.current = setTimeout(() => dispatch({ type: "RESOLVED" }), clip.durationMs);
    return () => clearTimeout(timer.current);
  }, [state]);

  const ask = useCallback((intent: Intent) => dispatch({ type: "ASK", intent }), []);
  const dismiss = useCallback(() => dispatch({ type: "DISMISS" }), []);
  const onClipEnded = useCallback(() => dispatch({ type: "CLIP_ENDED" }), []);
  const onClipReady = useCallback(() => dispatch({ type: "RESOLVED" }), []);

  return { state, ask, dismiss, onClipEnded, onClipReady };
}
