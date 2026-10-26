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
| `idle`                     | yes   | Waiting. Live: `public/teller/clips/idle.{mp4,webm}`, always playing under the other clips |
| `thinking`                 | yes   | Right after a question button is tapped |
| `answer:money-went`        | no    | "Where did my money go this month?" |
| `answer:subscriptions`     | no    | "Any subscriptions I forgot about?" |
| `answer:split-dinner`      | no    | "Split last night's dinner with Janet" |

All clips should start and end on the same home pose so crossfades are seamless.

The idle loop was made seamless by cross-fading its last 0.5 s into its first 0.5 s (the
Kling export's last frame didn't quite match its first). `idle-poster.jpg` is its first frame
and doubles as the still shown before the video loads.
