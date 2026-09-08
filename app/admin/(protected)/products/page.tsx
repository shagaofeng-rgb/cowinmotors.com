import Link from "next/link";
import { filterByQuery, getAdminListParams, getAdminProducts, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "产品数据 | Cowinmotors 后台",
};

function pageHref(params: { q: string; pageSize: number; page: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("pageSize", String(params.pageSize));
  query.set("page", String(params.page));
  return `/admin/products?${query.toString()}`;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const products = getAdminProducts();
  const filtered = filterByQuery(products, params.query, (product) => [
    product.title,
    product.category,
    product.brand,
    product.model,
    product.yearRange,
    product.productType,
    product.partNumbers?.join(" "),
  ]);
  const page = paginate(filtered, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">产品数据</p>
          <h1>产品库与前台同步</h1>
          <p>查看当前产品标题、分类、价格、购买路径、图片状态和前台详情页入口。</p>
        </div>
        <span className="admin-status good">{filtered.length}/{products.length} items</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <form action="/admin/products">
            <input name="q" placeholder="搜索标题、品牌、车型、OE号" defaultValue={params.query} />
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
              <option value="100">100 / 页</option>
            </select>
            <button type="submit">筛选</button>
          </form>
          <Link className="admin-secondary-button" href={`/api/admin/products/export?q=${encodeURIComponent(params.query)}`}>
            导出 CSV
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>图片</th>
                <th>产品</th>
                <th>分类</th>
                <th>价格</th>
                <th>路径</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((product) => (
                <tr key={product.__id}>
                  <td>
                    <img className="admin-product-thumb" src={product.localImage} alt="" />
                  </td>
                  <td>{product.title}</td>
                  <td>{product.category}</td>
                  <td>{product.price || "RFQ"}</td>
                  <td>{product.buyingPath}</td>
                  <td>
                    <Link href={product.path} target="_blank">
                      打开
                    </Link>
                    <span className={product.imageExists ? "admin-dot good" : "admin-dot warn"} />
                  </td>
                </tr>
              ))}
              {!page.items.length ? <tr><td colSpan={6}>没有匹配的产品。</td></tr> : null}
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
