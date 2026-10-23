import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function formatEUR(value: number, opts?: { sign?: boolean }) {
  const formatted = eur.format(Math.abs(value));
  if (!opts?.sign) return value < 0 ? `-${formatted}` : formatted;
  return `${value < 0 ? "−" : "+"} ${formatted}`;
}

export function formatWhen(date: Date, now = new Date()) {
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (date.getTime() >= startOfToday) return `Today, ${time}`;
  if (date.getTime() >= startOfToday - day) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
