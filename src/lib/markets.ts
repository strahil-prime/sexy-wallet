/**
 * Market data for the Trade screen and the Crypto page. The assets are real, the prices and
 * moves are illustrative (rounded, around late-2025 levels), not live market data.
 */

export type AssetKind = "Stock" | "ETF" | "Bond ETF" | "Commodity";

export type Asset = {
  ticker: string;
  name: string;
  kind: AssetKind;
  /** one short line on what it is */
  about: string;
  price: number;
  currency: "€" | "$";
  /** today's move, in percent */
  change: number;
  /** simple-icons key or a monogram for the logo */
  logo: LogoSpec;
};

export type Coin = {
  ticker: string;
  name: string;
  about: string;
  price: number;
  change: number;
  logo: LogoSpec;
};

export type LogoSpec =
  | { icon: string; bg: string; fg: string }
  | { text: string; bg: string; fg: string }
  | { custom: "microsoft" | "amazon"; bg: string; fg: string };

export const assets: Asset[] = [
  { ticker: "NVDA", name: "NVIDIA", kind: "Stock", about: "Chips that power most of today's AI.", price: 188.28, currency: "$", change: 3.68, logo: { icon: "siNvidia", bg: "#0b0b0b", fg: "#76b900" } },
  { ticker: "AAPL", name: "Apple", kind: "Stock", about: "iPhone, Mac and a fast-growing services arm.", price: 271.4, currency: "$", change: 0.84, logo: { icon: "siApple", bg: "#f5f7f8", fg: "#000" } },
  { ticker: "MSFT", name: "Microsoft", kind: "Stock", about: "Windows, Office and the Azure cloud.", price: 497.1, currency: "$", change: -0.74, logo: { custom: "microsoft", bg: "#1f6fd1", fg: "#fff" } },
  { ticker: "AMZN", name: "Amazon", kind: "Stock", about: "Online shopping and AWS, the largest cloud.", price: 244.2, currency: "$", change: 1.12, logo: { custom: "amazon", bg: "#131a22", fg: "#ff9900" } },
  { ticker: "GOOGL", name: "Alphabet", kind: "Stock", about: "Google Search, YouTube and Google Cloud.", price: 284.75, currency: "$", change: 0.56, logo: { icon: "siGoogle", bg: "#f5f7f8", fg: "#4285f4" } },
  { ticker: "META", name: "Meta Platforms", kind: "Stock", about: "Facebook, Instagram and WhatsApp.", price: 612.9, currency: "$", change: -1.35, logo: { icon: "siMeta", bg: "#0467df", fg: "#fff" } },
  { ticker: "TSLA", name: "Tesla", kind: "Stock", about: "Electric cars, batteries and solar.", price: 438.5, currency: "$", change: 2.41, logo: { icon: "siTesla", bg: "#cc0000", fg: "#fff" } },
  { ticker: "NFLX", name: "Netflix", kind: "Stock", about: "The world's biggest streaming service.", price: 110.53, currency: "$", change: -0.42, logo: { icon: "siNetflix", bg: "#0b0b0b", fg: "#e50914" } },
  { ticker: "ASML", name: "ASML Holding", kind: "Stock", about: "Makes the machines that make chips. Dutch.", price: 912.4, currency: "€", change: 1.05, logo: { text: "ASML", bg: "#10069f", fg: "#fff" } },
  { ticker: "SAP", name: "SAP", kind: "Stock", about: "Business software, from Walldorf, Germany.", price: 232.15, currency: "€", change: -0.38, logo: { icon: "siSap", bg: "#0faaff", fg: "#fff" } },
  { ticker: "MC", name: "LVMH", kind: "Stock", about: "Louis Vuitton, Dior, Moët and more.", price: 612.8, currency: "€", change: 0.27, logo: { text: "LV", bg: "#1a1a1a", fg: "#d8c39a" } },
  { ticker: "VWCE", name: "Vanguard FTSE All-World UCITS ETF", kind: "ETF", about: "About 3,700 companies across 50 countries.", price: 131.2, currency: "€", change: 0.42, logo: { text: "V", bg: "#96151d", fg: "#fff" } },
  { ticker: "VUAA", name: "Vanguard S&P 500 UCITS ETF (Acc)", kind: "ETF", about: "The 500 largest US companies, dividends reinvested.", price: 128.68, currency: "€", change: 1.53, logo: { text: "V", bg: "#96151d", fg: "#fff" } },
  { ticker: "IWDA", name: "iShares Core MSCI World UCITS ETF", kind: "ETF", about: "About 1,400 large companies in 23 countries.", price: 104.6, currency: "€", change: 0.38, logo: { text: "iS", bg: "#111", fg: "#fff" } },
  { ticker: "EQQQ", name: "Invesco EQQQ Nasdaq-100 UCITS ETF", kind: "ETF", about: "The 100 largest non-financial Nasdaq companies.", price: 512.3, currency: "€", change: 1.21, logo: { text: "IV", bg: "#000ab4", fg: "#fff" } },
  { ticker: "EIMI", name: "iShares Core MSCI EM IMI UCITS ETF", kind: "ETF", about: "Thousands of companies in emerging markets.", price: 38.9, currency: "€", change: 0.71, logo: { text: "iS", bg: "#111", fg: "#fff" } },
  { ticker: "AGGH", name: "iShares Core Global Aggregate Bond UCITS ETF", kind: "Bond ETF", about: "Government and company bonds worldwide.", price: 5.12, currency: "€", change: 0.04, logo: { text: "iS", bg: "#111", fg: "#fff" } },
  { ticker: "IBGL", name: "iShares Euro Government Bond 15-30yr UCITS ETF", kind: "Bond ETF", about: "Long-dated eurozone government bonds.", price: 168.4, currency: "€", change: -0.22, logo: { text: "iS", bg: "#111", fg: "#fff" } },
  { ticker: "4GLD", name: "Xetra-Gold", kind: "Commodity", about: "Each unit is backed by one gram of real gold.", price: 115.3, currency: "€", change: -0.62, logo: { text: "Au", bg: "#2a2416", fg: "#f5c76a" } },
];

