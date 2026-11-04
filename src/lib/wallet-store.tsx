"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { initialActivity, walletCards, type Activity, type BrandKey, type Contact } from "./data";
import { funds, initialHoldings, MONTHLY_PLAN, type Holding, type Ticker } from "./invest";
import { formatEUR } from "./utils";

export type CardSettings = {
  frozen: boolean;
  online: boolean;
  contactless: boolean;
  atm: boolean;
  abroad: boolean;
  monthlyLimit: number;
};

/** Something that happened on the Invest side: a purchase, a plan change, a decision. */
export type InvestEvent = {
  id: string;
  at: string;
  kind: "buy" | "plan" | "hold" | "safety";
  title: string;
  detail?: string;
  amount?: number;
  ticker?: Ticker;
};

type WalletState = {
  /** cash in the current account */
  balance: number;
  activity: Activity[];
  cards: Record<string, CardSettings>;
  /** subscription ids cancelled from Bella's review */
  cancelled: string[];
  holdings: Holding[];
  /** euros invested automatically on the 1st of each month */
  plan: number;
  /** cash kept aside and never invested; 0 when not set */
  safetyNet: number;
  investLog: InvestEvent[];
  /** monthly caps, e.g. { coffee: 35, dining: 220 } */
  budgets: Record<string, number>;
  billReminders: boolean;
  /** charges flagged for a refund, by activity id */
  refunds: string[];
};

type WalletContext = WalletState & {
  /** all holdings added up */
  portfolio: number;
  send: (to: Contact, amount: number, note?: string) => Activity;
  request: (from: Contact, amount: number, note?: string) => Activity;
  cancelSubscription: (id: string) => void;
  restoreSubscription: (id: string) => void;
  updateCard: (id: string, patch: Partial<CardSettings>) => void;
  /** Moves cash into a fund. Returns false when the balance can't cover it. */
  invest: (ticker: Ticker, amount: number, by?: string) => boolean;
  setPlan: (monthly: number, by?: string) => void;
  setSafetyNet: (amount: number, by?: string) => void;
  stayTheCourse: (by?: string) => void;
  setBudget: (key: string, monthly: number) => void;
  setBillReminders: (on: boolean) => void;
  flagRefund: (chargeId: string, refund: { title: string; amount: number; brand?: BrandKey }) => void;
  reset: () => void;
};

const STORAGE_KEY = "sexy-wallet:v3";
/** A money request is paid back this long after it is sent, so the demo can show it landing. */
const REQUEST_PAID_AFTER_MS = 20_000;

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
  holdings: initialHoldings,
  plan: MONTHLY_PLAN,
  safetyNet: 0,
  investLog: [],
  budgets: {},
  billReminders: false,
  refunds: [],
});

