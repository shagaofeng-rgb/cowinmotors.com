import assert from 'node:assert/strict';
import test from 'node:test';
import { googleSubmissionWindow } from '../lib/google-submission-schedule.ts';

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
