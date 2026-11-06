import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inquiryAttachment, inquirySubmissionId, isInquiryEmail, isNonProductionInquiry } from '../lib/inquiry-input.ts';
import { MONTHLY_EMAIL_JOB, SITEMAP_JOB, scheduledSyncStatus } from '../lib/sync-health.ts';

test('only reserved email addresses or trusted explicit flags are tests', () => {
  assert.equal(isNonProductionInquiry({ email: 'buyer@parts-shop.invalid', isTest: false, requirement: 'Test a sample from our new collection.' }), false);
  assert.equal(isNonProductionInquiry({ email: 'buyer@example.com', isTest: false }), true);
  assert.equal(isNonProductionInquiry({ email: 'internal@cowinmotors.com', isTest: true }), true);
  assert.equal(isInquiryEmail('buyer@shop.invalid\r\nBcc: another@shop.invalid'), false);
  assert.equal(isInquiryEmail('buyer+rfq@shop.invalid'), true);
});

test('retries have a stable ID scoped to the buyer and the submission key', () => {
  const key = '11d85576-2bfb-4a5a-bc31-f4a619fcb1fd';
  assert.equal(inquirySubmissionId(key, 'buyer@shop.invalid'), inquirySubmissionId(key, 'BUYER@SHOP.INVALID'));
  assert.notEqual(inquirySubmissionId(key, 'buyer@shop.invalid'), inquirySubmissionId(key, 'other@shop.invalid'));
  assert.equal(inquirySubmissionId('untrusted', 'buyer@shop.invalid'), '');
});

test('reference file type, size and base64 are checked server-side', () => {
  const pdf = { name: 'ref.pdf', type: 'application/pdf', contentBase64: Buffer.from('%PDF-1.4\n').toString('base64') };
  assert.deepEqual(inquiryAttachment(pdf), pdf);
  assert.throws(() => inquiryAttachment({ ...pdf, type: 'image/png' }), /valid JPG/);
  assert.throws(() => inquiryAttachment({ ...pdf, contentBase64: '!' }), /Invalid/);
  assert.throws(() => inquiryAttachment({ ...pdf, contentBase64: 'A'.repeat(4 * 1024 * 1024 + 1) }), /3 MB/);
});

test('scheduled task health is based on its cadence, not the report date filter', () => {
  const monday = new Date('2026-11-02T03:11:00Z');
  assert.equal(scheduledSyncStatus(SITEMAP_JOB, { startedAt: '2026-10-26T02:10:15Z', healthy: true }, monday), 'missing');
  assert.equal(scheduledSyncStatus(SITEMAP_JOB, { startedAt: '2026-11-02T02:10:10Z', healthy: false }, monday), 'failed');
  assert.equal(scheduledSyncStatus(MONTHLY_EMAIL_JOB, { startedAt: '2026-11-01T01:00:51Z', healthy: true }, monday), 'healthy');
});
