import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
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
  const range = getAdminDateRange(await searchParams);
  const data = await getAnalyticsSnapshot(range);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">访问路径</p>
          <h1>客户浏览路径</h1>
          <p>查看客户从哪些页面进入产品、询盘和联系方式页面。</p>
        </div>
        <AdminDateRangeFilter range={range} />
      </header>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">路径聚合</p>
          <h2>页面跳转</h2>
          {data.journeys.length ? (
            <div className="admin-stack">
              {data.journeys.map((journey) => (
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
          {data.landingJourneys.length ? (
            <div className="admin-stack">
              {data.landingJourneys.slice(0, 20).map((event) => (
                <div className="admin-mini-record" key={event.id}>
                  <strong>{event.previousPage || "Direct"} → {event.page}</strong>
                  <span>{event.sourcePlatform} · {event.device} · {new Date(event.timestamp).toLocaleString("zh-CN")}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>暂无进入记录。</EmptyState>
          )}
        </article>
      </section>
    </div>
  );
}
