import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lastUpdated: 1_800_000_000 as number | null,
  localizedTimestamp: vi.fn(),
}));

vi.mock("@/hooks/useLeaderboard", () => ({
  useLeaderboard: () => ({
    data: [],
    loading: false,
    error: null,
    lastUpdated: mocks.lastUpdated,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => ({ publicKey: null }),
}));

vi.mock("@/components/ui/LocalizedTimestamp", () => ({
  default: (props: { timestamp: number; mode?: string }) => {
    mocks.localizedTimestamp(props);
    return props.mode === "relative" ? "5 minutes ago" : "localized timestamp";
  },
}));

import LeaderboardPage from "@/app/leaderboard/page";

describe("LeaderboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lastUpdated = 1_800_000_000;
  });

  it("renders relative and absolute localized refresh timestamps", () => {
    render(<LeaderboardPage />);

    expect(screen.getByText(/^Updated 5 minutes ago$/)).toBeInTheDocument();
    expect(
      screen.getByText(/^Last updated: localized timestamp$/)
    ).toBeInTheDocument();

    const props = mocks.localizedTimestamp.mock.calls.map(([value]) => value);
    expect(props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          timestamp: 1_800_000_000,
          mode: "relative",
        }),
        expect.objectContaining({ timestamp: 1_800_000_000 }),
      ])
    );
  });

  it("hides timestamp labels before any successful refresh", () => {
    mocks.lastUpdated = null;
    render(<LeaderboardPage />);

    expect(screen.queryByText(/^Last updated:/)).not.toBeInTheDocument();
    expect(mocks.localizedTimestamp).not.toHaveBeenCalled();
  });
});
