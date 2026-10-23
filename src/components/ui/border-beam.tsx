import { cn } from "@/lib/utils";

/** Magic UI style light beam that travels around a rounded border. */
export function BorderBeam({
  className,
  size = 120,
  duration = 7,
  delay = 0,
  from = "#5ef0ff",
  to = "#1f7bff",
}: {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  from?: string;
  to?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:1px_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        className,
      )}
    >
      <div
        className="absolute aspect-square animate-beam [offset-anchor:90%_50%] [offset-path:rect(0_auto_auto_0_round_var(--beam-r))]"
        style={
          {
            width: size,
            background: `linear-gradient(to left, ${from}, ${to}, transparent)`,
            animationDuration: `${duration}s`,
            animationDelay: `-${delay}s`,
            "--beam-r": `${size}px`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
