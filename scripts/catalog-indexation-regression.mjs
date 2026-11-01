import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.argv[2] || 'http://localhost:3187';
const canonicalOrigin = 'https://www.cowinmotors.com';
const rows = [];
for (const route of ['/products','/headlights','/tail-lights','/exhaust','/wheels']) {
  const root = await fetch(base+route);
  assert.equal(root.status,200);
  const rootHtml = await root.text();
  const hasSecondPage = rootHtml.includes(`${route}?page=2`);
  for (const [query,status,canonical,noindex] of [
    ['?page=2',hasSecondPage ? 200 : 404,hasSecondPage ? `${route}?page=2` : null,!hasSecondPage],
    ['?page=9999',404,null,true],
    ['?page=2abc',308,route,null],
    ['?page=1',308,route,null],
    ['?page=02',308,`${route}?page=2`,null],
    ['?make=BMW',200,route,true],
    ['?utm_source=audit',200,route,false],
  ]) {
    const response = await fetch(`${base}${route}${query}`, {redirect:'manual'});
    const html = await response.text();
    const actualCanonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || '';
    const actualRobots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || '';
    assert.equal(response.status,status,`${route}${query} status`);
    if(status===308) assert.equal(new URL(response.headers.get('location'),base).pathname+new URL(response.headers.get('location'),base).search,canonical);
    else {
      if(canonical) assert.equal(actualCanonical,canonicalOrigin+canonical,`${route}${query} canonical`);
      assert.equal(actualRobots.includes('noindex'),noindex,`${route}${query} robots`);
    }
    if(status===200 && query==='?page=2') {
      assert.ok(html.includes('Product pagination'));
      assert.ok(html.includes(`href="${route}"`));
    }
    rows.push({url:base+route+query,status,canonical:actualCanonical,robots:actualRobots,passed:true});
  }
}
const category=await fetch(`${base}/products?category=headlights&page=1`,{redirect:'manual'});
assert.equal(category.status,308);
assert.equal(new URL(category.headers.get('location'),base).search,'?category=headlights');
if(process.argv[3])await fs.writeFile(process.argv[3],JSON.stringify(rows,null,2)+'\n');
console.log(`${rows.length+1} HTTP regression checks passed against ${base}`);
