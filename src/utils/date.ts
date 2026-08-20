export interface LeaderboardTimestampOptions {
  locale?: string;
  timeZone?: string;
}

function defaultLocale(): string {
  return typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
}

function defaultTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatLeaderboardTimestamp(
  timestamp: string | number | Date,
  options: LeaderboardTimestampOptions = {},
): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(options.locale || defaultLocale(), {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: options.timeZone || defaultTimeZone(),
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
