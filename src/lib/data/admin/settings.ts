import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { first, json } from "@/lib/db";
import type { SettingsData } from "@/lib/models";
import type { SettingsInput } from "@/lib/schemas/admin";

export async function getSettingsForEdit(): Promise<SettingsInput> {
  await requireAdmin();
  const row = await first<{ data: string }>("SELECT data FROM settings WHERE key = 'site'");
  const d = json<SettingsData>(row?.data, {});
  return {
    tagline: d.tagline ?? "",
    email: d.email ?? "",
    careersEmail: d.careersEmail ?? "",
    phone: d.phone ?? "",
    careersPhone: d.careersPhone ?? "",
    whatsapp: d.whatsapp ?? "",
    addressLines: d.addressLines ?? [],
    mapUrl: d.mapUrl ?? "",
    socials: {
      linkedin: d.socials?.linkedin ?? "",
      instagram: d.socials?.instagram ?? "",
      facebook: d.socials?.facebook ?? "",
    },
  };
}
