"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI_ASSETS } from "@/lib/ui-assets";

const groups = [
  { label: "运营数据", links: [
    { href: "/admin", label: "数据总览" },
    { href: "/admin/analytics", label: "流量分析" },
    { href: "/admin/visitors", label: "访客记录" },
    { href: "/admin/customers", label: "客户档案" },
    { href: "/admin/journeys", label: "访问路径" },
    { href: "/admin/pages", label: "页面表现" },
    { href: "/admin/inquiries", label: "客户表单" },
    { href: "/admin/data-quality", label: "数据质量" },
  ] },
  { label: "内容与目录", links: [
    { href: "/admin/products", label: "产品管理" },
    { href: "/admin/categories", label: "产品分类" },
    { href: "/admin/news", label: "新闻管理" },
    { href: "/admin/news-categories", label: "新闻分类" },
    { href: "/admin/blog", label: "Blog 管理" },
    { href: "/admin/media", label: "媒体库" },
  ] },
  { label: "SEO 与系统", links: [
    { href: "/admin/search-console", label: "SEO 数据" },
    { href: "/admin/link-audit", label: "内外链审计" },
    { href: "/admin/sync", label: "数据同步" },
    { href: "/admin/audit-logs", label: "操作日志" },
    { href: "/admin/users", label: "用户与权限" },
    { href: "/admin/settings", label: "系统设置" },
  ] },
];

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname();

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/admin">
          <img src={UI_ASSETS.logo} alt="Cowinmotors" />
          <strong>Cowinmotors 后台</strong>
        </Link>
        <nav>
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.links.map((link) => <Link className={pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`)) ? "is-active" : ""} href={link.href} key={link.href}>{link.label}</Link>)}
            </div>
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
