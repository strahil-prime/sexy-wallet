import { toast } from "sonner";

export function comingSoon(what: string) {
  toast(`${what} is coming soon`, {
    description: "This part of the wallet isn't wired up yet.",
    id: `soon-${what}`,
  });
}
