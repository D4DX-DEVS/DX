"use client";

import { useId, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivityPoint } from "@/lib/data/admin/dashboard";

const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
] as const;

const SERIES = [
  { key: "posts", label: "Blog posts", color: "#1d6bff" },
  { key: "projects", label: "Projects", color: "#14b8a6" },
  { key: "pages", label: "Pages", color: "#8b5cf6" },
] as const;

const W = 640;
const H = 250;
const PAD = { top: 12, right: 14, bottom: 30, left: 34 };

/** A smooth curve through the points that never overshoots them (monotone cubic), as an SVG path. */
function curve(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0]![0]},${pts[0]![1]}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1]![0] - pts[i]![0]);
    slope.push((pts[i + 1]![1] - pts[i]![1]) / dx[i]!);
  }
  const t: number[] = [slope[0]!];
  for (let i = 1; i < n - 1; i++) {
    t.push(
      slope[i - 1]! * slope[i]! <= 0 ? 0 : (slope[i - 1]! + slope[i]!) / 2,
    );
  }
  t.push(slope[n - 2]!);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i]! / slope[i]!;
    const b = t[i + 1]! / slope[i]!;
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * slope[i]!;
      t[i + 1] = k * b * slope[i]!;
    }
  }
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]! / 3;
    d += ` C${pts[i]![0] + h},${pts[i]![1] + t[i]! * h} ${pts[i + 1]![0] - h},${pts[i + 1]![1] - t[i + 1]! * h} ${pts[i + 1]![0]},${pts[i + 1]![1]}`;
  }
  return d;
}

/** Spreads each day's count over its neighbours a little, so single posts read as gentle hills rather than needles. */
function soften(values: number[], rounds: number): number[] {
  let v = values;
  for (let r = 0; r < rounds; r++) {
    v = v.map((x, i) => ((v[i - 1] ?? x) + 2 * x + (v[i + 1] ?? x)) / 4);
  }
  return v;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

/** Content published per day as three overlaid smooth areas, with a range picker. Drawn in SVG, so there is no chart library. */
export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const uid = useId().replace(/:/g, "");
  const [days, setDays] = useState<number>(30);

  const chart = useMemo(() => {
    const slice = data.slice(-days);
    const smoothing = days <= 7 ? 0 : days <= 30 ? 2 : 4;
    const lines = SERIES.map((s) => ({
      ...s,
      values: soften(
        slice.map((p) => p[s.key]),
        smoothing,
      ),
    }));
    const peak = Math.max(0, ...lines.flatMap((l) => l.values));
    const top = Math.max(4, Math.ceil(peak / 2) * 2);
    const step = top <= 4 ? 1 : top <= 8 ? 2 : Math.ceil(top / 4);
    const max = Math.ceil(top / step) * step;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (slice.length <= 1 ? 0 : (i / (slice.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
    const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
    const labelAt = Array.from({ length: 6 }, (_, i) =>
      Math.round((i / 5) * (slice.length - 1)),
    );
    const total = slice.reduce((a, p) => a + p.posts + p.projects + p.pages, 0);
    return { slice, lines, x, y, ticks, labelAt, total, base: y(0) };
  }, [data, days]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul
          className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.8125rem] text-soft"
          aria-label="Legend"
        >
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </li>
          ))}
        </ul>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger
            aria-label="Period"
            className="h-10 min-w-36 rounded-xl bg-white text-sm font-medium shadow-[var(--shadow-card)]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {RANGES.map((r) => (
              <SelectItem key={r.days} value={String(r.days)}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <figure className="mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Content created per day, ${chart.total} in total over the last ${days} days`}
          className="h-auto w-full"
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient
                key={s.key}
                id={`${uid}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {chart.ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={chart.y(t)}
                y2={chart.y(t)}
                stroke="#e6ebf5"
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
              <text
                x={PAD.left - 10}
                y={chart.y(t) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#7c86a2"
              >
                {t}
              </text>
            </g>
          ))}
          {chart.labelAt.map((i, n) => (
            <text
              key={`${i}-${n}`}
              x={chart.x(i)}
              y={H - 8}
              textAnchor={
                n === 0
                  ? "start"
                  : n === chart.labelAt.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize="11"
              fill="#7c86a2"
            >
              {shortDate(chart.slice[i]!.date)}
            </text>
          ))}
          {chart.lines.map((l) => {
            const pts = l.values.map(
              (v, i) => [chart.x(i), chart.y(v)] as [number, number],
            );
            const line = curve(pts);
            const area = `${line} L${pts[pts.length - 1]![0]},${chart.base} L${pts[0]![0]},${chart.base} Z`;
            return (
              <g key={l.key}>
                <path d={area} fill={`url(#${uid}-${l.key})`} />
                <path
                  d={line}
                  fill="none"
                  stroke={l.color}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>
        {chart.total === 0 ? (
          <figcaption className="-mt-1 text-center text-[0.8125rem] text-soft">
            Nothing was published in this period yet.
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
