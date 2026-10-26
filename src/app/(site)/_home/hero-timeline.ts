import { captionIndex, slideStops, travel } from "./scene/path";

/** The banner video's frame rate. */
export const FPS = 60;

/** The opening: the logo's pieces gather in this time... */
const ASSEMBLE = 1.6;
/** ...and the logo then sits still until this moment, long enough to read the heading and description. */
const INTRO = 5.5;
/** The first leg, through the breaking logo, takes longest so the pieces can be seen. */
const FIRST_LEG = 4.4;
/** Held on the closing logo before it breaks. */
const FINALE = 2.2;
/** The closing logo breaking inward, and the camera then flying back to the start while the video loops. */
const BREAK = 1.7;
const RETREAT = 1.8;
/** How much of its average speed the camera keeps as it passes a project: below 1 it eases, never stops. */
const EASE = 0.45;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export interface Cue {
  /** Seconds into the video. */
  from: number;
  to: number;
  /** Which project's caption shows; the project count means the closing line. */
  index: number;
}

/**
 * The banner video's script: how long it runs, where the camera is at each moment, and when each caption shows.
 * The camera flies one unbroken path through the same slides as the live 3D flight (the mark, one place per
 * project, the closing logo). Its speed changes smoothly (a cubic Hermite curve through the stops), it slows
 * to read each project but never halts. The closing logo then breaks and sinks away while the camera flies back
 * to where it began, and the opening logo's pieces gather again: the last frame leads straight into the first,
 * so the loop has no gap. Recorded frame by frame, so it plays back evenly on any device.
 */
export function buildTimeline(count: number) {
  const stops = slideStops(count);
  const length = travel(count);
  // Times at which the camera is at each stop; it is at rest at the first and the last.
  const times: number[] = [INTRO];
  for (let i = 1; i < stops.length; i++) {
    const dz = Math.abs(stops[i]! - stops[i - 1]!) * length;
    const dur = i === 1 ? FIRST_LEG : clamp(1.4 + dz * 0.12, 2.0, 2.8);
    times.push(times[i - 1]! + dur);
  }
  const flightEnd = times[times.length - 1]!;
  const breakStart = flightEnd + FINALE;
  const retreatStart = breakStart + 0.4;
  const duration = Math.max(breakStart + BREAK, retreatStart + RETREAT);

  const tangents = stops.map((_, i) => {
    if (i === 0 || i === stops.length - 1) return 0;
    const slope =
      (stops[i + 1]! - stops[i - 1]!) / (times[i + 1]! - times[i - 1]!);
    return slope * EASE;
  });

  /** The camera's progress (0..1) at a moment. */
  function progressAt(time: number): number {
    if (time >= retreatStart) {
      const u = clamp((time - retreatStart) / RETREAT, 0, 1);
      return stops[stops.length - 1]! * (1 - easeInOut(u));
    }
    if (time <= times[0]!) return stops[0]!;
    if (time >= flightEnd) return stops[stops.length - 1]!;
    let i = 0;
    while (time > times[i + 1]!) i++;
    const dt = times[i + 1]! - times[i]!;
    const u = (time - times[i]!) / dt;
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * stops[i]! +
      (u3 - 2 * u2 + u) * dt * tangents[i]! +
      (-2 * u3 + 3 * u2) * stops[i + 1]! +
      (u3 - u2) * dt * tangents[i + 1]!
    );
  }

  /** 0 while the opening pieces are far away, 1 once they have gathered into the logo. */
  const assembleAt = (time: number) =>
    time < retreatStart
      ? clamp(time / ASSEMBLE, 0, 1)
      : // The opening pieces are sent back into the distance while the camera is far from them, so that the
        // last frame matches the first.
        clamp(1 - (time - retreatStart) / 0.5, 0, 1);
  /** 0 while the closing logo is whole, 1 once it has broken and gone. */
  const breakAt = (time: number) => clamp((time - breakStart) / BREAK, 0, 1);
  /** 0 while the projects are on show, 1 once they have gone and the camera is flying back. */
  const retreatAt = (time: number) =>
    clamp((time - retreatStart) / RETREAT, 0, 1);

  function cues(): Cue[] {
    const out: Cue[] = [];
    const frames = Math.round(duration * FPS);
    let current: Cue | null = null;
    for (let f = 0; f <= frames; f++) {
      const time = f / FPS;
      // No captions once the closing logo starts to break.
      const index =
        time >= breakStart ? -1 : captionIndex(progressAt(time), count);
      if (index < 0) {
        current = null;
      } else if (current && current.index === index) {
        current.to = time;
      } else {
        current = { from: time, to: time, index };
        out.push(current);
      }
    }
    return out;
  }

  return {
    duration,
    introEnd: INTRO,
    progressAt,
    assembleAt,
    breakAt,
    retreatAt,
    cues,
  };
}
