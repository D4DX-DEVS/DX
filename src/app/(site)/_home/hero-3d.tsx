"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "@/components/icons";
import { cn } from "@/lib/utils";
import { buildTimeline, FPS } from "./hero-timeline";
import { slideStops, travel } from "./scene/path";
import { heroState } from "./scene/state";

import { Captions, heroSignature, type HeroProject } from "./hero-captions";

export type { HeroProject } from "./hero-captions";

const HeroScene = dynamic(() => import("./scene/hero-scene"), { ssr: false });

// The root layout's head script adds `immersive` before first paint when WebGL 2 is there,
// motion is welcome and the screen is tall enough; it is removed again if the scene fails.
function subscribe(onChange: () => void): () => void {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => mo.disconnect();
}
const isCapturing = () =>
  new URLSearchParams(window.location.search).has("hero-capture");
const isImmersive = () =>
  document.documentElement.classList.contains("immersive");
const onServer = () => false;

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const INTRO_MS = 1800;
const PANEL_MS = 1300;
const FINALE_MS = 2000;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * The hero as a slider that plays itself: the intro, one slide per project, then the closing wordmark,
 * after which it fades and starts again. It moves the camera by writing heroState.progress, the same
 * number scroll used to drive, so the scene needs no other change. `go` jumps to a slide.
 */
