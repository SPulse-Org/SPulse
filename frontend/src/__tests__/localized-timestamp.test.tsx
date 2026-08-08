import React from "react";
import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LocalizedTimestamp from "@/components/ui/LocalizedTimestamp";
import { formatDate, formatTime } from "@/utils/helpers";

const timestamp = Date.UTC(2026, 6, 12, 14, 30) / 1_000;

describe("LocalizedTimestamp", () => {
  it("renders deterministic UTC markup during SSR", () => {
    const expected = formatDate(timestamp, "en-US", { timeZone: "UTC" });
    const html = renderToString(<LocalizedTimestamp timestamp={timestamp} />);

    expect(html).toContain(expected);
    expect(html).toContain('data-time-zone="UTC"');
    expect(html.toLowerCase()).toContain('datetime="2026-07-12t14:30:00.000z"');
  });

  it("hydrates UTC markup before switching to the browser locale and timezone", async () => {
    const serverValue = formatDate(timestamp, "en-US", { timeZone: "UTC" });
    const browserValue = formatDate(timestamp, "es-ES", {
      timeZone: "Europe/Madrid",
    });
    const originalLanguages = Object.getOwnPropertyDescriptor(
      navigator,
      "languages"
    );
    const resolvedOptions = new Intl.DateTimeFormat().resolvedOptions();
    const resolvedOptionsSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockReturnValue({
        ...resolvedOptions,
        locale: "es-ES",
        timeZone: "Europe/Madrid",
      });
    const container = document.createElement("div");
    let root: Root | undefined;

    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["es-ES"],
    });
    container.innerHTML = renderToString(
      <LocalizedTimestamp timestamp={timestamp} />
    );
    document.body.appendChild(container);

    try {
      expect(container).toHaveTextContent(serverValue);

      await act(async () => {
        root = hydrateRoot(
          container,
          <LocalizedTimestamp timestamp={timestamp} />
        );
      });

      await waitFor(() => expect(container).toHaveTextContent(browserValue));
      expect(container.querySelector("time")).toHaveAttribute(
        "data-time-zone",
        "Europe/Madrid"
      );
    } finally {
      if (root) {
        await act(async () => root?.unmount());
      }
      container.remove();
      resolvedOptionsSpy.mockRestore();
      if (originalLanguages) {
        Object.defineProperty(navigator, "languages", originalLanguages);
      } else {
        Reflect.deleteProperty(navigator, "languages");
      }
    }
  });

  it.each([
    ["America/New_York", "en-US"],
    ["Europe/Madrid", "es-ES"],
    ["Asia/Tokyo", "ja-JP"],
  ])("formats the same instant in %s", (timeZone, locale) => {
    const expected = formatDate(timestamp, locale, { timeZone });

    render(
      <LocalizedTimestamp
        timestamp={timestamp}
        locale={locale}
        timeZone={timeZone}
      />
    );

    expect(screen.getByText(expected)).toHaveAttribute(
      "data-time-zone",
      timeZone
    );
  });

  it("supports a time-only view", () => {
    const expected = formatTime(timestamp, "en-GB", {
      timeZone: "Europe/London",
    });

    render(
      <LocalizedTimestamp
        timestamp={timestamp}
        mode="time"
        locale="en-GB"
        timeZone="Europe/London"
      />
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders relative timestamps deterministically when nowMs is supplied", () => {
    const nowMs = Date.UTC(2026, 6, 12, 16, 30);

    render(
      <LocalizedTimestamp
        timestamp={timestamp}
        mode="relative"
        locale="en-US"
        nowMs={nowMs}
      />
    );

    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("renders invalid input as an em dash", () => {
    render(<LocalizedTimestamp timestamp={Number.NaN} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
