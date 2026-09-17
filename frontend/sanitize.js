/**
 * Defense-in-depth HTML and URL sanitization helpers.
 * Prevents stored and DOM-based Cross-Site Scripting (XSS).
 */

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeUrl(url) {
  if (!url) return "#";
  const trimmed = String(url).trim();
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return "#";
  }
  if (/^(?:https?:\/\/|\/|#)/i.test(trimmed)) {
    return trimmed;
  }
  return "#";
}

if (typeof window !== "undefined") {
  window.escapeHtml = escapeHtml;
  window.sanitizeUrl = sanitizeUrl;
}
