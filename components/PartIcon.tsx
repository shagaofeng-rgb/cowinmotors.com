import type { ReactNode } from "react";

export function PartIcon({ category, size = 24, className }: { category: string; size?: number; className?: string }) {
  const drawings: Record<string, ReactNode> = {
    headlights: <><path d="M3 14.5c0-2.7 1.1-5.1 3.3-6.6L20.5 5v10.3c-4.6 2.5-10.2 3.2-15.6 2.1A2.7 2.7 0 0 1 3 14.5Z" /><path d="m4 13 16.5-4.7M15 11.5l-.5 2.5" /></>,
    "tail-lights": <><path d="M3.5 7.2h17v9.3l-11 2.2-6-4.1Z" /><path d="M7 10.6h10.2M9 14h8.2" /></>,
    exhaust: <><path d="M2.8 15.8h4l2.4-3.1m5.6-1.6 2.4-3.1h4" /><path d="m8.1 11.5 3.2-4a1.6 1.6 0 0 1 2.3-.2l2.4 1.9a1.6 1.6 0 0 1 .2 2.3l-3.2 4a1.6 1.6 0 0 1-2.3.2l-2.4-1.9a1.6 1.6 0 0 1-.2-2.3Z" /><path d="M3 13.9v3.8M21 6.1v3.8" /></>,
    wheels: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.4" /><path d="M12 3v6.6m8.6-.3-6.3 2m3 8.1-3.9-5.4m-6.7 5.4 3.9-5.4m-7.2-4.7 6.3 2" /></>,
    "body-kits": <><path d="m3 13 3.6-4h10.8l3.6 4v4.4h-3.5l-1.1-1.8H7.6l-1.1 1.8H3Z" /><path d="m5.6 12.4 2.2.6m10.6-.6-2.2.6M10 12.8h4" /></>,
  };

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {drawings[category] || <><path d="m12 3 8 4.4v9.2L12 21l-8-4.4V7.4Z" /><path d="m4 7.4 8 4.4 8-4.4M12 21v-9.2" /></>}
    </svg>
  );
}
