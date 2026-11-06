"""Join Search Console exports to live GET checks for the Cowinmotors property."""
import argparse
import collections
import concurrent.futures
import csv
import hashlib
import http.client
import io
import json
import pathlib
import re
import threading
import urllib.parse as urlparse
import xml.etree.ElementTree as ET
import zipfile
from html.parser import HTMLParser

ORIGIN = "https://www.cowinmotors.com"
HOSTS = {"www.cowinmotors.com", "cowinmotors.com"}
FILTERS = {"category", "make", "q", "year", "status"}
CATEGORIES = {"/products", "/headlights", "/tail-lights", "/exhaust", "/wheels", "/body-kits"}
CHANGED_ALIASES = {
    "https://cowinmotors.com/collections/maserati": ORIGIN + "/products?make=Maserati",
    "https://cowinmotors.com/collections?page_num=2": ORIGIN + "/products?page=2",
}
local = threading.local()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = self.robots = ""
        self.h1 = self.in_main = self.skip = 0
        self.content = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and values.get("rel") == "canonical":
            self.canonical = values.get("href", "")
        if tag == "meta" and values.get("name") == "robots":
            self.robots = values.get("content", "")
        if tag == "main":
            self.in_main += 1
        if tag == "h1" and self.in_main:
            self.h1 += 1
        if tag in {"script", "style", "template"}:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main = max(0, self.in_main - 1)
        if tag in {"script", "style", "template"}:
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        if self.in_main and not self.skip:
            self.content.append(data)


def get(url):
    history = []
    for _ in range(5):
        p = urlparse.urlsplit(url)
        if p.scheme != "https" or p.netloc not in HOSTS:
            raise ValueError("URL outside Cowinmotors property")
        connections = getattr(local, "connections", {})
        local.connections = connections
        if p.netloc not in connections:
            connections[p.netloc] = http.client.HTTPSConnection(p.netloc, timeout=8)
        connection = connections[p.netloc]
        route = urlparse.quote(urlparse.urlunsplit(("", "", p.path or "/", p.query, "")), safe="/%?&=+;:@,.-_~!$'()*")
        try:
            connection.request("GET", route, headers={"User-Agent": "Cowinmotors-Indexation-Audit/1.0", "Accept": "text/html,application/xml,*/*"})
            response = connection.getresponse()
            headers = dict((key.lower(), value) for key, value in response.getheaders())
            body = response.read()
        except (OSError, http.client.HTTPException):
            connection.close()
            raise
        history.append(response.status)
        if response.status in {301, 302, 303, 307, 308} and headers.get("location"):
            url = urlparse.urljoin(url, headers["location"])
            continue
        return url, history, headers, body
    raise ValueError("Redirect chain exceeds audit limit")


def normal(url):
    p = urlparse.urlsplit(url)
    return p._replace(path=p.path or "/").geturl()


def check(url):
    row = {"status": "", "chain": "", "final_url": "", "canonical": "", "robots": "", "main_words": "", "main_h1": "", "content_hash": "", "error": ""}
    for attempt in range(2):
        try:
            final, history, headers, body = get(url)
            page = Page()
            if "text/html" in headers.get("content-type", ""):
                page.feed(body.decode("utf-8", "replace"))
            text = " ".join(" ".join(page.content).split())
            row.update(status=history[-1], chain=" > ".join(map(str, history)), final_url=final,
                       canonical=page.canonical, robots=" ".join(filter(None, [page.robots, headers.get("x-robots-tag")])),
                       main_words=len(text.split()), main_h1=page.h1, content_hash=hashlib.sha256(text.encode()).hexdigest()[:16] if text else "")
            return row
        except (OSError, http.client.HTTPException, ValueError) as exc:
            if attempt == 1:
                row["error"] = str(exc)
    return row


def sitemap(url):
    _, statuses, _, body = get(url)
    if statuses[-1] != 200:
        raise ValueError(f"Sitemap returned HTTP {statuses[-1]}: {url}")
    root = ET.fromstring(body)
    locations = [node.text for node in root.findall(".//{*}loc")]
    return [item for loc in locations for item in sitemap(loc)] if root.tag.endswith("sitemapindex") else locations


def template(path):
    if path.startswith(("/product/", "/products/")):
        return "product"
    if path in CATEGORIES or path.startswith("/collections"):
        return "catalog"
    if path.startswith(("/news", "/blog", "/es/blog")):
        return "editorial"
    if path.startswith("/_next/") or path == "/favicon.ico":
        return "asset"
    return "rfq" if path == "/quote" else "other"


