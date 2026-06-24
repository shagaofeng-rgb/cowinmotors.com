import Link from "next/link";
import { AdminPasswordField } from "@/components/admin/AdminPasswordField";
import { getConfiguredAdminEmail, isAdminAuthConfigured } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "后台登录 | Cowinmotors",
};

const errorMessages: Record<string, string> = {
  invalid: "邮箱或密码不正确。",
  "not-configured": "生产环境还没有配置后台密码，请先配置 ADMIN_PASSWORD 或 ADMIN_PASSWORD_HASH。",
  "rate-limited": "登录尝试过于频繁，请稍后再试。",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const configured = isAdminAuthConfigured();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" href="/">
          <span>CM</span>
          <strong>Cowinmotors</strong>
        </Link>
        <p className="eyebrow">网站数据后台</p>
        <h1>后台登录</h1>
        <p className="admin-login-copy">查看产品库、询盘记录、页面结构、图片状态和基础 SEO 数据。</p>

        {!configured ? <div className="admin-alert">后台登录暂未启用，请先配置后台密码环境变量。</div> : null}
        {error ? <div className="admin-alert">{errorMessages[error] || "登录失败。"}</div> : null}

        <form className="admin-login-form" action="/api/admin/login" method="post">
          <label>
            登录邮箱
            <input name="email" type="email" defaultValue={getConfiguredAdminEmail()} required />
          </label>
          <AdminPasswordField />
          <button type="submit" disabled={!configured}>
            登录后台
          </button>
        </form>
      </section>
    </main>
  );
}
