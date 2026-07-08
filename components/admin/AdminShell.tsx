"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "数据总览" },
  { href: "/admin/products", label: "产品管理" },
  { href: "/admin/categories", label: "产品分类" },
  { href: "/admin/news", label: "新闻管理" },
  { href: "/admin/news-categories", label: "新闻分类" },
  { href: "/admin/inquiries", label: "客户表单" },
  { href: "/admin/analytics", label: "访问分析" },
  { href: "/admin/search-console", label: "SEO 数据" },
  { href: "/admin/media", label: "媒体库" },
  { href: "/admin/users", label: "用户与权限" },
  { href: "/admin/audit-logs", label: "操作日志" },
  { href: "/admin/link-audit", label: "内外链审计" },
  { href: "/admin/settings", label: "系统设置" },
  { href: "/admin/sync", label: "数据同步" },
];

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname();

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/admin">
          <span>CM</span>
          <strong>Cowinmotors 后台</strong>
        </Link>
        <nav>
          {links.map((link) => (
            <Link className={pathname === link.href ? "is-active" : ""} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <small>当前账号</small>
          <span>{email}</span>
          <form action="/api/admin/logout" method="post">
            <button type="submit">退出登录</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
