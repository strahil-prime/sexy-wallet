"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A scroll area with a slim overlay thumb instead of the system scrollbar. The thumb fades in while
 * scrolling or when the pointer is near the right edge, and fades out about a second later. It can
 * be dragged. When the area does not scroll (phones, where the page scrolls), nothing is drawn.
 */
export function ScrollFade({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [shown, setShown] = useState(false);
  const [dragging, setDragging] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) return setThumb(null);
    const track = clientHeight - 16;
    const height = Math.max(36, (clientHeight / scrollHeight) * track);
    const top = 8 + (scrollTop / (scrollHeight - clientHeight)) * (track - height);
    setThumb({ top, height });
  }, []);

  const flash = useCallback(() => {
    setShown(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShown(false), 1100);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      ro.disconnect();
      window.clearTimeout(hideTimer.current);
    };
  }, [measure]);

  const startDrag = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !thumb) return;
    e.preventDefault();
    const startY = e.clientY;
    const startScroll = el.scrollTop;
    const ratio = (el.scrollHeight - el.clientHeight) / (el.clientHeight - 16 - thumb.height);
    setDragging(true);
    const move = (ev: PointerEvent) => (el.scrollTop = startScroll + (ev.clientY - startY) * ratio);
    const up = () => {
      setDragging(false);
      flash();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const visible = shown || dragging;

  return (
    <div className="group/scroll relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={ref}
        onScroll={() => {
          measure();
          flash();
        }}
        className={cn("no-scrollbar min-h-0 flex-1", className)}
      >
        {children}
      </div>
      {thumb && (
        // A 14px hover strip on the right edge; the visible thumb is 4px and widens slightly on hover.
        <div
          aria-hidden
          onPointerEnter={flash}
          onPointerMove={flash}
          className="absolute top-0 right-0 bottom-0 z-20 hidden w-3.5 lg:block"
        >
          <div
            onPointerDown={startDrag}
            style={{ top: thumb.top, height: thumb.height }}
            className={cn(
              "absolute right-1 w-1 cursor-grab rounded-full bg-white/25 transition-[opacity,width,background-color] duration-300 hover:w-1.5 hover:bg-white/45 active:cursor-grabbing",
              visible ? "opacity-100" : "opacity-0",
              dragging && "w-1.5 bg-white/55",
            )}
          />
        </div>
      )}
    </div>
  );
}
