import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin-theme.css";

export const metadata: Metadata = {
  title: {
    default: "Cowinmotors 后台",
    template: "%s",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div lang="zh-CN">{children}</div>;
}
