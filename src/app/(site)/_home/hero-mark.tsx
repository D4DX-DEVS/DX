import { BlueMark } from "@/components/brand/logo";

/** The logo's mark in its own blue. The 3D mark takes over from it in the same colour. */
export function HeroMark() {
  return (
    <figure
      className="relative m-0 flex h-full justify-end"
      data-load
      style={{ "--d": "300ms" } as React.CSSProperties}
    >
      <BlueMark
        id="hero-mark"
        className="h-full w-auto max-w-full overflow-visible"
      />
    </figure>
  );
}
