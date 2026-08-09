import Link from "next/link";
import { notFound } from "next/navigation";
import { getInquiryDetail, type InquiryJourney } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "询盘详情 | Cowinmotors 后台",
};

const eventLabels = {
  page_view: "浏览页面",
  engagement: "页面停留",
  click: "点击操作",
  form_submit: "提交表单",
} as const;

function formatTime(value: string) {
  return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "-";
}

function displayValue(value: string) {
  return value || "-";
}

function JourneyPanel({ journey }: { journey: InquiryJourney }) {
  if (!journey.available) {
    return (
      <section className="admin-panel admin-detail-panel">
        <p className="eyebrow">访问轨迹</p>
        <h2>暂无可关联的访问记录</h2>
        <p className="admin-muted">此历史询盘创建于访问轨迹关联启用前，系统没有保存对应的匿名访客标识，因此不会以邮箱、电话或 IP 猜测并拼接访问记录。</p>
      </section>
    );
  }

  return (
    <section className="admin-panel admin-detail-panel">
      <div className="admin-panel-headline">
        <div>
          <p className="eyebrow">访问轨迹</p>
          <h2>提交前后真实行为</h2>
          <p>仅展示该匿名访客在提交前 30 天至提交后 10 分钟内，由网站第一方埋点记录的页面和操作。</p>
        </div>
        <span className="admin-status good">已关联</span>
      </div>
      <div className="admin-journey-metrics">
        <div><span>页面浏览</span><strong>{journey.summary.pageViews}</strong></div>
        <div><span>互动点击</span><strong>{journey.summary.clicks}</strong></div>
        <div><span>最长滚动</span><strong>{journey.summary.maxScroll}%</strong></div>
        <div><span>累计停留</span><strong>{journey.summary.totalDuration}s</strong></div>
      </div>
      <dl className="admin-detail-fields admin-journey-context">
        <div><dt>首次记录</dt><dd>{formatTime(journey.summary.firstVisit)}</dd></div>
        <div><dt>最后活动</dt><dd>{formatTime(journey.summary.lastActivity)}</dd></div>
        <div><dt>来源</dt><dd>{displayValue(journey.summary.source)}</dd></div>
        <div><dt>设备</dt><dd>{displayValue(journey.summary.device)}</dd></div>
      </dl>
      {journey.events.length ? (
        <ol className="admin-journey-timeline">
          {journey.events.map((event) => (
            <li key={event.id}>
              <time>{formatTime(event.timestamp)}</time>
              <div>
                <strong>{eventLabels[event.type]}</strong>
                <p>{event.page || "/"}{event.previousPage ? ` · 来自 ${event.previousPage}` : ""}</p>
                {(event.targetText || event.outboundUrl) && <span>{event.targetText || event.outboundUrl}</span>}
                {(event.duration > 0 || event.scrollDepth > 0) && <small>{event.duration > 0 ? `停留 ${event.duration}s` : ""}{event.duration > 0 && event.scrollDepth > 0 ? " · " : ""}{event.scrollDepth > 0 ? `滚动 ${event.scrollDepth}%` : ""}</small>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="admin-empty">已记录访客关联，但提交前后尚未收到可展示的行为事件。</div>
      )}
    </section>
  );
}

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getInquiryDetail(id);
  if (!detail) notFound();
  const { inquiry, journey } = detail;

  return (
    <div className="admin-page admin-detail-page">
      <header className="admin-page-head">
        <div>
          <Link className="admin-back-link" href="/admin/inquiries">返回客户表单</Link>
          <p className="eyebrow">客户询盘详情</p>
          <h1>{inquiry.name}</h1>
          <p>提交于 {formatTime(inquiry.createdAt)} · 来源：{inquiry.source || "website-rfq-form"}</p>
        </div>
        <span className="admin-status">RFQ</span>
      </header>

      <section className="admin-detail-grid">
        <article className="admin-panel admin-detail-panel">
          <p className="eyebrow">联系人</p>
          <h2>客户联系信息</h2>
          <dl className="admin-detail-fields">
            <div><dt>姓名</dt><dd>{displayValue(inquiry.name)}</dd></div>
            <div><dt>国家</dt><dd>{displayValue(inquiry.country)}</dd></div>
            <div><dt>邮箱</dt><dd>{inquiry.email ? <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a> : "-"}</dd></div>
            <div><dt>电话 / WhatsApp</dt><dd>{inquiry.phone ? <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a> : "-"}</dd></div>
          </dl>
        </article>

        <article className="admin-panel admin-detail-panel">
          <p className="eyebrow">提交来源</p>
          <h2>询盘来源信息</h2>
          <dl className="admin-detail-fields">
            <div><dt>表单来源</dt><dd>{displayValue(inquiry.source)}</dd></div>
            <div><dt>落地页</dt><dd>{displayValue(inquiry.landingPage)}</dd></div>
            <div><dt>引荐来源</dt><dd>{displayValue(inquiry.referrer)}</dd></div>
            <div><dt>记录编号</dt><dd className="admin-code-value">{inquiry.id}</dd></div>
          </dl>
        </article>
      </section>

      <section className="admin-panel admin-detail-panel">
        <p className="eyebrow">产品需求</p>
        <h2>产品、车型和采购说明</h2>
        <dl className="admin-detail-fields admin-detail-fields-wide">
          <div><dt>产品分类</dt><dd>{displayValue(inquiry.productType)}</dd></div>
          <div><dt>产品名称 / SKU</dt><dd>{displayValue(inquiry.product)}</dd></div>
          <div><dt>车型信息</dt><dd>{displayValue(inquiry.vehicleInfo)}</dd></div>
          <div><dt>数量</dt><dd>{displayValue(inquiry.quantity)}</dd></div>
          <div className="admin-detail-field-full"><dt>详细需求</dt><dd>{displayValue(inquiry.requirement)}</dd></div>
        </dl>
      </section>

      <JourneyPanel journey={journey} />
    </div>
  );
}
