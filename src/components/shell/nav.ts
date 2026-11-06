import { ArrowDownToLine, ArrowUpRight, Bitcoin, ChartNoAxesCombined, Clock3, CreditCard, Gift, House, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon; live: boolean };

export const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: House, live: true },
  { label: "Card", href: "/card", icon: CreditCard, live: true },
  { label: "Send", href: "/send", icon: ArrowUpRight, live: true },
  { label: "Receive", href: "/receive", icon: ArrowDownToLine, live: true },
  { label: "Activity", href: "/activity", icon: Clock3, live: true },
  { label: "Rewards", href: "/rewards", icon: Gift, live: true },
  { label: "Invest", href: "/invest", icon: ChartNoAxesCombined, live: true },
  { label: "Crypto", href: "/crypto", icon: Bitcoin, live: true },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
