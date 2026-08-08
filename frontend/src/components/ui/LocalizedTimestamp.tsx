"use client";

import React, { useEffect, useState } from "react";
import {
  formatDate,
  formatTime,
  timeAgo,
  toTimestampMs,
} from "@/utils/helpers";

const SERVER_LOCALE = "en-US";
const SERVER_TIME_ZONE = "UTC";

type TimestampMode = "date" | "time" | "relative";

interface FormattingContext {
  locale: string;
  timeZone: string;
}

export interface LocalizedTimestampProps {
  timestamp: number;
  mode?: TimestampMode;
  locale?: string;
  timeZone?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  nowMs?: number;
}

/**
 * Resolve the browser's preferred locale and IANA timezone. Kept behind a
 * function so importing this module during SSR never touches browser globals.
 */
export function getBrowserFormattingContext(): FormattingContext {
  if (typeof navigator === "undefined") {
    return { locale: SERVER_LOCALE, timeZone: SERVER_TIME_ZONE };
  }

  const locale = navigator.languages?.[0] || navigator.language || SERVER_LOCALE;
  let timeZone = SERVER_TIME_ZONE;

  try {
    timeZone =
      new Intl.DateTimeFormat().resolvedOptions().timeZone || SERVER_TIME_ZONE;
  } catch {
    // Keep the deterministic UTC fallback when Intl data is unavailable.
  }

  return { locale, timeZone };
}

/**
 * Hydration-safe timestamp renderer.
 *
 * Server output and the first client render both use en-US/UTC. After mount,
 * the component switches to the viewer's actual locale and timezone. This
 * avoids rendering server-local time into the HTML and prevents hydration
 * mismatches for users outside the server timezone.
 */
export default function LocalizedTimestamp({
  timestamp,
  mode = "date",
  locale,
  timeZone,
  options = {},
  className,
  nowMs,
}: LocalizedTimestampProps) {
  const [context, setContext] = useState<FormattingContext>(() => ({
    locale: locale || SERVER_LOCALE,
    timeZone: timeZone || SERVER_TIME_ZONE,
  }));

  useEffect(() => {
    const browser = getBrowserFormattingContext();
    const next = {
      locale: locale || browser.locale,
      timeZone: timeZone || browser.timeZone,
    };

    setContext((current) =>
      current.locale === next.locale && current.timeZone === next.timeZone
        ? current
        : next
    );
  }, [locale, timeZone]);

  const timestampMs = toTimestampMs(timestamp);
  if (!Number.isFinite(timestampMs)) {
    return <span className={className}>—</span>;
  }

  let value: string;
  if (mode === "relative") {
    value = timeAgo(timestamp, context.locale, nowMs);
  } else {
    const localizedOptions = { ...options, timeZone: context.timeZone };
    value =
      mode === "time"
        ? formatTime(timestamp, context.locale, localizedOptions)
        : formatDate(timestamp, context.locale, localizedOptions);
  }

  return (
    <time
      className={className}
      dateTime={new Date(timestampMs).toISOString()}
      data-time-zone={context.timeZone}
      suppressHydrationWarning
    >
      {value}
    </time>
  );
}
