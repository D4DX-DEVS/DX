"use client";

import { useEffect, useRef } from "react";

/** One wave, four periods wide: the svg is twice the footer's width and slides by half of itself, so it never shows a seam. */
const WAVE = "M0 110 Q 180 10 360 110 T 720 110 T 1080 110 T 1440 110 T 1800 110 T 2160 110 T 2520 110 T 2880 110";

const WAVES = [
  { top: "2%", amp: 1, duration: 46, reverse: false, width: 2.2, opacity: 0.95 },
  { top: "9%", amp: 0.7, duration: 62, reverse: true, width: 1.4, opacity: 0.6 },
  { top: "-3%", amp: 1.25, duration: 78, reverse: false, width: 1, opacity: 0.4 },
];

type Vec = [number, number, number];

const NODES = 90;
const ARC_COUNT = 6;

/** Nodes spread evenly over a sphere (the golden-angle spiral). */
function nodes(): Vec[] {
  const out: Vec[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < NODES; i++) {
    const y = 1 - (i / (NODES - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    out.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]);
  }
  return out;
}

/** A point on the great circle from a to b, `t` of the way along, lifted off the surface in the middle. */
function arcPoint(a: Vec, b: Vec, t: number): Vec {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sin = Math.sin(omega) || 1;
  const k1 = Math.sin((1 - t) * omega) / sin;
  const k2 = Math.sin(t * omega) / sin;
  const lift = 1 + 0.22 * Math.sin(Math.PI * t) * Math.min(1, omega);
  return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
}

