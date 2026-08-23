import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { BarList, MetricCard } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "流量分析 | Cowinmotors 后台",
};

export default async function AdminAnalyticsPage({
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
          <p className="eyebrow">流量分析</p>
          <h1>来源渠道与设备分析</h1>
          <p>查看客户从哪里进入网站、使用什么设备、哪些渠道带来询盘。</p>
        </div>
        <div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} /></div>
      </header>

      <section className="admin-metric-grid">
        <MetricCard label="真实 PV" value={data.overview.pageViews} note="已排除自动化流量" />
        <MetricCard label="真实 UV" value={data.overview.uniqueVisitors} note="独立访客" />
        <MetricCard label="Sessions" value={data.overview.sessions} note="30 分钟会话窗口" />
        <MetricCard label="Bounce" value={`${data.overview.bounceRate}%`} note="真实会话跳出率" />
      </section>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">每日趋势</p>
          <h2>PV 趋势</h2>
          <BarList rows={data.traffic.series.map((row) => ({ label: row.date, value: row.pv }))} />
        </article>
        <article className="admin-panel">
          <p className="eyebrow">渠道</p>
          <h2>来源渠道</h2>
          <BarList rows={data.traffic.channels} />
        </article>
      </section>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">平台</p>
          <h2>来源平台</h2>
          <BarList rows={data.traffic.sourcePlatforms} />
        </article>
        <article className="admin-panel">
          <p className="eyebrow">设备</p>
          <h2>设备 / 浏览器</h2>
          <BarList rows={[...data.traffic.devices, ...data.traffic.browsers]} />
        </article>
      </section>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">地域</p>
          <h2>访问国家 / 地区</h2>
          <BarList rows={data.traffic.countries} />
        </article>
        <article className="admin-panel">
          <p className="eyebrow">数据质量</p>
          <h2>默认未计入报表的流量</h2>
          <BarList rows={data.dataQuality.excludedByReason} />
        </article>
      </section>
    </div>
  );
}
