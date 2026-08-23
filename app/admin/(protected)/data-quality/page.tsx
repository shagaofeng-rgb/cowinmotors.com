import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { AdminLiveRefresh } from "@/components/admin/AdminLiveRefresh";
import { BarList, MetricCard } from "@/components/admin/AdminWidgets";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getTrafficQualityReport } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";
export const metadata = { title: "数据质量 | Cowinmotors 后台" };

export default async function AdminDataQualityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const range = getAdminDateRange(await searchParams);
  const report = await getTrafficQualityReport(range);
  return <div className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">数据质量</p><h1>流量排除与采集诊断</h1><p>已排除流量保留在审计区，不会进入经营数据、客户分层或转化报表。</p></div><div className="admin-page-actions"><AdminLiveRefresh /><AdminDateRangeFilter range={range} /></div></header>
    <section className="admin-metric-grid"><MetricCard label="原始事件" value={report.totalEvents} note="所有第一方埋点" /><MetricCard label="真实事件" value={report.realEvents} note="进入默认报表" /><MetricCard label="已排除" value={report.excludedEvents} note="自动化、预览与测试" /><MetricCard label="待复核" value={report.reviewEvents} note="不会直接删除" /></section>
    <section className="admin-grid-2"><article className="admin-panel"><p className="eyebrow">规则命中</p><h2>排除原因</h2><BarList rows={report.reasons} /></article><article className="admin-panel"><p className="eyebrow">来源</p><h2>排除来源</h2><BarList rows={report.sources} /></article></section>
    <section className="admin-panel"><p className="eyebrow">审计记录</p><h2>最近已排除或待复核事件</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>时间</th><th>状态</th><th>原因</th><th>来源</th><th>国家 / IP</th><th>页面</th></tr></thead><tbody>{report.recent.map((event) => <tr key={event.id}><td>{new Date(event.timestamp).toLocaleString("zh-CN", { hour12: false })}</td><td><span className={event.status === "excluded" ? "admin-status warn" : "admin-status"}>{event.status === "excluded" ? "已排除" : "待复核"}</span></td><td>{event.reason}</td><td>{event.source}</td><td>{event.country}<span className="admin-muted">{event.maskedIp}</span></td><td>{event.page}</td></tr>)}{!report.recent.length ? <tr><td colSpan={6}>当前范围内没有已排除或待复核事件。</td></tr> : null}</tbody></table></div></section>
  </div>;
}
