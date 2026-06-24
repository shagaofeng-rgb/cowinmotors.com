import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { EmptyState } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "页面表现 | Cowinmotors 后台",
};

export default async function AdminPagesPage({
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
          <p className="eyebrow">页面表现</p>
          <h1>落地页数据表现</h1>
          <p>按浏览量、访客、点击、询盘和转化率比较每个页面。</p>
        </div>
        <AdminDateRangeFilter range={range} />
      </header>

      <section className="admin-panel">
        {data.pages.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>页面</th>
                  <th>PV</th>
                  <th>UV</th>
                  <th>平均停留</th>
                  <th>点击</th>
                  <th>询盘</th>
                  <th>转化率</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((page) => (
                  <tr key={page.page}>
                    <td>{page.page}</td>
                    <td>{page.views}</td>
                    <td>{page.visitors}</td>
                    <td>{page.avgDuration}s</td>
                    <td>{page.clicks}</td>
                    <td>{page.inquiries}</td>
                    <td>{page.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>暂无页面表现数据。</EmptyState>
        )}
      </section>
    </div>
  );
}