def disposition(source, row, duplicate_content):
    url = source["url"]
    p = urlparse.urlsplit(url)
    status = row["status"]
    keys = set(urlparse.parse_qs(p.query))
    noindex = "noindex" in row["robots"].lower()
    current = status == 200 and row["canonical"] and normal(row["canonical"]) == normal(row["final_url"]) and not noindex
    if source["gsc_reason"] == "sitemap":
        if current and normal(url) == normal(row["final_url"]) and row["main_h1"] == 1:
            return "indexability-ok", "Canonical 200 with one main heading; not a Google indexing result."
        return "evidence-needed", "Unexpected status, canonical, robots or primary heading on a sitemap URL."
    if row["error"] or status in {429, 500, 502, 503, 504}:
        return "evidence-needed", "Live check did not establish a reliable response."
    if status == 200 and CHANGED_ALIASES.get(url) == row["final_url"]:
        return "fixed", "Legacy redirect preserves the original make or page instead of discarding the filter."
    if source["template"] == "asset":
        return "intentional-exclusion", "Not an HTML landing page; expired build assets are not restored."
    if status == 410 or (status == 404 and source["gsc_reason"] == "Not found (404)"):
        return "intentional-exclusion", "Retired, obsolete or malformed URL without an equivalent active landing page."
    if status == 200 and noindex:
        if p.path == "/quote" or (keys & FILTERS and source["template"] in {"catalog", "editorial"}):
            return "intentional-exclusion", "RFQ or filtered browse URL remains usable, but is not an index target."
        if source["template"] == "editorial":
            return "intentional-exclusion", "Editorial indexability was explicitly disabled; review the record before promoting it."
        if source["template"] == "product":
            return "intentional-exclusion", "Current catalog evidence policy excludes this SKU. Verify exact photos, reference and fitment before reclassification."
    if current and normal(url) != normal(row["final_url"]):
        return "awaiting-recrawl", "Legacy URL already redirects to a self-canonical 200 target."
    if current and row["main_h1"] == 1 and row["main_words"] and not duplicate_content:
        return "awaiting-recrawl", "Technically indexable now; Google selection and content depth still require review."
    if status == 404 and "page" in keys and source["template"] in {"catalog", "editorial"}:
        return "intentional-exclusion", "No listing exists for this pagination state."
    return "evidence-needed", "Review intent, equivalent target and SKU or content evidence individually."


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=pathlib.Path)
    parser.add_argument("exports", nargs="+", type=pathlib.Path)
    args = parser.parse_args()
    rows = []
    for source in args.exports:
        with zipfile.ZipFile(source) as data:
            metadata = dict(csv.reader(io.StringIO(data.read("Metadata.csv").decode("utf-8-sig"))))
            for entry in csv.DictReader(io.StringIO(data.read("Table.csv").decode("utf-8-sig"))):
                url = entry["URL"]
                parts = urlparse.urlsplit(url)
                if parts.scheme != "https" or parts.netloc not in HOSTS:
                    raise ValueError(f"Out-of-scope export URL: {url}")
                rows.append({"url": url, "gsc_reason": metadata["Issue"], "last_crawled": entry["Last crawled"], "template": template(parts.path)})
    locations = sitemap(ORIGIN + "/sitemap.xml")
    assert len(locations) == len(set(locations)), "Duplicate sitemap locations"
    rows.extend({"url": url, "gsc_reason": "sitemap", "last_crawled": "", "template": template(urlparse.urlsplit(url).path)} for url in locations)

    # Quote prefill changes only form values. Verify distributed examples, not 827 copies of that template.
    quote_rows = [row["url"] for row in rows if row["template"] == "rfq" and "?product=" in row["url"]]
    quote_set = set(quote_rows)
    samples = quote_rows[::max(1, len(quote_rows) // 10)]
    urls = list(dict.fromkeys([ORIGIN + "/quote", *samples, *(row["url"] for row in rows if row["url"] not in quote_set)]))
    checks = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for idx, (url, result) in enumerate(zip(urls, pool.map(check, urls)), 1):
            checks[url] = result
            if idx % 200 == 0:
                print(f"Checked {idx}/{len(urls)} direct URLs", flush=True)
    quote_valid = all(checks[url]["status"] == 200 and "noindex" in checks[url]["robots"] and checks[url]["canonical"] == ORIGIN + "/quote" for url in [ORIGIN + "/quote", *samples])
    hashes = collections.defaultdict(set)
    for url, row in checks.items():
        if row["content_hash"] and row["status"] == 200 and row["canonical"]:
            hashes[row["content_hash"]].add(row["canonical"])
    report = []
    for source in rows:
        url = source["url"]
        scope = "direct" if url in checks else "sampled-rfq-template"
        observed = dict(checks[url] if url in checks else checks[ORIGIN + "/quote"])
        if scope != "direct":
            observed.update(final_url="", chain="", main_words="", main_h1="", content_hash="")
            if not quote_valid:
                observed.update(status="", error="RFQ samples do not agree")
        duplicate = bool(observed["content_hash"] and len(hashes[observed["content_hash"]]) > 1)
        decision, note = disposition(source, observed, duplicate)
        report.append({**source, "check_scope": scope, **observed, "same_content_other_canonical": duplicate, "decision": decision, "note": note})
    args.output.mkdir(parents=True, exist_ok=True)
    with (args.output / "url-dispositions.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(report[0]))
        writer.writeheader()
        writer.writerows(report)
    summary = {"direct_checks": len(checks), "rfq_samples": len(samples), "sitemap": len(locations), "gsc_export_rows": len(rows) - len(locations), "by_reason": {}}
    for row in report:
        count = summary["by_reason"].setdefault(row["gsc_reason"], {})
        count[row["decision"]] = count.get(row["decision"], 0) + 1
    (args.output / "indexation-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary), flush=True)
    return int(summary["by_reason"]["sitemap"].get("evidence-needed", 0) > 0)


if __name__ == "__main__":
    raise SystemExit(main())
