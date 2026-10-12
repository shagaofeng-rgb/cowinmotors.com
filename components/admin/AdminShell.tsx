"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BarChart3, BookOpen, Boxes, ChartNoAxesCombined, ClipboardList,
  Database, FileClock, FolderTree, Image, LayoutDashboard,
  Link2, List, LogOut, Menu, Newspaper, Package, Settings, ShieldCheck,
  Users, UserRound, Waypoints, X, type LucideIcon,
} from "lucide-react";
import { UI_ASSETS } from "@/lib/ui-assets";

const groups: Array<{ label: string; links: Array<{ href: string; label: string; icon: LucideIcon }> }> = [
  { label: "运营数据", links: [
    { href: "/admin", label: "数据总览", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "流量分析", icon: ChartNoAxesCombined },
    { href: "/admin/visitors", label: "访客记录", icon: UserRound },
    { href: "/admin/customers", label: "客户档案", icon: Users },
    { href: "/admin/journeys", label: "访问路径", icon: Waypoints },
    { href: "/admin/pages", label: "页面表现", icon: BarChart3 },
    { href: "/admin/inquiries", label: "客户表单", icon: ClipboardList },
    { href: "/admin/data-quality", label: "数据质量", icon: Database },
  ] },
  { label: "内容与目录", links: [
    { href: "/admin/products", label: "产品管理", icon: Package },
    { href: "/admin/categories", label: "产品分类", icon: Boxes },
    { href: "/admin/news", label: "新闻管理", icon: Newspaper },
    { href: "/admin/news-categories", label: "新闻分类", icon: List },
    { href: "/admin/blog", label: "Blog 管理", icon: BookOpen },
    { href: "/admin/media", label: "媒体库", icon: Image },
  ] },
  { label: "SEO 与系统", links: [
    { href: "/admin/search-console", label: "SEO 数据", icon: Activity },
    { href: "/admin/link-audit", label: "内外链审计", icon: Link2 },
    { href: "/admin/sync", label: "数据同步", icon: FolderTree },
    { href: "/admin/audit-logs", label: "操作日志", icon: FileClock },
    { href: "/admin/users", label: "用户与权限", icon: ShieldCheck },
    { href: "/admin/settings", label: "系统设置", icon: Settings },
  ] },
];

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <Link className="admin-logo" href="/admin">
          <img src={UI_ASSETS.logo} alt="Cowinmotors" />
          <strong>Cowinmotors<small>管理后台</small></strong>
        </Link>
        <button className="admin-mobile-menu" type="button" aria-label={menuOpen ? "关闭后台导航" : "打开后台导航"} aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <nav id="admin-navigation" aria-label="后台导航">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.links.map((link) => <Link aria-current={pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`)) ? "page" : undefined} className={pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`)) ? "is-active" : ""} href={link.href} key={link.href}><link.icon size={18} strokeWidth={1.9} aria-hidden="true" />{link.label}</Link>)}
            </div>
          ))}
          <div className="admin-mobile-account">
            <small>当前账号</small>
            <span>{email}</span>
            <form action="/api/admin/logout" method="post">
              <button type="submit"><LogOut size={16} aria-hidden="true" />退出登录</button>
            </form>
          </div>
        </nav>
        <div className="admin-sidebar-foot">
          <small>当前账号</small>
          <span>{email}</span>
          <form action="/api/admin/logout" method="post">
            <button type="submit"><LogOut size={16} aria-hidden="true" />退出登录</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
