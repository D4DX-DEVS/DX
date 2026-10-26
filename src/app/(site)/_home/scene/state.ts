/** Mutable values written by the scroll listener and read every frame by the scene (no re-renders). */
export const heroState = {
  /** Scroll progress through the hero runway, 0..1. */
  progress: 0,
  /** Smoothed progress the scene actually renders. */
  smooth: 0,
  /** 0 when the opening mark's pieces are still far away inside the picture, 1 once they have gathered into the logo. */
  assemble: 1,
  /** 0 while the closing logo is whole, 1 once it has broken and gone. */
  finaleBreak: 0,
  /** 0 while the projects are on show, 1 once they have all gone (as the camera flies back to the start). */
  retreat: 0,
};
