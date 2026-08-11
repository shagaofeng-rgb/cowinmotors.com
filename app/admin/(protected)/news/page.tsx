import { NewsManager } from "@/components/admin/NewsManager";
import { getNewsAdminSnapshot } from "@/lib/news";

export const dynamic = "force-dynamic";
export const metadata = { title: "News 管理 | Cowinmotors 后台" };

export default async function AdminNewsPage() {
  const data = await getNewsAdminSnapshot();
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Source-Backed News</p>
          <h1>News 审核与发布</h1>
          <p>News 候选仅可来自站点白名单来源。自动任务与 Blog 完全隔离，发布后必须通过前台列表、详情、sitemap 和 RSS 验证；人工编辑、复核和下线能力保持可用。</p>
        </div>
      </header>
      <NewsManager initialArticles={data.articles} />
    </div>
  );
}
