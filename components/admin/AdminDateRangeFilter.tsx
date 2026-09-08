import Link from "next/link";
import { ADMIN_REPORT_TIME_ZONE, resolveDateRange, type AdminDateRange } from "@/lib/adminDateRange";

const ranges = [
  { preset: "today", label: "今天" },
  { preset: "week", label: "本周" },
  { preset: "month", label: "本月" },
];

function dayValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hrefFor(values: Record<string, string>, preserve: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...preserve, ...values })) {
    if (value) params.set(key, value);
  }
  return `?${params.toString()}`;
}

export function AdminDateRangeFilter({ range, preserve = {} }: { range: AdminDateRange; preserve?: Record<string, string | undefined> }) {
  const resolved = resolveDateRange(range);
  const customRange = range.preset === "custom";

  return (
    <div className="admin-date-filter">
      <div className="admin-date-presets" aria-label="日期范围">
        {ranges.map((item) => <Link className={!customRange && range.preset === item.preset ? "is-active" : ""} href={hrefFor({ range: item.preset, days: "", startDate: "", endDate: "", page: "1" }, preserve)} key={item.preset}>{item.label}</Link>)}
        <span className={customRange ? "is-active" : ""}>自定义</span>
      </div>
      <form className="admin-date-custom" method="get">
        {Object.entries(preserve).filter(([key]) => !["range", "days", "startDate", "endDate", "page"].includes(key)).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
        <input type="hidden" name="range" value="custom" />
        <label>起<input aria-label="开始日期" name="startDate" type="date" defaultValue={dayValue(resolved.startDate)} /></label>
        <label>止<input aria-label="结束日期" name="endDate" type="date" defaultValue={dayValue(resolved.endDate)} /></label>
        <input type="hidden" name="page" value="1" />
        <button type="submit">应用</button>
      </form>
    </div>
  );
}
