"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";

export function RetryInquiryNotification({ id }: { id: string }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function retry() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNote("");
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry-notification" }),
      });
      const result = await response.json();
      setNote(!response.ok ? "无法补发，请刷新后核对通知状态。" : !result.statusSaved ? "通知结果未写回，请先核对收件箱。" : result.emailSent ? "邮件服务已接收。" : "邮件服务未接收，询盘仍在后台。" );
      router.refresh();
    } catch {
      setNote("无法确认补发结果，请刷新后核对通知状态。");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  return <div><button className="admin-secondary-button" type="button" disabled={busy} onClick={retry}><RotateCw size={15} aria-hidden="true" /> {busy ? "补发中" : "补发通知（不含附件）"}</button>{note && <p className="admin-muted" role="status">{note}</p>}</div>;
}
