export type CampaignAttribution = {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
};

export function sessionAttribution(sessionId: string) {
  const params = new URLSearchParams(window.location.search);
  const utm: CampaignAttribution = {
    source: params.get("utm_source") || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
  };
  const hasCampaign = Object.values(utm).some(Boolean);
  try {
    const key = "cowinmotors_session_attribution";
    const saved = JSON.parse(window.sessionStorage.getItem(key) || "null") as {
      sessionId: string;
      utm: CampaignAttribution;
      referrer: string;
    } | null;
    if (hasCampaign || saved?.sessionId !== sessionId) {
      const next = { sessionId, utm, referrer: document.referrer };
      window.sessionStorage.setItem(key, JSON.stringify(next));
      return next;
    }
    return saved;
  } catch {
    return { sessionId, utm, referrer: document.referrer };
  }
}
