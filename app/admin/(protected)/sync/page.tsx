import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { getSyncSnapshot } from "@/lib/admin-sync";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";
import { getAdminListParams, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "数据同步 | Cowinmotors 后台",
};

function pageHref(params: { pageSize: number; page: number; range?: string; days?: number; startDate?: string; endDate?: string }) {
  const query = new URLSearchParams({ pageSize: String(params.pageSize), page: String(params.page) });
  if (params.range) query.set("range", params.range);
  if (params.days) query.set("days", String(params.days));
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  return `/admin/sync?${query.toString()}`;
}

const statusLabel = { healthy: "正常", failed: "最近运行异常", missing: "计划任务未到达", unavailable: "读取失败", empty: "暂无运行记录", paused: "自动任务已暂停" };
const formatTime = (value: string) => value ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "未记录";

export default async function AdminSyncPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const params = getAdminListParams(rawParams);
  const range = getAdminDateRange(rawParams?.range || rawParams?.days || rawParams?.startDate || rawParams?.endDate ? rawParams : { range: "week" });
  const { jobs, sources, readable, truncated } = await getSyncSnapshot(resolveDateRange(range));
  const hasWarning = sources.some((source) => source.status === "unavailable" || source.status === "missing" || source.status === "failed");
  const page = paginate(jobs, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">数据同步</p>
          <h1>Cron、SEO 与数据任务</h1>
          <p>查看签名 Blog 发布、站点地图维护、每月询盘测试邮件和 Search Console 数据读取状态。</p>
        </div>
        <div className="admin-page-actions"><span className={hasWarning ? "admin-status warn" : "admin-status good"}>{hasWarning ? "需要检查" : "计划任务正常"}</span><AdminDateRangeFilter range={range} preserve={{ pageSize: String(params.pageSize) }} /></div>
      </header>

      <section className="admin-panel" aria-labelledby="sync-health">
        <div className="admin-panel-headline"><h2 id="sync-health">任务状态</h2><p>北京时间 · 当前状态不受历史日期筛选影响</p></div>
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th scope="col">链路</th><th scope="col">状态</th><th scope="col">最近尝试</th><th scope="col">最近成功</th></tr></thead>
          <tbody>{sources.map((source) => <tr key={source.key}>
            <th scope="row">{source.label}</th>
            <td><span className={`admin-status ${source.status === "healthy" ? "good" : ["unavailable", "missing", "failed"].includes(source.status) ? "warn" : ""}`}>{statusLabel[source.status]}</span></td>
            <td>{formatTime(source.latest?.startedAt || "")}</td>
            <td>{formatTime(source.lastSuccessAt)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-badge-list">
            <Link className="admin-secondary-button" href="/admin/inquiries?range=month&amp;delivery=attention">询盘通知异常</Link>
            <Link className="admin-secondary-button" href="/admin/news">新闻任务</Link>
            <Link className="admin-secondary-button" href="/admin/search-console">SEO 数据</Link>
            <Link className="admin-secondary-button" href="/api/admin/sitemap">Sitemap 状态</Link>
          </div>
          <form action="/admin/sync">
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
              <option value="100">100 / 页</option>
            </select>
            <input type="hidden" name="range" value={range.preset} /><input type="hidden" name="days" value={String(range.days)} />
            {range.startDate ? <input type="hidden" name="startDate" value={range.startDate} /> : null}{range.endDate ? <input type="hidden" name="endDate" value={range.endDate} /> : null}
            <button type="submit">应用</button>
          </form>
        </div>
        <div className="admin-table-wrap">
          {jobs.length ? <table className="admin-table">
            <thead>
              <tr>
                <th>任务</th>
                <th>状态</th>
                <th>最近运行</th>
                <th>重试</th>
                <th>错误</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((job) => (
                <tr key={job.id}>
                  <td>{job.jobType}</td>
                  <td><span className={job.healthy ? "admin-status good" : "admin-status warn"}>{job.status}</span></td>
                  <td>{formatTime(job.startedAt)}</td>
                  <td>{job.retryCount}</td>
                  <td>{job.errorMessage || "-"}</td>
                  <td>{Object.keys(job.metadata).length > 0 ? <details><summary>查看结果</summary><pre className="admin-code">{JSON.stringify(job.metadata, null, 2)}</pre></details> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table> : <div className="admin-empty">{readable ? "所选日期内没有可读取的运行记录。" : "无法读取任务数据，请查看上方状态。"}</div>}
        </div>
        {truncated && <p className="admin-muted">历史记录已达显示上限，缩小日期范围可查看更多结果。</p>}
        <div className="admin-pagination">
          {page.hasPrevious ? <Link href={pageHref({ pageSize: params.pageSize, page: page.currentPage - 1, range: range.preset, days: range.days, startDate: range.startDate, endDate: range.endDate })}>上一页</Link> : <span>上一页</span>}
          <span>{page.currentPage} / {page.totalPages} · {page.total} 条</span>
          {page.hasNext ? <Link href={pageHref({ pageSize: params.pageSize, page: page.currentPage + 1, range: range.preset, days: range.days, startDate: range.startDate, endDate: range.endDate })}>下一页</Link> : <span>下一页</span>}
        </div>
      </section>
    </div>
  );
}
