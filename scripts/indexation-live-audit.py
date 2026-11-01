"""Read-only audit of this site's sitemap and a bounded set of URL variants."""
import argparse
import concurrent.futures
import csv
import hashlib
import json
import pathlib
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ORIGIN = 'https://www.cowinmotors.com'

class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = ''
        self.robots = ''
        self.title = ''
        self.in_title = False
        self.links = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href', '')
        if tag == 'meta' and a.get('name') == 'robots':
            self.robots = a.get('content', '')
        if tag == 'title':
            self.in_title = True
        if tag == 'a' and a.get('href'):
            self.links.add(a['href'])
    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
    def handle_data(self, data):
        if self.in_title:
            self.title += data

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent':'Cowinmotors-Indexation-Audit/1.0'})
    try:
        response = urllib.request.urlopen(req, timeout=25)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.url, dict(response.headers), response.read().decode('utf-8', 'replace')

def sitemap(url):
    if urllib.parse.urlsplit(url).netloc != 'www.cowinmotors.com':
        raise ValueError('Out-of-scope sitemap')
    status, _, _, body = fetch(url)
    if status != 200:
        raise ValueError(f'Sitemap HTTP {status}: {url}')
    root = ET.fromstring(body)
    locations = [node.text for node in root.findall('.//{*}loc')]
    if root.tag.endswith('sitemapindex'):
        return [loc for item in locations for loc in sitemap(item)]
    return locations

def audit(item):
    url, source = item
    row = {'url':url,'source':source,'status':'','final_url':'','canonical':'','robots':'','title':'','html_sha256':'','internal_links':0,'disposition':'证据不足','note':''}
    try:
        status, final, headers, body = fetch(url)
        head = Head()
        head.feed(body)
        row.update(status=status, final_url=final, canonical=head.canonical, robots=head.robots + ('; '+headers.get('X-Robots-Tag','') if headers.get('X-Robots-Tag') else ''), title=head.title, html_sha256=hashlib.sha256(body.encode()).hexdigest(), internal_links=len([x for x in head.links if x.startswith('/') or x.startswith(ORIGIN)]))
        if source == 'sitemap' and status == 200 and head.canonical == url and 'noindex' not in row['robots'].lower() and final == url:
            row.update(disposition='等待重抓',note='Live indexability passes; not proof of Google indexing or unique content')
        elif 'noindex' in row['robots'].lower() and source != 'sitemap':
            row.update(disposition='有意排除',note='Confirm search/filter/utility intent; not a Google validation result')
        elif status == 200 and final != url:
            row.update(disposition='等待重抓',note='Redirect reaches 200; preserve if destination is semantically equivalent')
        else:
            row['note'] = 'Needs URL-specific review; do not automatically redirect or remove noindex'
    except Exception as error:
        row['note'] = str(error)
    return row

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--output',required=True)
    p.add_argument('--variants-only',action='store_true')
    p.add_argument('--gsc-samples')
    args=p.parse_args()
    target=pathlib.Path(args.output)
    target.mkdir(parents=True,exist_ok=True)
    entries=[] if args.variants_only else list(dict.fromkeys(sitemap(ORIGIN+'/sitemap.xml')))
    variants=['/','/products?page=2','/products?page=1','/products?page=9999','/products?page=2abc','/products?utm_source=audit','/products?category=headlights&page=2','/products?make=BMW&page=2','/quote?product=1','/es/blog','/collections','/news?page=2']
    for category in ['headlights','tail-lights','exhaust','wheels']:
        variants.extend([f'/{category}?page=2',f'/{category}?page=9999',f'/{category}?category={category}&page=2'])
    items=[(url,'sitemap') for url in entries]+[(ORIGIN+v,'variant') for v in variants]
    samples={}
    if args.gsc_samples:
        with open(args.gsc_samples,encoding='utf-8-sig') as f:
            samples={r['url']:r for r in csv.DictReader(f)}
        items.extend((url,'gsc-example') for url in samples)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        rows=list(pool.map(audit,items))
    for row in rows:
        parsed=urllib.parse.urlsplit(row['url'])
        pathname=parsed.path
        row['template']='product' if pathname.startswith('/product/') else 'news' if pathname.startswith(('/news','/blog')) else 'category' if pathname in ['/headlights','/tail-lights','/exhaust','/wheels','/products'] else 'other'
        row['query_keys']='|'.join(sorted(urllib.parse.parse_qs(parsed.query)))
        row['last_crawled']=samples.get(row['url'],{}).get('last_crawled','')
        row['gsc_reason']=samples.get(row['url'],{}).get('gsc_reason','')
    with (target/'url-dispositions.csv').open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    summary={'sitemap_urls':len(entries),'audited':len(rows),'sitemap_indexability_failures':[r for r in rows if r['source']=='sitemap' and r['disposition']!='等待重抓'],'note':'Public live audit, NOT a GSC affected-URL export; status waiting-for-recrawl does not assert prior repair.'}
    (target/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
    print(json.dumps({'sitemap_urls':len(entries),'audited':len(rows),'sitemap_failures':len(summary['sitemap_indexability_failures'])}))

if __name__=='__main__':
    main()
