import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getVisitorDirectory } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = { title: "访客记录 | Cowinmotors 后台" };

function read(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function hrefFor(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return `/admin/visitors?${query.toString()}`;
}

export default async function AdminVisitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const filters = {
    query: read(params, "q"), country: read(params, "country"), channel: read(params, "channel"), source: read(params, "source"), device: read(params, "device"), label: read(params, "label"),
    page: Number(read(params, "page") || 1), pageSize: Number(read(params, "pageSize") || 25),
  };
  const data = await getVisitorDirectory(range, filters);
  const preserve = { q: filters.query, country: filters.country, channel: filters.channel, source: filters.source, device: filters.device, label: filters.label, pageSize: String(data.pageSize) };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div><p className="eyebrow">访客记录</p><h1>真实客户访问记录</h1><p>默认仅显示已排除预览、爬虫、无头浏览器和测试流量后的访问；点击记录可查看完整路径。</p></div>
        <div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} preserve={preserve} /></div>
      </header>

      <section className="admin-panel">
        <form className="admin-toolbar admin-filter-form" method="get">
          <input name="q" placeholder="搜索访客、国家、来源或标签" defaultValue={filters.query} />
          <select name="country" defaultValue={filters.country}><option value="">全部国家</option>{data.options.countries.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select name="channel" defaultValue={filters.channel}><option value="">全部渠道</option>{data.options.channels.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select name="source" defaultValue={filters.source}><option value="">全部来源</option>{data.options.sources.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select name="device" defaultValue={filters.device}><option value="">全部设备</option>{data.options.devices.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select name="label" defaultValue={filters.label}><option value="">全部客户类型</option><option>新访客</option><option>回访客户</option><option>高意向</option><option>已询盘</option></select>
          <select name="pageSize" defaultValue={String(data.pageSize)}><option value="25">25 / 页</option><option value="50">50 / 页</option><option value="100">100 / 页</option></select>
          <input type="hidden" name="days" value={String(range.days)} />
          {range.startDate ? <input type="hidden" name="startDate" value={range.startDate} /> : null}
          {range.endDate ? <input type="hidden" name="endDate" value={range.endDate} /> : null}
          <button type="submit">筛选</button><Link className="admin-secondary-button" href="/admin/visitors">重置</Link>
        </form>

        {data.items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>最后访问</th><th>访客</th><th>位置 / IP</th><th>来源</th><th>访问</th><th>客户分类</th><th aria-label="打开详情" /></tr></thead><tbody>{data.items.map((visitor) => <tr key={visitor.visitorId}>
          <td>{new Date(visitor.lastSeen).toLocaleString("zh-CN", { hour12: false })}</td>
          <td><strong>{visitor.displayId}</strong><span className="admin-muted">首次：{new Date(visitor.firstSeen).toLocaleDateString("zh-CN")}</span></td>
          <td>{[visitor.country, visitor.region || visitor.city].filter(Boolean).join(" · ") || "Unknown"}<span className="admin-muted">{visitor.maskedIp}</span></td>
          <td>{visitor.source}<span className="admin-muted">{visitor.channel} · {visitor.device}</span></td>
          <td>{visitor.visits} 次会话 · {visitor.pageViews} PV</td>
          <td><div className="admin-badge-list">{visitor.labels.map((label) => <span className="admin-status good" key={label}>{label}</span>)}</div></td>
          <td><Link className="admin-table-action" href={`/admin/visitors/${encodeURIComponent(visitor.visitorId)}`}>查看路径</Link></td>
        </tr>)}</tbody></table></div> : <EmptyState>此日期与筛选条件下暂无真实访客记录。</EmptyState>}

        <div className="admin-pagination">
          {data.currentPage > 1 ? <Link href={hrefFor({ ...preserve, days: range.days, startDate: range.startDate, endDate: range.endDate, page: data.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}
          <span>{data.currentPage} / {data.totalPages} · {data.total} 位访客</span>
          {data.currentPage < data.totalPages ? <Link href={hrefFor({ ...preserve, days: range.days, startDate: range.startDate, endDate: range.endDate, page: data.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}
        </div>
      </section>
    </div>
  );
}