const round = (v: number) => Math.round(v * 100) / 100;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const Ctx = createContext<WalletContext | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);

  // Session-scoped persistence so what happens on one page shows up on the others.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState(), ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Money requests get paid a little later: the pending row settles and the balance goes up.
  const nextRequest = useMemo(
    () => state.activity.filter((a) => a.pending && a.id.startsWith("rq_")).sort((a, b) => +new Date(a.at) - +new Date(b.at))[0],
    [state.activity],
  );
  useEffect(() => {
    if (!nextRequest) return;
    const wait = Math.max(0, +new Date(nextRequest.at) + REQUEST_PAID_AFTER_MS - Date.now());
    const timer = setTimeout(() => {
      const name = nextRequest.peer?.name.split(" ")[0] ?? "They";
      setState((s) => {
        const row = s.activity.find((a) => a.id === nextRequest.id);
        if (!row?.pending) return s;
        return {
          ...s,
          balance: round(s.balance + row.amount),
          activity: s.activity.map((a) =>
            a.id === row.id ? { ...a, pending: false, title: `${name} paid you`, at: new Date().toISOString() } : a,
          ),
        };
      });
      toast(`${name} paid you ${formatEUR(nextRequest.amount)}`, { description: `${nextRequest.category}. It's in your balance.` });
    }, wait);
    return () => clearTimeout(timer);
  }, [nextRequest]);

  const send = useCallback((to: Contact, amount: number, note?: string) => {
    const tx: Activity = {
      id: uid("tx"),
      title: `Transfer to ${to.name.split(" ")[0]}`,
      at: new Date().toISOString(),
      amount: -amount,
      category: note?.trim() || "Transfer",
      peer: { name: to.name, direction: "out" },
    };
    setState((s) => ({ ...s, balance: round(s.balance - amount), activity: [tx, ...s.activity] }));
    return tx;
  }, []);

  const request = useCallback((from: Contact, amount: number, note?: string) => {
    const tx: Activity = {
      id: uid("rq"),
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

  const invest = useCallback(
    (ticker: Ticker, amount: number, by?: string) => {
      if (amount <= 0 || amount > state.balance) return false;
      const at = new Date().toISOString();
      const fund = funds[ticker];
      const tx: Activity = {
        id: uid("inv"),
        title: `Bought ${ticker}`,
        at,
        amount: -amount,
        category: "Investment",
        invest: { ticker },
      };
      setState((s) => {
        if (amount > s.balance) return s;
        const has = s.holdings.some((h) => h.ticker === ticker);
        const holdings = has
          ? s.holdings.map((h) => (h.ticker === ticker ? { ...h, invested: h.invested + amount, value: round(h.value + amount) } : h))
          : [...s.holdings, { ticker, invested: amount, value: amount, month: 0 }];
        return {
          ...s,
          balance: round(s.balance - amount),
          activity: [tx, ...s.activity],
          holdings,
          investLog: [
            { id: tx.id, at, kind: "buy", title: `Bought ${ticker}`, detail: by ? `With ${by}` : fund.kind, amount, ticker },
            ...s.investLog,
          ],
        };
      });
      return true;
    },
    [state.balance],
  );

  const setPlan = useCallback((monthly: number, by?: string) => {
    setState((s) =>
      s.plan === monthly
        ? s
        : {
            ...s,
            plan: monthly,
            investLog: [
              {
                id: uid("plan"),
                at: new Date().toISOString(),
                kind: "plan",
                title: `Monthly plan ${monthly > s.plan ? "raised" : "changed"} to ${formatEUR(monthly).replace(".00", "")}`,
                detail: by ? `With ${by}` : `Was ${formatEUR(s.plan).replace(".00", "")} a month`,
              },
              ...s.investLog,
            ],
          },
    );
  }, []);

  const setSafetyNet = useCallback((amount: number, by?: string) => {
    setState((s) =>
      s.safetyNet === amount
        ? s
        : {
            ...s,
            safetyNet: amount,
            investLog: [
              {
                id: uid("safe"),
                at: new Date().toISOString(),
                kind: "safety",
                title: `Safety net set at ${formatEUR(amount).replace(".00", "")}`,
                detail: by ? `With ${by}` : "Kept as cash",
              },
              ...s.investLog,
            ],
          },
    );
  }, []);

  const stayTheCourse = useCallback((by?: string) => {
    setState((s) => ({
      ...s,
      investLog: [
        {
          id: uid("hold"),
          at: new Date().toISOString(),
          kind: "hold",
          title: "Stayed the course",
          detail: by ? `With ${by}` : "No changes",
        },
        ...s.investLog,
      ],
    }));
  }, []);

  const setBudget = useCallback((key: string, monthly: number) => {
    setState((s) => ({ ...s, budgets: { ...s.budgets, [key]: monthly } }));
  }, []);

  const setBillReminders = useCallback((on: boolean) => setState((s) => ({ ...s, billReminders: on })), []);

  const flagRefund = useCallback((chargeId: string, refund: { title: string; amount: number; brand?: BrandKey }) => {
    setState((s) =>
      s.refunds.includes(chargeId)
        ? s
        : {
            ...s,
            refunds: [...s.refunds, chargeId],
            activity: [
              {
                id: uid("rf"),
                title: refund.title,
                at: new Date().toISOString(),
                amount: refund.amount,
                category: "Refund",
                brand: refund.brand,
                pending: true,
              },
              ...s.activity,
            ],
          },
    );
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  const portfolio = useMemo(() => round(state.holdings.reduce((sum, h) => sum + h.value, 0)), [state.holdings]);

  const value = useMemo(
    () => ({
      ...state,
      portfolio,
      send,
      request,
      cancelSubscription,
      restoreSubscription,
      updateCard,
      invest,
      setPlan,
      setSafetyNet,
      stayTheCourse,
      setBudget,
      setBillReminders,
      flagRefund,
      reset,
    }),
    [
      state,
      portfolio,
      send,
      request,
      cancelSubscription,
      restoreSubscription,
      updateCard,
      invest,
      setPlan,
      setSafetyNet,
      stayTheCourse,
      setBudget,
      setBillReminders,
      flagRefund,
      reset,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
