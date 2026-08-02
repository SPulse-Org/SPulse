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
  return fracStr.length === 0 ? sign+whole+" XLM" : sign+whole+"."+fracStr+" XLM";
}

export function displayXLM(xlm: number): string {
  if (xlm === 0) return "0 XLM";
  const formatted = xlm.toFixed(2).replace(/.?0+$/, "");
  return formatted+" XLM";
}

export function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return addr.slice(0, 4)+"..."+addr.slice(-4);
}

export function isValidAmount(amount: string, balance: number): boolean {
  const parsed = parseFloat(amount);
  if (Number.isNaN(parsed) || parsed < 1) return false;
  return parsed <= balance;
}

export function timeUntil(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400);
  const hours = Math.floor((diff % 86_400) / 3_600);
  const minutes = Math.floor((diff % 3_600) / 60);
  if (days > 0) return days+"d "+hours+"h "+minutes+"m";
  if (hours > 0) return hours+"h "+minutes+"m";
  if (minutes > 0) return minutes+"m";
  return diff+"s";
}

export function toTimestampMs(timestamp: number): number {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Number.NaN;
  const ts = timestamp < MILLISECOND_TIMESTAMP_THRESHOLD ? timestamp * 1_000 : timestamp;
  return ts <= MAX_DATE_TIMESTAMP_MS ? ts : Number.NaN;
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric", month: "short", day: "numeric",
  hour: "2-digit", minute: "2-digit", timeZoneName: "short"
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit", minute: "2-digit", timeZoneName: "short"
};

/** Format a timestamp in the viewer's locale timezone — fixes issue #80 */
export function formatDate(timestamp: number, locale?: Intl.LocalesArgument, options: Intl.DateTimeFormatOptions = {}): string {
  const ts = toTimestampMs(timestamp);
  if (!Number.isFinite(ts)) return INVALID_TIMESTAMP;
  return new Intl.DateTimeFormat(locale ?? navigator.language, { ...DATE_TIME_OPTIONS, ...options }).format(new Date(ts));
}

/** Format only the local time portion — fixes issue #80 */
export function formatTime(timestamp: number, locale?: Intl.LocalesArgument, options: Intl.DateTimeFormatOptions = {}): string {
  const ts = toTimestampMs(timestamp);
  if (!Number.isFinite(ts)) return INVALID_TIMESTAMP;
  return new Intl.DateTimeFormat(locale ?? navigator.language, { ...TIME_OPTIONS, ...options }).format(new Date(ts));
}

/** Format relative time — fixes issue #80 */
export function timeAgo(timestamp: number, locale?: Intl.LocalesArgument): string {
  const ts = toTimestampMs(timestamp);
  if (!Number.isFinite(ts)) return INVALID_TIMESTAMP;
  const diffSeconds = (ts - Date.now()) / 1_000;
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 5) return "just now";
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000], ["month", 2_592_000], ["week", 604_800],
    ["day", 86_400], ["hour", 3_600], ["minute", 60], ["second", 1]
  ];
  const [unit, unitSec] = units.find(([, s]) => absSeconds >= s) ?? units[6];
  const value = Math.sign(diffSeconds) * Math.round(absSeconds / unitSec);
  return new Intl.RelativeTimeFormat(locale ?? navigator.language, { numeric: "auto" }).format(value, unit);
}

export function formatEventTime(timestampMs: number): string {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return INVALID_TIMESTAMP;
  return new Date(timestampMs).toLocaleString(navigator.language, DATE_TIME_OPTIONS);
}

export function calculatePayout(userNetBet: number, winningSideTotal: number, totalPool: number): number {
  if (winningSideTotal <= 0) return 0;
  return (userNetBet / winningSideTotal) * totalPool;
}

export function calculateOdds(totalYes: number, totalNo: number): { yesPercent: number; noPercent: number } {
  const total = totalYes + totalNo;
  if (total <= 0) return { yesPercent: 50, noPercent: 50 };
  const yesPercent = Math.round((totalYes / total) * 100);
  return { yesPercent, noPercent: 100 - yesPercent };
}

export function bpsToPercent(bps: number): string { return (bps / 100)+"%"; }

export function explorerUrl(type: "tx" | "account" | "contract", id: string, network: "public" | "testnet" = "public"): string {
  const base = network === "testnet" ? "https://stellar.expert/explorer/testnet" : "https://stellar.expert/explorer/public";
  switch (type) {
    case "tx": return base+"/tx/"+id;
    case "account": return base+"/account/"+id;
    case "contract": return base+"/contract/"+id;
    default: return base;
  }
}
