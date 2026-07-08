import Link from "next/link";
import { filterByQuery, getAdminListParams, getInquiries, paginate } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "询盘数据 | Cowinmotors 后台",
};

function pageHref(params: { q: string; pageSize: number; page: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  query.set("pageSize", String(params.pageSize));
  query.set("page", String(params.page));
  return `/admin/inquiries?${query.toString()}`;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = getAdminListParams(await searchParams);
  const inquiries = await getInquiries();
  const filtered = filterByQuery(inquiries, params.query, (inquiry) => [
    inquiry.name,
    inquiry.email,
    inquiry.phone,
    inquiry.country,
    inquiry.productType,
    inquiry.product,
    inquiry.vehicleInfo,
    inquiry.quantity,
    inquiry.requirement,
    inquiry.source,
  ]);
  const page = paginate(filtered, params.page, params.pageSize);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">询盘数据</p>
          <h1>RFQ 表单提交记录</h1>
          <p>查看网站询盘表单提交的联系人、电话、产品、车型、数量和需求说明。</p>
        </div>
        <span className="admin-status">{filtered.length}/{inquiries.length} records</span>
      </header>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <form action="/admin/inquiries">
            <input name="q" placeholder="搜索客户、邮箱、电话、车型、产品" defaultValue={params.query} />
            <select name="pageSize" defaultValue={String(params.pageSize)}>
              <option value="10">10 / 页</option>
              <option value="25">25 / 页</option>
              <option value="50">50 / 页</option>
              <option value="100">100 / 页</option>
            </select>
            <button type="submit">筛选</button>
          </form>
          <Link className="admin-secondary-button" href={`/api/admin/inquiries/export?q=${encodeURIComponent(params.query)}`}>
            导出 CSV
          </Link>
        </div>
        {page.items.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>联系人</th>
                  <th>电话</th>
                  <th>产品</th>
                  <th>车型</th>
                  <th>数量</th>
                  <th>需求</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>{new Date(inquiry.createdAt).toLocaleString("zh-CN")}</td>
                    <td>
                      <strong>{inquiry.name}</strong>
                      <span className="admin-muted">{inquiry.email}</span>
                    </td>
                    <td>{inquiry.phone || "-"}</td>
                    <td>{inquiry.product || inquiry.productType}</td>
                    <td>{inquiry.vehicleInfo || "-"}</td>
                    <td>{inquiry.quantity || "-"}</td>
                    <td>{inquiry.requirement || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">暂无匹配的询盘记录。</div>
        )}
        <div className="admin-pagination">
          {page.hasPrevious ? <Link href={pageHref({ q: params.query, pageSize: params.pageSize, page: page.currentPage - 1 })}>上一页</Link> : <span>上一页</span>}
          <span>{page.currentPage} / {page.totalPages}</span>
          {page.hasNext ? <Link href={pageHref({ q: params.query, pageSize: params.pageSize, page: page.currentPage + 1 })}>下一页</Link> : <span>下一页</span>}
        </div>
      </section>
    </div>
  );
}
