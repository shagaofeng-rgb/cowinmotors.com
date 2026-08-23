import Link from "next/link";
import { ADMIN_REPORT_TIME_ZONE, resolveDateRange, type AdminDateRange } from "@/lib/adminDateRange";

const ranges = [
  { days: 1, label: "今天" },
  { days: 7, label: "7天" },
  { days: 30, label: "30天" },
  { days: 90, label: "90天" },
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
  const yesterday = new Date(resolved.endDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const customRange = Boolean(range.startDate || range.endDate);

  return (
    <div className="admin-date-filter">
      <div className="admin-date-presets" aria-label="日期范围">
        {ranges.map((item) => <Link className={!customRange && range.days === item.days ? "is-active" : ""} href={hrefFor({ days: String(item.days), startDate: "", endDate: "", page: "1" }, preserve)} key={item.days}>{item.label}</Link>)}
        <Link className={range.startDate === dayValue(yesterday) && range.endDate === dayValue(yesterday) ? "is-active" : ""} href={hrefFor({ startDate: dayValue(yesterday), endDate: dayValue(yesterday), page: "1" }, preserve)}>昨天</Link>
      </div>
      <form className="admin-date-custom" method="get">
        {Object.entries(preserve).filter(([key]) => !["days", "startDate", "endDate", "page"].includes(key)).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
        <label>起<input aria-label="开始日期" name="startDate" type="date" defaultValue={dayValue(resolved.startDate)} /></label>
        <label>止<input aria-label="结束日期" name="endDate" type="date" defaultValue={dayValue(resolved.endDate)} /></label>
        <input type="hidden" name="page" value="1" />
        <button type="submit">应用</button>
      </form>
    </div>
  );
}
