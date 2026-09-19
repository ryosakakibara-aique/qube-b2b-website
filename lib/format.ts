/**
 * Formats a database timestamp for the CMS.
 *
 * UTC is stated explicitly rather than relying on the server's zone, so an editor never has to
 * guess which timezone a date is in.
 */
export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return `${date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;
}
