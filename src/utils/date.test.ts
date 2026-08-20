import { formatLeaderboardTimestamp } from "./date";

describe("Leaderboard Timestamp Utilities", () => {
  it("returns empty string for empty or invalid input", () => {
    expect(formatLeaderboardTimestamp("")).toBe("");
    expect(formatLeaderboardTimestamp("not-a-date")).toBe("");
  });

  it("formats the same instant in the requested local timezone", () => {
    const instant = "2026-08-06T12:00:00Z";
    const utc = formatLeaderboardTimestamp(instant, { locale: "en-US", timeZone: "UTC" });
    const newYork = formatLeaderboardTimestamp(instant, { locale: "en-US", timeZone: "America/New_York" });
    expect(utc).toContain("12:00 PM");
    expect(newYork).toContain("08:00 AM");
  });
});
