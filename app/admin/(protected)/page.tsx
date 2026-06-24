import Link from "next/link";
import { getAdminOverview } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "数据总览 | Cowinmotors 后台",
};

export default function AdminOverviewPage() {
  const data = getAdminOverview();
  const metrics = [
    { label: "产品数量", value: data.metrics.products },
    { label: "产品分类", value: data.metrics.categories },
    { label: "询盘记录", value: data.metrics.inquiries },
    { label: "缺失图片", value: data.metrics.missingImages },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">数据总览</p>
          <h1>网站后台数据总览</h1>
          <p>集中查看 Cowinmotors 当前产品、分类、询盘、页面和基础健康状态。</p>
        </div>
        <span className="admin-status">更新时间 {new Date(data.generatedAt).toLocaleString("zh-CN")}</span>
      </header>

      <section className="admin-metric-grid">
        {metrics.map((metric) => (
          <div className="admin-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
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
              <p className="eyebrow">询盘</p>
              <h2>最近询盘</h2>
            </div>
            <Link href="/admin/inquiries">查看全部</Link>
          </div>
          {data.recentInquiries.length ? (
            <div className="admin-stack">
              {data.recentInquiries.map((inquiry) => (
                <article className="admin-mini-record" key={inquiry.id}>
                  <strong>{inquiry.product || inquiry.productType}</strong>
                  <span>{inquiry.name} · {inquiry.email}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty">暂无询盘记录。</div>
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-headline">
          <div>
            <p className="eyebrow">系统健康</p>
            <h2>内容与资源状态</h2>
          </div>
          <span className={data.metrics.missingImages ? "admin-status warn" : "admin-status good"}>
            {data.metrics.missingImages ? "需要检查" : "正常"}
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
