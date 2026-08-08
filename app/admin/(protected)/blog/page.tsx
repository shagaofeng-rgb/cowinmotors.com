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
          <p>查看人工审核后保存的文章、分类、封面和发布时间。Blog 没有自动发布、自动生成或外部发布接口。</p>
        </div>
        <Link className="admin-status good" href="/blog" target="_blank">前台 Blog</Link>
      </header>
      <section className="admin-metric-grid">
        <div className="admin-metric"><span>Published</span><strong>{published}</strong><small>已发布文章</small></div>
        <div className="admin-metric"><span>Categories</span><strong>{data.categories.length}</strong><small>真实文章分类</small></div>
        <div className="admin-metric"><span>Source</span><strong>Editorial</strong><small>人工审核内容</small></div>
        <div className="admin-metric"><span>Automation</span><strong>Off</strong><small>无 Blog 自动发布入口</small></div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-headline"><div><p className="eyebrow">Articles</p><h2>已发布文章</h2></div><Link href="/api/admin/blog">查看 API</Link></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>标题</th><th>分类</th><th>来源</th><th>封面</th><th>发布时间</th></tr></thead>
            <tbody>
              {data.articles.map((article) => <tr key={article.id}>
                <td><Link href={`/blog/${article.slug}`} target="_blank">{article.title}</Link></td><td>{article.classId}</td><td>{article.source}</td><td>{article.coverImageUrl ? "已配置" : "-"}</td><td>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("zh-CN") : "-"}</td>
              </tr>)}
              {!data.articles.length ? <tr><td colSpan={5}>暂无已发布文章。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel"><p className="eyebrow">Categories</p><h2>文章分类</h2><div className="admin-stack">{data.categories.map((category) => <div className="admin-mini-record" key={category.id}><strong>{category.name}</strong><span>{category.slug} · {category.enabled ? "启用" : "停用"} · {category.description}</span></div>)}</div></section>
    </div>
  );
}
