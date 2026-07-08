import Link from "next/link";
import { getSyncJobs } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "数据同步 | Cowinmotors 后台",
};

export default async function AdminSyncPage() {
  const jobs = await getSyncJobs();
  const hasWarning = jobs.some((job) => job.status !== "正常" || job.errorMessage);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">数据同步</p>
          <h1>Cron、SEO 与数据任务</h1>
          <p>检查新闻自动发布、每月询盘测试邮件、Search Console 同步和数据任务状态。</p>
        </div>
        <span className={hasWarning ? "admin-status warn" : "admin-status good"}>{hasWarning ? "需要检查" : "已配置"}</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-badge-list">
            <Link className="admin-secondary-button" href="/api/admin/sync">查看 API</Link>
            <Link className="admin-secondary-button" href="/admin/news">新闻任务</Link>
            <Link className="admin-secondary-button" href="/admin/search-console">SEO 数据</Link>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
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
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.jobType}</td>
                  <td><span className={job.errorMessage || job.status !== "正常" ? "admin-status warn" : "admin-status good"}>{job.status}</span></td>
                  <td>{job.scheduledAt || "-"}</td>
                  <td>{job.startedAt ? new Date(job.startedAt).toLocaleString("zh-CN") : "-"}</td>
                  <td>{job.errorMessage || "-"}</td>
                  <td><pre className="admin-code">{JSON.stringify(job.metadata, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
