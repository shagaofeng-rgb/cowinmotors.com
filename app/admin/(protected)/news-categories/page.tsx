import Link from "next/link";
import { getNewsAdminSnapshot } from "@/lib/news";
import { filterByQuery, getAdminListParams, getNewsCategoryRecords, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "新闻分类 | Cowinmotors 后台",
};

export default async function AdminNewsCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const snapshot = await getNewsAdminSnapshot();
  const articleCounts = new Map<string, number>();
  for (const article of snapshot.articles) {
    const key = article.tags[0] || article.category || "automotive-lighting";
    articleCounts.set(key, (articleCounts.get(key) || 0) + 1);
  }
  const categories = getNewsCategoryRecords().map((category) => ({
    ...category,
    articleCount: articleCounts.get(category.slug) || 0,
  }));
  const filtered = filterByQuery(categories, params.query, (category) => [category.nameEn, category.nameZh, category.slug]);
  const page = paginate(filtered, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">新闻分类</p>
          <h1>News 标签与分类管理</h1>
          <p>用于检查自动新闻的主题分类、前台筛选入口和文章归类状态。</p>
        </div>
        <Link className="admin-status good" href="/news" target="_blank">前台 News</Link>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <form action="/admin/news-categories">
            <input name="q" placeholder="搜索新闻分类" defaultValue={params.query} />
            <button type="submit">筛选</button>
          </form>
          <Link className="admin-secondary-button" href="/api/admin/news-categories">查看 API</Link>
        </div>
        <div className="admin-card-grid">
          {page.items.map((category) => (
            <article className="admin-card" key={category.slug}>
              <strong>{category.nameEn}</strong>
              <span className="admin-muted">{category.nameZh} · {category.slug}</span>
              <span className={category.enabled ? "admin-status good" : "admin-status warn"}>
                {category.articleCount} articles
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
