import Link from "next/link";
import { getLinkAuditReport } from "@/lib/linkStrategy";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "内外链审计 | Cowinmotors 后台",
};

const riskLabels: Record<string, string> = {
  safe: "安全外链",
  "needs-confirmation": "待确认",
  "high-risk": "高风险",
};

export default async function AdminLinkAuditPage() {
  const report = await getLinkAuditReport();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">SEO 链接网络</p>
          <h1>内外链审计</h1>
          <p>检查产品、分类和核心页面之间的内链覆盖，并对外链做风险分级。</p>
        </div>
        <Link className="admin-status" href="/api/admin/link-audit" target="_blank">JSON 报告</Link>
      </header>

      <section className="admin-metric-grid">
        <div className="admin-metric"><span>内容页面</span><strong>{report.summary.pages}</strong><small>页面 + 产品</small></div>
        <div className="admin-metric"><span>内链达标</span><strong>{report.summary.pagesWithEnoughInternalLinks}</strong><small>至少 2 条推荐内链</small></div>
        <div className="admin-metric"><span>外链总数</span><strong>{report.summary.externalLinks}</strong><small>去重出站链接</small></div>
        <div className="admin-metric"><span>高风险外链</span><strong>{report.summary.highRiskExternalLinks}</strong><small>需人工处理</small></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-headline">
          <div>
            <p className="eyebrow">自动推荐</p>
            <h2>内容发布时的内链建议</h2>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>页面</th>
                <th>类型</th>
                <th>推荐内链</th>
                <th>建议锚文本</th>
              </tr>
            </thead>
            <tbody>
              {report.internalRows.slice(0, 80).map((row) => (
                <tr key={`${row.type}-${row.href}`}>
                  <td><Link href={row.href} target="_blank">{row.title}</Link></td>
                  <td>{row.type}</td>
                  <td>{row.suggestions.length}</td>
                  <td>
                    <div className="admin-chip-list">
                      {row.suggestions.slice(0, 4).map((item) => (
                        <Link href={item.href} target="_blank" key={item.href}>{item.title}</Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <p className="eyebrow">出站链接</p>
        <h2>外链质量分级</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>外链</th>
                <th>来源位置</th>
                <th>风险</th>
                <th>建议 rel</th>
                <th>原因</th>
              </tr>
            </thead>
            <tbody>
              {report.externalRows.map((row) => (
                <tr key={row.url}>
                  <td><a href={row.url} target="_blank" rel="noopener noreferrer nofollow">{row.domain}</a></td>
                  <td>{row.source}</td>
                  <td>{riskLabels[row.risk] || row.risk}</td>
                  <td><code>{row.recommendedRel}</code></td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
