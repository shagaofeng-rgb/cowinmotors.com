import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";
import { getCustomerProfile } from "@/lib/adminData";

export const dynamic = "force-dynamic";
export const metadata = { title: "客户详情 | Cowinmotors 后台" };

const eventLabels = { page_view: "浏览页面", engagement: "页面停留", click: "点击操作", form_submit: "提交表单" } as const;
const time = (value: string) => value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "-";

export default async function AdminCustomerDetailPage({ params, searchParams }: { params: Promise<{ customerId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ customerId }, rawParams] = await Promise.all([params, searchParams]);
  const range = getAdminDateRange(rawParams);
  const customer = await getCustomerProfile(customerId, resolveDateRange(range));
  if (!customer) notFound();
  return <div className="admin-page admin-detail-page">
    <header className="admin-page-head"><div><Link className="admin-back-link" href="/admin/customers">返回客户档案</Link><p className="eyebrow">已识别客户详情</p><h1>{customer.displayName}</h1><p>{customer.country || "Unknown"} · {customer.email || customer.phone || "无可展示联系方式"} · 同一邮箱或电话关联 {customer.visitorIds.length} 个匿名访客。</p></div><div className="admin-page-actions"><AdminDateRangeFilter range={range} /><div className="admin-badge-list">{customer.labels.map((label) => <span className="admin-status good" key={label}>{label}</span>)}</div></div></header>
    <section className="admin-journey-metrics"><div><span>提交询盘</span><strong>{customer.inquiries}</strong></div><div><span>关联访客</span><strong>{customer.visitorIds.length}</strong></div><div><span>访问会话</span><strong>{customer.sessions}</strong></div><div><span>页面浏览</span><strong>{customer.pageViews}</strong></div></section>
    <section className="admin-panel admin-detail-panel"><p className="eyebrow">询盘记录</p><h2>该客户的真实提交</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>时间</th><th>产品</th><th>车型</th><th>需求</th><th /></tr></thead><tbody>{customer.inquiryRecords.map((inquiry) => <tr key={inquiry.id}><td>{time(inquiry.createdAt)}</td><td>{inquiry.product || inquiry.productType || "-"}</td><td>{inquiry.vehicleInfo || "-"}</td><td>{inquiry.requirement || "-"}</td><td><Link className="admin-table-action" href={`/admin/inquiries/${inquiry.id}`}>询盘详情</Link></td></tr>)}</tbody></table></div></section>
    <section className="admin-panel admin-detail-panel"><p className="eyebrow">完整访问路径</p><h2>所关联浏览器的第一方访问记录</h2>{customer.events.length ? <ol className="admin-journey-timeline">{customer.events.map((event) => <li key={event.id}><time>{time(event.timestamp)}</time><div><strong>{eventLabels[event.type]}</strong><p>{event.page}{event.previousPage ? ` · 来自 ${event.previousPage}` : ""}</p><span>{event.sourcePlatform} · {event.channel} · {event.device}</span>{event.targetText || event.outboundUrl ? <small>{event.targetText || event.outboundUrl}</small> : null}</div></li>)}</ol> : <div className="admin-empty">当前时间范围内没有可展示的第一方访问事件。</div>}</section>
  </div>;
}
