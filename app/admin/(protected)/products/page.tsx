import Link from "next/link";
import { getAdminProducts } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "产品数据 | Cowinmotors 后台",
};

export default function AdminProductsPage() {
  const products = getAdminProducts();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">产品数据</p>
          <h1>产品库与前台同步</h1>
          <p>查看当前产品标题、分类、价格、购买路径、图片状态和前台详情页入口。</p>
        </div>
        <span className="admin-status good">{products.length} items</span>
      </header>

      <section className="admin-panel">
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
              {products.map((product) => (
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
