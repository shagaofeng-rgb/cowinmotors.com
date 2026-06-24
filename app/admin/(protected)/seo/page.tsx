import Link from "next/link";
import { adminPages, getCategoryStats } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO 页面 | Cowinmotors 后台",
};

export default function AdminSeoPage() {
  const categories = getCategoryStats();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">SEO 页面</p>
          <h1>页面结构与内容入口</h1>
          <p>查看当前核心页面、页面意图、产品分类数量和后续 SEO/AIO/GEO 内容扩展入口。</p>
        </div>
        <span className="admin-status good">{adminPages.length} pages</span>
      </header>

      <section className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">核心页面</p>
              <h2>URL 与搜索意图</h2>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>页面</th>
                  <th>优先级</th>
                  <th>意图</th>
                </tr>
              </thead>
              <tbody>
                {adminPages.map((page) => (
                  <tr key={page.path}>
                    <td><Link href={page.path} target="_blank">{page.path}</Link></td>
                    <td>{page.priority}</td>
                    <td>{page.intent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-headline">
            <div>
              <p className="eyebrow">分类覆盖</p>
              <h2>产品集群</h2>
            </div>
          </div>
          <div className="admin-stack">
            {categories.map((category) => (
              <div className="admin-mini-record" key={category.category}>
                <strong>{category.category}</strong>
                <span>{category.count} products · {category.priced} priced · {category.rfq} RFQ</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
