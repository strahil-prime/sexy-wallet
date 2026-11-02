import { CalendarClock, Lightbulb, PieChart, Repeat, ShieldAlert, Split, type LucideIcon } from "lucide-react";
import { user } from "./data";

/**
 * Tellers ("personas"). Everything that differs between them lives here: name, pictures, videos
 * and the three quick questions. The UI reads the active persona and never names one directly.
 *
 * Adding a persona:
 *   1. Put its media in /public/personas/<id>/ (see scripts/encode-clip.sh):
 *        idle.mp4 / idle.webm / idle-poster.jpg   seamless loop, poster = its first frame
 *        intro.mp4 / intro.webm                   greeting, plays once when home opens
 *        ask-1..3.mp4 / .webm                     one answer clip per quick question
 *        avatar.jpg                               square face crop, ~200px
 *   2. Copy the `bella` entry below, change the id, text and `voice` timings (the script
 *      prints them), and add it to `personas`. Remove one placeholder from `upcomingPersonas`.
 *   3. Each question's `answer` picks the card shown under the reply. Reuse an existing one
 *      or add a new card to ANSWER_CARDS in components/teller/conversation.tsx.
 * Videos are square (1080×1080), with the face in the same place as Bella's, so the desktop
 * frame and the phone crop fit every persona.
 */

export type Clip = {
  /** MP4 (H.264), the format every browser plays */
  src?: string;
  /** optional smaller WebM (VP9), tried first on desktop */
  webm?: string;
  loop: boolean;
  /** fallback length when there is no video */
  durationMs: number;
  /** seconds where the persona is speaking, from ffmpeg silencedetect (-35dB, 0.25s); drives the equaliser */
  voice?: [number, number][];
};

/** The answer cards that exist. A question shows one of these under the spoken reply. */
export type AnswerKind = "money-went" | "subscriptions" | "split-dinner" | "bills" | "double-charge" | "coffee-tip";

export type Question = {
  /** stable id, unique within the persona */
  id: string;
  /** chip text on wider screens */
  label: string;
  /** chip text on phones */
  short: string;
  icon: LucideIcon;
  answer: AnswerKind;
  /** the card's spoken line, word for word what the clip says (else the card writes its own) */
  reply?: string;
  clip: Clip;
};

export type Persona = {
  id: string;
  name: string;
  /** shown under the name in the teller picker */
  role: string;
  /** square face crop for the picker */
  avatar: string;
  /** first frame of the idle loop; the still behind the video */
  poster: string;
  /** colour at the top edge of the video, used for the phone top bar so the two meet seamlessly */
  edgeColor: string;
  greeting: { headline: string; line: string };
  idle: Clip;
  intro: Clip;
  questions: readonly [Question, Question, Question];
};

const clip = (dir: string, name: string, durationMs: number, voice?: [number, number][], loop = false): Clip => ({
  src: `/personas/${dir}/${name}.mp4`,
  webm: `/personas/${dir}/${name}.webm`,
  loop,
  durationMs,
  voice,
});

// Speaking stretches printed by scripts/encode-clip.sh.
const BELLA_VOICE_1: [number, number][] = [[0, 5.04], [5.68, 8.25], [8.77, 11.3], [11.56, 12.27]];
const BELLA_VOICE_2: [number, number][] = [[0, 4.87], [5.38, 6.4], [6.96, 10.47], [10.75, 12.27]];
const BELLA_VOICE_3: [number, number][] = [[0, 5.05], [5.5, 6.37], [6.76, 9.87]];

const bella: Persona = {
  id: "bella",
  name: "Bella",
  role: "Lead teller",
  avatar: "/personas/bella/avatar.jpg",
  poster: "/personas/bella/idle-poster.jpg",
  edgeColor: "#051118",
  greeting: { headline: `Hello ${user.name}.`, line: "Good to see you. What can I do for you today?" },
  idle: clip("bella", "idle", 0, undefined, true),
  intro: clip("bella", "intro", 3200, [[0, 0.94], [1.3, 2.38]]),
  questions: [
    {
      id: "money-went",
      label: "Where did my money go this month?",
      short: "Where did my money go?",
      icon: PieChart,
      answer: "money-went",
      reply: "You've spent €1,462.82 in October. Most of it went on groceries (28%), then travel, which was mostly your Airbnb.",
      clip: clip("bella", "ask-1", 12300, BELLA_VOICE_1),
    },
    {
      id: "subscriptions",
      label: "Any subscriptions I forgot about?",
      short: "Forgotten subscriptions?",
      icon: Repeat,
      answer: "subscriptions",
      clip: clip("bella", "ask-2", 12300, BELLA_VOICE_2),
    },
    {
      id: "split-dinner",
      label: "Split last night’s dinner with Janet",
      short: "Split dinner with Janet",
      icon: Split,
      answer: "split-dinner",
      clip: clip("bella", "ask-3", 9900, BELLA_VOICE_3),
    },
  ],
};

const sebastian: Persona = {
  id: "sebastian",
  name: "Sebastian",
  role: "Money coach",
  avatar: "/personas/sebastian/avatar.jpg",
  poster: "/personas/sebastian/idle-poster.jpg",
  edgeColor: "#0c1921",
  greeting: { headline: `Hey ${user.name}.`, line: "What can I help you with today?" },
  idle: clip("sebastian", "idle", 0, undefined, true),
  intro: clip("sebastian", "intro", 2133, [[0, 1.04], [1.39, 2.13]]),
  questions: [
    {
      id: "bills",
      label: "Bills coming up",
      short: "Bills coming up",
      icon: CalendarClock,
      answer: "bills",
      reply: "3 bills this week: rent, 950 euros on Friday, phone 25, and Netflix 13.99. You’ll still have 410 left. You’re covered.",
      clip: clip("sebastian", "ask-1", 12533, [[0, 1.27], [1.74, 2.18], [2.44, 4.53], [4.95, 6.27], [6.66, 8.65], [9.18, 10.88], [11.28, 12.19], [12.45, 12.53]]),
    },
    {
      id: "unusual",
      label: "Unusual activity",
      short: "Unusual activity",
      icon: ShieldAlert,
      answer: "double-charge",
      reply: "Spotify charged you twice yesterday, 10.99 each. Probably a mistake. You should flag it for a return.",
      clip: clip("sebastian", "ask-2", 7733, [[0, 2.18], [2.57, 3.9], [4.35, 5.37], [5.81, 7.73]]),
    },
    {
      id: "tip",
      label: "Money tip of the day",
      short: "Money tip of the day",
      icon: Lightbulb,
      answer: "coffee-tip",
      reply: "Today’s tip: your coffees cost sixty-four euros last month. Brew half at home.",
      clip: clip("sebastian", "ask-3", 7200, [[0, 0.77], [1.36, 4.24], [4.76, 7.2]]),
    },
  ],
};

/** Live personas, in picker order. The first is the default. */
export const personas: readonly Persona[] = [bella, sebastian];

/** Locked rows in the picker until their videos exist. */
export const upcomingPersonas = [{ id: "teller-3", name: "Teller three", role: "Arriving soon" }] as const;

export function personaById(id: string | null | undefined): Persona {
  return personas.find((p) => p.id === id) ?? personas[0];
}
