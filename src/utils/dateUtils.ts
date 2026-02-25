/**
 * Timezone utility for consistent PKT (Asia/Karachi) formatting
 * across the entire frontend application
 */

const PKT_TIMEZONE = "Asia/Karachi";

/**
 * Format date to locale string with PKT timezone
 * @param date Date object or date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string in PKT
 */
export const formatDatePKT = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  // Handle ISO strings with timezone offset (e.g., "2026-02-17T17:25:00+00:00")
  let dateObj: Date;
  if (typeof date === "string") {
    // Replace space with T and parse
    const normalized = date.replace(" ", "T");
    dateObj = new Date(normalized);
  } else {
    dateObj = date;
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PKT_TIMEZONE,
    ...options,
  };
  return dateObj.toLocaleString("en-US", defaultOptions);
};

/**
 * Format time only with PKT timezone
 * @param date Date object or date string (with or without timezone)
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted time string in PKT
 */
export const formatTimePKT = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  // Handle ISO strings with timezone offset (e.g., "2026-02-17T17:25:00+00:00")
  let dateObj: Date;
  if (typeof date === "string") {
    const normalized = date.replace(" ", "T");
    dateObj = new Date(normalized);
  } else {
    dateObj = date;
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PKT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };
  return dateObj.toLocaleTimeString("en-US", defaultOptions);
};

/**
 * Format date only with PKT timezone
 * @param date Date object or date string (with or without timezone)
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string in PKT
 */
export const formatDateOnlyPKT = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  // Handle ISO strings with timezone offset (e.g., "2026-02-17T17:25:00+00:00")
  let dateObj: Date;
  if (typeof date === "string") {
    const normalized = date.replace(" ", "T");
    dateObj = new Date(normalized);
  } else {
    dateObj = date;
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  };
  return dateObj.toLocaleDateString("en-US", defaultOptions);
};

/**
 * Format date with custom locale options in PKT
 * @param date Date object or date string (with or without timezone)
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted string in PKT
 */
export const formatPKT = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions
): string => {
  // Handle ISO strings with timezone offset (e.g., "2026-02-17T17:25:00+00:00")
  let dateObj: Date;
  if (typeof date === "string") {
    const normalized = date.replace(" ", "T");
    dateObj = new Date(normalized);
  } else {
    dateObj = date;
  }
  
  return dateObj.toLocaleString("en-US", {
    timeZone: PKT_TIMEZONE,
    ...options,
  });
};

/**
 * Convert a Date object to YYYY-MM-DD string in PKT timezone
 * Properly handles timezone conversion without UTC conversion issues
 * @param date Date object to convert
 * @returns Date string in YYYY-MM-DD format (PKT)
 */
