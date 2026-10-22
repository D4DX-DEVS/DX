"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CtaOption {
  slug: string;
  word: string;
}

interface CtaPickerProps {
  options: CtaOption[];
  whatsapp: string;
}

/**
 * "Your app x D4DX": the visitor picks what they are building, and the headline, the
 * contact form and a pre-written WhatsApp message follow. Without script it reads "app"
 * and both links still work.
 */
export function CtaPicker({ options, whatsapp }: CtaPickerProps) {
  const [selected, setSelected] = useState(options[0]?.slug ?? "");
  const current = options.find((o) => o.slug === selected) ?? options[0];
  const word = current?.word ?? "project";
  const message = `Hello D4DX, I'd like to talk about a new ${word}.`;
  const phone = whatsapp.replace(/\D/g, "");

  return (
    <div className="flex min-h-[60svh] flex-col">
      <h2 id="cta-title" className="pt-[clamp(4rem,8vw,7rem)] text-[length:var(--step-xl)] leading-[1] font-medium tracking-[-0.035em]">
        <span className="block">
          Your{" "}
          <span key={word} className="inline-block motion-safe:animate-[word-in_480ms_var(--ease-out)]">
            {word}
          </span>
        </span>
        <span className="block">x D4DX</span>
      </h2>

      <fieldset className="mt-10">
        <legend className="text-[0.9375rem] font-medium">What are you building?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.slug}
              type="button"
              aria-pressed={o.slug === selected}
              onClick={() => setSelected(o.slug)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold transition-colors duration-200 active:scale-[0.97]",
                o.slug === selected ? "bg-white text-brand" : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              {o.word}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto flex flex-col gap-6 pt-14 pb-10 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[38ch] text-[length:var(--step-lead)] leading-snug text-white/85">
          Tell us who will use it and what it must do on day one. We will call you back to talk it through.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {phone ? (
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link order-2 inline-flex min-h-11 items-center font-medium whitespace-nowrap sm:order-1"
            >
              Message on WhatsApp
            </a>
          ) : null}
          <Link href={`/contact?type=${encodeURIComponent(current?.slug ?? "")}`} className="btn btn-ink order-1 min-h-12 px-7 sm:order-2">
            Start a project
          </Link>
        </div>
      </div>
    </div>
  );
}
