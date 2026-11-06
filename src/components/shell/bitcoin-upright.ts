import { createLucideIcon } from "lucide-react";

/** An upright ₿ in Lucide's style (Lucide's own Bitcoin icon is tilted). */
export const BitcoinUpright = createLucideIcon("bitcoin-upright", [
  ["path", { d: "M7 5.5h6.5a3.25 3.25 0 0 1 0 6.5H7", key: "top" }],
  ["path", { d: "M7 12h7.5a3.25 3.25 0 0 1 0 6.5H7", key: "bottom" }],
  ["path", { d: "M8.5 5.5v13", key: "spine" }],
  ["path", { d: "M10 3v2.5M13.5 3v2.5M10 18.5V21M13.5 18.5V21", key: "ticks" }],
]);
