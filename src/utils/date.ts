export function formatLeaderboardTimestamp(timestamp: string | number | Date): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(navigator.language || 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch (err) {
    return new Date(timestamp).toISOString();
  }
}
