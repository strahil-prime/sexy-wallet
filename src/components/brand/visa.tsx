import { siVisa } from "simple-icons";
import { cn } from "@/lib/utils";

export function VisaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 7.4 24 9.2" className={cn("h-6 w-auto", className)} fill="currentColor" aria-label="Visa">
      <path d={siVisa.path} />
    </svg>
  );
}
