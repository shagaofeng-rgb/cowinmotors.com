import Link from "next/link";
import { filterByQuery, getAdminListParams, getMediaAssets, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "媒体库 | Cowinmotors 后台",
};

function pageHref(params: { q: string; pageSize: number; page: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("pageSize", String(params.pageSize));
  query.set("page", String(params.page));
  return `/admin/media?${query.toString()}`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const assets = getMediaAssets();
  const filtered = filterByQuery(assets, params.query, (asset) => [
    asset.url,
    asset.alt,
    asset.assetType,
    asset.source,
    asset.category,
    asset.usedBy,
  ]);
  const page = paginate(filtered, params.page, params.pageSize);
  const missing = filtered.filter((asset) => !asset.exists).length;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">媒体库</p>
          <h1>产品图片与页面素材</h1>
          <p>扫描当前产品库和 UI 素材清单，检查图片是否存在、归属分类和使用范围。</p>
        </div>
        <span className={missing ? "admin-status warn" : "admin-status good"}>{missing} missing</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <form action="/admin/media">
            <input name="q" placeholder="搜索图片路径、分类、来源" defaultValue={params.query} />
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="10">10 / 页</option>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
              <option value="100">100 / 页</option>
            </select>
            <button type="submit">筛选</button>
          </form>
          <Link className="admin-secondary-button" href="/api/admin/media">查看 API</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>预览</th>
                <th>文件</th>
                <th>类型</th>
                <th>分类</th>
                <th>使用</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((asset) => (
                <tr key={asset.id}>
                  <td><img className="admin-media-thumb" src={asset.url} alt="" /></td>
                  <td>
                    <strong>{asset.alt}</strong>
                    <span className="admin-muted">{asset.url}</span>
                  </td>
                  <td>{asset.assetType}</td>
                  <td>{asset.category}</td>
                  <td>{asset.usedBy}</td>
                  <td><span className={asset.exists ? "admin-status good" : "admin-status warn"}>{asset.exists ? "存在" : "缺失"}</span></td>
                </tr>
              ))}
              {!page.items.length ? <tr><td colSpan={6}>没有匹配的媒体文件。</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          {page.hasPrevious ? <Link href={pageHref({ q: params.query, pageSize: params.pageSize, page: page.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}
          <span>{page.currentPage} / {page.totalPages}</span>
          {page.hasNext ? <Link href={pageHref({ q: params.query, pageSize: params.pageSize, page: page.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}
        </div>
      </section>
    </div>
  );
}
