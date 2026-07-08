import { getAdminUsers } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "用户与权限 | Cowinmotors 后台",
};

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  const roles = [
    ["super_admin", "全站后台、系统配置、导出与审计"],
    ["admin", "内容、产品、询盘和基础配置"],
    ["content_editor", "新闻、页面、媒体内容"],
    ["marketing", "SEO、流量、Campaign 和 GSC 数据"],
    ["sales", "询盘、客户表单和导出"],
    ["analyst", "只读分析数据"],
    ["read_only", "只读查看后台"],
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">用户与权限</p>
          <h1>后台账号和角色</h1>
          <p>当前登录账号来自生产环境变量。多用户增删改需要接入数据库用户表和密码重置邮件后开放。</p>
        </div>
        <span className="admin-status good">{users.length} active</span>
      </header>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>账号</th>
                <th>角色</th>
                <th>状态</th>
                <th>权限</th>
                <th>最近登录</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.displayName}</strong>
                    <span className="admin-muted">{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td><span className="admin-status good">{user.status}</span></td>
                  <td>
                    <div className="admin-badge-list">
                      {user.permissions.map((permission) => <span className="admin-badge" key={permission}>{permission}</span>)}
                    </div>
                  </td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "由登录日志记录"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <h2>角色规划</h2>
        <div className="admin-card-grid">
          {roles.map(([role, description]) => (
            <article className="admin-card" key={role}>
              <strong>{role}</strong>
              <span className="admin-muted">{description}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
