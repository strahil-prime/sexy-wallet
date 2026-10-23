export type BrandKey =
  | "apple"
  | "starbucks"
  | "netflix"
  | "spotify"
  | "uber"
  | "airbnb"
  | "zara"
  | "ikea"
  | "lidl";

export type Activity = {
  id: string;
  title: string;
  /** ISO timestamp */
  at: string;
  amount: number;
  category: string;
  brand?: BrandKey;
  /** peer transfers show an arrow glyph instead of a brand mark */
  peer?: { name: string; direction: "in" | "out" };
  card?: boolean;
};

export type Contact = {
  id: string;
  name: string;
  handle: string;
  iban: string;
  /** two-stop gradient used for the avatar */
  hue: [string, string];
  favourite?: boolean;
};

const today = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const daysAgo = (n: number, h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const initialActivity: Activity[] = [
  { id: "a1", title: "Apple", at: today(8, 30), amount: -49, category: "Subscriptions", brand: "apple", card: true },
  { id: "a2", title: "Starbucks", at: today(7, 24), amount: -6.7, category: "Coffee", brand: "starbucks", card: true },
  { id: "a3", title: "Transfer from Alex", at: daysAgo(1, 16, 18), amount: 250, category: "Transfer", peer: { name: "Alex", direction: "in" } },
  { id: "a4", title: "Netflix", at: daysAgo(4, 9, 0), amount: -15.99, category: "Entertainment", brand: "netflix", card: true },
  { id: "a5", title: "Spotify", at: daysAgo(5, 10, 12), amount: -10.99, category: "Entertainment", brand: "spotify", card: true },
  { id: "a6", title: "Uber", at: daysAgo(6, 22, 41), amount: -18.4, category: "Transport", brand: "uber", card: true },
  { id: "a7", title: "Zara", at: daysAgo(8, 14, 3), amount: -89.95, category: "Shopping", brand: "zara", card: true },
  { id: "a8", title: "Lidl", at: daysAgo(9, 18, 20), amount: -42.18, category: "Groceries", brand: "lidl", card: true },
  { id: "a9", title: "Airbnb", at: daysAgo(12, 11, 47), amount: -312, category: "Travel", brand: "airbnb", card: true },
];

export const contacts: Contact[] = [
  { id: "janet", name: "Janet Moreau", handle: "@janet", iban: "FR76 3000 6000 0112 3456 7890 189", hue: ["#ff8a5b", "#ff4f8b"], favourite: true },
  { id: "alex", name: "Alex Novak", handle: "@alexn", iban: "DE89 3704 0044 0532 0130 00", hue: ["#2ad1e6", "#1f7bff"], favourite: true },
  { id: "maria", name: "Maria Rossi", handle: "@mariar", iban: "IT60 X054 2811 1010 0000 0123 456", hue: ["#7c5cff", "#c56bff"], favourite: true },
  { id: "luka", name: "Luka Petrov", handle: "@luka", iban: "BG80 BNBG 9661 1020 3456 78", hue: ["#3ee39a", "#13a8a0"], favourite: true },
  { id: "sofia", name: "Sofia Lindqvist", handle: "@sofial", iban: "SE45 5000 0000 0583 9825 7466", hue: ["#ffd25e", "#ff8a5b"] },
  { id: "noah", name: "Noah van Dijk", handle: "@noahvd", iban: "NL91 ABNA 0417 1643 00", hue: ["#5ef0ff", "#7c5cff"] },
  { id: "elena", name: "Elena García", handle: "@elenag", iban: "ES91 2100 0418 4502 0005 1332", hue: ["#ff6b7a", "#7c5cff"] },
];

export type WalletCard = {
  id: string;
  name: string;
  kind: "Virtual" | "Metal";
  last4: string;
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
  /** css background for the face */
  finish: "aurora" | "obsidian";
};

export const walletCards: WalletCard[] = [
  { id: "aurora", name: "Aurora", kind: "Virtual", last4: "8920", number: "4716 2093 5581 8920", expiry: "09/29", cvv: "417", holder: "Strahil", finish: "aurora" },
  { id: "obsidian", name: "Obsidian", kind: "Metal", last4: "3305", number: "4532 7781 0466 3305", expiry: "04/30", cvv: "862", holder: "Strahil", finish: "obsidian" },
];

export const teller = {
  name: "Bella",
  user: "Strahil",
};
