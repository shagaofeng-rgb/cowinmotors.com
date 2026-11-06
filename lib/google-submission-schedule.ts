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

export type GoogleSubmissionResult = {
  status: "success" | "failed" | "not-configured";
  message: string;
  retryable?: boolean;
};

export function isRetryableGoogleStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

export async function submitGoogleSitemapWithRetry(attempt: () => Promise<GoogleSubmissionResult>, wait = () => new Promise<void>((resolve) => setTimeout(resolve, 1500))) {
  const run = () => attempt().catch((error: unknown): GoogleSubmissionResult => ({
    status: "failed",
    message: "Google Sitemap request failed before a response was confirmed.",
    retryable: error instanceof TypeError || (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)),
  }));
  const first = await run();
  if (first.status !== "failed" || !first.retryable) return { ...first, retries: 0 };
  await wait();
  return { ...await run(), retries: 1 };
}
