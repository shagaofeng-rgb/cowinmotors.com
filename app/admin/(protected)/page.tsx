import Link from "next/link";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { MetricCard, BarList } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAdminOverview } from "@/lib/adminData";
import { getAnalyticsSnapshot } from "@/lib/analyticsStore";

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
  const data = getAdminOverview();
  const metrics = [
    { label: "PV", value: analytics.overview.pageViews, note: `${range.days}天页面浏览` },
    { label: "UV", value: analytics.overview.uniqueVisitors, note: "匿名访客" },
    { label: "询盘", value: data.metrics.inquiries + analytics.overview.inquiries, note: "RFQ + 表单事件" },
    { label: "产品", value: data.metrics.products, note: `${data.metrics.categories} 个分类` },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">数据总览</p>
          <h1>网站后台数据总览</h1>
          <p>集中查看 Cowinmotors 当前流量、访客、询盘、产品、页面和基础健康状态。</p>
        </div>
        <AdminDateRangeFilter range={range} />
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
              <p className="eyebrow">访客设备</p>
              <h2>设备分布</h2>
            </div>
            <Link href="/admin/visitors">查看访客</Link>
          </div>
          <BarList rows={analytics.traffic.devices} />
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-headline">
          <div>
            <p className="eyebrow">系统健康</p>
            <h2>内容与资源状态</h2>
          </div>
          <span className={data.metrics.missingImages ? "admin-status warn" : "admin-status good"}>
            {data.metrics.missingImages ? "需要检查" : `${analytics.storageMode} / 正常`}
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
          <div className="admin-empty">产品图片路径检查通过。</div>
        )}
      </section>
    </div>
  );
}
