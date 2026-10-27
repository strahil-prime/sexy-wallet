import { useSyncExternalStore } from "react";

/**
 * Whether Bella's voice can be heard right now: a clip is playing, unmuted, inside one of its
 * spoken stretches (see `voice` on each clip). Drives the little equaliser on her cards.
 */
let voiced = false;
const listeners = new Set<() => void>();

export function setVoiced(next: boolean) {
  if (next === voiced) return;
  voiced = next;
  listeners.forEach((l) => l());
}

export function useVoiced() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => voiced,
    () => false,
  );
}
