/** Mutable values written by the scroll listener and read every frame by the scene (no re-renders). */
export const heroState = {
  /** Scroll progress through the hero runway, 0..1. */
  progress: 0,
  /** Smoothed progress the scene actually renders. */
  smooth: 0,
};
