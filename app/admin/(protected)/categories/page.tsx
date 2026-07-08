import Link from "next/link";
import { filterByQuery, getAdminListParams, getProductCategoryRecords, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "产品分类 | Cowinmotors 后台",
};

function pageHref(params: { q: string; pageSize: number; page: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("pageSize", String(params.pageSize));
  query.set("page", String(params.page));
  return `/admin/categories?${query.toString()}`;
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const categories = getProductCategoryRecords();
  const filtered = filterByQuery(categories, params.query, (category) => [
    category.nameEn,
    category.nameZh,
    category.slug,
    category.seoTitle,
    category.seoDescription,
  ]);
  const page = paginate(filtered, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">产品分类</p>
          <h1>前台分类与 SEO 入口</h1>
          <p>分类来源于当前真实产品库，用于检查导航展示、分类页产品数量、样图和 SEO 标题描述。</p>
        </div>
        <span className="admin-status good">{filtered.length} categories</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <form action="/admin/categories">
            <input name="q" placeholder="搜索分类、slug、SEO标题" defaultValue={params.query} />
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="10">10 / 页</option>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
            </select>
            <button type="submit">筛选</button>
          </form>
          <Link className="admin-secondary-button" href="/api/admin/categories">查看 API</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>样图</th>
                <th>分类</th>
                <th>Slug</th>
                <th>产品数</th>
                <th>导航</th>
                <th>SEO</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((category) => (
                <tr key={category.slug}>
                  <td><img className="admin-product-thumb" src={category.sampleImage} alt="" /></td>
                  <td>
                    <strong>{category.nameEn}</strong>
                    <span className="admin-muted">{category.nameZh}</span>
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.productCount}</td>
                  <td>{category.showInNav ? "展示" : "隐藏"} · {category.enabled ? "启用" : "无产品"}</td>
                  <td>
                    <strong>{category.seoTitle}</strong>
                    <span className="admin-muted">{category.seoDescription}</span>
                  </td>
                </tr>
              ))}
              {!page.items.length ? <tr><td colSpan={6}>没有匹配的分类。</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          {page.hasPrevious ? <Link href={pageHref({ q: params.query, pageSize: params.pageSize, page: page.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}
          <span>{page.currentPage} / {page.totalPages}</span>
          {page.hasNext ? <Link href={pageHref({ q: params.query, pageSize: params.pageSize, page: page.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}
        </div>
      </section>
    </div>
  );
}
