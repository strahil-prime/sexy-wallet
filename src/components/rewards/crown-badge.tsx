"use client";

import { useId } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The Gold tier crown: an openwork gold frame with red and amber enamel and a diamond on top,
 * built as real 3D (front, back and a stack of rim slices) so it can spin like the coins.
 * Everything is drawn in one 200×200 SVG space.
 */

type Pt = [number, number];

const C = 100; // centre line
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [200 - x, y]);
const poly = (pts: Pt[]) => `M${pts.map((p) => p.join(" ")).join(" L")} Z`;
const line = (a: Pt, b: Pt) => `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;

/** A tapered lance from a to b: pointed top, widest a fifth of the way down, slim foot. */
function lance(a: Pt, b: Pt, w: number): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const at = (t: number, off: number): Pt => [
    +(a[0] + dx * t + nx * off).toFixed(2),
    +(a[1] + dy * t + ny * off).toFixed(2),
  ];
  return [at(0, 0), at(0.16, w / 2), at(0.9, w * 0.32), at(1, 0), at(0.9, -w * 0.32), at(0.16, -w / 2)];
}

/* ── Geometry ─────────────────────────────────────────── */

const DIAMOND: Pt[] = [
  [C, 6],
  [C + 15, 21],
  [C, 36],
  [C - 15, 21],
];
const DIAMOND_IN: Pt[] = [
  [C, 12],
  [C + 9, 21],
  [C, 30],
  [C - 9, 21],
];

// A tall elliptical dome; lances and lattice all radiate from its foot, like a rose window.
const RX = 72;
const RY = 100;
const FOOT = 140;
const at = (f: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [+(C + f * RX * Math.cos(a)).toFixed(2), +(FOOT - f * RY * Math.sin(a)).toFixed(2)];
};
const arc = (f: number) => `M${C - f * RX} ${FOOT} A${f * RX} ${f * RY} 0 0 1 ${C + f * RX} ${FOOT}`;
const ARCH_OUT = arc(1);
const ARCH_MID = arc(0.7);
const IN = 0.42;
const MID = 0.7;
const RAYS = [137, 106, 74, 43];
const rays = RAYS.map((d) => line(at(IN, d), at(1, d)));

// Each sector between a ray and a lance gets a diagonal, splitting it into faceted glass
const tri = (a: Pt, b: Pt, c: Pt): Pt[] => [a, b, c];
const OUTER_SECTORS: [number, number][] = [
  [152, 172],
  [106, 122],
  [58, 74],
  [8, 28],
];
const INNER_SECTORS: [number, number][] = [
  [122, 137],
  [43, 58],
];
const diagonals = [
  ...OUTER_SECTORS.map(([d1, d2]) => line(at(MID, d1), at(1, d2))),
  ...INNER_SECTORS.map(([d1, d2]) => line(at(IN, d2), at(MID, d1))),
];
// Amber glass in the faceted cells, like light through stained glass
const AMBER_CELLS: Pt[][] = [
  ...OUTER_SECTORS.map(([d1, d2]) => tri(at(MID + 0.05, d1 + 2.5), at(0.955, d2 - 2), at(0.955, d1 + 2.5))),
  ...INNER_SECTORS.map(([d1, d2]) => tri(at(IN + 0.05, d2 - 3), at(MID - 0.04, d1 + 2.5), at(IN + 0.05, d1 + 3))),
];

const CENTRE_LANCE: Pt[] = [
  [C, 38],
  [C + 9.5, 55],
  [C + 5, 112],
  [C, 122],
  [C - 5, 112],
  [C - 9.5, 55],
];
const INNER_L = lance(at(1.06, 122), at(0.4, 122), 14);
const OUTER_L = lance(at(1.12, 152), at(0.42, 152), 12);
const LANCES = [CENTRE_LANCE, INNER_L, mirror(INNER_L), OUTER_L, mirror(OUTER_L)];
const KNOTS: Pt[] = [
  [62, 150],
  [138, 150],
];

// Side wings: a fan of lattice outside the arch
const WING = "M30 92 Q6 100 5 124 Q5 142 24 150";
const wingFan = [line([40, 150], [10, 106]), line([40, 150], [6, 126]), line([40, 150], [14, 144])];
const mirrorPath = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(200 - +x).toFixed(2)} ${y}`);

// The band: amber crest, red stripe, and the open red ring at the foot
const BAND_TOP = "M24 144 Q100 104 176 144";
const BAND_MID = "M30 158 Q100 128 170 158";
const BAND_LOW = "M33 168 Q100 140 167 168";
const AMBER_BAND = "M24 144 Q100 104 176 144 L170 158 Q100 128 30 158 Z";
const RED_BAND = "M30 158 Q100 128 170 158 L167 168 Q100 140 33 168 Z";
const FOOT_OUT = "M33 168 Q28 186 54 190 Q100 197 146 190 Q172 186 167 168 Q100 140 33 168 Z";
const FOOT_HOLE = "M50 176 Q100 160 150 176 Q148 184 100 186 Q52 184 50 176 Z";
const KEEL = [line([C, 122], [C, 134]), poly([[C, 130], [C + 5, 135], [C, 140], [C - 5, 135]])];

