import { formatLeaderboardTimestamp } from './date';

describe('Leaderboard Timestamp Utilities', () => {
  it('should return empty string for empty input', () => {
    expect(formatLeaderboardTimestamp('')).toBe('');
  });

  it('should format valid timestamp', () => {
    const res = formatLeaderboardTimestamp('2026-08-06T12:00:00Z');
    expect(res).toBeTruthy();
  });
});
