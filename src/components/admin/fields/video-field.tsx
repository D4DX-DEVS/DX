"use client";

import { Loader2, RefreshCw, Upload, X } from "@/components/icons";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadVideo } from "@/lib/actions/admin/media";

interface VideoFieldProps {
  id: string;
  /** "" when there is no video. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

/** A short preview video: upload an MP4 or WebM to R2, or paste a link. Shown as it will play on the cards (muted, looping). */
export function VideoField({ id, value, onChange, invalid }: VideoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await uploadVideo(form);
      if (result.ok) onChange(result.url);
      else toast.error(`${file.name}: ${result.message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => onFile(e.target.files)}
      />
      {value ? (
        <video
          key={value}
          src={value}
          muted
          loop
          playsInline
          controls
          preload="metadata"
          className="aspect-[4/3] w-full rounded-xl border border-border bg-black object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : value ? (
            <RefreshCw className="size-4" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {busy
            ? "Uploading…"
            : value
              ? "Replace video"
              : "Upload video (MP4 or WebM, up to 25 MB)"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            disabled={busy}
          >
            <X className="size-4" aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>
      <Input
        id={id}
        type="text"
        inputMode="url"
        placeholder="…or paste a link: https://"
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value.trim())}
      />
    </div>
  );
}
