import { BarList, MetricCard } from "@/components/admin/AdminWidgets";
import { getSearchConsoleSnapshot } from "@/lib/analyticsStore";
import Link from "next/link";

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

export default async function AdminSearchConsolePage({
  searchParams,
}: {
  searchParams?: Promise<{ gsc?: string; message?: string }>;
}) {
  const params = await searchParams;
  const data = await getSearchConsoleSnapshot();
  const dateNote = data.dateRange ? `${data.dateRange.startDate} 至 ${data.dateRange.endDate}` : "GSC 指标";
  const statusMessage = params?.gsc === "connected"
    ? "Google Search Console 已授权，后台正在读取真实数据。"
    : params?.gsc === "disconnected"
      ? "Google Search Console 连接已断开。"
      : params?.message || "";

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Google SEO</p>
          <h1>Search Console 数据</h1>
          <p>用于查看点击量、曝光量、点击率、平均排名、页面和关键词搜索表现。</p>
        </div>
        <div className={data.live ? "admin-status good" : "admin-status"}>{data.live ? "GSC 已连接" : "GSC 待连接"}</div>
      </header>

      {statusMessage ? <div className={params?.gsc === "connected" ? "admin-alert good" : "admin-alert"}>{statusMessage}</div> : null}

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
              <form action="/api/admin/search-console/oauth/disconnect" method="post">
                <button className="admin-secondary-button" type="submit">断开 Google 授权</button>
              </form>
            </div>
          ) : (
            <div className="admin-stack">
              <p className="admin-muted">
                尚未读取到 Google Search Console 真实数据。{data.error ? `当前状态：${data.error}` : ""}
              </p>
              {data.oauth?.oauthConfigured ? (
                <Link className="admin-primary-button" href="/api/admin/search-console/oauth/start">
                  Connect Google Search Console
                </Link>
              ) : (
                <div className="admin-alert">
                  还需要配置 Google OAuth Client ID 和 Client Secret。配置后这里会出现一键授权按钮。
                </div>
              )}
              <div className="admin-mini-record">
                <strong>授权回调地址</strong>
                <span>{data.oauth?.redirectUri || "https://www.cowinmotors.com/api/admin/search-console/oauth/callback"}</span>
              </div>
              <p className="admin-muted">
                点连接后只需要用已绑定 Search Console 的 Google 账号确认一次授权，后台以后会自动同步关键词、页面、国家和设备数据。
              </p>
            </div>
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
