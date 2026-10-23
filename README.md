# Sexy Wallet

A cinematic wallet prototype with Bella, a personal teller. Fictional data, no real money.

Next.js 15 · TypeScript · Tailwind v4 · Radix (shadcn-style primitives) · Motion · GSAP · NumberFlow

```bash
pnpm install
pnpm dev
```

## Routes

| Route   | What it is |
| ------- | ---------- |
| `/`     | Dashboard with Bella, balance, quick actions, card and recent activity |
| `/card` | Card journey: switch cards, verified reveal of details, freeze, controls, limits |
| `/send` | Send money journey: recipient, amount, review, hold to send, receipt. Accepts `?to=janet&amount=10` |

## Bella's video clips

Bella is a still image today. The stage is driven by a small state machine in
`src/components/teller/machine.ts` (`intro → idle ⇄ thinking → talking`).
To switch to video, put clips in `public/teller/clips/` and set `src` on each
entry in `clips`:

| Clip id                    | Loops | Plays when |
| -------------------------- | ----- | ---------- |
| `intro`                    | no    | Page load, "Hello Strahil" |
| `idle`                     | yes   | Waiting |
| `thinking`                 | yes   | Right after a question button is tapped |
| `answer:spent-this-month`  | no    | "How much did I spend this month?" |
| `answer:savings-rate`      | no    | "What's my savings rate?" |
| `answer:send-janet`        | no    | "Send €10 to Janet" |

All clips should start and end on the same home pose so crossfades are seamless.
