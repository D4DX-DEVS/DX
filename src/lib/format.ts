/** A stored ISO date as the site shows it: "5 December 2025". Empty when there is no date. */
export function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
}