const FRAME_FINE = [ARCH_MID, ...rays, ...diagonals, ...wingFan, ...wingFan.map(mirrorPath)];
const FRAME_BOLD = [ARCH_OUT, WING, mirrorPath(WING), BAND_TOP, BAND_MID, BAND_LOW, FOOT_OUT, FOOT_HOLE, ...KEEL];
const OUTLINES = [poly(DIAMOND), poly(DIAMOND_IN), ...LANCES.map(poly), ...AMBER_CELLS.map(poly)];

/* ── Drawing ──────────────────────────────────────────── */

/** A raised gold bar: drop shadow, dark base, polished body and a thin specular line. */
function Bar({ d, w, ids }: { d: string; w: number; ids: Ids }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#2a1704" strokeOpacity={0.55} strokeWidth={w + 2.4} transform="translate(0.6 1.6)" />
      <path d={d} stroke="#6b430d" strokeWidth={w + 1.4} />
      <path d={d} stroke={`url(#${ids.gold})`} strokeWidth={w} />
      <path d={d} stroke="#fffbe6" strokeOpacity={0.85} strokeWidth={w * 0.26} transform="translate(-0.35 -0.55)" />
    </g>
  );
}

type Ids = { gold: string; red: string; amber: string; gloss: string; frame: string; glare: string; back: string };

function Enamel({ ids }: { ids: Ids }) {
  return (
    <g>
      {AMBER_CELLS.map((c, i) => (
        <path key={i} d={poly(c)} fill={`url(#${ids.amber})`} />
      ))}
      <path d={AMBER_BAND} fill={`url(#${ids.amber})`} />
      <path d={RED_BAND} fill={`url(#${ids.red})`} />
      <path d={`${FOOT_OUT} ${FOOT_HOLE}`} fill={`url(#${ids.red})`} fillRule="evenodd" />
      {LANCES.map((l, i) => (
        <path key={i} d={poly(l)} fill={`url(#${ids.red})`} />
      ))}
      <path d={poly(DIAMOND_IN)} fill={`url(#${ids.red})`} />
      {KNOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.6} fill={`url(#${ids.red})`} />
      ))}
      {/* Wet-glass gloss over every enamel field */}
      <g fill={`url(#${ids.gloss})`} style={{ mixBlendMode: "screen" }}>
        {LANCES.map((l, i) => (
          <path key={i} d={poly(l)} />
        ))}
        {AMBER_CELLS.map((c, i) => (
          <path key={i} d={poly(c)} />
        ))}
        <path d={AMBER_BAND} />
        <path d={poly(DIAMOND_IN)} />
      </g>
    </g>
  );
}

function Frame({ ids }: { ids: Ids }) {
  return (
    <g>
      {FRAME_FINE.map((d, i) => (
        <Bar key={`f${i}`} d={d} w={2.9} ids={ids} />
      ))}
      {FRAME_BOLD.map((d, i) => (
        <Bar key={`b${i}`} d={d} w={4.2} ids={ids} />
      ))}
      {OUTLINES.map((d, i) => (
        <Bar key={`o${i}`} d={d} w={3.2} ids={ids} />
      ))}
      {KNOTS.map(([x, y], i) => (
        <Bar key={`k${i}`} d={`M${x - 3.6} ${y} a3.6 3.6 0 1 0 7.2 0 a3.6 3.6 0 1 0 -7.2 0`} w={2.2} ids={ids} />
      ))}
    </g>
  );
}

/** Every solid part of the crown as one shape, for masks and the rim slices. */
function Solid({ grow = 0, fill }: { grow?: number; fill: string }) {
  return (
    <g stroke={fill} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {FRAME_FINE.map((d, i) => (
        <path key={`f${i}`} d={d} strokeWidth={4 + grow} />
      ))}
      {[...FRAME_BOLD, ...OUTLINES].map((d, i) => (
        <path key={`b${i}`} d={d} strokeWidth={5 + grow} />
      ))}
      <g fill={fill} stroke="none">
        {LANCES.map((l, i) => (
          <path key={i} d={poly(l)} />
        ))}
        {AMBER_CELLS.map((c, i) => (
          <path key={i} d={poly(c)} />
        ))}
        <path d={AMBER_BAND} />
        <path d={RED_BAND} />
        <path d={`${FOOT_OUT} ${FOOT_HOLE}`} fillRule="evenodd" />
        <path d={poly(DIAMOND)} />
        {KNOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5} />
        ))}
      </g>
    </g>
  );
}

