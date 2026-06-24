import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "访客记录 | Cowinmotors 后台",
};

export default async function AdminVisitorsPage({
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
          <p className="eyebrow">访客记录</p>
          <h1>近期客户访问记录</h1>
          <p>匿名查看客户国家、设备、浏览器、来源渠道、访问页面和时间。</p>
        </div>
        <AdminDateRangeFilter range={range} />
      </header>

      <section className="admin-panel">
        {data.visitors.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>访客</th>
                  <th>国家</th>
                  <th>设备</th>
                  <th>来源</th>
                  <th>页面</th>
                </tr>
              </thead>
              <tbody>
                {data.visitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td>{new Date(visitor.timestamp).toLocaleString("zh-CN")}</td>
                    <td>{visitor.visitorId.slice(-8)}</td>
                    <td>{visitor.country}</td>
                    <td>{visitor.device} / {visitor.browser}</td>
                    <td>{visitor.sourcePlatform}</td>
                    <td>{visitor.page}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>暂无访客记录，前台产生访问后会自动出现。</EmptyState>
        )}
      </section>
    </div>
  );
}
