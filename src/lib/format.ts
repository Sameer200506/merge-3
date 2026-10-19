/**
 * Display formatters shared across modules. Centralized so currency / dates /
 * durations render consistently everywhere and adapt to locale where sensible.
 */

export function formatCurrency(value: number, currency = "USD", opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    ...opts,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Seconds → "1h 30m" / "45m" / "30s". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

/** Seconds → decimal hours, e.g. 5400 → "1.5". */
export function hoursFromSeconds(seconds: number): number {
  return +(seconds / 3600).toFixed(2);
}

/** Live "3h ago" / "in 2d" relative to now. */
export function formatRelative(date: string | Date, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - now.getTime();
  const absSec = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secs] of units) {
    if (absSec >= secs || unit === "second") {
      const value = Math.round(diff / 1000 / secs);
      return rtf.format(value, unit);
    }
  }
  return "just now";
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** ISO week start (Monday) for a given date. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
