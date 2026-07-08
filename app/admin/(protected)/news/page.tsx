import Link from "next/link";
import { getNewsAdminSnapshot } from "@/lib/news";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "News 自动发布 | Cowinmotors 后台",
};

export default async function AdminNewsPage() {
  const data = await getNewsAdminSnapshot();
  const published = data.articles.filter((article) => article.status === "published").length;
  const latestAudit = data.audits[0];
  const statusLabel = (status: string) => ({
    published: "已发布",
    draft: "草稿",
    failed: "失败",
    completed: "完成",
    running: "运行中",
  }[status] || status);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">News Automation</p>
          <h1>新闻自动发布系统</h1>
          <p>查看新闻采集来源、发布记录、每日目标完成情况、产品关联和自动任务结果。</p>
        </div>
        <Link className="admin-status good" href="/news" target="_blank">前台 News</Link>
      </header>

      <section className="admin-metric-grid">
        <div className="admin-metric"><span>Published</span><strong>{published}</strong><small>已发布新闻</small></div>
        <div className="admin-metric"><span>Sources</span><strong>{data.sources.length}</strong><small>RSS / 来源</small></div>
        <div className="admin-metric"><span>Jobs</span><strong>{data.jobs.length}</strong><small>自动任务记录</small></div>
        <div className="admin-metric"><span>Daily Target</span><strong>{latestAudit?.publishedCount || 0}/{latestAudit?.targetCount || Number(process.env.NEWS_DAILY_TARGET || 4)}</strong><small>{latestAudit?.date || "暂无审计记录"}</small></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-headline">
          <div>
            <p className="eyebrow">Articles</p>
            <h2>新闻记录</h2>
          </div>
          <Link href="/news/rss.xml" target="_blank">RSS</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>状态</th>
                <th>来源</th>
                <th>相关产品</th>
                <th>发布时间</th>
              </tr>
            </thead>
            <tbody>
              {data.articles.map((article) => (
                <tr key={article.id}>
                  <td><Link href={`/news/${article.slug}`} target="_blank">{article.title}</Link></td>
                  <td>{statusLabel(article.status)}</td>
                  <td><a href={article.canonicalSourceUrl} target="_blank" rel="noreferrer">{article.sourcePublisher || "-"}</a></td>
                  <td>{article.products.length || "-"}</td>
                  <td>{article.publishedAt ? new Date(article.publishedAt).toLocaleString("zh-CN") : "-"}</td>
                </tr>
              ))}
              {!data.articles.length ? <tr><td colSpan={5}>暂无新闻记录。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">Sources</p>
          <h2>新闻来源</h2>
          <div className="admin-stack">
            {data.sources.map((source) => (
              <div className="admin-mini-record" key={source.id}>
                <strong>{source.publisherName}</strong>
                <span>{source.domain} · 可信度 {source.credibilityScore} · {source.enabled ? "启用" : "停用"}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="admin-panel">
          <p className="eyebrow">Jobs</p>
          <h2>任务与审计</h2>
          <div className="admin-stack">
            {data.jobs.slice(0, 10).map((job) => (
              <div className="admin-mini-record" key={job.id}>
                <strong>{job.jobType} · {statusLabel(job.status)}</strong>
                <span>{job.startedAt ? new Date(job.startedAt).toLocaleString("zh-CN") : "-"} · {job.errorMessage || "运行正常"}</span>
              </div>
            ))}
            {!data.jobs.length ? <div className="admin-empty">暂无任务记录。</div> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
