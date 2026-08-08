#!/usr/bin/env node

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const args = new Set(process.argv.slice(2));
const siteUrl = (process.env.SITE_URL || "https://www.cowinmotors.com").replace(/\/$/, "");
const secret = process.env.CRON_SECRET || "";

if (!secret) {
  console.error("CRON_SECRET is required. Configure it in the environment or .env.local.");
  process.exit(1);
}

const query = new URLSearchParams({
  trigger: "manual-command",
  force: args.has("--force") ? "1" : "0",
  dryRun: args.has("--dry-run") ? "1" : "0",
  verbose: args.has("--verbose") ? "1" : "0",
});

const response = await fetch(`${siteUrl}/api/cron/sitemap-maintenance?${query}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(120_000),
});
const payload = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }));
console.log(JSON.stringify(payload, null, args.has("--verbose") ? 2 : 0));
if (!response.ok || !payload.ok) process.exit(1);
