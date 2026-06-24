import { hashAdminPassword, isAdminAuthConfigured } from "@/lib/adminAuth";
import { getAnalyticsStorageMode } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "系统设置 | Cowinmotors 后台",
};

function configured(value: unknown) {
  return value ? "已配置" : "未配置";
}

export default function AdminSettingsPage() {
  const authConfigured = isAdminAuthConfigured();
  const rows = [
    ["ADMIN_EMAIL", process.env.ADMIN_EMAIL || "admin@cowinmotors.com"],
    ["ADMIN_PASSWORD_HASH", configured(process.env.ADMIN_PASSWORD_HASH)],
    ["ADMIN_PASSWORD", configured(process.env.ADMIN_PASSWORD)],
    ["ADMIN_JWT_SECRET", configured(process.env.ADMIN_JWT_SECRET)],
    ["Analytics storage", getAnalyticsStorageMode()],
    ["DATABASE_URL", configured(process.env.DATABASE_URL)],
    ["GOOGLE_SEARCH_CONSOLE_SITE_URL", process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "-"],
    ["GOOGLE_CLIENT_EMAIL", configured(process.env.GOOGLE_CLIENT_EMAIL)],
    ["GOOGLE_PRIVATE_KEY", configured(process.env.GOOGLE_PRIVATE_KEY)],
    ["INQUIRY_TO_EMAIL", process.env.INQUIRY_TO_EMAIL || "-"],
    ["SMTP_HOST", process.env.SMTP_HOST || "-"],
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">系统设置</p>
          <h1>后台配置检查</h1>
          <p>检查后台登录、数据存储、询盘、SMTP、Search Console 和生产环境配置。</p>
        </div>
        <div className={authConfigured ? "admin-status good" : "admin-status"}>{authConfigured ? "后台已启用" : "后台未启用"}</div>
      </header>

      <section className="admin-panel">
        <h2>环境变量</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              {rows.map(([key, value]) => (
                <tr key={key}>
                  <th>{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <h2>密码 Hash 示例</h2>
        <p className="admin-muted">生产环境建议使用 ADMIN_JWT_SECRET + ADMIN_PASSWORD_HASH，不保存明文密码。</p>
        <pre className="admin-code">{hashAdminPassword("replace-with-your-password")}</pre>
      </section>
    </div>
  );
}
