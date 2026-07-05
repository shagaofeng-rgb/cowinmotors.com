import { BarList, MetricCard } from "@/components/admin/AdminWidgets";
import { getSearchConsoleSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO 数据 | Cowinmotors 后台",
};

function shortPage(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/" ? parsed.hostname : parsed.pathname;
  } catch {
    return url;
  }
}

export default async function AdminSearchConsolePage() {
  const data = await getSearchConsoleSnapshot();
  const dateNote = data.dateRange ? `${data.dateRange.startDate} 至 ${data.dateRange.endDate}` : "GSC 指标";

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Google SEO</p>
          <h1>Search Console 数据</h1>
          <p>用于查看点击量、曝光量、点击率、平均排名、页面和关键词搜索表现。</p>
        </div>
        <div className={data.live ? "admin-status good" : "admin-status"}>{data.live ? "GSC 已连接" : "GSC 未连接"}</div>
      </header>

      <section className="admin-metric-grid">
        <MetricCard label="点击量" value={data.overview.clicks} note={dateNote} />
        <MetricCard label="曝光量" value={data.overview.impressions} note={dateNote} />
        <MetricCard label="点击率" value={`${data.overview.ctr}%`} note="平均值" />
        <MetricCard label="排名位置" value={data.overview.position} note="平均值" />
      </section>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">关键词</p>
          <h2>搜索词表现</h2>
          <BarList rows={data.queries.map((row: any) => ({ label: row.query, value: row.clicks }))} />
        </article>
        <article className="admin-panel">
          <p className="eyebrow">连接状态</p>
          <h2>Search Console API</h2>
          {data.live ? (
            <div className="admin-stack">
              <div className="admin-status good">已读取真实 GSC 数据</div>
              <p className="admin-muted">站点资源：{data.siteUrl}</p>
              <p className="admin-muted">当前展示最近 28 天可用搜索数据。Google Search Console 通常会有 2-3 天数据延迟。</p>
            </div>
          ) : (
            <>
              <p className="admin-muted">
                尚未读取到 Google Search Console API 数据。{data.error ? `当前状态：${data.error}` : ""}
              </p>
              <ol className="admin-setup-list">
                <li>启用 Google Search Console API。</li>
                <li>创建 Service Account，并把邮箱加到 GSC 网站资源中。</li>
                <li>在 Vercel 配置 GOOGLE_SEARCH_CONSOLE_SITE_URL、GOOGLE_CLIENT_EMAIL、GOOGLE_PRIVATE_KEY。</li>
                <li>重新部署后后台自动读取真实关键词、页面、国家和设备数据。</li>
              </ol>
            </>
          )}
        </article>
      </section>

      <section className="admin-grid-2">
        <article className="admin-panel">
          <p className="eyebrow">页面</p>
          <h2>自然搜索页面表现</h2>
          <BarList rows={data.pages.map((row: any) => ({ label: shortPage(row.page), value: row.clicks }))} />
        </article>
        <article className="admin-panel">
          <p className="eyebrow">设备</p>
          <h2>设备点击分布</h2>
          <BarList rows={data.devices.map((row: any) => ({ label: row.device, value: row.clicks }))} />
        </article>
      </section>

      <section className="admin-panel">
        <p className="eyebrow">国家/地区</p>
        <h2>搜索来源国家</h2>
        <BarList rows={data.countries.map((row: any) => ({ label: row.country, value: row.clicks }))} />
      </section>
    </div>
  );
}