export const recentlyViewed = ["MSFT", "NVDA", "VWCE"];
export const mostTraded = ["VUAA", "NVDA", "4GLD", "TSLA", "VWCE"];

export const coins: Coin[] = [
  { ticker: "BTC", name: "Bitcoin", about: "The first cryptocurrency. Only 21 million will ever exist.", price: 88420, change: 1.84, logo: { icon: "siBitcoin", bg: "#f7931a", fg: "#fff" } },
  { ticker: "ETH", name: "Ethereum", about: "A blockchain that runs apps and smart contracts.", price: 3121.5, change: 2.65, logo: { icon: "siEthereum", bg: "#627eea", fg: "#fff" } },
  { ticker: "SOL", name: "Solana", about: "A fast, low-fee blockchain for apps and payments.", price: 142.3, change: 4.12, logo: { icon: "siSolana", bg: "#14151a", fg: "#14f195" } },
  { ticker: "XRP", name: "XRP", about: "Built for quick, cheap money transfers across borders.", price: 2.18, change: -0.86, logo: { icon: "siXrp", bg: "#23292f", fg: "#fff" } },
  { ticker: "BNB", name: "BNB", about: "The coin of the BNB Chain and the Binance exchange.", price: 812.4, change: 0.44, logo: { icon: "siBnbchain", bg: "#f0b90b", fg: "#fff" } },
  { ticker: "ADA", name: "Cardano", about: "A research-driven blockchain focused on security.", price: 0.62, change: -1.21, logo: { icon: "siCardano", bg: "#0133ad", fg: "#fff" } },
  { ticker: "DOGE", name: "Dogecoin", about: "Started as a joke, now one of the largest coins.", price: 0.165, change: 3.05, logo: { icon: "siDogecoin", bg: "#c2a633", fg: "#fff" } },
  { ticker: "LINK", name: "Chainlink", about: "Brings real-world data onto blockchains.", price: 14.8, change: 1.67, logo: { icon: "siChainlink", bg: "#375bd2", fg: "#fff" } },
  { ticker: "DOT", name: "Polkadot", about: "Connects many blockchains so they can work together.", price: 2.95, change: -0.54, logo: { icon: "siPolkadot", bg: "#e6007a", fg: "#fff" } },
  { ticker: "LTC", name: "Litecoin", about: "A lighter, faster cousin of Bitcoin.", price: 86.4, change: 0.31, logo: { icon: "siLitecoin", bg: "#345d9d", fg: "#fff" } },
  { ticker: "AVAX", name: "Avalanche", about: "A blockchain built for speed and custom networks.", price: 15.2, change: 5.38, logo: { text: "A", bg: "#e84142", fg: "#fff" } },
  { ticker: "SUI", name: "Sui", about: "A newer, very fast blockchain for apps and games.", price: 1.92, change: 6.21, logo: { icon: "siSui", bg: "#4da2ff", fg: "#fff" } },
  { ticker: "XLM", name: "Stellar", about: "Low-cost payments and transfers between currencies.", price: 0.24, change: -2.14, logo: { icon: "siStellar", bg: "#111", fg: "#fff" } },
  { ticker: "TON", name: "Toncoin", about: "The blockchain linked to the Telegram app.", price: 1.68, change: -3.02, logo: { icon: "siTon", bg: "#0098ea", fg: "#fff" } },
  { ticker: "HBAR", name: "Hedera", about: "A fast network used by large companies.", price: 0.15, change: 2.86, logo: { icon: "siHedera", bg: "#222", fg: "#fff" } },
  { ticker: "XMR", name: "Monero", about: "A privacy-focused cryptocurrency.", price: 318.6, change: -1.48, logo: { icon: "siMonero", bg: "#ff6600", fg: "#fff" } },
  { ticker: "NEAR", name: "NEAR Protocol", about: "A blockchain that aims to be easy for developers.", price: 2.05, change: -2.67, logo: { icon: "siNear", bg: "#f5f7f8", fg: "#000" } },
  { ticker: "ALGO", name: "Algorand", about: "A green, low-fee blockchain for payments.", price: 0.14, change: 1.12, logo: { icon: "siAlgorand", bg: "#f5f7f8", fg: "#000" } },
];

