"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

interface Pulse {
  a: number;
  b: number;
  t: number;
  speed: number;
}

const LINK = 150;
const POINTER = 170;

/**
 * A slow neural network behind the call to action: nodes drift, near ones join with faint lines,
 * small lights travel along the lines, and the pointer pulls nearby nodes into a web. It stops
 * while off screen, and under reduced motion it paints one still frame.
 */
export function NeuralField({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    const host = el?.parentElement;
    if (!el || !ctx || !host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let last = 0;
    let spawn = 0;
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    const pointer = { x: -9999, y: -9999 };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      w = host.clientWidth;
      h = host.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(16, Math.min(44, Math.round((w * h) / 14000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1.2 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
      }));
      pulses = [];
    };

    const frame = (now: number, still = false) => {
      const dt = Math.min(48, now - last || 16);
      last = now;
      ctx.clearRect(0, 0, w, h);

      if (!still) {
        for (const n of nodes) {
          n.x += n.vx * dt * 0.06 * 16;
          n.y += n.vy * dt * 0.06 * 16;
          if (n.x < -20) n.x = w + 20;
          else if (n.x > w + 20) n.x = -20;
          if (n.y < -20) n.y = h + 20;
          else if (n.y > h + 20) n.y = -20;
        }
      }

      const edges: [number, number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            edges.push([i, j, d]);
            ctx.strokeStyle = `rgba(122, 160, 255, ${(1 - d / LINK) * 0.34})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < POINTER) {
          ctx.strokeStyle = `rgba(190, 212, 255, ${(1 - d / POINTER) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
        const glow = 0.55 + 0.45 * Math.sin(n.phase + now / 900);
        ctx.fillStyle = `rgba(165, 192, 255, ${0.35 + glow * 0.5})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (d < POINTER ? 1.2 : 0), 0, Math.PI * 2);
        ctx.fill();
      }

      if (still) return;

      spawn -= dt;
      if (spawn <= 0 && edges.length) {
        const [a, b] = edges[Math.floor(Math.random() * edges.length)]!;
        pulses.push({ a, b, t: 0, speed: 0.0006 + Math.random() * 0.0006 });
        spawn = 260 + Math.random() * 420;
      }
      pulses = pulses.filter((p) => p.t < 1);
      for (const p of pulses) {
        p.t += p.speed * dt;
        const a = nodes[p.a]!;
        const b = nodes[p.b]!;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.35, "rgba(120,160,255,0.55)");
        g.addColorStop(1, "rgba(120,160,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // About 30 frames a second is plenty for drifting nodes, and half the work of 60.
    let drawn = 0;
    const loop = (now: number) => {
      if (now - drawn >= 32) {
        drawn = now;
        frame(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    build();
    frame(performance.now(), true);

    const ro = new ResizeObserver(() => {
      build();
      frame(performance.now(), true);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) start();
      else stop();
    });
    io.observe(host);
    const onVisibility = () => (document.hidden ? stop() : start());
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className={className} />;
}
