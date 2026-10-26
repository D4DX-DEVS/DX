import { describe, expect, it } from "vitest";
import {
  activePanel,
  cameraZ,
  CAMERA_START_Z,
  captionIndex,
  finale,
  markOpen,
  panelZ,
  travel,
  wordmarkZ,
} from "./path";

describe("camera path", () => {
  it("starts in front of the mark and ends past the last panel", () => {
    expect(cameraZ(0, 6)).toBe(CAMERA_START_Z);
    expect(cameraZ(1, 6)).toBeLessThan(panelZ(5));
    expect(cameraZ(1, 6)).toBe(CAMERA_START_Z - travel(6));
  });

  it("clamps progress", () => {
    expect(cameraZ(-1, 6)).toBe(cameraZ(0, 6));
    expect(cameraZ(2, 6)).toBe(cameraZ(1, 6));
  });
});

describe("activePanel", () => {
  it("shows no project before the camera passes the mark", () => {
    expect(activePanel(0, 6)).toBe(-1);
    expect(activePanel(0.1, 6)).toBe(-1);
  });

  it("walks through every project in order, once each", () => {
    const seen: number[] = [];
    for (let p = 0; p <= 1; p += 0.002) {
      const i = activePanel(p, 6);
      if (i >= 0 && seen.at(-1) !== i) seen.push(i);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("handles an empty catalogue", () => {
    expect(activePanel(0.5, 0)).toBe(-1);
  });
});

describe("finale", () => {
  it("is zero while projects are still passing and one at the end of the flight", () => {
    expect(finale(0, 6)).toBe(0);
    const lastPanelProgress = (CAMERA_START_Z - panelZ(5)) / travel(6);
    expect(finale(lastPanelProgress, 6)).toBe(0);
    expect(finale(1, 6)).toBe(1);
  });

  it("never overlaps a project caption once fully arrived", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      if (finale(p, 6) > 0.5) expect(activePanel(p, 6)).toBe(-1);
    }
  });

  it("puts the wordmark ahead of where the camera stops", () => {
    expect(wordmarkZ(6)).toBeLessThan(cameraZ(1, 6));
  });

  it("works with no projects", () => {
    expect(finale(1, 0)).toBe(1);
    expect(finale(0, 0)).toBe(0);
  });
});

describe("captionIndex", () => {
  it("shows the intro, then each project, then the closing line", () => {
    const seen: number[] = [];
    for (let p = 0; p <= 1; p += 0.002) {
      const c = captionIndex(p, 6);
      if (seen.at(-1) !== c) seen.push(c);
    }
    expect(seen).toEqual([-1, 0, 1, 2, 3, 4, 5, -1, 6]);
  });
});

describe("markOpen", () => {
  it("is closed far away and open at the mark", () => {
    expect(markOpen(0, 6)).toBe(0);
    const atMark = CAMERA_START_Z / travel(6);
    expect(markOpen(atMark, 6)).toBe(1);
  });
});
