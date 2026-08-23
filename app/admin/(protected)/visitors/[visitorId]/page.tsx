import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisitorProfile } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

const eventLabels = { page_view: "浏览页面", engagement: "页面停留", click: "点击操作", form_submit: "提交表单" } as const;

export default async function AdminVisitorDetailPage({ params }: { params: Promise<{ visitorId: string }> }) {
  const { visitorId } = await params;
  const detail = await getVisitorProfile(visitorId);
  if (!detail) notFound();
  const { profile, events } = detail;
  return <div className="admin-page admin-detail-page">
    <header className="admin-page-head"><div><Link className="admin-back-link" href="/admin/visitors">返回访客记录</Link><p className="eyebrow">匿名访客详情</p><h1>{profile.displayId}</h1><p>{profile.country || "Unknown"}{profile.region ? ` · ${profile.region}` : ""} · {profile.maskedIp} · 最后活动 {new Date(profile.lastSeen).toLocaleString("zh-CN", { hour12: false })}</p></div><div className="admin-badge-list">{profile.labels.map((label) => <span className="admin-status good" key={label}>{label}</span>)}</div></header>
    <section className="admin-journey-metrics"><div><span>访问会话</span><strong>{profile.visits}</strong></div><div><span>页面浏览</span><strong>{profile.pageViews}</strong></div><div><span>互动点击</span><strong>{profile.clicks}</strong></div><div><span>询盘提交</span><strong>{profile.inquiries}</strong></div></section>
    <section className="admin-panel admin-detail-panel"><p className="eyebrow">访问轨迹</p><h2>最近 180 天第一方访问记录</h2><ol className="admin-journey-timeline">{events.map((event) => <li key={event.id}><time>{new Date(event.timestamp).toLocaleString("zh-CN", { hour12: false })}</time><div><strong>{eventLabels[event.type]}</strong><p>{event.page}{event.previousPage ? ` · 来自 ${event.previousPage}` : ""}</p><span>{event.sourcePlatform} · {event.channel} · {event.device}</span>{(event.targetText || event.outboundUrl) ? <small>{event.targetText || event.outboundUrl}</small> : null}</div></li>)}</ol></section>
  </div>;
}
