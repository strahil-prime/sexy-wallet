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

The stage is driven by a small state machine in
`src/components/teller/machine.ts` (`intro → idle ⇄ thinking → talking`).
Clips live in `public/teller/clips/` and are wired up by setting `src` (and an
optional `webm`) on each entry in `clips`. A clip without `src` is timed over the idle loop.

| Clip id                    | Loops | Plays when |
| -------------------------- | ----- | ---------- |
| `intro`                    | no    | Page load, once, with sound. Live: `intro.{mp4,webm}` |
| `idle`                     | yes   | Waiting. Live: `public/teller/clips/idle.{mp4,webm}`, always playing under the other clips |
| `thinking`                 | yes   | Right after a question button is tapped |
| `answer:money-went`        | no    | "Where did my money go this month?". Live: `answer.{mp4,webm}` (placeholder for all three) |
| `answer:subscriptions`     | no    | "Any subscriptions I forgot about?" |
| `answer:split-dinner`      | no    | "Split last night's dinner with Janet" |

One-off clips play on a single overlay video above the idle loop, with sound when the
browser allows it. Browsers usually block sound before the first tap, so the logo preloader
(`src/components/shell/preloader.tsx`) asks the browser first: if sound may autoplay it goes
straight to the page, otherwise it ends on "Tap to enter", and that tap unlocks sound (on iOS it
starts the greeting inside the gesture). If sound is still refused, the clip plays muted and the
sound toggle (top left) shows "Tap for sound".

All clips should start and end on the same home pose so crossfades are seamless.

The idle loop was made seamless by cross-fading its last 0.5 s into its first 0.5 s (the
Kling export's last frame didn't quite match its first). `idle-poster.jpg` is its first frame
and doubles as the still shown before the video loads.
