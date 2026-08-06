// ── Pure Utility Functions ───────────────────────────────────────────────────

const STROOPS_PER_XLM = 10_000_000n;
const MILLISECOND_TIMESTAMP_THRESHOLD = 4_102_444_800;
const MAX_DATE_TIMESTAMP_MS = 8_640_000_000_000_000;
const INVALID_TIMESTAMP = "—";

/** Convert stroops (bigint) to a human-readable XLM string. */
export function formatXLM(stroops: bigint): string {
  const isNegative = stroops < 0n;
  const abs = isNegative ? -stroops : stroops;
  const whole = abs / STROOPS_PER_XLM;
  const fractional = abs % STROOPS_PER_XLM;
  const fracStr = fractional.toString().padStart(7, "0").replace(/0+$/, "");
  const sign = isNegative ? "-" : "";

  return fracStr.length === 0
    ? `${sign}${whole} XLM`
    : `${sign}${whole}.${fracStr} XLM`;
}

/** Format a number that is already expressed in XLM. */
export function displayXLM(xlm: number): string {
  if (xlm === 0) return "0 XLM";
  const formatted = xlm.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted} XLM`;
}

/** Truncate a Stellar address for display. */
export function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/** Validate a bet amount against the minimum and the user's balance. */
export function isValidAmount(amount: string, balance: number): boolean {
  const parsed = parseFloat(amount);
  if (Number.isNaN(parsed) || parsed < 1) return false;
  return parsed <= balance;
}

/** Return a human-readable duration until a Unix-seconds timestamp. */
export function timeUntil(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86_400);
  const hours = Math.floor((diff % 86_400) / 3_600);
  const minutes = Math.floor((diff % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${diff}s`;
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
};

/**
 * Normalize a positive Unix timestamp supplied in seconds or milliseconds.
 * Values below MILLISECOND_TIMESTAMP_THRESHOLD (~year 2100 in seconds)
 * are treated as seconds; larger values are treated as milliseconds.
 * Returns NaN for invalid/out-of-range timestamps.
 */
export function toTimestampMs(timestamp: number): number {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Number.NaN;
  const timestampMs =
    timestamp < MILLISECOND_TIMESTAMP_THRESHOLD
      ? timestamp * 1_000
      : timestamp;
  return timestampMs <= MAX_DATE_TIMESTAMP_MS ? timestampMs : Number.NaN;
}

/**
 * Format a Unix timestamp (seconds or milliseconds) to a locale-aware
 * date/time string using the viewer's browser locale and timezone.
 *
 * Example (en-GB): "12 Jul 2026, 14:30 BST"
 * Example (en-US): "Jul 12, 2026, 10:30 AM EDT"
 */
export function formatDate(
  timestamp: number,
  locale?: Intl.LocalesArgument,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const timestampMs = toTimestampMs(timestamp);
  if (!Number.isFinite(timestampMs)) return INVALID_TIMESTAMP;

  return new Intl.DateTimeFormat(locale, {
    ...DATE_TIME_OPTIONS,
    ...options,
  }).format(new Date(timestampMs));
}

/**
 * Format a Unix timestamp (seconds or milliseconds) to a locale-aware time-only
 * string with its timezone label.
 */
export function formatTime(
  timestamp: number,
  locale?: Intl.LocalesArgument,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const timestampMs = toTimestampMs(timestamp);
  if (!Number.isFinite(timestampMs)) return INVALID_TIMESTAMP;

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    ...options,
  }).format(new Date(timestampMs));
}

/**
 * Format a timestamp relative to now, accepting seconds or milliseconds.
 * Uses Intl.RelativeTimeFormat for locale-aware output.
 *
 * Examples: "2 hours ago", "3 days ago", "just now"
 */
export function timeAgo(
  timestamp: number,
  locale?: Intl.LocalesArgument
): string {
  const timestampMs = toTimestampMs(timestamp);
  if (!Number.isFinite(timestampMs)) return INVALID_TIMESTAMP;

  const diffSeconds = (timestampMs - Date.now()) / 1_000;
  const absoluteSeconds = Math.abs(diffSeconds);
  if (absoluteSeconds < 5) return "just now";

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, unitSeconds] =
    units.find(([, seconds]) => absoluteSeconds >= seconds) ?? units[6];

  const value =
    Math.sign(diffSeconds) * Math.round(absoluteSeconds / unitSeconds);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    value,
    unit
  );
}

/**
 * Format an event timestamp (already in milliseconds) to a locale-aware
 * date+time string. Unlike formatDate, this does NOT apply second→ms conversion.
 *
 * Use this for MarketEvent.timestamp — it is already in milliseconds.
 */
export function formatEventTime(timestampMs: number): string {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0)
    return INVALID_TIMESTAMP;
  return new Intl.DateTimeFormat(undefined, DATE_TIME_OPTIONS).format(
    new Date(timestampMs)
  );
}

/**
 * Calculate a winner's payout from a prediction market.
 *
 * payout = (userNetBet / winningSideTotal) * totalPool
 *
 * All values in XLM (not stroops).
 */
export function calculatePayout(
  userNetBet: number,
  winningSideTotal: number,
  totalPool: number
): number {
  if (winningSideTotal <= 0) return 0;
  return (userNetBet / winningSideTotal) * totalPool;
}

/**
 * Calculate YES/NO odds percentages from net totals.
 * Returns { yesPercent, noPercent } — each 0-0.
 */
export function calculateOdds(
  totalYes: number,
  totalNo: number
): { yesPercent: number; noPercent: number } {
  const total = totalYes + totalNo;
  if (total <= 0) return { yesPercent: 50, noPercent: 50 };
  const yesPercent = Math.round((totalYes / total) * 100);
  return { yesPercent, noPercent: 100 - yesPercent };
}

/** Convert basis points to a percentage string. */
export function bpsToPercent(bps: number): string {
  return `${bps / 100}%`;
}

/** Build a Stellar Expert explorer URL for transactions, accounts, or contracts. */
export function explorerUrl(
  type: "tx" | "account" | "contract",
  id: string,
  network: "public" | "testnet" = "public"
): string {
  const base =
    network === "testnet"
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";
  return `${base}/${type}/${id}`;
}