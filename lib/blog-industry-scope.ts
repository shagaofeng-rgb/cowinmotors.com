export function validateBlogIndustryScope(title: string, content: string) {
  const normalizedTitle = title.toLowerCase();
  const combined = `${title} ${content}`.toLowerCase();
  const outOfScopeTitle = /\b(electric bicycles?|e-?bikes?|wheelchairs?|motorcycles?|dirt bikes?|scooters?)\b/i;
  const automotiveSignals = [
    /\bautomotive\b/, /\bauto parts?\b/, /\bvehicle\b/, /\bcars?\b/, /\bfitment\b/,
    /\bheadlights?\b/, /\btail lights?\b/, /\btaillights?\b/, /\bexhaust\b/, /\bcat-?back\b/,
    /\bforged wheels?\b/, /\bwheel (?:pcd|offset|center bore|fitment)\b/, /\bbody kits?\b/,
    /\bbumpers?\b/, /\bdiffusers?\b/, /\bspoilers?\b/, /\bgrilles?\b/, /\boe numbers?\b/,
    /\blhd\b/, /\brhd\b/, /\baudi\b/, /\bbmw\b/, /\bmercedes(?:-benz)?\b/, /\bporsche\b/,
    /\btesla\b/, /\btoyota\b/, /\bhonda\b/, /\bvolkswagen\b/, /\bford\b/, /\blexus\b/,
  ];

  if (outOfScopeTitle.test(normalizedTitle)) {
    return { ok: false, error: "Article topic is outside the Cowinmotors automotive-parts scope." };
  }

  const signalCount = automotiveSignals.filter((pattern) => pattern.test(combined)).length;
  return signalCount >= 2
    ? { ok: true, error: "" }
    : { ok: false, error: "Article must contain a clear automotive-parts and vehicle-fitment focus." };
}
