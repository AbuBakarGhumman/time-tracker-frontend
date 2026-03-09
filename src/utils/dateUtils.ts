/**
 * Timezone-aware date utilities for Time Tracker Pro.
 *
 * All formatting functions read the user's timezone from storage (set when
 * settings are loaded / saved).  The PKT-named exports are kept for
 * backward compatibility but now honour the stored preference.
 */

// ─── Storage helpers ──────────────────────────────────────────────────────────

const TZ_STORAGE_KEY = "user_timezone";
const DEFAULT_TIMEZONE = "Asia/Karachi";

/** Persist the user's IANA timezone string (called from Settings on load/save). */
export const setStoredTimezone = (tz: string): void => {
  try {
    localStorage.setItem(TZ_STORAGE_KEY, tz);
    sessionStorage.setItem(TZ_STORAGE_KEY, tz);
  } catch {
    // ignore storage errors
  }
};

/** Read the stored IANA timezone, falling back to Asia/Karachi. */
export const getStoredTimezone = (): string => {
  try {
    return (
      localStorage.getItem(TZ_STORAGE_KEY) ||
      sessionStorage.getItem(TZ_STORAGE_KEY) ||
      DEFAULT_TIMEZONE
    );
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

// ─── UTC-offset map (mirrors backend timezone_utils.py) ──────────────────────

/** Maps IANA timezone names / short aliases → UTC offset in hours. */
const TZ_OFFSETS: Record<string, number> = {
  // Aliases
  PKT: 5, IST: 5.5, GST: 4, GMT: 0,
  // Africa
  "Africa/Cairo": 2, "Africa/Johannesburg": 2, "Africa/Lagos": 1, "Africa/Nairobi": 3,
  // Americas
  "America/Anchorage": -9, "America/Argentina/Buenos_Aires": -3, "America/Bogota": -5,
  "America/Chicago": -6, "America/Denver": -7, "America/Halifax": -4,
  "America/Lima": -5, "America/Los_Angeles": -8, "America/Mexico_City": -6,
  "America/New_York": -5, "America/Phoenix": -7, "America/Sao_Paulo": -3,
  "America/Toronto": -5, "America/Vancouver": -8,
  // Asia
  "Asia/Baghdad": 3, "Asia/Bangkok": 7, "Asia/Colombo": 5.5, "Asia/Dhaka": 6,
  "Asia/Dubai": 4, "Asia/Ho_Chi_Minh": 7, "Asia/Hong_Kong": 8, "Asia/Jakarta": 7,
  "Asia/Karachi": 5, "Asia/Kathmandu": 5.75, "Asia/Kolkata": 5.5,
  "Asia/Kuala_Lumpur": 8, "Asia/Kuwait": 3, "Asia/Manila": 8, "Asia/Muscat": 4,
  "Asia/Riyadh": 3, "Asia/Seoul": 9, "Asia/Shanghai": 8, "Asia/Singapore": 8,
  "Asia/Taipei": 8, "Asia/Tashkent": 5, "Asia/Tehran": 3.5, "Asia/Tokyo": 9,
  // Atlantic
  "Atlantic/Reykjavik": 0,
  // Australia
  "Australia/Adelaide": 9.5, "Australia/Brisbane": 10, "Australia/Darwin": 9.5,
  "Australia/Melbourne": 10, "Australia/Perth": 8, "Australia/Sydney": 10,
  // Europe
  "Europe/Amsterdam": 1, "Europe/Athens": 2, "Europe/Berlin": 1,
  "Europe/Brussels": 1, "Europe/Bucharest": 2, "Europe/Budapest": 1,
  "Europe/Copenhagen": 1, "Europe/Dublin": 0, "Europe/Helsinki": 2,
  "Europe/Istanbul": 3, "Europe/Kiev": 2, "Europe/Lisbon": 0, "Europe/London": 0,
  "Europe/Madrid": 1, "Europe/Moscow": 3, "Europe/Oslo": 1, "Europe/Paris": 1,
  "Europe/Prague": 1, "Europe/Rome": 1, "Europe/Stockholm": 1,
  "Europe/Warsaw": 1, "Europe/Zurich": 1,
  // Pacific
  "Pacific/Auckland": 12, "Pacific/Fiji": 12, "Pacific/Honolulu": -10,
  // UTC
  UTC: 0,
};

/** Get UTC offset (hours) for a timezone string. Returns 0 for unknown. */
export const getTzOffsetHours = (tz: string): number =>
  TZ_OFFSETS[tz] ?? 0;

/**
 * Build an offset string like "+05:00" or "-08:00" for a given IANA timezone.
 */
export const getTzOffsetString = (tz: string): string => {
  const offsetHours = getTzOffsetHours(tz);
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs).toString().padStart(2, "0");
  const m = Math.round((abs % 1) * 60).toString().padStart(2, "0");
  return `${sign}${h}:${m}`;
};

// ─── Core formatting helpers ──────────────────────────────────────────────────

function toDateObj(date: Date | string): Date {
  if (typeof date === "string") {
    return new Date(date.replace(" ", "T"));
  }
  return date;
}

/**
 * Format a Date / ISO string using the user's stored timezone.
 * Pass explicit `tz` to override.
 */
export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  tz?: string
): string => {
  const timeZone = tz ?? getStoredTimezone();
  return toDateObj(date).toLocaleString("en-US", { timeZone, ...options });
};

