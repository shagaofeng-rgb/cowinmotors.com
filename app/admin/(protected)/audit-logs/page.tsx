import Link from "next/link";
import { filterByQuery, getAdminListParams, getAuditLogs, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "操作日志 | Cowinmotors 后台",
};

function pageHref(params: { q: string; pageSize: number; page: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("pageSize", String(params.pageSize));
  query.set("page", String(params.page));
  return `/admin/audit-logs?${query.toString()}`;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const logs = await getAuditLogs();
  const filtered = filterByQuery(logs, params.query, (log) => [
    log.actorEmail,
    log.action,
    log.resourceType,
    log.resourceId,
    log.ip,
    log.userAgent,
    JSON.stringify(log.metadata),
  ]);
  const page = paginate(filtered, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">操作日志</p>
          <h1>后台审计记录</h1>
          <p>记录导出、数据读取、同步和未来编辑动作。没有数据库时会展示询盘提交的只读审计兜底。</p>
        </div>
        <span className="admin-status">{filtered.length} logs</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <form action="/admin/audit-logs">
            <input name="q" placeholder="搜索账号、动作、资源、IP" defaultValue={params.query} />
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="10">10 / 页</option>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
            </select>
            <button type="submit">筛选</button>
          </form>
          <Link className="admin-secondary-button" href="/api/admin/audit-logs">查看 API</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>账号</th>
                <th>动作</th>
                <th>资源</th>
                <th>IP / UA</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                  <td>{log.actorEmail || "-"}</td>
                  <td>{log.action}</td>
                  <td>{log.resourceType} · {log.resourceId || "-"}</td>
                  <td>
                    <strong>{log.ip || "-"}</strong>
                    <span className="admin-muted">{log.userAgent || "-"}</span>
                  </td>
                </tr>
              ))}
              {!page.items.length ? <tr><td colSpan={5}>暂无审计记录。</td></tr> : null}
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
