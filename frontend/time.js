(function (global) {
  "use strict";

  const DEFAULT_LOCALE = "en-US";
  const DEFAULT_TIME_ZONE = "UTC";

  function browserLocale() {
    if (typeof document !== "undefined" && document.documentElement?.lang) {
      return document.documentElement.lang;
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return DEFAULT_LOCALE;
  }

  function browserTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
    } catch {
      return DEFAULT_TIME_ZONE;
    }
  }

  function validDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatLocalDateTime(value, options = {}) {
    const date = validDate(value);
    if (!date) return "";
    const locale = options.locale || browserLocale();
    const timeZone = options.timeZone || browserTimeZone();
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(options.includeSeconds ? { second: "2-digit" } : {}),
      timeZone,
    }).format(date);
  }

  function formatLocalTime(value, options = {}) {
    const date = validDate(value);
    if (!date) return "";
    const locale = options.locale || browserLocale();
    const timeZone = options.timeZone || browserTimeZone();
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      ...(options.includeSeconds ? { second: "2-digit" } : {}),
      timeZone,
    }).format(date);
  }

  global.SPulseDate = Object.freeze({
    formatLocalDateTime,
    formatLocalTime,
    timeZone: browserTimeZone,
  });
})(globalThis);
