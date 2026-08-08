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
          <p className="eyebrow">Editorial News</p>
          <h1>News 人工审核与发布</h1>
          <p>所有内容均需由后台人工创建、复核、发布或下线；系统不抓取、生成或定时发布文章。</p>
        </div>
      </header>
      <NewsManager initialArticles={data.articles} />
    </div>
  );
}
