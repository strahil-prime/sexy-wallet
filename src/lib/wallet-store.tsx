"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialActivity, walletCards, type Activity, type Contact } from "./data";

export type CardSettings = {
  frozen: boolean;
  online: boolean;
  contactless: boolean;
  atm: boolean;
  abroad: boolean;
  monthlyLimit: number;
};

type WalletState = {
  balance: number;
  activity: Activity[];
  cards: Record<string, CardSettings>;
  /** subscription ids cancelled from Bella's review */
  cancelled: string[];
};

type WalletContext = WalletState & {
  send: (to: Contact, amount: number, note?: string) => Activity;
  request: (from: Contact, amount: number, note?: string) => Activity;
  cancelSubscription: (id: string) => void;
  restoreSubscription: (id: string) => void;
  updateCard: (id: string, patch: Partial<CardSettings>) => void;
  reset: () => void;
};

const STORAGE_KEY = "sexy-wallet:v2";

const initialState = (): WalletState => ({
  balance: 24678.32,
  activity: initialActivity,
  cards: Object.fromEntries(
    walletCards.map((c) => [
      c.id,
      { frozen: false, online: true, contactless: true, atm: c.kind === "Metal", abroad: true, monthlyLimit: c.kind === "Metal" ? 5000 : 2500 },
    ]),
  ),
  cancelled: [],
});

const Ctx = createContext<WalletContext | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  // Session-scoped persistence so a sent payment shows up on the dashboard.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const send = useCallback((to: Contact, amount: number, note?: string) => {
    const tx: Activity = {
      id: `tx_${Date.now().toString(36)}`,
      title: `Transfer to ${to.name.split(" ")[0]}`,
      at: new Date().toISOString(),
      amount: -amount,
      category: note?.trim() || "Transfer",
      peer: { name: to.name, direction: "out" },
    };
    setState((s) => ({ ...s, balance: Math.round((s.balance - amount) * 100) / 100, activity: [tx, ...s.activity] }));
    return tx;
  }, []);

  const request = useCallback((from: Contact, amount: number, note?: string) => {
    const tx: Activity = {
      id: `rq_${Date.now().toString(36)}`,
      title: `Request to ${from.name.split(" ")[0]}`,
      at: new Date().toISOString(),
      amount,
      category: note?.trim() || "Request",
      peer: { name: from.name, direction: "in" },
      pending: true,
    };
    setState((s) => ({ ...s, activity: [tx, ...s.activity] }));
    return tx;
  }, []);

  const cancelSubscription = useCallback((id: string) => {
    setState((s) => (s.cancelled.includes(id) ? s : { ...s, cancelled: [...s.cancelled, id] }));
  }, []);

  const restoreSubscription = useCallback((id: string) => {
    setState((s) => ({ ...s, cancelled: s.cancelled.filter((c) => c !== id) }));
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<CardSettings>) => {
    setState((s) => ({ ...s, cards: { ...s.cards, [id]: { ...s.cards[id], ...patch } } }));
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  const value = useMemo(
    () => ({ ...state, send, request, cancelSubscription, restoreSubscription, updateCard, reset }),
    [state, send, request, cancelSubscription, restoreSubscription, updateCard, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
