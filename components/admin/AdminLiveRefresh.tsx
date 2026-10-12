"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AdminLiveRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return (
    <div className="admin-live-status" aria-live="polite">
      <small>每 {Math.round(intervalMs / 1000)} 秒更新</small>
      <button type="button" aria-label="刷新数据" title="刷新数据" onClick={() => router.refresh()}><RefreshCw size={17} aria-hidden="true" /></button>
    </div>
  );
}
