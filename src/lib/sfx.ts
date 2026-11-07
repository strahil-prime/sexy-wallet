/**
 * Small synthesized sound effects (Web Audio, no files to download).
 *
 * The browser only lets a page make sound after a tap, so the shared AudioContext is created and
 * resumed on the first pointerdown ("Tap to enter", or the hold on Hold to send). Effects stay
 * silent when the viewer turned sound off with the teller's speaker button.
 */

const SOUND_KEY = "sexy-wallet:sound:v2";

let ctx: AudioContext | null = null;

function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function unlock() {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {}
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true, passive: true });
}

/** The live context, or null when sound is off or the browser has not allowed audio yet. */
function live(): AudioContext | null {
  if (!soundOn()) return null;
  unlock();
  return ctx && ctx.state !== "closed" ? ctx : null;
}

function noiseBuffer(ac: BaseAudioContext, seconds: number) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * A warm, rising swell for the transfer animation: a soft major-9 pad that opens up, an
 * ascending shimmer of little plucks and a gentle airy whoosh that peaks as the colours flood.
 * `peak` is when (in seconds) it should be fullest; it then fades out over `tail` seconds.
 */
export function scheduleSwell(ac: BaseAudioContext, out: AudioNode, t0: number, peak: number, tail = 0.9) {
  const end = t0 + peak + tail;
  const bus = ac.createGain();
  // Audible from the first moment, then building: a quick fade in, a long climb to full.
  bus.gain.setValueAtTime(0.0001, t0);
  bus.gain.exponentialRampToValueAtTime(0.22, t0 + 0.35);
  bus.gain.exponentialRampToValueAtTime(1, t0 + peak * 0.85);
  bus.gain.setValueAtTime(1, t0 + peak);
  bus.gain.exponentialRampToValueAtTime(0.0001, end);
  bus.connect(out);

  // Pad: C major 9, two slightly detuned voices per note, through an opening low-pass.
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(350, t0);
  lp.frequency.exponentialRampToValueAtTime(2600, t0 + peak);
  const pad = ac.createGain();
  pad.gain.value = 0.05;
  lp.connect(pad).connect(bus);
  for (const f of [130.81, 196.0, 261.63, 329.63, 493.88, 587.33]) {
    for (const det of [-6, 6]) {
      const o = ac.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t0);
      o.stop(end + 0.05);
    }
  }

  // Shimmer: rising pentatonic plucks, sparse at first and quicker towards the peak.
  const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
  const shimmer = ac.createGain();
  shimmer.gain.value = 0.035;
  const echo = ac.createDelay(1);
  echo.delayTime.value = 0.19;
  const fb = ac.createGain();
  fb.gain.value = 0.35;
  shimmer.connect(bus);
  shimmer.connect(echo);
  echo.connect(fb).connect(echo);
  echo.connect(bus);
  const count = notes.length;
  for (let i = 0; i < count; i++) {
    const at = t0 + 0.25 + peak * 0.92 * Math.pow(i / (count - 1), 0.8);
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = notes[i];
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.35 + (0.65 * i) / count, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.connect(g).connect(shimmer);
    o.start(at);
    o.stop(at + 0.55);
  }

  // Air: band-passed noise that sweeps up into the flood.
  const air = ac.createBufferSource();
  air.buffer = noiseBuffer(ac, peak + tail + 0.1);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(500, t0);
  bp.frequency.exponentialRampToValueAtTime(5200, t0 + peak);
  const ag = ac.createGain();
  ag.gain.setValueAtTime(0.0001, t0);
  ag.gain.exponentialRampToValueAtTime(0.03, t0 + peak);
  ag.gain.exponentialRampToValueAtTime(0.0001, t0 + peak + 0.6);
  air.connect(bp).connect(ag).connect(bus);
  air.start(t0);
  air.stop(end);

  return bus;
}

/** "Cha-ching": a short metallic shuffle (the drawer) and then two bright bell strikes. */
export function scheduleChaChing(ac: BaseAudioContext, out: AudioNode, t0: number) {
  const bus = ac.createGain();
  bus.gain.value = 0.5;
  bus.connect(out);

  // "Cha": a crisp burst of high noise with a little click in front.
  const n = ac.createBufferSource();
  n.buffer = noiseBuffer(ac, 0.15);
  const hp = ac.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = 6500;
  hp.Q.value = 0.9;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, t0);
  ng.gain.exponentialRampToValueAtTime(0.35, t0 + 0.004);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
  n.connect(hp).connect(ng).connect(bus);
  n.start(t0);
  n.stop(t0 + 0.15);

  // "Ching": inharmonic bell partials, struck twice.
  const bell = (at: number, base: number, level: number) => {
    const partials: [number, number, number][] = [
      [1, 1, 1.4],
      [2.76, 0.45, 0.9],
      [5.4, 0.25, 0.5],
      [8.93, 0.12, 0.3],
    ];
    for (const [ratio, amp, decay] of partials) {
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.value = base * ratio;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(level * amp, at + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      o.connect(g).connect(bus);
      o.start(at);
      o.stop(at + decay + 0.02);
    }
  };
  bell(t0 + 0.085, 1568, 0.28);
  bell(t0 + 0.2, 2093, 0.32);
  return bus;
}

function master(ac: AudioContext) {
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  const vol = ac.createGain();
  vol.gain.value = 0.9;
  vol.connect(comp).connect(ac.destination);
  return vol;
}

/**
 * Sound for one transfer: the swell peaks at `peakMs` and the cha-ching lands at `chingMs`
 * (both from now). Returns a stop function that fades everything out, for when the veil goes early.
 */
export function playTransferSounds(peakMs: number, chingMs: number) {
  const ac = live();
  if (!ac) return () => {};
  const out = master(ac);
  const t0 = ac.currentTime + 0.02;
  scheduleSwell(ac, out, t0, peakMs / 1000);
  scheduleChaChing(ac, out, t0 + chingMs / 1000);
  return () => {
    const now = ac.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + 0.15);
    setTimeout(() => out.disconnect(), 300);
  };
}
