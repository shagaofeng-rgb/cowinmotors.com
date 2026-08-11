import Link from "next/link";
import { getBlogAdminSnapshot } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog 管理 | Cowinmotors 后台" };

export default async function AdminBlogPage() {
  const data = await getBlogAdminSnapshot();
  const published = data.articles.filter((article) => article.status === "published").length;
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Blog Publishing</p>
          <h1>Blog 文章管理</h1>
          <p>查看真实 Blog 文章、分类、封面和发布时间。外部插件通过签名 Webhook 发布，并记录每次成功或失败结果。</p>
        </div>
        <Link className="admin-status good" href="/blog" target="_blank">前台 Blog</Link>
      </header>
      <section className="admin-metric-grid">
        <div className="admin-metric"><span>Published</span><strong>{published}</strong><small>已发布文章</small></div>
        <div className="admin-metric"><span>Categories</span><strong>{data.categories.length}</strong><small>真实文章分类</small></div>
        <div className="admin-metric"><span>Webhook</span><strong>{data.publication.configured ? "Ready" : "Needs key"}</strong><small>外部发布签名状态</small></div>
        <div className="admin-metric"><span>Last publish</span><strong>{data.publication.lastSuccessAt ? "OK" : "-"}</strong><small>{data.publication.lastSuccessAt ? new Date(data.publication.lastSuccessAt).toLocaleString("zh-CN") : "尚无插件发布记录"}</small></div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-headline"><div><p className="eyebrow">Articles</p><h2>文章记录</h2></div><Link href="/api/admin/blog">查看 API</Link></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>标题</th><th>状态</th><th>分类</th><th>来源</th><th>封面</th><th>发布时间</th></tr></thead>
            <tbody>
              {data.articles.map((article) => <tr key={article.id}>
                <td>{article.status === "published" ? <Link href={`/blog/${article.slug}`} target="_blank">{article.title}</Link> : article.title}</td><td>{article.status}</td><td>{article.classId}</td><td>{article.source}</td><td>{article.coverImageUrl ? "已配置" : "-"}</td><td>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("zh-CN") : "-"}</td>
              </tr>)}
              {!data.articles.length ? <tr><td colSpan={6}>暂无文章。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel"><p className="eyebrow">Categories</p><h2>文章分类</h2><div className="admin-stack">{data.categories.map((category) => <div className="admin-mini-record" key={category.id}><strong>{category.name}</strong><span>{category.slug} · {category.enabled ? "启用" : "停用"} · {category.description}</span></div>)}</div></section>
    </div>
  );
}
