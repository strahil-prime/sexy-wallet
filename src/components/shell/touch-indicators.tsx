"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Demo-recording touch indicators (inspired by ipepe/show-touches-js, rewritten).
 * A soft circle follows every finger and ripples out on release, so screen recordings
 * show where the presenter taps. Touch only (phones/tablets); off by default.
 *
 * Hidden switch: hold "Add to Wallet" on the Card page for 1.5 s.
 *
 * Uses touch events (not pointer events) because iOS Safari fires pointercancel as soon
 * as a drag turns into a scroll, while touchmove keeps flowing. All listeners are passive
 * and the overlay is pointer-events:none, so scrolling and taps are never affected.
 * Dots are plain DOM nodes moved with transforms; React never re-renders on a touch.
 */

const KEY = "nobby:touches:v1";
const EVENT = "nobby:touches";
const SIZE = 44;

export function touchesEnabled() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function toggleTouches() {
  const on = !touchesEnabled();
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
  toast(on ? "Touch indicators on" : "Touch indicators off", {
    id: "touches",
    description: on ? "Taps and swipes now show a circle. Hold Add to Wallet again to turn off." : "Hold Add to Wallet again to turn them back on.",
  });
  navigator.vibrate?.(on ? [12, 40, 12] : 12);
  return on;
}

export function TouchIndicators() {
  useEffect(() => {
    let layer: HTMLDivElement | null = null;
    const dots = new Map<number, HTMLDivElement>();

    const ensureLayer = () => {
      if (layer) return layer;
      layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;contain:strict;";
      document.body.appendChild(layer);
      return layer;
    };

    const place = (el: HTMLElement, x: number, y: number) => {
      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
    };

    const makeDot = (x: number, y: number) => {
      const el = document.createElement("div");
      el.style.cssText = [
        "position:absolute",
        "left:0",
        "top:0",
        `width:${SIZE}px`,
        `height:${SIZE}px`,
        "will-change:transform",
      ].join(";");
      const core = document.createElement("div");
      core.style.cssText = [
        "width:100%",
        "height:100%",
        "border-radius:9999px",
        "background:radial-gradient(circle, rgb(255 255 255/0.55) 0%, rgb(255 255 255/0.28) 60%, rgb(255 255 255/0.18) 100%)",
        "box-shadow:0 0 0 1.5px rgb(255 255 255/0.85), 0 0 18px 2px rgb(120 220 255/0.35), 0 2px 10px rgb(0 0 0/0.35)",
      ].join(";");
      el.appendChild(core);
      place(el, x, y);
      ensureLayer().appendChild(el);
      core.animate(
        [
          { transform: "scale(0.55)", opacity: 0 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 140, easing: "cubic-bezier(.2,.9,.3,1.2)", fill: "both" },
      );
      return el;
    };

    const release = (el: HTMLDivElement) => {
      const core = el.firstElementChild as HTMLElement;
      // Ripple ring that expands from the dot.
      const ring = document.createElement("div");
      ring.style.cssText =
        "position:absolute;inset:0;border-radius:9999px;box-shadow:0 0 0 2px rgb(255 255 255/0.8), 0 0 14px rgb(120 220 255/0.4);";
      el.appendChild(ring);
      ring.animate(
        [
          { transform: "scale(1)", opacity: 0.9 },
          { transform: "scale(2)", opacity: 0 },
        ],
        { duration: 420, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
      );
      const fade = core.animate(
        [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(0.7)", opacity: 0 },
        ],
        { duration: 320, easing: "ease-out", fill: "forwards" },
      );
      fade.finished.then(() => setTimeout(() => el.remove(), 120)).catch(() => el.remove());
    };

    const onStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        dots.get(t.identifier)?.remove();
        dots.set(t.identifier, makeDot(t.clientX, t.clientY));
      }
    };
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        const el = dots.get(t.identifier);
        if (el) place(el, t.clientX, t.clientY);
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        const el = dots.get(t.identifier);
        if (!el) continue;
        dots.delete(t.identifier);
        place(el, t.clientX, t.clientY);
        release(el);
      }
    };

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    let active = false;
    const attach = () => {
      if (active) return;
      active = true;
      window.addEventListener("touchstart", onStart, opts);
      window.addEventListener("touchmove", onMove, opts);
      window.addEventListener("touchend", onEnd, opts);
      window.addEventListener("touchcancel", onEnd, opts);
    };
    const detach = () => {
      if (!active) return;
      active = false;
      window.removeEventListener("touchstart", onStart, opts);
      window.removeEventListener("touchmove", onMove, opts);
      window.removeEventListener("touchend", onEnd, opts);
      window.removeEventListener("touchcancel", onEnd, opts);
      dots.forEach((el) => el.remove());
      dots.clear();
      layer?.remove();
      layer = null;
    };

    const sync = () => (touchesEnabled() ? attach() : detach());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
      detach();
    };
  }, []);

  return null;
}