function Defs({ ids }: { ids: Ids }) {
  return (
    <defs>
      <linearGradient id={ids.gold} gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="180" y2="190">
        <stop offset="0" stopColor="#fff4cf" />
        <stop offset="0.18" stopColor="#f3c96f" />
        <stop offset="0.36" stopColor="#b98128" />
        <stop offset="0.5" stopColor="#ffe9a8" />
        <stop offset="0.66" stopColor="#d19a3c" />
        <stop offset="0.82" stopColor="#8f5c18" />
        <stop offset="1" stopColor="#f6d384" />
      </linearGradient>
      <linearGradient id={ids.red} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#c8321f" />
        <stop offset="0.45" stopColor="#8e1610" />
        <stop offset="1" stopColor="#4d0706" />
      </linearGradient>
      <linearGradient id={ids.amber} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#ffe09a" />
        <stop offset="0.5" stopColor="#ffb63f" />
        <stop offset="1" stopColor="#d9740f" />
      </linearGradient>
      <linearGradient id={ids.gloss} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="0.28" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={ids.glare} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={ids.back} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="200">
        <stop offset="0" stopColor="#f6dc9a" />
        <stop offset="0.45" stopColor="#c99640" />
        <stop offset="0.7" stopColor="#e8c477" />
        <stop offset="1" stopColor="#8a5a19" />
      </linearGradient>
      <mask id={ids.frame} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
        <Solid fill="#fff" />
      </mask>
    </defs>
  );
}

function useIds(): Ids {
  const base = useId().replace(/:/g, "");
  return {
    gold: `${base}g`,
    red: `${base}r`,
    amber: `${base}a`,
    gloss: `${base}s`,
    frame: `${base}m`,
    glare: `${base}l`,
    back: `${base}b`,
  };
}

function Front({ light }: { light: MotionValue<number> }) {
  const ids = useIds();
  const glareX = useTransform(light, [-1, 1], [-150, 150]);
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible">
      <Defs ids={ids} />
      <Enamel ids={ids} />
      <Frame ids={ids} />
      {/* A glint that slides across the metal as it turns */}
      <g mask={`url(#${ids.frame})`} style={{ mixBlendMode: "overlay" }}>
        <motion.g style={{ x: glareX }}>
          <rect x="40" y="-20" width="60" height="240" fill={`url(#${ids.glare})`} transform="rotate(18 70 100)" />
        </motion.g>
      </g>
    </svg>
  );
}

function Back({ caption }: { caption: string }) {
  const ids = useIds();
  const [first, ...rest] = caption.toUpperCase().split(" SINCE ");
  const second = rest.length ? `SINCE ${rest.join(" SINCE ")}` : "";
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible">
      <Defs ids={ids} />
      {/* The reverse is plain struck gold: same openwork, no enamel */}
      <Solid fill={`url(#${ids.back})`} />
      <Frame ids={ids} />
      {/* Engraved plaque */}
      <rect x="44" y="70" width="112" height="44" rx="10" fill="#6b430d" transform="translate(0 1.5)" opacity="0.6" />
      <rect x="44" y="70" width="112" height="44" rx="10" fill={`url(#${ids.gold})`} />
      <rect x="48.5" y="74.5" width="103" height="35" rx="7" fill="none" stroke="#7a4d12" strokeOpacity="0.55" strokeWidth="1" />
      <g fontFamily="inherit" fontWeight="700" textAnchor="middle" fill="#5a3708" style={{ letterSpacing: "0.12em" }}>
        <text x="100" y={second ? 89 : 96} fontSize="10.5">
          {first}
        </text>
        {second && (
          <text x="100" y="103" fontSize="8.5" fillOpacity="0.85">
            {second}
          </text>
        )}
      </g>
      <g fill="#fff6d8" fillOpacity="0.35" fontWeight="700" textAnchor="middle" fontSize="10.5" style={{ letterSpacing: "0.12em" }} transform="translate(0 0.8)">
        <text x="100" y={second ? 89 : 96}>{first}</text>
        {second && (
          <text x="100" y="103" fontSize="8.5">
            {second}
          </text>
        )}
      </g>
    </svg>
  );
}

const LAYERS = 10;

export function CrownBadge3D({
  size,
  caption = "Gold member since 2024",
  rotateX,
  rotateY,
  className,
}: {
  size: number;
  caption?: string;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  className?: string;
}) {
  const thick = Math.max(7, size * 0.06);
  const light = useTransform(rotateY, (v) => Math.sin((v * Math.PI) / 180));
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size, perspective: size * 5 }}>
      <motion.div className="absolute inset-0" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {/* Rim: slices of the same openwork, so the edge has real depth */}
        {Array.from({ length: LAYERS }, (_, i) => {
          const z = -thick / 2 + (thick * (i + 0.5)) / LAYERS;
          const shade = ["#7a4c12", "#8f5c18", "#a46d22", "#8f5c18", "#6b430d"][i % 5];
          return (
            <svg key={i} viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible" style={{ transform: `translateZ(${z}px)` }}>
              <Solid fill={shade} />
            </svg>
          );
        })}
        <div className="absolute inset-0" style={{ transform: `translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          <Front light={light} />
        </div>
        <div className="absolute inset-0" style={{ transform: `rotateY(180deg) translateZ(${thick / 2}px)`, backfaceVisibility: "hidden" }}>
          <Back caption={caption} />
        </div>
      </motion.div>
    </div>
  );
}
