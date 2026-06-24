export type AdminDateRange = {
  days: number;
  startDate?: string;
  endDate?: string;
};

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
  const endDate = range.endDate ? new Date(range.endDate) : new Date();
  const startDate = range.startDate ? new Date(range.startDate) : new Date();

  if (!range.startDate) {
    startDate.setDate(endDate.getDate() - range.days + 1);
    startDate.setHours(0, 0, 0, 0);
  }

  if (!range.endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const rangeDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime() + 1) / 86400000));
  return { startDate, endDate, rangeDays };
}
