import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";
import { getCustomerDirectory } from "@/lib/adminData";

export const dynamic = "force-dynamic";
export const metadata = { title: "客户档案 | Cowinmotors 后台" };

function read(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function hrefFor(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return `/admin/customers?${query.toString()}`;
}

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const filters = {
    query: read(params, "q"),
    country: read(params, "country"),
    label: read(params, "label"),
    page: Number(read(params, "page") || 1),
    pageSize: Number(read(params, "pageSize") || 25),
  };
  const data = await getCustomerDirectory(resolveDateRange(range), filters);
  const preserve = { q: filters.query, country: filters.country, label: filters.label, pageSize: String(data.pageSize) };

  return <div className="admin-page">
    <header className="admin-page-head">
      <div><p className="eyebrow">客户档案</p><h1>已识别客户与完整访问归属</h1><p>仅在客户提交相同邮箱或电话后合并对应的匿名访客路径；不会基于 IP 自动猜测身份。</p></div>
      <div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} preserve={preserve} /></div>
    </header>
    <section className="admin-panel">
      <form className="admin-toolbar admin-filter-form" method="get">
        <input name="q" placeholder="搜索客户、邮箱、电话或标签" defaultValue={filters.query} />
        <select name="country" defaultValue={filters.country}><option value="">全部国家</option>{data.options.countries.map((value) => <option value={value} key={value}>{value}</option>)}</select>
        <select name="label" defaultValue={filters.label}><option value="">全部客户类型</option><option>已询盘</option><option>回访客户</option><option>高意向</option></select>
        <select name="pageSize" defaultValue={String(data.pageSize)}><option value="25">25 / 页</option><option value="50">50 / 页</option><option value="100">100 / 页</option></select>
        <input type="hidden" name="range" value={range.preset} />
        <input type="hidden" name="days" value={String(range.days)} />
        {range.startDate ? <input type="hidden" name="startDate" value={range.startDate} /> : null}
        {range.endDate ? <input type="hidden" name="endDate" value={range.endDate} /> : null}
        <button type="submit">筛选</button><Link className="admin-secondary-button" href="/admin/customers">重置</Link>
      </form>
      {data.items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>最后活动</th><th>客户</th><th>国家</th><th>已关联访问</th><th>询盘</th><th>分类</th><th aria-label="打开详情" /></tr></thead><tbody>{data.items.map((customer) => <tr key={customer.customerId}>
        <td>{customer.lastSeen ? new Date(customer.lastSeen).toLocaleString("zh-CN", { hour12: false }) : "-"}<span className="admin-muted">首次：{customer.firstSeen ? new Date(customer.firstSeen).toLocaleString("zh-CN", { hour12: false }) : "-"}</span></td>
        <td><strong>{customer.displayName}</strong><span className="admin-muted">{customer.email || customer.phone || "-"}</span></td>
        <td>{customer.country || "Unknown"}</td>
        <td>{customer.visitorIds.length} 位访客 · {customer.sessions} 次会话 · {customer.pageViews} PV</td>
        <td>{customer.inquiries}</td>
        <td><div className="admin-badge-list">{customer.labels.map((label) => <span className="admin-status good" key={label}>{label}</span>)}</div></td>
        <td><Link className="admin-table-action" href={`/admin/customers/${encodeURIComponent(customer.customerId)}`}>查看档案</Link></td>
      </tr>)}</tbody></table></div> : <EmptyState>此日期范围内暂无已识别客户。访客尚未提交联系方式时会留在“访客记录”中。</EmptyState>}
      <div className="admin-pagination">
        {data.hasPrevious ? <Link href={hrefFor({ ...preserve, range: range.preset, days: range.days, startDate: range.startDate, endDate: range.endDate, page: data.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}
        <span>{data.currentPage} / {data.totalPages} · {data.total} 位客户</span>
        {data.hasNext ? <Link href={hrefFor({ ...preserve, range: range.preset, days: range.days, startDate: range.startDate, endDate: range.endDate, page: data.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}
      </div>
    </section>
  </div>;
}
