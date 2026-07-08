import { getAdminUsers } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "用户与权限 | Cowinmotors 后台",
};

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">用户与权限</p>
          <h1>后台账号和角色</h1>
          <p>查看当前启用的后台账号、角色、状态和可操作权限。</p>
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
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
