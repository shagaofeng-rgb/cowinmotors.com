# Cowinmotors Admin Implementation Plan

## Goal

Build a Chinese B2B website management backend for Cowinmotors that can support production operations for products, categories, news automation, inquiries, SEO data, media, users, audit logs, settings, and data sync.

## Current Stack

- Next.js App Router, React, TypeScript.
- Vercel production deployment.
- Product catalog source: `public/data/site-data.json`.
- Product/media assets: `public/assets`.
- Inquiry persistence: Neon Postgres through `DATABASE_URL` when configured, with temporary file fallback for local development.
- Analytics persistence: existing analytics store and admin dashboard routes.
- News automation: `/api/cron/news-automation` with Vercel Cron.
- Monthly inquiry email test: `/api/cron/inquiry-email-test` with Vercel Cron.
- Google Search Console: OAuth/service-account environment variables supported by the existing SEO admin pages.

## Completed In This Phase

- Reorganized Chinese admin navigation around the required management modules.
- Added product categories page and API backed by the real product catalog.
- Added news categories page and API backed by news automation data.
- Added media library page and API scanning product images and UI asset pack files.
- Added users and roles page based on the configured production admin account and documented role model.
- Added audit log page and API, plus durable database table support.
- Added sync jobs page and API for cron, Search Console, and data task visibility.
- Added CSV exports for products and inquiries with audit logging.
- Added server-side search, pagination, page-size selection, and empty states for product and inquiry lists.
- Extended database schema for audit logs, admin users, categories, media assets, system settings, and sync jobs.
- Added production operation docs, environment variable example, backup/restore notes, and API references.

## Required Next Phase

- Replace static product JSON management with database-backed editable product CRUD.
- Add category CRUD forms with validation, drag sorting, show/hide controls, and audit records.
- Add media upload/delete/replace workflow using object storage such as Vercel Blob or S3-compatible storage.
- Add full multi-user management: create users, reset password, disable users, role assignment, and login attempt lockout records.
- Add import queue for Excel/PDF catalog ingestion with preview, validation, rollback, and duplicate detection.
- Add editable news workflow: draft review, manual publish/unpublish, category assignment, and source management.
- Add backup/restore automation after the production database and object storage are finalized.

## Risk Notes

- The current product catalog is real but file-based. It is suitable for display and export, not for multi-user editing.
- Without `DATABASE_URL`, audit logs and inquiries cannot be production-durable.
- Without Google Search Console credentials, the SEO page must show configuration status rather than fabricated metrics.
- Without object storage, media library is a scanner/checker rather than an upload manager.

## Verification Checklist

- `pnpm exec tsc --noEmit`
- `pnpm exec next build`
- Production smoke test for public pages, robots, sitemap, news, and API health.
- Verify `/admin` login, product list, inquiry list, category pages, media page, audit logs, sync status, and exports.
