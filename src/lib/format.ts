/** Compact date for admin tables: "5 Dec 2025". Empty when there is no date. */
export function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
}

/** Date and time for inbox entries: "5 Dec 2025, 3:40 pm". */
export function dateTime(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : "";
}

/** A stored ISO date as the site shows it: "5 December 2025". Empty when there is no date. */
export function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
}
