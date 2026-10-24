"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type CSSProperties, type ReactElement, type ReactNode } from "react";

type Heading = "h1" | "h2" | "h3";

interface TitleFxProps {
  as?: Heading;
  id?: string;
  className?: string;
  /** Lets the section's Reveal rise the whole title as well. */
  "data-reveal"?: boolean;
  children: ReactNode;
}

/**
 * Cuts a heading into words, each wrapped in a mask. Words keep the styling of the element they sat
 * in, so a coloured span inside a title still reads as one.
 */
function words(node: ReactNode, counter: { n: number }, inherit?: string): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === "string") {
      return child.split(/(\s+)/).map((part, k) =>
        part === "" || /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={k} className="fx-word">
            <span className={inherit ? `fx-word-in ${inherit}` : "fx-word-in"} style={{ "--w": counter.n++ } as CSSProperties}>
              {part}
            </span>
          </span>
        ),
      );
    }
    if (isValidElement(child)) {
      const el = child as ReactElement<{ className?: string; children?: ReactNode }>;
      // The wrapper gives its class to its words (a gradient, a colour), so the clip stays on the text.
      return cloneElement(el, { className: undefined }, words(el.props.children, counter, el.props.className ?? inherit));
    }
    return child;
  });
}

/**
 * A section title whose words rise out of a mask one after another the first time it is seen.
 * Without script, or under reduced motion, it is plain text.
 */
export function TitleFx({ as: Tag = "h2", id, className, children, ...rest }: TitleFxProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.fx = "in";
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} id={id} className={className} data-fx="out" data-reveal={rest["data-reveal"] ? "" : undefined}>
      {words(children, { n: 0 })}
    </Tag>
  );
}
