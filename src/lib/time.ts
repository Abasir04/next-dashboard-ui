// lib/time.ts
// A universal time utility for handling UTC ↔ Local conversions, formatting, and comparisons

/**
 * Converts a local date-time string (e.g. from <input type="datetime-local" />)
 * into an ISO UTC string safe to store in the database.
 */
export function toUTC(localDateString: string): string {
  const localDate = new Date(localDateString);
  return localDate.toISOString(); // Always UTC
}

/**
 * Converts an ISO UTC string (from DB) to the user's local Date object.
 */
export function toLocal(utcDateString: string): Date {
  return new Date(utcDateString); // new Date() auto-adjusts for local time zone
}

/**
 * Formats a UTC string to a nice local date-time string for display.
 */
export function formatLocal(
  utcDateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const localDate = new Date(utcDateString);
  return localDate.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });
}

/**
 * Formats a UTC string to datetime-local input format (YYYY-MM-DDTHH:mm)
 * This is needed to populate <input type="datetime-local" /> fields
 */
export function toDateTimeLocalFormat(utcDateString: string): string {
  const localDate = new Date(utcDateString);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Returns the user's local time zone (e.g., "Africa/Lagos")
 */
export function getUserTimeZone(): string {
  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC"; // fallback for servers
}

/**
 * Checks whether the current time is past a given UTC date string.
 */
export function isPast(utcDateString: string): boolean {
  return new Date(utcDateString).getTime() < Date.now();
}

/**
 * Checks whether the current time is before a given UTC date string.
 */
export function isFuture(utcDateString: string): boolean {
  return new Date(utcDateString).getTime() > Date.now();
}

/**
 * Returns the difference between two UTC times in minutes or hours.
 */
export function getTimeDifference(
  startUTC: string,
  endUTC: string,
  unit: "minutes" | "hours" = "minutes"
): number {
  const diffMs = new Date(endUTC).getTime() - new Date(startUTC).getTime();
  if (unit === "hours") return diffMs / (1000 * 60 * 60);
  return diffMs / (1000 * 60);
}

/**
 * Converts a Date object (or ISO string) to a formatted UTC timestamp for logs or APIs.
 */
export function formatUTC(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

/**
 * Returns a human-friendly relative time string like "in 5 minutes" or "2 hours ago".
 */
export function fromNow(utcDateString: string): string {
  const date = new Date(utcDateString);
  const diffMs = date.getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins === 0) return "now";
  if (diffMins > 0) {
    if (diffMins < 60)
      return `in ${diffMins} minute${diffMins === 1 ? "" : "s"}`;
    return `in ${Math.round(diffMins / 60)} hour${
      Math.round(diffMins / 60) === 1 ? "" : "s"
    }`;
  } else {
    const abs = Math.abs(diffMins);
    if (abs < 60) return `${abs} minute${abs === 1 ? "" : "s"} ago`;
    return `${Math.round(abs / 60)} hour${
      Math.round(abs / 60) === 1 ? "" : "s"
    } ago`;
  }
}

/**
 * Safely converts any timestamp (local or UTC) to a Date object in UTC.
 * Useful when dealing with mixed data sources.
 */
export function ensureUTC(dateInput: string | Date): Date {
  const d = new Date(dateInput);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
}

/**
 * Generates a consistent ISO timestamp string for "now" in UTC.
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Helper to create default times for forms (e.g., 1 hour from now)
 */
export function getDefaultTimes(offsetHours = 1, durationHours = 2) {
  const now = new Date();
  const startTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const endTime = new Date(
    startTime.getTime() + durationHours * 60 * 60 * 1000
  );

  return {
    startTime: toDateTimeLocalFormat(startTime.toISOString()),
    endTime: toDateTimeLocalFormat(endTime.toISOString()),
  };
}
