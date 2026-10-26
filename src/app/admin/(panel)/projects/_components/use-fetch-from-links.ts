"use client";

import { useState } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import { importFromLinks } from "@/lib/actions/admin/import-links";
import type { ProjectInput } from "@/lib/schemas/admin";

/** Brings a project's icon, screenshots and a designed cover from its store and website links into the form (filling only what is empty). */
export function useFetchFromLinks(
  getValues: UseFormGetValues<ProjectInput>,
  setValue: UseFormSetValue<ProjectInput>,
) {
  const [fetching, setFetching] = useState(false);

  async function fetchFromLinks() {
    setFetching(true);
    try {
      const links = getValues("links");
      const result = await importFromLinks({
        playStore: links.playStore,
        appStore: links.appStore,
        website: links.website,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const a = result.assets;
      const mark = { shouldDirty: true, shouldValidate: true };
      const added: string[] = [];
      if (a.icon && !getValues("icon")) {
        setValue("icon", a.icon, mark);
        added.push("the icon");
      }
      if (a.cover && !getValues("cover")) {
        setValue("cover", a.cover, mark);
        added.push("a cover");
      }
      if (a.gallery.length > 0 && getValues("gallery").length === 0) {
        setValue("gallery", a.gallery, mark);
        added.push(
          `${a.gallery.length} screenshot${a.gallery.length === 1 ? "" : "s"}`,
        );
      }
      if (a.title && !getValues("title").trim())
        setValue("title", a.title, mark);
      if (a.summary && !getValues("summary").trim())
        setValue("summary", a.summary.slice(0, 320), mark);
      setValue(
        "platforms",
        Array.from(new Set([...getValues("platforms"), ...a.platforms])),
        mark,
      );
      toast.success(
        added.length
          ? `Added ${added.join(", ")}. Check them, then save.`
          : "Those fields already have pictures, so nothing was replaced. Clear a field to fetch it again.",
      );
    } finally {
      setFetching(false);
    }
  }

  return { fetching, fetchFromLinks };
}
