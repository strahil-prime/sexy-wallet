import { useId } from "react";
import { cn } from "@/lib/utils";
import { H_WORD, LOGOTYPE, N_LEGS, N_STAR } from "./nudge-paths";

export const NUDGE_BLUE = "#115CE1";
export const NUDGE_BLUE_DEEP = "#1250BF";

/** The brand's blue legs (the diagonal a shade deeper) and the star's gradient. */
function MarkPaths({ mono, gradId }: { mono: boolean; gradId: string }) {
  return (
    <>
      {N_LEGS.map((d, i) => (
        <path key={i} d={d} fill={mono ? "currentColor" : i === 1 ? NUDGE_BLUE_DEEP : NUDGE_BLUE} />
      ))}
      <path d={N_STAR} fill={mono ? "currentColor" : `url(#${gradId})`} />
      {!mono && (
        <defs>
          <linearGradient id={gradId} x1="139.5" y1="13" x2="151.5" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2E75E8" />
            <stop offset="1" stopColor={NUDGE_BLUE_DEEP} />
          </linearGradient>
        </defs>
      )}
    </>
  );
}

/** The "N" symbol. Full colour by default; `mono` paints it in the current text colour. */
export function NudgeMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 228 125" className={cn("h-6 w-auto", className)} aria-hidden>
      <MarkPaths mono={mono} gradId={`nm${id}`} />
    </svg>
  );
}

/** Blue N with the "Nudge" wordmark beside it. The wordmark takes the current text colour. */
export function NudgeLogo({ className, label = "Nudge" }: { className?: string; label?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 595 143" className={cn("h-7 w-auto", className)} role="img" aria-label={label}>
      <MarkPaths mono={false} gradId={`nl${id}`} />
      {H_WORD.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}

/** "Nudge" wordmark only, in the current text colour. */
export function NudgeLogotype({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 344 128" className={cn("h-6 w-auto", className)} aria-hidden>
      {LOGOTYPE.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}
