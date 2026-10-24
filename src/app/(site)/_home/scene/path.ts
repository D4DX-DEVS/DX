/**
 * The camera's path through the hero, as plain numbers shared by the WebGL scene and the
 * HTML captions so both always agree on which project is in view.
 *
 * Scroll progress 0..1 maps linearly onto the camera's z: it starts in front of the mark,
 * flies through the mark's cross-shaped gutter, then past one floating panel per project.
 */
export const CAMERA_START_Z = 9;
export const MARK_Z = 0;
export const PANEL_SPACING = 5.5;
export const PANEL_LEAD = 3.5;
const TAIL = 4;

export function travel(count: number): number {
  return CAMERA_START_Z + count * PANEL_SPACING + TAIL;
}

export function cameraZ(progress: number, count: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return CAMERA_START_Z - p * travel(count);
}

export function panelZ(index: number): number {
  return MARK_Z - PANEL_LEAD - index * PANEL_SPACING;
}

/** Panels alternate sides and heights so the flight weaves between them. */
export function panelPosition(index: number, wide: boolean): [number, number, number] {
  const side = index % 2 === 0 ? -1 : 1;
  const x = side * (wide ? 1.85 : 0.55);
  const y = (index % 3 === 0 ? 0.35 : index % 3 === 1 ? -0.3 : 0.1) * (wide ? 1 : 0.6);
  return [x, y, panelZ(index)];
}

/** A panel hands over to the next while it is still this far ahead, so it is never described half off screen. */
const HANDOVER = 2.8;

/**
 * The project whose panel is the next one ahead of the camera, or -1 before the camera has
 * passed through the mark (and after the last panel).
 */
export function activePanel(progress: number, count: number): number {
  if (count === 0) return -1;
  const z = cameraZ(progress, count);
  // By this point the mark has spread out of frame and the first app is in full view.
  if (z > MARK_Z + 2) return -1;
  for (let i = 0; i < count; i++) {
    if (panelZ(i) < z - HANDOVER) return i;
  }
  return -1;
}

/** Vertical field of view of the hero camera, in degrees. */
export const CAMERA_FOV = 42;

/** How far in front of the wordmark the camera comes to rest. */
export const FINALE_DISTANCE = 7;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const c = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return c * c * (3 - 2 * c);
}

/** The extruded wordmark waits at the end of the flight. */
export function wordmarkZ(count: number): number {
  return cameraZ(1, count) - FINALE_DISTANCE;
}

/** 0 until the last project is behind the camera, 1 when the camera stops in front of the wordmark. */
export function finale(progress: number, count: number): number {
  const from = count > 0 ? panelZ(count - 1) - 0.5 : MARK_Z - 0.5;
  return smoothstep(-from, -cameraZ(1, count), -cameraZ(progress, count));
}

/**
 * Which caption the page shows: a project index, `count` for the closing line once the
 * wordmark is in view, or -1 between them (the opening screen, the gap after the last panel).
 */
export function captionIndex(progress: number, count: number): number {
  if (finale(progress, count) > 0.5) return count;
  return activePanel(progress, count);
}

/** 0 far from the mark, 1 once the camera reaches it: drives the mark coming apart. */
export function markOpen(progress: number, count: number): number {
  const z = cameraZ(progress, count);
  const t = (6 - z) / (6 - 0.6);
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** How far ahead of a panel the camera rests while that slide is showing (clear of the caption handover). */
const SLIDE_AHEAD = 3.6;

/**
 * The scene's slides as camera progress values: the opening mark, then one rest in front of each
 * project's panel, then the closing wordmark. The hero's slider moves between these.
 */
export function slideStops(count: number): number[] {
  const t = travel(count);
  const panels = Array.from({ length: count }, (_, i) =>
    Math.min(1, Math.max(0, (CAMERA_START_Z - (panelZ(i) + SLIDE_AHEAD)) / t)),
  );
  return [0, ...panels, 1];
}