export const cryptoWatchlist = ["BTC", "ETH", "SOL"];

/** What Eddie holds to start with. */
export const initialCrypto: Record<string, number> = { BTC: 0.0124, ETH: 0.85, SOL: 12 };

/** A small deterministic random walk that ends on `end` and moved `changePct` over its length. */
export function walk(seed: string, n: number, end: number, changePct: number, vol = 0.012) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const start = end / (1 + changePct / 100);
  const raw: number[] = [0];
  for (let i = 1; i < n; i++) raw.push(raw[i - 1] + (rand() - 0.5) * 2);
  // Pull the walk so it starts at 0 and ends at 0, then lay it over the straight line start→end.
  const drift = raw[n - 1];
  return raw.map((r, i) => {
    const t = i / (n - 1);
    const noise = (r - drift * t) * vol * end;
    return start + (end - start) * t + noise * Math.sin(Math.PI * t) ** 0.5;
  });
}

export function money(v: number, currency: "€" | "$" = "€") {
  const digits = v >= 1000 ? 0 : v >= 1 ? 2 : v >= 0.1 ? 3 : 4;
  const s = v.toLocaleString("en-IE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${currency}${s}`;
}

/**
 * Context for the crypto Top picks. Facts are rounded; the worst falls are peak-to-low in
 * US dollars during the named crash. Swings use a simple 1–7 scale (crypto starts high).
 */
export type CoinFacts = {
  category: string;
  why: string;
  /** 1–7, how wild the price moves */
  swings: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** a typical day's move, in percent either way */
  typicalDay: number;
  launched: number;
  supply: string;
  supplySub: string;
  worstFall: number;
  worstWhen: string;
  usedFor: string;
  securedBy: string;
  goodFor: string;
  keepInMind: string;
};

export const cryptoPicks = ["BTC", "ETH", "SOL", "XRP"];

export const coinFacts: Record<string, CoinFacts> = {
  BTC: {
    category: "Digital gold",
    why: "The first and largest crypto. A fixed supply makes it the one people hold as a long-term store of value.",
    swings: 5,
    typicalDay: 2.5,
    launched: 2009,
    supply: "21M",
    supplySub: "max, ever",
    worstFall: -77,
    worstWhen: "2021–22",
    usedFor: "Saving and sending value without a bank in the middle.",
    securedBy: "Proof of work: miners around the world compete to add each block.",
    goodFor: "A small, long-term slice next to your other savings.",
    keepInMind: "Falls of 50% or more have happened several times.",
  },
  ETH: {
    category: "Smart contracts",
    why: "The network most crypto apps run on, from stablecoins to digital art. Owning ETH is a bet on that ecosystem.",
    swings: 6,
    typicalDay: 3.2,
    launched: 2015,
    supply: "No cap",
    supplySub: "new coins kept low",
    worstFall: -82,
    worstWhen: "2021–22",
    usedFor: "Paying for apps, payments and tokens that run on Ethereum.",
    securedBy: "Proof of stake: holders lock up ETH to validate, since 2022.",
    goodFor: "Adding the 'crypto apps' side next to Bitcoin.",
    keepInMind: "Usually swings harder than Bitcoin in both directions.",
  },
  SOL: {
    category: "Fast apps & payments",
    why: "A newer network built for speed and tiny fees, popular for payments, trading apps and games.",
    swings: 7,
    typicalDay: 4.5,
    launched: 2020,
    supply: "No cap",
    supplySub: "~4% more a year",
    worstFall: -96,
    worstWhen: "2021–22",
    usedFor: "Quick, cheap transactions for apps that need lots of them.",
    securedBy: "Proof of stake, with a built-in clock that keeps it fast.",
    goodFor: "A higher-risk, higher-growth extra, kept small.",
    keepInMind: "Younger network that has had outages, and very big swings.",
  },
  XRP: {
    category: "Cross-border payments",
    why: "Designed to move money between countries in seconds, for a fraction of a cent.",
    swings: 6,
    typicalDay: 3.5,
    launched: 2012,
    supply: "100B",
    supplySub: "made at launch",
    worstFall: -97,
    worstWhen: "2018–20",
    usedFor: "Settling payments between banks and payment firms.",
    securedBy: "A group of trusted validators agree each ledger. No mining.",
    goodFor: "A bet on crypto rails for international payments.",
    keepInMind: "Much of the supply is held by one company, Ripple.",
  },
};
