import Link from "next/link";
import { getAdminListParams, getSyncJobs, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "数据同步 | Cowinmotors 后台",
};

function pageHref(params: { pageSize: number; page: number }) {
  const query = new URLSearchParams({ pageSize: String(params.pageSize), page: String(params.page) });
  return `/admin/sync?${query.toString()}`;
}

export default async function AdminSyncPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const jobs = await getSyncJobs();
  const latestByType = new Map<string, (typeof jobs)[number]>();
  for (const job of jobs) {
    if (!latestByType.has(job.jobType)) latestByType.set(job.jobType, job);
  }
  const healthJobs = [...latestByType.values()].filter((job) => job.jobType !== "blog-webhook-rejected");
  const hasWarning = !jobs.length || healthJobs.some((job) => !job.healthy);
  const page = paginate(jobs, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">数据同步</p>
          <h1>Cron、SEO 与数据任务</h1>
          <p>查看签名 Blog 发布、站点地图维护、每月询盘测试邮件和 Search Console 数据读取状态。</p>
        </div>
        <span className={hasWarning ? "admin-status warn" : "admin-status good"}>{!jobs.length ? "暂无运行日志" : hasWarning ? "需要检查" : "已配置"}</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-badge-list">
            <Link className="admin-secondary-button" href="/api/admin/sync">查看 API</Link>
            <Link className="admin-secondary-button" href="/admin/news">新闻任务</Link>
            <Link className="admin-secondary-button" href="/admin/search-console">SEO 数据</Link>
            <Link className="admin-secondary-button" href="/api/admin/sitemap">Sitemap 状态</Link>
          </div>
          <form action="/admin/sync">
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="10">10 / 页</option>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
              <option value="100">100 / 页</option>
            </select>
            <button type="submit">应用</button>
          </form>
        </div>
        <div className="admin-table-wrap">
          {jobs.length ? <table className="admin-table">
            <thead>
              <tr>
                <th>任务</th>
                <th>状态</th>
                <th>计划</th>
                <th>最近运行</th>
                <th>错误</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((job) => (
                <tr key={job.id}>
                  <td>{job.jobType}</td>
                  <td><span className={job.healthy ? "admin-status good" : "admin-status warn"}>{job.status}</span></td>
                  <td>{job.scheduledAt || "-"}</td>
                  <td>{job.startedAt ? new Date(job.startedAt).toLocaleString("zh-CN") : "-"}</td>
                  <td>{job.errorMessage || "-"}</td>
                  <td><pre className="admin-code">{JSON.stringify(job.metadata, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table> : <div className="admin-empty">暂无可验证的任务运行记录。系统不会再用“已配置”的静态占位数据代替真实运行状态。</div>}
        </div>
        <div className="admin-pagination">
          {page.hasPrevious ? <Link href={pageHref({ pageSize: params.pageSize, page: page.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}
          <span>{page.currentPage} / {page.totalPages} · {page.total} 条</span>
          {page.hasNext ? <Link href={pageHref({ pageSize: params.pageSize, page: page.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}
        </div>
      </section>
    </div>
  );
}
