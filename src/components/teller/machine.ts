/**
 * Teller state machine.
 *
 * Clips live in /public/teller/clips. The idle loop always plays underneath; any other
 * clip with a `src` fades in on top, plays once (with sound when allowed) and fades out.
 * A clip without a `src` falls back to `durationMs` timing over the idle loop.
 *
 *   intro    → greeting, plays once on load, then idle
 *   idle     → seamless loop
 *   thinking → short beat while an intent is resolved
 *   talking  → the answer clip for the active intent; when it ends the video returns to
 *              the idle loop while the answer stays on screen
 */
import { useCallback, useEffect, useReducer, useRef } from "react";

export type Intent = "money-went" | "subscriptions" | "split-dinner";

export type TellerState =
  | { status: "intro" }
  | { status: "idle" }
  | { status: "thinking"; intent: Intent }
  | { status: "talking"; intent: Intent; clipDone?: boolean };

export type ClipId = "intro" | "idle" | "thinking" | `answer:${Intent}`;

export type Clip = {
  /** MP4 (H.264), the format every browser plays */
  src?: string;
  /** optional smaller WebM (VP9), tried first */
  webm?: string;
  loop: boolean;
  /** fallback length when there is no video */
  durationMs: number;
};

export const clips: Record<ClipId, Clip> = {
  intro: { src: "/teller/clips/intro.mp4", webm: "/teller/clips/intro.webm", loop: false, durationMs: 3200 },
  idle: { src: "/teller/clips/idle.mp4", webm: "/teller/clips/idle.webm", loop: true, durationMs: 0 },
  thinking: { src: undefined, loop: true, durationMs: 900 },
  // One placeholder answer clip for all three questions until the real ones are recorded.
  "answer:money-went": { src: "/teller/clips/answer.mp4", webm: "/teller/clips/answer.webm", loop: false, durationMs: 9000 },
  "answer:subscriptions": { src: "/teller/clips/answer.mp4", webm: "/teller/clips/answer.webm", loop: false, durationMs: 10000 },
  "answer:split-dinner": { src: "/teller/clips/answer.mp4", webm: "/teller/clips/answer.webm", loop: false, durationMs: 9000 },
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
      return state.clipDone ? "idle" : `answer:${state.intent}`;
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
      // The intro hands over to idle. An answer stays on screen until dismissed or a new
      // question, but its video hands back to the idle loop.
      if (state.status === "intro") return { status: "idle" };
      if (state.status === "talking") return { ...state, clipDone: true };
      return state;
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
