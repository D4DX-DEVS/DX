"use client";

import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MediaInput } from "@/lib/schemas/admin";
import { useImageUpload } from "./image-field";

interface GalleryFieldProps {
  id: string;
  value: MediaInput[];
  onChange: (value: MediaInput[]) => void;
  defaultAlt?: string;
  max?: number;
}

/** An ordered list of images: upload several at once, reorder, edit alt text, remove. */
export function GalleryField({ id, value, onChange, defaultAlt = "", max = 30 }: GalleryFieldProps) {
  const { busy, open, input } = useImageUpload((media) => onChange([...value, ...media].slice(0, max)), defaultAlt);

  function move(index: number, by: -1 | 1) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {input(true)}
      {value.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((m, i) => (
            <li key={m.url} className="flex flex-col gap-2 rounded-xl border border-border bg-raised-2/40 p-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-raised-2">
                <Image src={m.url} alt={m.alt} fill sizes="320px" className="object-cover" />
                <span className="absolute top-2 left-2 rounded-full bg-ground/80 px-2 py-0.5 text-xs num">{i + 1}</span>
              </div>
              <Input
                value={m.alt}
                maxLength={200}
                placeholder="Alt text"
                aria-label={`Alt text for image ${i + 1}`}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move image ${i + 1} earlier`}>
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move image ${i + 1} later`}>
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`}>
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-soft">No gallery images yet.</p>
      )}
      <div>
        <Button id={id} type="button" variant="outline" onClick={open} disabled={busy || value.length >= max}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
          {busy ? "Uploading…" : "Add images"}
        </Button>
      </div>
    </div>
  );
}
