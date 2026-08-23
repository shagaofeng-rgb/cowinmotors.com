import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { filterByQuery, getAdminListParams, paginate } from "@/lib/adminData";
import { getAnalyticsSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";
export const metadata = { title: "页面表现 | Cowinmotors 后台" };

function hrefFor(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return `/admin/pages?${query.toString()}`;
}

export default async function AdminPagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const rawParams = await searchParams;
  const range = getAdminDateRange(rawParams);
  const list = getAdminListParams(rawParams);
  const data = await getAnalyticsSnapshot(range);
  const pages = paginate(filterByQuery(data.pages, list.query, (page) => [page.page, page.title]), list.page, list.pageSize);
  const preserve = { q: list.query, pageSize: String(list.pageSize) };
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">页面表现</p><h1>落地页数据表现</h1><p>按浏览量、访客、点击、询盘和转化率比较每个页面，仅统计已过滤后的真实访问。</p></div><div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} preserve={preserve} /></div></header>
    <section className="admin-panel"><form className="admin-toolbar admin-filter-form" method="get"><input name="q" placeholder="搜索页面路径或标题" defaultValue={list.query} /><select name="pageSize" defaultValue={String(list.pageSize)}><option value="25">25 / 页</option><option value="50">50 / 页</option><option value="100">100 / 页</option></select><input type="hidden" name="days" value={String(range.days)} />{range.startDate ? <input type="hidden" name="startDate" value={range.startDate} /> : null}{range.endDate ? <input type="hidden" name="endDate" value={range.endDate} /> : null}<button type="submit">筛选</button><Link className="admin-secondary-button" href="/admin/pages">重置</Link></form>
      {pages.items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>页面</th><th>PV</th><th>UV</th><th>平均停留</th><th>点击</th><th>询盘</th><th>转化率</th></tr></thead><tbody>{pages.items.map((page) => <tr key={page.page}><td><strong>{page.page}</strong><span className="admin-muted">{page.title}</span></td><td>{page.views}</td><td>{page.visitors}</td><td>{page.avgDuration}s</td><td>{page.clicks}</td><td>{page.inquiries}</td><td>{page.conversionRate}%</td></tr>)}</tbody></table></div> : <EmptyState>暂无页面表现数据。</EmptyState>}
      <div className="admin-pagination">{pages.hasPrevious ? <Link href={hrefFor({ ...preserve, days: range.days, startDate: range.startDate, endDate: range.endDate, page: pages.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}<span>{pages.currentPage} / {pages.totalPages} · {pages.total} 个页面</span>{pages.hasNext ? <Link href={hrefFor({ ...preserve, days: range.days, startDate: range.startDate, endDate: range.endDate, page: pages.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}</div>
    </section>
  </div>;
}
