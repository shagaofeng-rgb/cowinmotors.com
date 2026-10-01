// Vercel cron uses UTC; Monday 02:10 is Monday 10:10 in Shanghai.
export function googleSubmissionWindow(now: Date, lastSubmission?: string | null) {
  const offset = 8 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offset);
  const monday = local.getUTCDay() === 1;
  const todayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset;
  const previous = lastSubmission ? Date.parse(lastSubmission) : NaN;
  const daysUntilMonday = (8 - local.getUTCDay()) % 7 || 7;
  return {
    eligible: monday && !(previous >= todayStart),
    nextScheduledAt: new Date(todayStart + daysUntilMonday * 86_400_000 + 10 * 3_600_000 + 10 * 60_000).toISOString(),
  };
}
