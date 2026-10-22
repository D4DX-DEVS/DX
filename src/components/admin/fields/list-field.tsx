"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ListFieldProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  max?: number;
  maxLength?: number;
  invalid?: boolean;
}

/** A short list of text lines (features, points, tags). Enter adds the typed line. */
export function ListField({ id, value, onChange, placeholder, max = 30, maxLength = 200, invalid }: ListFieldProps) {
  const [draft, setDraft] = useState("");

  function add() {
    const text = draft.trim();
    if (!text || value.length >= max) return;
    onChange([...value, text]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                value={item}
                maxLength={maxLength}
                aria-label={`Item ${i + 1}`}
                onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={invalid}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim() || value.length >= max}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>
    </div>
  );
}
