export type SourceBackedCandidate = {
  title: string;
  summary: string;
  sourceDomain: string;
  sourcePublishedAt: string;
  sourceAuthor: string;
};

export type EditorialSite = {
  brandName: string;
  industry: string;
  targetMarkets: string[];
  desiredWordCount: { min: number; max: number };
};

export type EditorialTheme = {
  productName: string;
};

export type ComposedNewsArticle = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  editorialNote: string;
};

function compact(value: string, maximum = 2_000) {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
}

function sentence(value: string) {
  const result = compact(value).replace(/[.!?]+$/g, "");
  return result ? `${result}.` : "The source feed did not include a detailed summary.";
}

function categoryFor(value: string) {
  const corpus = value.toLowerCase();
  if (/headlight|tail light|lighting|lamp/.test(corpus)) return "Automotive Lighting";
  if (/exhaust|emission|muffler|catalytic/.test(corpus)) return "Exhaust Systems";
  if (/wheel|rim|tire|tyre/.test(corpus)) return "Wheels & Fitment";
  if (/body|collision|repair|bumper|panel/.test(corpus)) return "Body Kits & Repair";
  if (/shipping|logistics|supply chain|tariff|trade/.test(corpus)) return "Shipping & Supply Chain";
  if (/regulation|standard|safety|compliance|recall/.test(corpus)) return "Safety & Compliance";
  return "Automotive Aftermarket";
}

function tagsFor(value: string, category: string) {
  const corpus = value.toLowerCase();
  const tags = [category, "Automotive Aftermarket"];
  if (/fitment|compatib/.test(corpus)) tags.push("Fitment");
  if (/safety|recall/.test(corpus)) tags.push("Safety");
  if (/regulation|standard|compliance/.test(corpus)) tags.push("Compliance");
  if (/shipping|logistics|supply chain/.test(corpus)) tags.push("Supply Chain");
  if (/repair|collision/.test(corpus)) tags.push("Repair");
  return [...new Set(tags)].slice(0, 8);
}

export function composeSourceBackedNews(
  site: EditorialSite,
  candidate: SourceBackedCandidate,
  theme: EditorialTheme,
): ComposedNewsArticle {
  const sourceTitle = compact(candidate.title, 150);
  const sourceSummary = sentence(candidate.summary);
  const sourceName = compact(candidate.sourceDomain, 180) || "the original publisher";
  const sourceDate = new Date(candidate.sourcePublishedAt);
  const readableDate = Number.isNaN(sourceDate.getTime())
    ? "the date shown by the original publisher"
    : sourceDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const category = categoryFor(`${candidate.title} ${candidate.summary}`);
  const title = compact(`${sourceTitle}: What Aftermarket Buyers Should Review`, 180);
  const excerpt = compact(
    `${sourceName} reported a new automotive industry development. This independent editorial review separates the source facts from practical fitment, sourcing, quality-control and logistics questions for aftermarket buyers.`,
    340,
  );

  const paragraphs = [
    `${sourceName} published “${sourceTitle}” on ${readableDate}. The source feed describes the update as follows: ${sourceSummary} This paragraph reflects the information supplied by the original publisher. It does not add unverified figures, product claims, certification statements or conclusions that are absent from the cited report. Readers should use the original link and publication date in the source panel to review the reporting in its full context.`,

    `The immediate value of this update is not that every aftermarket buyer must change a purchasing plan at once. Its value is that it identifies a development worth checking against current vehicle applications, supplier documentation and destination-market requirements. Automotive parts decisions can be affected by model year, trim, engine, market version, left-hand-drive or right-hand-drive configuration, connector design and installation method. A broad industry headline therefore becomes useful only after those details are compared with the specific part and vehicle under review.`,

    `For importers, distributors, repair businesses and online sellers, the first practical step is to separate the verified event from assumptions about commercial impact. The source establishes the event described above. It does not automatically establish that every product, supplier, vehicle platform or destination market is affected in the same way. Buyers should record the source date, identify the models or product families directly mentioned, and check whether any later correction, technical bulletin or regulatory notice changes the original information. This creates a traceable decision record without overstating what the report proves.`,

    `Fitment remains the most important control point for many aftermarket parts. A product image or a familiar model name is not enough to confirm compatibility. Before a purchase decision, the vehicle year, make, platform, trim, engine and market version should be matched with the part number, connector, mounting points and side or set configuration. Lighting products may also require checks for beam pattern, LHD or RHD use, control modules and coding. Wheels require diameter, width, bolt pattern, offset, center bore and load information. Exhaust and exterior parts require their own vehicle and installation checks.`,

    `Quality-control review should be equally specific. Useful evidence may include current product photographs, dimensional checks, material declarations where available, connector or mounting-detail images, packaging photographs and a clear list of package contents. A report about an industry trend does not replace product-level inspection. It can, however, help a buyer decide which evidence deserves closer attention. When a feature, material, certification or performance result is not documented, it should remain marked as available upon confirmation rather than being treated as an established fact.`,

    `The update also has an operational dimension. Buyers serving the ${site.targetMarkets.join(" and ")} markets should compare destination requirements, labeling, documentation, packaging and transport conditions before shipment. Requirements can vary by product category and destination, and a source article may discuss only one jurisdiction or one part of the supply chain. Packaging choices should reflect product fragility, surface protection, carton strength and handling risk. Shipping plans should preserve the link between the ordered specification, inspection record, packing list and final dispatch information.`,

    `In the context of ${compact(theme.productName, 120)}, the safest interpretation is a review prompt rather than a sales claim. Teams can use the report to revisit product data, fitment notes and supplier evidence for related applications, but a connection should be made only where the vehicle or product facts genuinely overlap. Unrelated products should not be attached to the news merely to create an internal link. That discipline keeps the article useful for technical and procurement readers and prevents an external industry event from being turned into unsupported promotion.`,

    `A practical internal review can be completed in four stages. First, save the original source URL, title and date. Second, list only the facts explicitly supported by that source. Third, identify product, fitment, compliance or logistics questions that still require confirmation. Fourth, assign those questions to the appropriate supplier, technical reviewer or shipping partner before a commercial decision is made. This method is intentionally conservative: it helps teams act on relevant information while preserving a clear boundary between reporting, editorial analysis and product-specific evidence.`,

    `The main takeaway is that this development deserves structured verification, not an automatic change to every buying decision. ${site.brandName} presents this page as an independent editorial summary for readers involved in ${site.industry.toLowerCase()}. The linked publisher remains the source of the original report. Any product-level conclusion should be based on current vehicle data, confirmed specifications and applicable destination requirements, with uncertain points documented for further review.`,
  ];

  const content = paragraphs.join("\n\n");
  const words = content.split(/\s+/).filter(Boolean).length;
  if (words < site.desiredWordCount.min || words > site.desiredWordCount.max) {
    throw new Error(`Built-in News composer produced ${words} words; expected ${site.desiredWordCount.min}-${site.desiredWordCount.max}.`);
  }

  return {
    title,
    excerpt,
    content,
    category,
    tags: tagsFor(`${candidate.title} ${candidate.summary}`, category),
    seoTitle: title,
    seoDescription: excerpt,
    editorialNote: `Independent editorial summary and analysis based on the linked report from ${sourceName}. Source facts and Cowinmotors analysis are presented separately; readers should review the original publication for full context.`,
  };
}
