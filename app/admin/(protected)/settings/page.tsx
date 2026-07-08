import { isAdminAuthConfigured } from "@/lib/adminAuth";
import { getAnalyticsStorageMode } from "@/lib/analyticsStore";
import { getSystemSettingsSnapshot } from "@/lib/adminData";
import { isDatabaseConfigured } from "@/lib/database";
import { getGoogleOAuthConfig } from "@/lib/googleSearchConsoleOAuth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "系统设置 | Cowinmotors 后台",
};

function configured(value: unknown) {
  return value ? "已启用" : "未启用";
}

export default function AdminSettingsPage() {
  const authConfigured = isAdminAuthConfigured();
  const googleOAuth = getGoogleOAuthConfig();
  const settings = getSystemSettingsSnapshot();
  const rows = [
    ["管理员账号", process.env.ADMIN_EMAIL || "admin@cowinmotors.com"],
    ["密码登录", configured(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD)],
    ["会话安全", configured(process.env.ADMIN_JWT_SECRET)],
    ["访问数据存储", getAnalyticsStorageMode()],
    ["业务数据库", isDatabaseConfigured() ? "已启用" : "未启用"],
    ["Search Console 站点", process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "-"],
    ["Google 授权", configured(googleOAuth.clientId && googleOAuth.clientSecret)],
    ["Google 回调地址", googleOAuth.redirectUri],
    ["询盘收件邮箱", process.env.INQUIRY_TO_EMAIL || "-"],
    ["询盘抄送邮箱", process.env.INQUIRY_CC_EMAIL || "-"],
    ["邮件服务器", process.env.SMTP_HOST || (process.env.RESEND_API_KEY ? "Resend" : "未启用")],
    ["邮件账号", configured(process.env.SMTP_USER || process.env.RESEND_API_KEY)],
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">系统设置</p>
          <h1>后台配置检查</h1>
          <p>检查后台登录、数据存储、询盘邮件和 Search Console 的运行状态。</p>
        </div>
        <div className={authConfigured ? "admin-status good" : "admin-status"}>{authConfigured ? "后台已启用" : "后台未启用"}</div>
      </header>

      <section className="admin-panel">
        <h2>配置摘要</h2>
        <div className="admin-card-grid">
          {settings.map((setting) => (
            <article className="admin-card" key={setting.key}>
              <strong>{setting.key}</strong>
              <span className="admin-muted">{setting.value}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <h2>系统连接状态</h2>
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
    </div>
  );
}
