"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Pause, Play, RotateCcw } from "@/components/icons";
import type { HeroVideoConfig } from "@/lib/types";
import { Captions } from "./hero-captions";

const REDUCED = "(prefers-reduced-motion: reduce)";
function onReducedChange(notify: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
const prefersReduced = () => window.matchMedia(REDUCED).matches;
const onServer = () => false;

const NARROW = "(max-width: 767px)";
function onNarrowChange(notify: () => void): () => void {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
const isNarrow = () => window.matchMedia(NARROW).matches;

interface HeroVideoProps {
  config: HeroVideoConfig;
  labelledBy: string;
  /** The static first screen: the words, the buttons and the flat mark. */
  children: ReactNode;
}

/**
 * The home banner as one recorded video: the 3D flight past the shipped apps, drawn in advance frame by frame,
 * so it plays the same on every device with nothing to compute. The opening words and each project's caption
 * stay real text (links you can follow) and appear at the moments the video script gives.
 */
export function HeroVideo({ config, labelledBy, children }: HeroVideoProps) {
  const section = useRef<HTMLElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const reduced = useSyncExternalStore(
    onReducedChange,
    prefersReduced,
    onServer,
  );
  // Phones get the tall recording, when there is one.
  const narrow = useSyncExternalStore(onNarrowChange, isNarrow, onServer);
  const source = narrow && config.mobile ? config.mobile : config;
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [intro, setIntro] = useState(true);
  const [caption, setCaption] = useState(-1);
  const wanted = useRef(true);

  // Plays while the hero is on screen and the visitor has not paused it; stands still under reduced motion.
  useEffect(() => {
    const el = section.current;
    const v = clip.current;
    if (!el || !v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && wanted.current && !reduced)
          v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // Follows the video's clock: the opening words and the caption of the project on show.
  useEffect(() => {
    const v = clip.current;
    if (!v) return;
    const onLoaded = () => setReady(true);
    const onPlaying = (on: boolean) => setPlaying(on);
    let raf = 0;
    const tick = () => {
      const t = v.currentTime;
      setIntro(t < config.introEnd);
      const cue = config.cues.find((c) => t >= c.from && t <= c.to);
      setCaption(cue ? cue.index : -1);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    // The video may have loaded and started before this component hydrated, when its events could not be heard.
    if (v.readyState >= 3) onLoaded();
    if (!v.paused) onPlaying(true);
    v.addEventListener("play", start);
    v.addEventListener("pause", stop);
    if (!v.paused) start();
    return () => {
      stop();
      v.removeEventListener("play", start);
      v.removeEventListener("pause", stop);
    };
  }, [config]);

  function toggle() {
    const v = clip.current;
    if (!v) return;
    wanted.current = v.paused;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  }

  /** Back to the first frame, and playing. */
  function replay() {
    const v = clip.current;
    if (!v) return;
    wanted.current = true;
    v.currentTime = 0;
    v.play().catch(() => undefined);
  }

  return (
    <section
      ref={section}
      data-hero
      data-video
      data-3d={ready ? "ready" : undefined}
      data-intro={intro ? "on" : "off"}
      aria-labelledby={labelledBy}
      className="hero relative -mt-20"
    >
      <div className="hero-stage relative overflow-hidden">
        <video
          ref={clip}
          key={source.video}
          src={source.video}
          poster={source.poster.url}
          muted
          loop
          playsInline
          autoPlay={!reduced}
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="hero-canvas absolute inset-0 size-full object-cover"
        />
        {children}
        {ready ? (
          <Captions
            projects={config.projects.map((p) => ({
              ...p,
              src: "",
              icon: null,
            }))}
            current={caption}
          />
        ) : null}
        {ready ? (
          <div
            role="group"
            aria-label="Banner video controls"
            className="absolute bottom-[4.75rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 p-1.5 ring-1 ring-white/15 backdrop-blur-md md:bottom-[var(--margin)]"
          >
            <button
              type="button"
              onClick={replay}
              aria-label="Replay the banner video"
              className="hero-ctl"
            >
              <RotateCcw
                weight="bold"
                className="size-[1.125rem]"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={
                playing ? "Pause the banner video" : "Play the banner video"
              }
              aria-pressed={!playing}
              className="hero-ctl bg-white/10"
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
        ) : null}
      </div>
    </section>
  );
}

const noSubscribe = () => () => undefined;
const isRecording = () =>
  new URLSearchParams(window.location.search).has("hero-capture");

/**
 * Shows the recorded banner, except while the banner video itself is being recorded (`?hero-capture`,
 * scripts/hero-video-capture.mjs), when it shows the live 3D flight that the recording is made from.
 */
export function HeroChoice({
  recorded,
  live,
}: {
  recorded: ReactNode;
  live: ReactNode;
}) {
  const recording = useSyncExternalStore(noSubscribe, isRecording, onServer);
  return recording ? live : recorded;
}
