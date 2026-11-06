export const MONTHLY_EMAIL_JOB = "inquiry-email-test";
export const SITEMAP_JOB = "sitemap-maintenance";

export function expectedSyncRun(job: typeof MONTHLY_EMAIL_JOB | typeof SITEMAP_JOB, now: Date) {
  const date = new Date(now.getTime() - 60 * 60_000);
  if (job === MONTHLY_EMAIL_JOB) {
    const due = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 1);
    return due <= date.getTime() ? due : Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1, 1);
  }
  const monday = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - (date.getUTCDay() + 6) % 7, 2, 10);
  return monday <= date.getTime() ? monday : monday - 7 * 86_400_000;
}

export function scheduledSyncStatus(job: typeof MONTHLY_EMAIL_JOB | typeof SITEMAP_JOB, latest: { startedAt: string; healthy: boolean } | undefined, now: Date) {
  if (!latest || Date.parse(latest.startedAt) < expectedSyncRun(job, now)) return "missing";
  return latest.healthy ? "healthy" : "failed";
}
