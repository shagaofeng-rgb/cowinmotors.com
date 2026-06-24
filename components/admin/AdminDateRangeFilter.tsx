import Link from "next/link";
import type { AdminDateRange } from "@/lib/adminDateRange";

const ranges = [
  { days: 7, label: "7天" },
  { days: 14, label: "14天" },
  { days: 30, label: "30天" },
  { days: 90, label: "90天" },
];

export function AdminDateRangeFilter({ range }: { range: AdminDateRange }) {
  return (
    <div className="admin-date-filter">
      {ranges.map((item) => (
        <Link className={range.days === item.days ? "is-active" : ""} href={`?days=${item.days}`} key={item.days}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
