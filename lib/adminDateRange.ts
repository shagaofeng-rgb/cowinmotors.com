export type AdminDateRange = {
  days: number;
  startDate?: string;
  endDate?: string;
};

export const ADMIN_REPORT_TIME_ZONE = "Asia/Shanghai";

function safeDays(value: unknown) {
  const parsed = Number(value || 14);
  if (!Number.isFinite(parsed)) return 14;
  return Math.min(180, Math.max(1, Math.round(parsed)));
}

export function getAdminDateRange(params?: URLSearchParams | Record<string, string | string[] | undefined>): AdminDateRange {
  const get = (key: string) => {
    if (!params) return "";
    if (params instanceof URLSearchParams) return params.get(key) || "";
    const value = params[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
  };

  return {
    days: safeDays(get("days")),
    startDate: get("startDate") || undefined,
    endDate: get("endDate") || undefined,
  };
}

export function resolveDateRange(range: AdminDateRange = { days: 14 }) {
  const parseCalendarDay = (value: string, endOfDay = false) => {
    const suffix = endOfDay ? "T23:59:59.999+08:00" : "T00:00:00.000+08:00";
    const parsed = new Date(`${value}${suffix}`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };
  const endDate = range.endDate ? parseCalendarDay(range.endDate, true) : new Date();
  const startDate = range.startDate ? parseCalendarDay(range.startDate) : new Date();

  if (!range.startDate) {
    const shanghaiToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: ADMIN_REPORT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(endDate);
    const start = parseCalendarDay(shanghaiToday);
    start.setUTCDate(start.getUTCDate() - range.days + 1);
    startDate.setTime(start.getTime());
  }

  if (!range.endDate) {
    const shanghaiToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: ADMIN_REPORT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(endDate);
    endDate.setTime(parseCalendarDay(shanghaiToday, true).getTime());
  }

  const rangeDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime() + 1) / 86400000));
  return { startDate, endDate, rangeDays };
}
