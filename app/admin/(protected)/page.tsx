import Link from "next/link";
import { ClipboardList, FileText, Globe2, MessageSquareText, UserRound, Users } from "lucide-react";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { MetricCard, BarList } from "@/components/admin/AdminWidgets";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";
import { getAdminOverview, getCustomerDirectory, getInquiries, paginate } from "@/lib/adminData";
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
  const [analyticsHealth, analytics, allInquiries] = await Promise.all([
    getAnalyticsHealth(), getAnalyticsSnapshot(range), getInquiries(),
  ]);
  const [data, customers] = await Promise.all([
    getAdminOverview(allInquiries),
    getCustomerDirectory(resolveDateRange(range), { pageSize: 10 }, allInquiries),
  ]);
  const { startDate, endDate } = resolveDateRange(range);
  const inquiryPage = paginate(allInquiries.filter((inquiry) => {
    const createdAt = new Date(inquiry.createdAt).getTime();
    return createdAt >= startDate.getTime() && createdAt <= endDate.getTime();
  }), 1, 5);
  const metrics = [
    { label: "页面浏览 PV", value: analytics?.overview.pageViews ?? "—", note: "已过滤非真实访问", icon: FileText, tone: "blue" as const },
    { label: "匿名访客 UV", value: analytics?.overview.uniqueVisitors ?? "—", note: "按访客 ID 去重", icon: Users, tone: "green" as const },
    { label: "询盘记录", value: inquiryPage.total, note: "当前日期范围内的表单", icon: MessageSquareText, tone: "blue" as const },
    { label: "已识别客户", value: customers?.total ?? "—", note: "已留联系方式的客户", icon: UserRound, tone: "green" as const },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">运营数据 / 数据总览</p>
          <h1>数据总览</h1>
          <p>所选时段：{startDate.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })} 至 {endDate.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })} · Asia/Shanghai</p>
        </div>
        <div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} /></div>
      </header>

      {!analyticsHealth.connected ? <div className="admin-alert" role="alert">分析数据库暂不可用，流量与客户指标暂不显示。请检查数据连接后刷新。</div> : null}

      <section className="admin-metric-grid admin-overview-metrics">
        {metrics.map((metric) => (
          <MetricCard {...metric} key={metric.label} />
        ))}
      </section>

      <section className="admin-grid-2 admin-overview-breakdown">
        <div className="admin-panel">
          <div className="admin-panel-headline"><div><h2>来源渠道</h2><p>按真实页面浏览次数统计</p></div><Link href="/admin/analytics">查看分析</Link></div>
          {analytics ? <BarList rows={analytics.traffic.channels} /> : <div className="admin-empty"><ClipboardList size={26} aria-hidden="true" />数据连接不可用</div>}
        </div>
        <div className="admin-panel">
          <div className="admin-panel-headline"><div><h2>访问国家</h2><p>按已识别访问地域统计</p></div><Link href="/admin/visitors">查看访客</Link></div>
          {analytics ? <BarList rows={analytics.traffic.countries} /> : <div className="admin-empty"><Globe2 size={26} aria-hidden="true" />数据连接不可用</div>}
        </div>
      </section>

      <section className="admin-panel admin-overview-inquiries">
        <div className="admin-panel-headline"><div><h2>最近询盘</h2><p>当前日期范围内收到的真实表单</p></div><Link href="/admin/inquiries">查看全部</Link></div>
        {inquiryPage.items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>提交时间</th><th>客户</th><th>产品</th><th>通知状态</th><th>操作</th></tr></thead><tbody>{inquiryPage.items.map((inquiry) => <tr key={inquiry.id}><td>{new Date(inquiry.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}</td><td><strong>{inquiry.name}</strong><br /><span className="admin-muted">{inquiry.email}</span></td><td>{inquiry.product || inquiry.productType || "未填写"}</td><td><span className={`admin-status ${inquiry.deliveryStatus === "sent" ? "good" : inquiry.deliveryStatus === "failed" ? "danger" : "warn"}`}>{inquiry.deliveryStatus === "sent" ? "已通知" : inquiry.deliveryStatus === "failed" ? "通知失败" : inquiry.deliveryStatus === "pending" ? "待通知" : "未发送"}</span></td><td><Link href={`/admin/inquiries/${inquiry.id}`}>查看详情</Link></td></tr>)}</tbody></table></div> : <div className="admin-empty"><ClipboardList size={28} aria-hidden="true" /><span>此时间范围内暂无真实询盘</span></div>}
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
          <BarList rows={analytics?.traffic.sourcePlatforms || []} />
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
          <BarList rows={analytics?.pages.slice(0, 8).map((page) => ({ label: page.page, value: page.views })) || []} />
        </div>

        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">访客地域</p>
              <h2>国家与设备</h2>
            </div>
            <Link href="/admin/visitors">查看访客</Link>
          </div>
          <BarList rows={analytics?.traffic.devices || []} />
        </div>
      </section>

      <section className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel-headline"><div><p className="eyebrow">最近真实访问</p><h2>实时客户活动</h2></div><Link href="/admin/visitors">查看访客</Link></div>
          {analytics?.visitors.length ? <div className="admin-stack">{analytics.visitors.slice(0, 10).map((visitor) => <Link className="admin-mini-record" href={`/admin/visitors/${encodeURIComponent(visitor.visitorId)}`} key={visitor.id}><strong>{visitor.page}</strong><span>{visitor.country || "未知地域"} · {visitor.sourcePlatform} · {new Date(visitor.timestamp).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" })}</span></Link>)}</div> : <div className="admin-empty">当前范围内暂无真实访问。</div>}
        </div>
        <div className="admin-panel">
          <div className="admin-panel-headline"><div><p className="eyebrow">客户归属</p><h2>最新已识别客户</h2></div><Link href="/admin/customers">查看客户</Link></div>
          {customers?.items.length ? <div className="admin-stack">{customers.items.map((customer) => <Link className="admin-mini-record" href={`/admin/customers/${encodeURIComponent(customer.customerId)}`} key={customer.customerId}><strong>{customer.displayName}</strong><span>{customer.country || "未知地域"} · {customer.inquiries} 条询盘 · {customer.pageViews} PV</span></Link>)}</div> : <div className="admin-empty">当前范围内暂无已识别客户。</div>}
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
            数据库连接：{analyticsHealth.connected ? "正常" : "异常"} · 最后事件：{analyticsHealth.lastEventAt ? new Date(analyticsHealth.lastEventAt).toLocaleString("zh-CN") : "暂无"} · 非真实事件：{analytics?.overview.excludedEvents ?? "—"} · 产品图片路径检查通过。
          </div>
        )}
      </section>
    </div>
  );
}
