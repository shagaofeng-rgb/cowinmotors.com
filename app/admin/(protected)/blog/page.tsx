import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";
import { filterByQuery, getAdminListParams, paginate } from "@/lib/adminData";
import { getBlogAdminSnapshot } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog 管理 | Cowinmotors 后台" };

function hrefFor(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return `/admin/blog?${query.toString()}`;
}

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const rawParams = await searchParams;
  const range = getAdminDateRange(rawParams);
  const list = getAdminListParams(rawParams);
  const { startDate, endDate } = resolveDateRange(range);
  const data = await getBlogAdminSnapshot();
  const published = data.articles.filter((article) => article.status === "published").length;
  const articles = paginate(filterByQuery(data.articles.filter((article) => {
    const timestamp = new Date(article.publishedAt || article.updatedAt || article.createdAt || 0).getTime();
    return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
  }), list.query, (article) => [article.title, article.classId, article.status, article.source]), list.page, list.pageSize);
  const preserve = { q: list.query, pageSize: String(list.pageSize), range: range.preset, days: String(range.days), startDate: range.startDate, endDate: range.endDate };
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Blog Publishing</p>
          <h1>Blog 文章管理</h1>
          <p>查看真实 Blog 文章、分类、封面和发布时间。外部插件通过签名 Webhook 发布，并记录每次成功或失败结果。</p>
        </div>
        <div className="admin-page-actions"><Link className="admin-status good" href="/blog" target="_blank">前台 Blog</Link><AdminDateRangeFilter range={range} preserve={preserve} /></div>
      </header>
      <section className="admin-metric-grid">
        <div className="admin-metric"><span>Published</span><strong>{published}</strong><small>已发布文章</small></div>
        <div className="admin-metric"><span>Categories</span><strong>{data.categories.length}</strong><small>真实文章分类</small></div>
        <div className="admin-metric"><span>Webhook</span><strong>{data.publication.configured ? "Ready" : "Needs key"}</strong><small>外部发布签名状态</small></div>
        <div className="admin-metric"><span>Last publish</span><strong>{data.publication.lastSuccessAt ? "OK" : "-"}</strong><small>{data.publication.lastSuccessAt ? new Date(data.publication.lastSuccessAt).toLocaleString("zh-CN") : "尚无插件发布记录"}</small></div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-headline"><div><p className="eyebrow">Articles</p><h2>文章记录</h2></div><Link href="/api/admin/blog">查看 API</Link></div>
        <form className="admin-toolbar admin-filter-form" method="get"><input name="q" defaultValue={list.query} placeholder="搜索标题、状态或来源" /><select name="pageSize" defaultValue={String(list.pageSize)}><option value="25">25 / 页</option><option value="50">50 / 页</option><option value="100">100 / 页</option></select><input type="hidden" name="range" value={range.preset} /><input type="hidden" name="days" value={String(range.days)} />{range.startDate ? <input type="hidden" name="startDate" value={range.startDate} /> : null}{range.endDate ? <input type="hidden" name="endDate" value={range.endDate} /> : null}<button type="submit">筛选</button></form>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>标题</th><th>状态</th><th>分类</th><th>来源</th><th>封面</th><th>发布时间</th></tr></thead>
            <tbody>
              {articles.items.map((article) => <tr key={article.id}>
                <td>{article.status === "published" ? <Link href={`/blog/${article.slug}`} target="_blank">{article.title}</Link> : article.title}</td><td>{article.status}</td><td>{article.classId}</td><td>{article.source}</td><td>{article.coverImageUrl ? "已配置" : "-"}</td><td>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("zh-CN") : "-"}</td>
              </tr>)}
              {!data.articles.length ? <tr><td colSpan={6}>暂无文章。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <div className="admin-pagination">{articles.hasPrevious ? <Link href={hrefFor({ ...preserve, page: articles.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}<span>{articles.currentPage} / {articles.totalPages} · {articles.total} 篇</span>{articles.hasNext ? <Link href={hrefFor({ ...preserve, page: articles.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}</div>
      <section className="admin-panel"><p className="eyebrow">Categories</p><h2>文章分类</h2><div className="admin-stack">{data.categories.map((category) => <div className="admin-mini-record" key={category.id}><strong>{category.name}</strong><span>{category.slug} · {category.enabled ? "启用" : "停用"} · {category.description}</span></div>)}</div></section>
    </div>
  );
}
