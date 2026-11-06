import assert from 'node:assert/strict';
import test from 'node:test';
import { googleSubmissionWindow, isRetryableGoogleStatus, submitGoogleSitemapWithRetry } from '../lib/google-submission-schedule.ts';

test('Monday submission, deduplication and next Monday', () => {
  const now = new Date('2026-10-05T02:10:00Z');
  assert.equal(googleSubmissionWindow(now).eligible, true);
  assert.equal(googleSubmissionWindow(now, '2026-10-05T02:09:00Z').eligible, false);
  assert.equal(googleSubmissionWindow(now, '2026-09-28T02:11:00Z').eligible, true);
  assert.equal(googleSubmissionWindow(now).nextScheduledAt, '2026-10-12T02:10:00.000Z');
});

test('Shanghai Monday boundary and off-day calls', () => {
  assert.equal(googleSubmissionWindow(new Date('2026-10-04T15:59:59Z')).eligible, false);
  assert.equal(googleSubmissionWindow(new Date('2026-10-04T16:00:00Z')).eligible, true);
  const thursday = googleSubmissionWindow(new Date('2026-10-01T02:10:00Z'));
  assert.equal(thursday.eligible, false);
  assert.equal(thursday.nextScheduledAt, '2026-10-05T02:10:00.000Z');
});

test('Google retries a transient failure exactly once and does not retry configuration errors', async () => {
  let calls = 0;
  const wait = async () => {};
  const retried = await submitGoogleSitemapWithRetry(async () => (++calls === 1
    ? { status: 'failed', message: '503', retryable: isRetryableGoogleStatus(503) }
    : { status: 'success', message: 'accepted' }), wait);
  assert.deepEqual(retried, { status: 'success', message: 'accepted', retries: 1 });
  const failed = await submitGoogleSitemapWithRetry(async () => ({ status: 'failed', message: '403', retryable: isRetryableGoogleStatus(403) }), wait);
  assert.equal(failed.retries, 0);
  assert.equal((await submitGoogleSitemapWithRetry(async () => { throw new TypeError('offline'); }, wait)).retries, 1);
  assert.equal((await submitGoogleSitemapWithRetry(async () => ({ status: 'not-configured', message: 'missing' }), wait)).retries, 0);
});
