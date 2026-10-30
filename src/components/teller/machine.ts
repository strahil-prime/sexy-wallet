/**
 * Teller state machine. Clips come from the active persona (lib/personas).
 *
 * The idle loop always plays underneath; any other clip with a `src` fades in on top, plays
 * once (with sound when allowed) and fades out. A clip without a `src` falls back to
 * `durationMs` timing over the idle loop.
 *
 *   intro    → greeting, plays once on load, then idle
 *   idle     → seamless loop
 *   thinking → short beat while a question is resolved
 *   talking  → the answer clip for the active question; when it ends the video returns to
 *              the idle loop while the answer stays on screen
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Clip, Persona } from "@/lib/personas";

export type { Clip };

/** A quick question, by its id in the persona's `questions`. */
export type Intent = string;

export type TellerState =
  | { status: "intro" }
  | { status: "idle" }
  | { status: "thinking"; intent: Intent }
  | { status: "talking"; intent: Intent; clipDone?: boolean };

export type ClipId = "intro" | "idle" | "thinking" | `answer:${Intent}`;

const THINKING: Clip = { loop: true, durationMs: 900 };

/** The clip a state plays, from the persona's media. */
export function clipOf(persona: Persona, id: ClipId): Clip {
  if (id === "intro") return persona.intro;
  if (id === "idle") return persona.idle;
  if (id === "thinking") return THINKING;
  return persona.questions.find((q) => `answer:${q.id}` === id)?.clip ?? persona.idle;
}

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

export function useTeller(persona: Persona) {
  const [state, dispatch] = useReducer(reducer, { status: "intro" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Without video, emulate clip timing so the flow feels the same.
  useEffect(() => {
    clearTimeout(timer.current);
    const clip = clipOf(persona, clipFor(state));
    if (clip.src) return;
    if (state.status === "intro") timer.current = setTimeout(() => dispatch({ type: "CLIP_ENDED" }), clip.durationMs);
    if (state.status === "thinking") timer.current = setTimeout(() => dispatch({ type: "RESOLVED" }), clip.durationMs);
    return () => clearTimeout(timer.current);
  }, [state, persona]);

  const ask = useCallback((intent: Intent) => dispatch({ type: "ASK", intent }), []);
  const dismiss = useCallback(() => dispatch({ type: "DISMISS" }), []);
  const onClipEnded = useCallback(() => dispatch({ type: "CLIP_ENDED" }), []);
  const onClipReady = useCallback(() => dispatch({ type: "RESOLVED" }), []);

  return { state, ask, dismiss, onClipEnded, onClipReady };
}