function useSlider(count: number, active: boolean) {
  const stops = useMemo(() => slideStops(count), [count]);
  const last = stops.length - 1;
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fading, setFading] = useState(false);
  const [leg, setLeg] = useState(INTRO_MS);
  const at = useRef(0);
  const tween = useRef<{
    from: number;
    to: number;
    t: number;
    dur: number;
  } | null>(null);
  const dwell = useRef(INTRO_MS);
  const busy = useRef(false);

  const restMs = (i: number) =>
    i === 0 ? INTRO_MS : i === last ? FINALE_MS : PANEL_MS;

  const go = useCallback(
    (i: number) => {
      if (busy.current || i < 0 || i > last) return;
      const from = heroState.progress;
      const to = stops[i]!;
      const dz = Math.abs(to - from) * travel(count);
      const dur = Math.min(1600, Math.max(950, 550 + dz * 110));
      tween.current = { from, to, t: 0, dur };
      at.current = i;
      setSlide(i);
      setLeg(dur + restMs(i));
    },
    // restMs depends only on `last`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stops, count, last],
  );

  const restart = useCallback(() => {
    busy.current = true;
    setFading(true);
    window.setTimeout(() => {
      heroState.progress = 0;
      heroState.smooth = 0;
      tween.current = null;
      at.current = 0;
      dwell.current = INTRO_MS;
      setSlide(0);
      setLeg(INTRO_MS);
      setFading(false);
      busy.current = false;
    }, 520);
  }, []);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(250, now - prev);
      prev = now;
      const tw = tween.current;
      if (tw) {
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.dur);
        heroState.progress = tw.from + (tw.to - tw.from) * easeInOut(k);
        if (k >= 1) {
          tween.current = null;
          dwell.current = restMs(at.current);
        }
      } else if (playing && !busy.current) {
        dwell.current -= dt;
        if (dwell.current <= 0) {
          if (at.current >= last) restart();
          else go(at.current + 1);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // restMs depends only on `last`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playing, go, restart, last]);

  useEffect(
    () => () => {
      heroState.progress = 0;
      heroState.smooth = 0;
    },
    [],
  );

  return {
    slide,
    slides: stops.length,
    playing,
    setPlaying,
    fading,
    leg,
    go,
    next: () => (at.current >= last ? go(0) : go(at.current + 1)),
    prev: () => go(Math.max(0, at.current - 1)),
  };
}

interface SliderControlsProps {
  slide: number;
  slides: number;
  playing: boolean;
  leg: number;
  titles: string[];
  onGo: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
}

/** Previous and next, one dot per slide (the current one fills as its time runs out), and play or pause. */
function SliderControls({
  slide,
  slides,
  playing,
  leg,
  titles,
  onGo,
  onPrev,
  onNext,
  onToggle,
}: SliderControlsProps) {
  const label = (i: number) =>
    i === 0
      ? "Introduction"
      : i === slides - 1
        ? "Closing"
        : (titles[i - 1] ?? `Project ${i}`);
  return (
    <div
      role="group"
      aria-label="Hero slides"
      className="hero-controls absolute top-[5.75rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 p-1.5 ring-1 ring-white/15 backdrop-blur-md md:top-auto md:bottom-[var(--margin)]"
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous slide"
        className="hero-ctl"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <ol className="flex items-center gap-1.5 px-1.5">
        {Array.from({ length: slides }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-label={`Show ${label(i)}`}
              aria-current={i === slide ? "true" : undefined}
              className="hero-dot group relative grid h-7 place-items-center"
            >
              <span
                className={cn(
                  "relative block h-1.5 overflow-hidden rounded-full bg-white/30 transition-[width] duration-500",
                  i === slide ? "w-9" : "w-1.5 group-hover:bg-white/60",
                )}
              >
                {i === slide ? (
                  <span
                    key={`${slide}-${leg}`}
                    className="hero-dot-fill absolute inset-y-0 left-0 block rounded-full bg-white"
                    style={{
                      animationDuration: `${leg}ms`,
                      animationPlayState: playing ? "running" : "paused",
                    }}
                  />
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next slide"
        className="hero-ctl"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}
        aria-pressed={!playing}
        className="hero-ctl ml-1 bg-white/10"
      >
        {playing ? (
          <Pause weight="fill" className="size-4" aria-hidden="true" />
        ) : (
          <Play
            weight="fill"
            className="size-4 translate-x-px"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}

interface Hero3DProps {
  projects: HeroProject[];
  labelledBy: string;
  /** The static first screen: shown at once, kept as the fallback, faded as the flight begins. */
  children: ReactNode;
}

/**
 * A pinned stage that turns the hero into a flight: the mark lifts off the page in 3D, comes
 * apart, and the camera flies past one panel per shipped app before reaching the name. The
 * static hero is the first paint, the no-WebGL version and the reduced-motion version.
 */
export function Hero3D({ projects, labelledBy, children }: Hero3DProps) {
  const supported = useSyncExternalStore(subscribe, isImmersive, onServer);
  const count = projects.length;
  const immersive = supported && count > 0;
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [caption, setCaption] = useState(-1);
  // `?hero-capture` is how the banner video is recorded (scripts/hero-video-capture.mjs): the scene stops playing
  // itself and is driven frame by frame from outside, so every frame is drawn at exactly its own moment.
  const capture = useSyncExternalStore(subscribe, isCapturing, onServer);

  const onReady = useCallback(() => setReady(true), []);
  // A lost GPU context brings the flat mark back until the browser restores it.
  const onContext = useCallback((lost: boolean) => setReady(!lost), []);
  // A scene error gets one more try (a hiccup while loading, a context that was just reset) before the
  // page settles for the flat hero.
  const [attempt, setAttempt] = useState(0);
  const onFail = useCallback(() => {
    if (attempt === 0) {
      window.setTimeout(() => setAttempt(1), 900);
      return;
    }
    document.documentElement.classList.remove("immersive");
  }, [attempt]);

  // Render only while the hero is on screen. A layout effect so the cleanup also runs when Next
  // keeps this route mounted but hidden (<Activity>) after navigating away.
  useLayoutEffect(() => {
    const el = section.current;
    if (!immersive || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const last = entries.at(-1);
        if (last) setRunning(last.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setRunning(false);
    };
  }, [immersive]);

  // Plays itself once the 3D is on screen, and only while the hero is in view.
  const slider = useSlider(count, immersive && ready && running && !capture);

  const readyNow = useRef(false);
  useEffect(() => {
    readyNow.current = ready;
  }, [ready]);
  useEffect(() => {
    if (!capture || count === 0) return;
    const plan = buildTimeline(count);
    const bridge = {
      fps: FPS,
      duration: plan.duration,
      introEnd: plan.introEnd,
      cues: plan.cues(),
      signature: heroSignature(projects),
      projects: projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        category: p.category,
      })),
      isReady: () => readyNow.current,
      /** Draws the scene as it is at `time` seconds and returns its canvas. */
      frame(time: number): HTMLCanvasElement | null {
        const gl = (
          window as unknown as {
            __heroGL?: {
              advance: (t: number) => void;
              canvas: HTMLCanvasElement;
            };
          }
        ).__heroGL;
        if (!gl) return null;
        const p = plan.progressAt(time);
        heroState.progress = p;
        heroState.smooth = p;
        heroState.assemble = plan.assembleAt(time);
        heroState.finaleBreak = plan.breakAt(time);
        heroState.retreat = plan.retreatAt(time);
        gl.advance(time);
        return gl.canvas;
      },
    };
    (window as unknown as { __heroCapture?: typeof bridge }).__heroCapture =
      bridge;
    return () => {
      delete (window as unknown as { __heroCapture?: typeof bridge })
        .__heroCapture;
      heroState.assemble = 1;
      heroState.finaleBreak = 0;
      heroState.retreat = 0;
    };
  }, [capture, count, projects]);

  return (
    <section
      ref={section}
      data-hero
      data-3d={immersive && ready ? "ready" : undefined}
      aria-labelledby={labelledBy}
      data-intro={slider.slide === 0 ? "on" : "off"}
      className="hero relative -mt-20"
    >
      <div ref={stage} className="hero-stage relative overflow-hidden">
        {immersive ? (
          <div
            className={cn(
              "hero-canvas absolute inset-0",
              slider.fading && "hero-canvas-fading",
            )}
            aria-hidden="true"
          >
            <SceneBoundary key={attempt} onError={onFail}>
              <HeroScene
                panels={projects.map((p) => ({
                  src: p.src,
                  icon: p.icon,
                  title: p.title,
                }))}
                stage={stage}
                running={running}
                capture={capture}
                onReady={onReady}
                onCaption={setCaption}
                onContext={onContext}
              />
            </SceneBoundary>
          </div>
        ) : null}
        {children}
        {immersive ? (
          <Captions projects={projects} current={ready ? caption : -1} />
        ) : null}
        {immersive && ready ? (
          <SliderControls
            slide={slider.slide}
            slides={slider.slides}
            playing={slider.playing}
            leg={slider.leg}
            titles={projects.map((p) => p.title)}
            onGo={slider.go}
            onPrev={slider.prev}
            onNext={slider.next}
            onToggle={() => slider.setPlaying((v) => !v)}
          />
        ) : null}
      </div>
    </section>
  );
}
