import { ArrowDownToLine, ArrowUpRight, Clock3, CreditCard, Gift, House, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon; live: boolean };

export const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: House, live: true },
  { label: "Card", href: "/card", icon: CreditCard, live: true },
  { label: "Send", href: "/send", icon: ArrowUpRight, live: true },
  { label: "Receive", href: "/receive", icon: ArrowDownToLine, live: false },
  { label: "Activity", href: "/activity", icon: Clock3, live: false },
  { label: "Rewards", href: "/rewards", icon: Gift, live: false },
  { label: "Profile", href: "/profile", icon: UserRound, live: false },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
