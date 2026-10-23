import type { Contact } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ContactAvatar({ contact, className }: { contact: Contact; className?: string }) {
  const initials = contact.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className={cn(
        "relative grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ring-1 ring-white/15",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${contact.hue[0]}, ${contact.hue[1]})` }}
    >
      <span className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.35)]">{initials}</span>
    </div>
  );
}
