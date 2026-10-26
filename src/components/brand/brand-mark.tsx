import { siAirbnb, siApple, siAudible, siIkea, siLidl, siNetflix, siSpotify, siStarbucks, siUber, siZara } from "simple-icons";
import { ArrowDownLeft, ArrowUpRight, UtensilsCrossed } from "lucide-react";
import type { Activity, BrandKey } from "@/lib/data";
import { cn } from "@/lib/utils";

const brands: Record<Exclude<BrandKey, "dining">, { path: string; bg: string; fg: string }> = {
  apple: { path: siApple.path, bg: "#f5f7f8", fg: "#000" },
  starbucks: { path: siStarbucks.path, bg: "#006241", fg: "#fff" },
  netflix: { path: siNetflix.path, bg: "#0b0b0b", fg: "#e50914" },
  spotify: { path: siSpotify.path, bg: "#101010", fg: "#1ed760" },
  uber: { path: siUber.path, bg: "#f5f7f8", fg: "#000" },
  airbnb: { path: siAirbnb.path, bg: "#ff385c", fg: "#fff" },
  zara: { path: siZara.path, bg: "#f5f7f8", fg: "#000" },
  ikea: { path: siIkea.path, bg: "#0058a3", fg: "#ffdb00" },
  lidl: { path: siLidl.path, bg: "#0050aa", fg: "#fff100" },
  audible: { path: siAudible.path, bg: "#f8991c", fg: "#000" },
};

/** Logo only, for places without an Activity row (e.g. Bella's subscription list). */
export function BrandLogo({ brand, className }: { brand: BrandKey; className?: string }) {
  return <BrandMark activity={{ id: brand, title: brand, at: "", amount: 0, category: "", brand }} className={className} />;
}

export function BrandMark({ activity, className }: { activity: Activity; className?: string }) {
  if (activity.peer) {
    const Icon = activity.peer.direction === "in" ? ArrowUpRight : ArrowDownLeft;
    return (
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-ink-600 to-ink-700 text-fog ring-1 ring-white/10",
          className,
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
    );
  }
  if (activity.brand === "dining") {
    return (
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#ff9a6b] to-[#e8573a] text-white ring-1 ring-white/10",
          className,
        )}
      >
        <UtensilsCrossed className="size-5" strokeWidth={1.75} />
      </div>
    );
  }
  const b = brands[activity.brand ?? "apple"];
  return (
    <div
      className={cn("grid size-11 shrink-0 place-items-center rounded-full ring-1 ring-white/10", className)}
      style={{ background: b.bg }}
    >
      <svg viewBox="0 0 24 24" className="size-[22px]" fill={b.fg} aria-hidden>
        <path d={b.path} />
      </svg>
    </div>
  );
}
