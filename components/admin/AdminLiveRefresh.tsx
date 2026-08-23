"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLiveRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
      setUpdatedAt(new Date());
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return (
    <div className="admin-live-status" aria-live="polite">
      <span>实时数据</span>
      <small>每 30 秒刷新 · {updatedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</small>
      <button type="button" onClick={() => { router.refresh(); setUpdatedAt(new Date()); }}>刷新</button>
    </div>
  );
}
