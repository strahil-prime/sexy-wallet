/**
 * Investing data for the demo: the funds Eddie can buy, the portfolio he starts with, its history
 * and the long-term projection. Numbers line up with Michael's answers: a €13,653 portfolio that is
 * up 2.4% (about €320) this month, tech leading, bonds flat, and €275 a month going in.
 *
 * Prices and returns are illustrative, not market data.
 */

export type Ticker = "VWCE" | "IWDA" | "EQQQ" | "AGGH";

export type Fund = {
  ticker: Ticker;
  name: string;
  /** what it holds, in two or three words */
  kind: string;
  about: string;
  /** yearly fee, in percent */
  ter: number;
  /** price per share, illustrative */
  price: number;
  color: string;
};

export const funds: Record<Ticker, Fund> = {
  VWCE: {
    ticker: "VWCE",
    price: 131.2,
    name: "Vanguard FTSE All-World",
    kind: "Global stocks",
    about: "About 3,700 companies across 50 countries, in one fund.",
    ter: 0.22,
    color: "#8b6dff",
  },
  IWDA: {
    ticker: "IWDA",
    price: 104.6,
    name: "iShares Core MSCI World",
    kind: "Developed markets",
    about: "About 1,400 large companies in 23 developed countries.",
    ter: 0.2,
    color: "#1f7bff",
  },
  EQQQ: {
    ticker: "EQQQ",
    price: 512.3,
    name: "Invesco Nasdaq-100",
    kind: "Tech",
    about: "The 100 largest non-financial companies on the Nasdaq.",
    ter: 0.3,
    color: "#22d3ee",
  },
  AGGH: {
    ticker: "AGGH",
    price: 5.12,
    name: "iShares Global Aggregate Bond",
    kind: "Bonds",
    about: "Government and company bonds worldwide. Steadies the ride.",
    ter: 0.1,
    color: "#f5c76a",
  },
};

/** Buyable from the Invest screen, in the order shown. */
export const buyable: Ticker[] = ["VWCE", "IWDA", "EQQQ", "AGGH"];

export type Holding = {
  ticker: Ticker;
  /** what went in */
  invested: number;
  /** what it is worth now */
  value: number;
  /** change over the last 30 days, in euros (new money excluded) */
  month: number;
};

/** Tech +€236, other stocks +€78, bonds +€6: €320 this month on €13,653. */
export const initialHoldings: Holding[] = [
  { ticker: "EQQQ", invested: 5200, value: 6120, month: 236 },
  { ticker: "IWDA", invested: 4400, value: 4980, month: 78 },
  { ticker: "AGGH", invested: 2500, value: 2553, month: 6 },
];

export const MONTHLY_PLAN = 275;
export const AGE = 35;
export const RETIRE_AT = 65;
export const RATE = 0.065;

/** Months of saving from today to `retire`, with `start` invested today and `monthly` added each month. */
export function project(start: number, monthly: number, years = RETIRE_AT - AGE) {
  const r = RATE / 12;
  const out: number[] = [start];
  let v = start;
  for (let m = 1; m <= years * 12; m++) {
    v = v * (1 + r) + monthly;
    if (m % 12 === 0) out.push(v);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// History

/** Small deterministic random numbers, so the chart looks the same on every visit. */
function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Point = { t: number; v: number };

const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 3 * 365;

/**
 * Daily portfolio value for three years, ending at `end` today. It starts with a first deposit sized
 * so that, with €275 a month since, everything put in matches the holdings (€12,100),
 * adds €275 on the 1st of each month and drifts with the market, tuned so the line lands on the
 * value a month ago; the last 30 days then climb 2.4% with gentle dips (as Michael says).
 */
export function portfolioHistory(end: number, now = Date.now()): Point[] {
  const t0 = now;
  const monthStart = end / 1.024;
  const recent: number[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const wobble = Math.sin(i * 1.3) * 0.0035 + Math.sin(i * 0.45) * 0.004;
    recent.push(monthStart * (1 + 0.024 * t + wobble * Math.sin(Math.PI * t)));
  }

  // The same market noise every time; only the average daily growth is solved for.
  const r = rand(7);
  const days = HISTORY_DAYS - 30;
  const noise = Array.from({ length: days }, (_, d) => (r() - 0.5) * 0.014 + Math.sin(d / 37) * 0.0011);
  const firsts = Array.from({ length: days }, (_, d) => new Date(t0 - (HISTORY_DAYS - d) * DAY).getDate() === 1);
  const putIn = initialHoldings.reduce((sum, h) => sum + h.invested, 0);
  const first = putIn - firsts.filter(Boolean).length * MONTHLY_PLAN;
  const walk = (mu: number) => {
    const out: number[] = [];
    let v = first;
    for (let d = 0; d < days; d++) {
      out.push(v);
      v = v * (1 + mu + noise[d]) + (firsts[d] ? MONTHLY_PLAN : 0);
    }
    return { out, last: v };
  };
  let lo = -0.002;
  let hi = 0.004;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (walk(mid).last < monthStart) lo = mid;
    else hi = mid;
  }
  const older = walk((lo + hi) / 2).out;

  const values = [...older, ...recent];
  return values.map((value, i) => ({ t: t0 - (values.length - 1 - i) * DAY, v: Math.round(value * 100) / 100 }));
}

export const ranges = [
  { id: "1M", days: 30 },
  { id: "6M", days: 182 },
  { id: "1Y", days: 365 },
  { id: "All", days: HISTORY_DAYS },
] as const;

export type RangeId = (typeof ranges)[number]["id"];

/** Every nth point so a long range stays light, always keeping the last one. */
export function thin(points: Point[], max = 140) {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out: Point[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}
