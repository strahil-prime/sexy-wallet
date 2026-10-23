import { cn } from "@/lib/utils";

/** Four-point star mark from the reference, rotated into an X. */
export function Logo({ className, glow = false }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-8", className)} aria-hidden>
      {glow && (
        <defs>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <path
        transform="rotate(45 12 12)"
        d="M12 0.5C12.6 8.2 15.8 11.4 23.5 12 15.8 12.6 12.6 15.8 12 23.5 11.4 15.8 8.2 12.6 0.5 12 8.2 11.4 11.4 8.2 12 0.5Z"
        fill="currentColor"
        filter={glow ? "url(#logo-glow)" : undefined}
      />
    </svg>
  );
}
