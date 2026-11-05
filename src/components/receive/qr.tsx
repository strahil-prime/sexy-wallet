"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import { N_LEGS, N_STAR } from "@/components/brand/nudge-paths";

const FINDER = 7;

/**
 * A scannable QR code drawn as rounded dots, with soft-cornered finder eyes in the brand blue
 * and the N in the middle (error correction H leaves room for the logo).
 */
export function PayQR({ value, className }: { value: string; className?: string }) {
  const { size, dots } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
    const n = qr.modules.size;
    const logo = Math.ceil(n * 0.24) | 1; // odd, centred
    const lo = (n - logo) / 2;
    const out: [number, number][] = [];
    const inFinder = (x: number, y: number) =>
      (x < FINDER && y < FINDER) || (x >= n - FINDER && y < FINDER) || (x < FINDER && y >= n - FINDER);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!qr.modules.get(x, y) || inFinder(x, y)) continue;
        if (x >= lo - 0.5 && x < lo + logo && y >= lo - 0.5 && y < lo + logo) continue;
        out.push([x, y]);
      }
    }
    return { size: n, dots: out };
  }, [value]);

  const eyes: [number, number][] = [
    [0, 0],
    [size - FINDER, 0],
    [0, size - FINDER],
  ];
  const logo = size * 0.22;

  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className={className} role="img" aria-label="QR code to pay you">
      <defs>
        <linearGradient id="qr-eye" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E75E8" />
          <stop offset="1" stopColor="#0d3f9e" />
        </linearGradient>
      </defs>
      {dots.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.1} y={y + 0.1} width={0.8} height={0.8} rx={0.38} fill="#0a1620" />
      ))}
      {eyes.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={2} fill="none" stroke="url(#qr-eye)" strokeWidth={1} />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={1} fill="url(#qr-eye)" />
        </g>
      ))}
      <g transform={`translate(${(size - logo) / 2} ${(size - logo) / 2})`}>
        <rect width={logo} height={logo} rx={logo * 0.28} fill="#115CE1" />
        <svg x={logo * 0.15} y={logo * 0.15} width={logo * 0.7} height={logo * 0.7} viewBox="-4 -40 236 236">
          {N_LEGS.map((d, i) => (
            <path key={i} d={d} fill="white" />
          ))}
          <path d={N_STAR} fill="white" />
        </svg>
      </g>
    </svg>
  );
}
