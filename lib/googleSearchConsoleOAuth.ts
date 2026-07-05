import crypto from "node:crypto";
import { ensureCoreSchema, getSql } from "@/lib/database";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SETTINGS_KEY = "google_search_console_oauth";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const DEFAULT_SITE_URL = "https://www.cowinmotors.com/";

type StoredToken = {
  refreshToken: string;
  scope?: string;
  connectedAt: string;
  updatedAt: string;
};

let oauthAccessToken: { value: string; expiresAt: number } | null = null;

function oauthSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_DEFAULT_PASSWORD ||
    "cowinmotors-local-admin-secret"
  );
}

function encryptionKey() {
  return crypto.createHash("sha256").update(oauthSecret()).digest();
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decrypt(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) return null;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function sign(value: string) {
  return crypto.createHmac("sha256", oauthSecret()).update(value).digest("base64url");
}

function encodeState(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifyState(state: string) {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return false;
  const expected = sign(encoded);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { exp?: number };
    return Boolean(payload.exp && payload.exp > Date.now());
  } catch {
    return false;
  }
}

export function getSearchConsoleSiteUrl() {
  return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || DEFAULT_SITE_URL;
}

export function getGoogleOAuthConfig(request?: Request) {
  const origin = request ? new URL(request.url).origin : "https://www.cowinmotors.com";
  return {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || `${origin}/api/admin/search-console/oauth/callback`,
  };
}

export function isGoogleOAuthConfigured() {
  const config = getGoogleOAuthConfig();
  return Boolean(config.clientId && config.clientSecret);
}

async function ensureSettingsSchema() {
  const sql = getSql();
  if (!sql) return null;
  await ensureCoreSchema();
  await sql`
    CREATE TABLE IF NOT EXISTS cowin_admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

async function readStoredToken() {
  const sql = await ensureSettingsSchema();
  if (!sql) return null;

  const rows = await sql`
    SELECT value
    FROM cowin_admin_settings
    WHERE key = ${SETTINGS_KEY}
    LIMIT 1
  ` as { value: string }[];
  const decrypted = rows[0]?.value ? decrypt(rows[0].value) : null;
  if (!decrypted) return null;

  try {
    return JSON.parse(decrypted) as StoredToken;
  } catch {
    return null;
  }
}

async function saveStoredToken(token: StoredToken) {
  const sql = await ensureSettingsSchema();
  if (!sql) throw new Error("DATABASE_URL is not configured, so the OAuth token cannot be stored.");

  await sql`
    INSERT INTO cowin_admin_settings (key, value, updated_at)
    VALUES (${SETTINGS_KEY}, ${encrypt(JSON.stringify(token))}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export async function deleteGoogleSearchConsoleConnection() {
  const sql = await ensureSettingsSchema();
  if (!sql) return false;
  await sql`DELETE FROM cowin_admin_settings WHERE key = ${SETTINGS_KEY}`;
  oauthAccessToken = null;
  return true;
}

export async function getGoogleSearchConsoleConnectionStatus() {
  const stored = await readStoredToken();
  const config = getGoogleOAuthConfig();
  return {
    oauthConfigured: Boolean(config.clientId && config.clientSecret),
    connected: Boolean(stored?.refreshToken),
    siteUrl: getSearchConsoleSiteUrl(),
    redirectUri: config.redirectUri,
    connectedAt: stored?.connectedAt || "",
    updatedAt: stored?.updatedAt || "",
  };
}

export function buildGoogleSearchConsoleAuthUrl(request: Request) {
  const config = getGoogleOAuthConfig(request);
  if (!config.clientId || !config.clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET is not configured.");
  }

  const state = encodeState({
    nonce: crypto.randomBytes(16).toString("base64url"),
    exp: Date.now() + 10 * 60 * 1000,
  });

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeGoogleSearchConsoleCode(request: Request, code: string, state: string) {
  if (!verifyState(state)) {
    throw new Error("Google authorization state is invalid or expired.");
  }

  const config = getGoogleOAuthConfig(request);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || `Google OAuth failed: ${response.status}`);
  }

  const existing = await readStoredToken();
  const refreshToken = payload.refresh_token || existing?.refreshToken;
  if (!refreshToken) {
    throw new Error("Google did not return a refresh token. Reconnect and approve offline access.");
  }

  const now = new Date().toISOString();
  await saveStoredToken({
    refreshToken,
    scope: payload.scope || SCOPE,
    connectedAt: existing?.connectedAt || now,
    updatedAt: now,
  });

  oauthAccessToken = payload.access_token
    ? {
        value: payload.access_token,
        expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
      }
    : null;
}

export async function getGoogleSearchConsoleOAuthAccessToken() {
  if (oauthAccessToken && oauthAccessToken.expiresAt > Date.now() + 60_000) {
    return oauthAccessToken.value;
  }

  const config = getGoogleOAuthConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google OAuth client is not configured.");
  }

  const stored = await readStoredToken();
  if (!stored?.refreshToken) {
    throw new Error("Google Search Console is not connected. Open the admin SEO page and click Connect.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: stored.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Google token refresh failed: ${response.status}`);
  }

  oauthAccessToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };
  return oauthAccessToken.value;
}