interface Arc {
  a: number;
  b: number;
  t: number;
  speed: number;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

/**
 * Behind the footer: glowing waves drifting across the top, a digital globe turning at the bottom
 * right (a latitude and longitude wireframe, data nodes, and arcs of light travelling
 * between them), and small motes rising and twinkling. It stops off screen, and under reduced
 * motion draws one still frame.
 */
export function FooterBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    const host = el?.parentElement;
    if (!el || !ctx || !host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points = nodes();
    const pick = () => Math.floor(Math.random() * points.length);
    const newArc = (): Arc => ({ a: pick(), b: pick(), t: -Math.random() * 0.6, speed: 0.00035 + Math.random() * 0.0004 });
    let arcs: Arc[] = Array.from({ length: ARC_COUNT }, newArc);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let motes: Mote[] = [];
    let angle = 0.6;
    let last = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      w = host.clientWidth;
      h = host.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.max(24, Math.min(80, Math.round((w * h) / 16000))) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.6,
        speed: 0.004 + Math.random() * 0.012,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (now: number, still = false) => {
      const dt = Math.min(48, now - last || 16);
      last = now;
      if (!still) angle += dt * 0.00016;
      ctx.clearRect(0, 0, w, h);

      // A small globe at the foot of the footer, its lower edge sinking past the bottom like a planet on the horizon.
      const R = Math.max(86, Math.min(h * 0.19, w * 0.1));
      const cx = w - Math.max(R * 1.6, w * 0.13);
      const cy = h - R * 0.5;
      const tilt = 0.42;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const project = (v: Vec): { x: number; y: number; z: number } => {
        const x1 = v[0] * cosA + v[2] * sinA;
        const z1 = -v[0] * sinA + v[2] * cosA;
        const y2 = v[1] * cosT - z1 * sinT;
        const z2 = v[1] * sinT + z1 * cosT;
        return { x: cx + x1 * R, y: cy - y2 * R, z: z2 };
      };

      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
      halo.addColorStop(0, "rgba(50,110,255,0.2)");
      halo.addColorStop(1, "rgba(50,110,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      body.addColorStop(0, "rgba(40,90,220,0.22)");
      body.addColorStop(1, "rgba(8,16,60,0.35)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,170,255,0.5)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // The wireframe: a meridian every 30 degrees, a parallel every 20, drawn back to front by depth.
      const line = (from: (u: number) => Vec, steps: number) => {
        let prev = project(from(0));
        for (let i = 1; i <= steps; i++) {
          const cur = project(from(i / steps));
          const z = (prev.z + cur.z) / 2;
          ctx.strokeStyle = z > 0 ? `rgba(110,165,255,${0.14 + z * 0.4})` : "rgba(90,130,230,0.05)";
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
          prev = cur;
        }
      };
      ctx.lineWidth = 0.8;
      for (let m = 0; m < 12; m++) {
        const lon = (m / 12) * Math.PI * 2;
        line((u) => {
          const lat = (u - 0.5) * Math.PI;
          return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
        }, 36);
      }
      for (let p = -3; p <= 3; p++) {
        const lat = (p / 4.5) * (Math.PI / 2);
        line((u) => [Math.cos(lat) * Math.cos(u * Math.PI * 2), Math.sin(lat), Math.cos(lat) * Math.sin(u * Math.PI * 2)], 56);
      }

      // Data nodes, a few brighter and pulsing.
      points.forEach((v, i) => {
        const p = project(v);
        if (p.z < 0) return;
        const lit = i % 7 === 0;
        const pulse = lit ? 0.6 + 0.4 * Math.sin(now / 500 + i) : 0;
        ctx.fillStyle = lit ? `rgba(200,222,255,${0.55 + pulse * 0.45})` : `rgba(130,175,255,${0.2 + p.z * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, lit ? 1.8 + pulse * 1.2 : 0.8 + p.z * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Arcs of light: each grows from one node to another, glows, then fades and picks a new route.
      arcs = arcs.map((arc) => {
        if (!still) arc.t += arc.speed * dt;
        return arc.t > 1.35 || arc.a === arc.b ? newArc() : arc;
      });
      for (const arc of arcs) {
        const head = Math.max(0, Math.min(1, arc.t));
        if (head <= 0) continue;
        const fade = arc.t > 1 ? Math.max(0, 1 - (arc.t - 1) / 0.35) : 1;
        const tail = Math.max(0, head - 0.55);
        let prev = project(arcPoint(points[arc.a]!, points[arc.b]!, tail));
        const steps = 28;
        for (let i = 1; i <= steps; i++) {
          const u = tail + ((head - tail) * i) / steps;
          const cur = project(arcPoint(points[arc.a]!, points[arc.b]!, u));
          const k = i / steps;
          if (cur.z > -0.05 && prev.z > -0.05) {
            ctx.strokeStyle = `rgba(150,195,255,${(0.1 + k * 0.85) * fade})`;
            ctx.lineWidth = 0.8 + k * 1.1;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(cur.x, cur.y);
            ctx.stroke();
          }
          prev = cur;
        }
        const tip = project(arcPoint(points[arc.a]!, points[arc.b]!, head));
        if (tip.z > -0.05) {
          const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 9);
          g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
          g.addColorStop(0.4, `rgba(120,170,255,${0.5 * fade})`);
          g.addColorStop(1, "rgba(120,170,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const m of motes) {
        if (!still) {
          m.y -= m.speed * dt;
          if (m.y < -4) {
            m.y = h + 4;
            m.x = Math.random() * w;
          }
        }
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(m.phase + now / 1100));
        ctx.fillStyle = `rgba(150,190,255,${tw * 0.7})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // About 30 frames a second is plenty for slow drifting lights, and half the work of 60.
    let drawn = 0;
    const loop = (now: number) => {
      if (now - drawn >= 32) {
        drawn = now;
        draw(now);
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
    for (const arc of arcs) arc.t = 0.5 + Math.random() * 0.4;
    draw(performance.now(), true);
    const ro = new ResizeObserver(() => {
      build();
      draw(performance.now(), true);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) start();
      else stop();
    });
    io.observe(host);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-56 overflow-hidden">
        {WAVES.map((wave, i) => (
          <div key={i} className="absolute left-0 h-44 w-full" style={{ top: wave.top, opacity: wave.opacity, transform: `scaleY(${wave.amp})` }}>
            <svg
              viewBox="0 0 2880 220"
              preserveAspectRatio="none"
              className="footer-wave h-full w-[200%]"
              style={{ animationDuration: `${wave.duration}s`, animationDirection: wave.reverse ? "reverse" : "normal" }}
            >
              <defs>
                <linearGradient id={`footer-wave-${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
                  <stop offset="30%" stopColor="#3b82f6" />
                  <stop offset="55%" stopColor="#9bc0ff" />
                  <stop offset="80%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={WAVE} fill="none" stroke={`url(#footer-wave-${i})`} strokeWidth={wave.width * 2} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        ))}
      </div>
      <canvas ref={canvas} className="absolute inset-0 size-full" />
    </div>
  );
}
