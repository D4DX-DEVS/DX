"use client";

import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/actions/admin/media";
import type { MediaInput } from "@/lib/schemas/admin";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** Opens the file picker, uploads each file to R2 and hands back the stored images in one call. */
export function useImageUpload(onUploaded: (media: MediaInput[]) => void, defaultAlt = "") {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const uploaded: MediaInput[] = [];
      for (const file of list) {
        const form = new FormData();
        form.set("file", file);
        form.set("alt", defaultAlt);
        const result = await uploadImage(form);
        if (result.ok) uploaded.push(result.media);
        else toast.error(`${file.name}: ${result.message}`);
      }
      if (uploaded.length) onUploaded(uploaded);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const input = (multiple = false) => (
    <input ref={inputRef} type="file" accept={ACCEPT} multiple={multiple} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFiles(e.target.files)} />
  );
  return { busy, open: () => inputRef.current?.click(), input };
}

interface ImageFieldProps {
  id: string;
  value: MediaInput | null;
  onChange: (value: MediaInput | null) => void;
  /** Alt text suggested for a new upload (usually the record's title). */
  defaultAlt?: string;
  invalid?: boolean;
  /** Tall for portraits, wide for covers. */
  aspect?: "wide" | "portrait";
}

export function ImageField({ id, value, onChange, defaultAlt = "", invalid, aspect = "wide" }: ImageFieldProps) {
  const altId = useId();
  const { busy, open, input } = useImageUpload((media) => onChange(media[media.length - 1]), defaultAlt);

  return (
    <div className="flex flex-col gap-3">
      {input()}
      {value ? (
        <div className={cn("relative overflow-hidden rounded-xl border border-border bg-raised-2", aspect === "wide" ? "aspect-[16/10] max-w-md" : "aspect-[4/5] max-w-56")}>
          <Image src={value.url} alt={value.alt} fill sizes="448px" className="object-cover" placeholder={value.blur ? "blur" : "empty"} blurDataURL={value.blur || undefined} />
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={open}
          disabled={busy}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={cn(
            "flex min-h-40 max-w-md flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-raised-2/50 px-4 text-sm text-soft transition-colors",
            "hover:border-brand hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            invalid && "border-destructive",
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-5" aria-hidden="true" />}
          {busy ? "Uploading…" : "Upload an image (JPG, PNG, WebP or AVIF, up to 8 MB)"}
        </button>
      )}
      {value ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button id={id} type="button" variant="outline" size="sm" onClick={open} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
              {busy ? "Uploading…" : "Replace"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={busy}>
              <X className="size-4" aria-hidden="true" />
              Remove
            </Button>
          </div>
          <div className="flex max-w-md flex-col gap-1.5">
            <label htmlFor={altId} className="text-sm text-soft">
              Alt text (describe the picture for screen readers)
            </label>
            <Input id={altId} value={value.alt} maxLength={200} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
          </div>
        </>
      ) : null}
    </div>
  );
}