/** Format time only in the user's stored timezone. */
export const formatTime = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  tz?: string
): string => {
  const timeZone = tz ?? getStoredTimezone();
  return toDateObj(date).toLocaleTimeString("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

/** Format date only in the user's stored timezone. */
export const formatDateOnly = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  tz?: string
): string => {
  const timeZone = tz ?? getStoredTimezone();
  return toDateObj(date).toLocaleDateString("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  });
};

// ─── PKT-named aliases (backward-compatible, now honour stored timezone) ──────

/** @deprecated Use formatDate() */
export const formatDatePKT = (date: Date | string, options?: Intl.DateTimeFormatOptions): string =>
  formatDate(date, options);

/** @deprecated Use formatTime() */
export const formatTimePKT = (date: Date | string, options?: Intl.DateTimeFormatOptions): string =>
  formatTime(date, options);

/** @deprecated Use formatDateOnly() */
export const formatDateOnlyPKT = (date: Date | string, options?: Intl.DateTimeFormatOptions): string =>
  formatDateOnly(date, options);

/** @deprecated Use formatDate() */
export const formatPKT = (date: Date | string, options: Intl.DateTimeFormatOptions): string =>
  formatDate(date, options);

// ─── Date string helpers ──────────────────────────────────────────────────────

/** Convert a Date to YYYY-MM-DD in the user's stored timezone. */
export const getDateString = (date: Date, tz?: string): string => {
  const timeZone = tz ?? getStoredTimezone();
  const s = date.toLocaleDateString("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = s.split("/");
  return `${year}-${month}-${day}`;
};

/** @deprecated Use getDateString() */
export const getDateStringPKT = (date: Date): string => getDateString(date);

/** Today's date as YYYY-MM-DD in the user's stored timezone. */
export const getToday = (tz?: string): string => getDateString(new Date(), tz);

/** @deprecated Use getToday() */
export const getTodayPKT = (): string => getToday();

// ─── Form / ISO helpers ───────────────────────────────────────────────────────

/**
 * Get the current time as a datetime-local string (YYYY-MM-DDTHH:mm)
 * in the user's stored timezone — used to pre-fill form inputs.
 */
export const getNowForForm = (tz?: string): string => {
  const timeZone = tz ?? getStoredTimezone();
  const s = new Date().toLocaleString("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [datePart, timePart] = s.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hours, minutes] = timePart.split(":");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/** @deprecated Use getNowForForm() */
export const getNowPKTForForm = (): string => getNowForForm();

/**
 * Convert a datetime-local input value to an ISO string WITH the user's
 * timezone offset (e.g., "2026-02-12T14:30:00+05:00").
 * Sent to the backend so it knows the intended local time.
 */
export const localDateTimeToISO = (localDateTimeString: string, tz?: string): string => {
  const timeZone = tz ?? getStoredTimezone();
  const offset = getTzOffsetString(timeZone);
  const [date, time] = localDateTimeString.split("T");
  const [year, month, day] = date.split("-");
  const [hours, minutes] = time.split(":");
  return `${year}-${month}-${day}T${hours}:${minutes}:00${offset}`;
};

/** @deprecated Use localDateTimeToISO() */
export const localDateTimeToPKTISO = (s: string): string => localDateTimeToISO(s);

/** @deprecated Use localDateTimeToISO() */
export const localDateTimeToPKTISOWithOffset = (s: string): string => localDateTimeToISO(s);

/**
 * Get current time as an ISO string with the user's timezone offset.
 * Used for check-in/check-out requests.
 */
export const getNowISO = (tz?: string): string => {
  const timeZone = tz ?? getStoredTimezone();
  const s = new Date().toLocaleString("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [datePart, timePart] = s.split(", ");
  const [month, day, year] = datePart.split("/");
  const offset = getTzOffsetString(timeZone);
  return `${year}-${month}-${day}T${timePart}${offset}`;
};

/** @deprecated Use getNowISO() */
export const getNowPKTISO = (): string => getNowISO();

/**
 * Convert a backend ISO string (with offset) to datetime-local format (YYYY-MM-DDTHH:mm).
 * Strips the timezone offset — DB already stores the local time value.
 */
export const backendISOToDatetimeLocal = (isoString: string): string => {
  if (!isoString) return "";
  const clean = isoString.replace(/[+-]\d{2}:\d{2}$/, "").replace(/\.\d+$/, "");
  return clean.substring(0, 16);
};

// ─── Naive datetime display helpers ──────────────────────────────────────────
//
// The DB stores times as naive local-time strings (e.g., "2026-02-17T14:30:00").
// These functions interpret the value AS the user's local time and display it
// without any unwanted UTC conversion.

function _parseNaiveISO(isoString: string): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } | null {
  if (!isoString) return null;
  let normalized = isoString.replace(" ", "T");
  const tzMatch = normalized.match(/[+-]\d{2}:?\d{2}$|Z$/);
  if (tzMatch) normalized = normalized.substring(0, normalized.length - tzMatch[0].length);
  const [datePart, timePart] = normalized.split("T");
  if (!datePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours = 0, minutes = 0, secondsRaw = 0] = (timePart || "").split(":").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day, hours, minutes, seconds: Math.floor(secondsRaw) };
}

/**
 * Display a naive datetime string from the DB in the user's stored timezone.
 * The string is treated as already being in the user's local time.
 */
export const formatLocalTime = (
  isoString: string,
  options?: Intl.DateTimeFormatOptions,
  tz?: string
): string => {
  if (!isoString) return "";
  const parts = _parseNaiveISO(isoString);
  if (!parts) return "";
  const { year, month, day, hours, minutes, seconds } = parts;
  const timeZone = tz ?? getStoredTimezone();
  const offsetHours = getTzOffsetHours(timeZone);
  const offsetMinutes = Math.round(offsetHours * 60);
  const wholeHoursOffset = Math.floor(offsetHours);
  const fractionalMinutesOffset = offsetMinutes - wholeHoursOffset * 60;
  const dateInUTC = new Date(
    Date.UTC(year, month - 1, day, hours - wholeHoursOffset, minutes - fractionalMinutesOffset, seconds)
  );
  return dateInUTC.toLocaleString("en-US", { timeZone, ...options });
};

/** @deprecated Use formatLocalTime() */
export const formatPKTLocalTime = (isoString: string, options?: Intl.DateTimeFormatOptions): string =>
  formatLocalTime(isoString, options);

/** Display only the time portion of a naive datetime string from the DB. */
export const formatLocalTimeOnly = (isoString: string): string => {
  if (!isoString) return "";
  const parts = _parseNaiveISO(isoString);
  if (!parts) return "";
  const { hours, minutes } = parts;
  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

/** @deprecated Use formatLocalTimeOnly() */
export const formatPKTLocalTimeOnly = (isoString: string): string => formatLocalTimeOnly(isoString);

/** Display only the date portion of a naive datetime string from the DB. */
export const formatLocalDateOnly = (
  isoString: string,
  options?: Intl.DateTimeFormatOptions,
  tz?: string
): string => {
  if (!isoString) return "";
  const parts = _parseNaiveISO(isoString);
  if (!parts) return "";
  const { year, month, day } = parts;
  const timeZone = tz ?? getStoredTimezone();
  const dateInUTC = new Date(Date.UTC(year, month - 1, day));
  return dateInUTC.toLocaleString("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  });
};

/** @deprecated Use formatLocalDateOnly() */
export const formatPKTLocalDateOnly = (isoString: string, options?: Intl.DateTimeFormatOptions): string =>
  formatLocalDateOnly(isoString, options);

// ─── Date comparison helpers ──────────────────────────────────────────────────

/** Check if an ISO date string represents today in the user's stored timezone. */
export const isToday = (isoString?: string, tz?: string): boolean => {
  if (!isoString) return false;
  const timeZone = tz ?? getStoredTimezone();
  const d = new Date(new Date(isoString).toLocaleString("en-US", { timeZone }));
  const today = new Date(new Date().toLocaleString("en-US", { timeZone }));
  return d.toLocaleDateString() === today.toLocaleDateString();
};

/** Check if a date string is in the future relative to today in the user's timezone. */
export const isFutureDate = (dateString: string, tz?: string): boolean => {
  const timeZone = tz ?? getStoredTimezone();
  const d = new Date(new Date(dateString).toLocaleString("en-US", { timeZone }));
  const today = new Date(new Date().toLocaleString("en-US", { timeZone }));
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d > today;
};

// ─── Duration helper ──────────────────────────────────────────────────────────

/**
 * Convert decimal hours to a human-readable string like "2h 30m".
 * Shows only minutes when hours are zero (e.g., 0.5 → "30m").
 */
export const formatHoursAsHoursMinutes = (decimalHours: number): string => {
  if (!decimalHours || decimalHours === 0) return "0m";
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  if (minutes === 60) return `${hours + 1}h`;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};
