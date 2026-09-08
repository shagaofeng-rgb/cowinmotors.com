import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { MetricCard, BarList } from "@/components/admin/AdminWidgets";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";
import { getAdminOverview, getCustomerDirectory } from "@/lib/adminData";
import { getAnalyticsHealth, getAnalyticsSnapshot } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "数据总览 | Cowinmotors 后台",
};

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const range = getAdminDateRange(await searchParams);
  const analytics = await getAnalyticsSnapshot(range);
  const analyticsHealth = await getAnalyticsHealth();
  const data = await getAdminOverview();
  const customers = await getCustomerDirectory(resolveDateRange(range), { pageSize: 10 });
  const metrics = [
    { label: "真实 PV", value: analytics.overview.pageViews, note: `${analytics.rangeDays} 天已过滤自动化流量` },
    { label: "真实 UV", value: analytics.overview.uniqueVisitors, note: "匿名访客" },
    { label: "RFQ 提交", value: analytics.overview.inquiries, note: "同一事件仅统计一次" },
    { label: "已识别客户", value: customers.total, note: "已留邮箱或电话的真实客户" },
    { label: "已排除", value: analytics.overview.excludedEvents, note: "预览、爬虫、测试与自动化" },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">数据总览</p>
          <h1>网站后台数据总览</h1>
          <p>集中查看 Cowinmotors 当前流量、访客、询盘、产品、页面和基础健康状态。</p>
        </div>
        <div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} /></div>
      </header>

      <section className="admin-metric-grid">
        {metrics.map((metric) => (
          <MetricCard label={metric.label} value={metric.value} note={metric.note} key={metric.label} />
        ))}
      </section>

      <section className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">分类表现</p>
              <h2>产品分类数据</h2>
            </div>
            <Link href="/admin/products">查看产品</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>分类</th>
                  <th>数量</th>
                  <th>有价格</th>
                  <th>RFQ</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((category) => (
                  <tr key={category.category}>
                    <td>{category.category}</td>
                    <td>{category.count}</td>
                    <td>{category.priced}</td>
                    <td>{category.rfq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">来源渠道</p>
              <h2>流量来源</h2>
            </div>
          </div>
          <BarList rows={analytics.traffic.channels} />
        </div>
      </section>

      <section className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">页面表现</p>
              <h2>热门落地页</h2>
            </div>
            <Link href="/admin/pages">查看页面</Link>
          </div>
          <BarList rows={analytics.pages.slice(0, 8).map((page) => ({ label: page.page, value: page.views }))} />
        </div>

        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">访客地域</p>
              <h2>国家与设备</h2>
            </div>
            <Link href="/admin/visitors">查看访客</Link>
          </div>
          <BarList rows={[...analytics.traffic.countries.slice(0, 5), ...analytics.traffic.devices]} />
        </div>
      </section>

      <section className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel-headline"><div><p className="eyebrow">最近真实访问</p><h2>实时客户活动</h2></div><Link href="/admin/visitors">查看访客</Link></div>
          {analytics.visitors.length ? <div className="admin-stack">{analytics.visitors.slice(0, 10).map((visitor) => <Link className="admin-mini-record" href={`/admin/visitors/${encodeURIComponent(visitor.visitorId)}`} key={visitor.id}><strong>{visitor.page}</strong><span>{visitor.country || "Unknown"} · {visitor.sourcePlatform} · {new Date(visitor.timestamp).toLocaleString("zh-CN", { hour12: false })}</span></Link>)}</div> : <div className="admin-empty">当前范围内暂无真实访问。</div>}
        </div>
        <div className="admin-panel">
          <div className="admin-panel-headline"><div><p className="eyebrow">客户归属</p><h2>最新已识别客户</h2></div><Link href="/admin/customers">查看客户</Link></div>
          {customers.items.length ? <div className="admin-stack">{customers.items.map((customer) => <Link className="admin-mini-record" href={`/admin/customers/${encodeURIComponent(customer.customerId)}`} key={customer.customerId}><strong>{customer.displayName}</strong><span>{customer.country || "Unknown"} · {customer.inquiries} 条询盘 · {customer.pageViews} PV</span></Link>)}</div> : <div className="admin-empty">当前范围内暂无已识别客户。</div>}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-headline">
          <div>
            <p className="eyebrow">系统健康</p>
            <h2>内容与资源状态</h2>
          </div>
          <span className={data.metrics.missingImages ? "admin-status warn" : "admin-status good"}>
            {analyticsHealth.connected ? `${analyticsHealth.storageMode} / 已连接` : "数据连接需检查"}
          </span>
        </div>
        {data.missingImages.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>图片路径</th>
                  <th>页面</th>
                </tr>
              </thead>
              <tbody>
                {data.missingImages.map((item) => (
                  <tr key={item.path}>
                    <td>{item.title}</td>
                    <td>{item.image}</td>
                    <td><Link href={item.path}>打开</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            数据库连接：{analyticsHealth.connected ? "正常" : "异常"} · 最后事件：{analyticsHealth.lastEventAt ? new Date(analyticsHealth.lastEventAt).toLocaleString("zh-CN") : "暂无"} · 产品图片路径检查通过。
          </div>
        )}
      </section>
    </div>
  );
}