export const getDateStringPKT = (date: Date): string => {
  const pktString = date.toLocaleDateString("en-US", {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // pktString format is "MM/DD/YYYY", convert to "YYYY-MM-DD"
  const [month, day, year] = pktString.split("/");
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date string in YYYY-MM-DD format (PKT timezone)
 */
export const getTodayPKT = (): string => {
  return getDateStringPKT(new Date());
};

/**
 * Convert local datetime-local input to PKT ISO string WITH timezone offset for CREATE operations
 * Used for sending NEW entries - backend receives with explicit PKT timezone
 * @param localDateTimeString datetime-local value (e.g., "2026-02-12T14:30")
 * @returns ISO format with +05:00 PKT offset (e.g., "2026-02-12T14:30:00+05:00")
 */
export const localDateTimeToPKTISO = (localDateTimeString: string): string => {
  // Parse the datetime-local value (already in user's local time representation)
  const [date, time] = localDateTimeString.split("T");
  const [year, month, day] = date.split("-");
  const [hours, minutes] = time.split(":")
  
  // Create ISO string WITH PKT timezone offset (+05:00)
  // This ensures the backend knows the times are explicitly in PKT, not UTC
  const isoString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:00`;
  return isoString;
};

/**
 * DEPRECATED: Use localDateTimeToPKTISO() instead
 * Both CREATE and UPDATE operations now use the same conversion with +05:00 offset
 * This function is kept for backward compatibility
 */
export const localDateTimeToPKTISOWithOffset = (localDateTimeString: string): string => {
  return localDateTimeToPKTISO(localDateTimeString);
};

/**
 * Get current time as PKT ISO string for form initialization
 * @returns datetime-local format string (YYYY-MM-DDTHH:mm)
 */
export const getNowPKTForForm = (): string => {
  const now = new Date();
  const pktString = now.toLocaleString("en-US", {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  
  const [datePart, timePart] = pktString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hours, minutes] = timePart.split(":");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert backend ISO string (with timezone) to datetime-local input format
 * Since backend returns times with +05:00 offset (which IS PKT), just extract the datetime part
 * @param isoString Backend time string (e.g., "2026-02-12T14:30:00+05:00")
 * @returns datetime-local format string (YYYY-MM-DDTHH:mm) in PKT
 */
export const backendISOToDatetimeLocal = (isoString: string): string => {
  if (!isoString) return "";
  
  // Simply extract the datetime part up to the timezone offset
  // ISO format: "2026-02-17T10:30:00+05:00" or "2026-02-17T10:30:00.000+05:00"
  // We want: "2026-02-17T10:30"
  const dateTimePart = isoString.split("+")[0];  // Remove +05:00 
  const dateTime = dateTimePart.split(".")[0];   // Remove milliseconds if present
  
  // Return YYYY-MM-DDTHH:mm format
  return dateTime.substring(0, 16);
};

/**
 * Check if date is today (in PKT timezone)
 */
export const isToday = (isoString?: string): boolean => {
  if (!isoString) return false;
  const date = new Date(isoString);
  const pktDate = new Date(date.toLocaleString("en-US", { timeZone: PKT_TIMEZONE }));
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: PKT_TIMEZONE }));
  return pktDate.toLocaleDateString() === today.toLocaleDateString();
};

/**
 * Check if date is in the future (compared to today in PKT timezone)
 */
export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const pktDate = new Date(date.toLocaleString("en-US", { timeZone: PKT_TIMEZONE }));
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: PKT_TIMEZONE }));
  pktDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return pktDate > today;
};
/**
 * Get current time as PKT ISO string with timezone offset
 * Used for sending check-in/check-out times to backend
 * @returns ISO string with +05:00 offset (e.g., "2026-02-17T14:30:45+05:00")
 */
export const getNowPKTISO = (): string => {
  const now = new Date();
  const pktString = now.toLocaleString("en-US", {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  
  const [datePart, timePart] = pktString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hours, minutes, seconds] = timePart.split(":");
  
  // Return ISO string with PKT timezone offset (+05:00)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:00`;
};

/**
 * Format a naive PKT datetime string (from database) for display
 * The datetime is already in PKT - no timezone conversion needed
 * @param isoString ISO datetime string (with or without timezone, e.g., "2026-02-17T03:53:38" or "2026-02-17T03:53:38+00:00")
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export const formatPKTLocalTime = (
  isoString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!isoString) return "";
  
  // Normalize the input: strip timezone information and fix spacing
  // Handle formats like:
  // - "2026-02-17T03:53:38" (naive with T separator)
  // - "2026-02-17 03:53:38" (naive with space separator) 
  // - "2026-02-17T03:53:38+00:00" (with timezone)
  // - "2026-02-17 17:25:00+00" (with space and short timezone)
  
  // Replace space with T to normalize format
  let normalized = isoString.replace(" ", "T");
  
  // Strip timezone information (anything after + or -)
  // But be careful: dates like "2026-02-17" have hyphens, so only strip timezone
  // Timezones appear after the time part (after the last colon and 2 digits)
  const timezoneMatch = normalized.match(/[+-]\d{2}:?\d{2}$|Z$/);
  if (timezoneMatch) {
    normalized = normalized.substring(0, normalized.length - timezoneMatch[0].length);
  }
  
  // Parse the normalized ISO string as local PKT time (no timezone conversion)
  const [datePart, timePart] = normalized.split("T");
  if (!datePart || !timePart) return "";
  
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, secondsStr] = timePart.split(":").map(Number);
  const seconds = Math.floor(secondsStr);
  
  if (!year || !month || !day) return "";
  
  // Create date assuming it's already in PKT (don't let JS interpret as UTC)
  // We fake the timezone conversion by adjusting the UTC values
  // PKT is UTC+5, so we subtract 5 hours to get the UTC equivalent
  // that will display as our PKT time
  const dateInUTC = new Date(Date.UTC(year, month - 1, day, hours - 5, minutes, seconds));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PKT_TIMEZONE,
    ...options,
  };
  return dateInUTC.toLocaleString("en-US", defaultOptions);
};

/**
 * Format only time part of a naive PKT datetime string
 * @param isoString ISO datetime string (with or without timezone, e.g., "2026-02-17T03:53:38" or "2026-02-17T03:53:38+00:00")
 * @returns Formatted time (e.g., "03:53 AM")
 */
export const formatPKTLocalTimeOnly = (isoString: string): string => {
  if (!isoString) return "";
  
  // Normalize: replace space with T and strip timezone
  let normalized = isoString.replace(" ", "T");
  const timezoneMatch = normalized.match(/[+-]\d{2}:?\d{2}$|Z$/);
  if (timezoneMatch) {
    normalized = normalized.substring(0, normalized.length - timezoneMatch[0].length);
  }
  
  // Extract time part directly from the normalized ISO string
  const timePart = normalized.split("T")[1];
  if (!timePart) return "";
  
  const [hours, minutes] = timePart.split(":").map(Number);
  
  // Format as 12-hour time
  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  const minuteStr = minutes.toString().padStart(2, "0");
  
  return `${hour12}:${minuteStr} ${period}`;
};

/**
 * Format only date part of a naive PKT datetime string
 * @param isoString ISO datetime string (with or without timezone, e.g., "2026-02-17T03:53:38" or "2026-02-17T03:53:38+00:00")
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date
 */
export const formatPKTLocalDateOnly = (
  isoString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!isoString) return "";
  
  // Normalize: replace space with T and strip timezone
  let normalized = isoString.replace(" ", "T");
  const timezoneMatch = normalized.match(/[+-]\d{2}:?\d{2}$|Z$/);
  if (timezoneMatch) {
    normalized = normalized.substring(0, normalized.length - timezoneMatch[0].length);
  }
  
  const datePart = normalized.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  
  if (!year || !month || !day) return "";
  
  // Create UTC date that will appear as PKT date
  const dateInUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  };
  
  return dateInUTC.toLocaleString("en-US", defaultOptions);
};

/**
 * Convert decimal hours to "Xh Ym" format
 * Shows only minutes if hours are zero (e.g., 0.5 → "30m", not "0h 30m")
 * @param decimalHours - Duration in decimal hours (e.g., 2.5 = 2h 30m)
 * @returns Formatted string like "2h 30m", "30m", or "2h"
 */
export const formatHoursAsHoursMinutes = (decimalHours: number): string => {
  if (!decimalHours || decimalHours === 0) return "0m";
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  // Handle case where rounding minutes = 60
  if (minutes === 60) {
    return `${hours + 1}h`;
  }
  
  // If only minutes (no hours), show just minutes
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  // If no minutes, show just hours
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
};