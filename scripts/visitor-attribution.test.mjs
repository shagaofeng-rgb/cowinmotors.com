import assert from "node:assert/strict";
import test from "node:test";
import { sessionAttribution } from "../lib/visitorAttribution.ts";

function browser(search, referrer = "") {
  const values = new Map();
  globalThis.window = {
    location: { search },
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  globalThis.document = { referrer };
  return {
    navigate(nextSearch, nextReferrer = "") {
      window.location.search = nextSearch;
      document.referrer = nextReferrer;
    },
  };
}

test("preserves campaign and external referrer across pages in one session", () => {
  const tab = browser("?utm_source=google&utm_medium=cpc&utm_campaign=autumn", "https://www.google.com/");
  const first = sessionAttribution("session-1");
  tab.navigate("", "https://www.cowinmotors.com/products");
  assert.deepEqual(sessionAttribution("session-1"), first);
  assert.equal(first.utm.source, "google");
  assert.equal(first.referrer, "https://www.google.com/");
});

test("starts a new attribution record for a new session", () => {
  const tab = browser("?utm_source=google");
  sessionAttribution("session-1");
  tab.navigate("?utm_source=bing&utm_medium=organic", "https://www.bing.com/");
  const second = sessionAttribution("session-2");
  assert.equal(second.sessionId, "session-2");
  assert.equal(second.utm.source, "bing");
  assert.equal(second.referrer, "https://www.bing.com/");
});
