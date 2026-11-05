import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryPageMetadata, categorySearchPath, normalizedPage, readCategorySearchParams, shouldNormalizeCategorySearch } from '../lib/category-url.ts';

for (const basePath of ['/products', '/headlights', '/tail-lights', '/exhaust', '/wheels']) {
  test(`${basePath}: unfiltered pagination is self-canonical and not noindex`, () => {
    for (const page of ['2', '3']) {
      const meta = categoryPageMetadata({title:'Catalog', description:'Parts', basePath, params:{page}});
      assert.equal(meta.alternates.canonical, `${basePath}?page=${page}`);
      assert.equal(meta.robots, undefined);
    }
  });
  test(`${basePath}: real filters remain intentionally excluded`, () => {
    for (const params of [{make:'BMW',page:'2'}, {q:'LED'}, {year:'2024'}]) {
      const meta = categoryPageMetadata({title:'Catalog', description:'Parts', basePath, params});
      assert.deepEqual(meta.robots, {index:false,follow:true});
      assert.equal(meta.alternates.canonical, basePath);
    }
  });
}
test('tracking parameters do not exclude the public products landing page', () => {
  const meta = categoryPageMetadata({title:'Catalog',description:'Parts',basePath:'/products',params:{utm_source:'facebook'}});
  assert.equal(meta.robots, undefined);
  assert.equal(meta.alternates.canonical, '/products');
});
test('category filter is retained on the all-products route only', () => {
  const params={category:'headlights',make:'BMW',page:'2'};
  assert.equal(categorySearchPath('/products',params),'/products?category=headlights&make=BMW&page=2');
  assert.equal(categorySearchPath('/headlights',params),'/headlights?make=BMW&page=2');
  assert.equal(shouldNormalizeCategorySearch(params,false),false);
  assert.equal(shouldNormalizeCategorySearch(params),true);
  assert.equal(categoryPageMetadata({title:'Catalog',description:'Parts',basePath:'/products',params}).robots.index,false);
});
test('malformed pages normalize consistently instead of partial parse or fractional slices', () => {
  for (const value of ['0','-2','1','abc','2abc','2.5','Infinity','9007199254740992']) {
    assert.equal(normalizedPage(value),1);
    assert.equal(shouldNormalizeCategorySearch({page:value},false),true);
  }
  assert.equal(normalizedPage('02'),2);
  assert.equal(shouldNormalizeCategorySearch({page:'02'},false),true);
  assert.equal(shouldNormalizeCategorySearch({},false),false);
});
test('repeated catalog parameters cannot crash search or metadata', () => {
  const params = readCategorySearchParams({ make: [' BMW ', 'Audi'], q: ['A3', 'A4'], year: '2015', page: ['02', '9'], utm_source: 'ads' });
  assert.equal(categorySearchPath('/products', params), '/products?make=BMW&q=A3&year=2015&page=2');
  assert.equal(shouldNormalizeCategorySearch(params, false), true);
});
