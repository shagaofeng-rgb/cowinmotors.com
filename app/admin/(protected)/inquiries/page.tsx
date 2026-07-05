import { getInquiries } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "询盘数据 | Cowinmotors 后台",
};

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">询盘数据</p>
          <h1>RFQ 表单提交记录</h1>
          <p>查看网站询盘表单提交的联系人、电话、产品、车型、数量和需求说明。</p>
        </div>
        <span className="admin-status">{inquiries.length} records</span>
      </header>

      <section className="admin-panel">
        {inquiries.length ? (
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
                {inquiries.map((inquiry) => (
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
          <div className="admin-empty">暂无询盘记录。</div>
        )}
      </section>
    </div>
  );
}
