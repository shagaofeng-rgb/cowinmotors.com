import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { filterByQuery, getAdminListParams, paginate } from "@/lib/adminData";
import { getAnalyticsSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "访问路径 | Cowinmotors 后台",
};

export default async function AdminJourneysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const list = getAdminListParams(params);
  const data = await getAnalyticsSnapshot(range);
  const routes = paginate(filterByQuery(data.journeys, list.query, (journey) => [journey.route]), list.page, list.pageSize);
  const landings = paginate(filterByQuery(data.landingJourneys, list.query, (event) => [event.page, event.previousPage, event.country, event.sourcePlatform]), list.page, list.pageSize);
  const preserve = { q: list.query, pageSize: String(list.pageSize) };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">访问路径</p>
          <h1>客户浏览路径</h1>
          <p>查看客户从哪些页面进入产品、询盘和联系方式页面。</p>
        </div>
        <div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} preserve={preserve} /></div>
      </header>

      <form className="admin-toolbar admin-filter-form" method="get">
        <input name="q" placeholder="搜索页面路径、国家或来源" defaultValue={list.query} />
        <select name="pageSize" defaultValue={String(list.pageSize)}><option value="25">25 / 页</option><option value="50">50 / 页</option><option value="100">100 / 页</option></select>
        <input type="hidden" name="range" value={range.preset} /><input type="hidden" name="days" value={String(range.days)} />
        {range.startDate ? <input type="hidden" name="startDate" value={range.startDate} /> : null}{range.endDate ? <input type="hidden" name="endDate" value={range.endDate} /> : null}
        <button type="submit">筛选</button>
      </form>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">路径聚合</p>
          <h2>页面跳转</h2>
          {routes.items.length ? (
            <div className="admin-stack">
              {routes.items.map((journey) => (
                <div className="admin-mini-record" key={journey.route}>
                  <strong>{journey.route}</strong>
                  <span>{journey.value} 次</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>暂无路径聚合数据。</EmptyState>
          )}
        </article>

        <article className="admin-panel">
          <p className="eyebrow">近期落地</p>
          <h2>进入记录</h2>
          {landings.items.length ? (
            <div className="admin-stack">
              {landings.items.map((event) => (
                <a className="admin-mini-record" href={`/admin/visitors/${encodeURIComponent(event.visitorId)}`} key={event.id}>
                  <strong>{event.previousPage || "Direct"} → {event.page}</strong>
                  <span>{event.country || "Unknown"} · {event.sourcePlatform} · {event.device} · {new Date(event.timestamp).toLocaleString("zh-CN", { hour12: false })}</span>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState>暂无进入记录。</EmptyState>
          )}
        </article>
      </section>
      <div className="admin-pagination">
        {routes.hasPrevious || landings.hasPrevious ? <a href={`?${new URLSearchParams({ ...preserve, range: range.preset, days: String(range.days), ...(range.startDate ? { startDate: range.startDate } : {}), ...(range.endDate ? { endDate: range.endDate } : {}), page: String(Math.max(1, list.page - 1)) }).toString()}`}>上一页</a> : <span>上一页</span>}
        <span>{list.page} · 路径 {routes.total} 条 / 访问 {landings.total} 条</span>
        {routes.hasNext || landings.hasNext ? <a href={`?${new URLSearchParams({ ...preserve, range: range.preset, days: String(range.days), ...(range.startDate ? { startDate: range.startDate } : {}), ...(range.endDate ? { endDate: range.endDate } : {}), page: String(list.page + 1) }).toString()}`}>下一页</a> : <span>下一页</span>}
      </div>
    </div>
  );
}
