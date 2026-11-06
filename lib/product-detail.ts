import { categorySlug, productPath, type Product } from "@/lib/products";

const SITE_URL = "https://www.cowinmotors.com";

type DetailSpec = { label: string; value: string };

function productKind(product: Product) {
  const type = `${product.productType || ""} ${product.title || ""}`.toLowerCase();
  if (categorySlug(product) === "headlights") return type.includes("headlight") ? "Headlight Assembly" : "Automotive Lighting Assembly";
  if (categorySlug(product) === "tail-lights") return type.includes("tail") ? "Tail Light Assembly" : "Rear Lighting Assembly";
  if (categorySlug(product) === "exhaust") return "Exhaust System";
  if (categorySlug(product) === "wheels") return "Forged Wheel";
  if (categorySlug(product) === "body-kits") return "Body Kit Component";
  return product.productType || "Automotive Part";
}

function fitmentLabel(product: Product) {
  const fitment = productFitment(product);
  return [fitment.vehicle, fitment.years].filter(Boolean).join(" ");
}

export function productDisplayTitle(product: Product) {
  const title = product.title.trim();
  const reference = productReferences(product)[0];
  if (reference && !title.toLowerCase().includes(reference.toLowerCase())) return `${title} | Ref. ${reference}`;
  return title;
}

export function productSeoDescription(product: Product) {
  const fitment = categorySlug(product) === "wheels" ? "" : fitmentLabel(product);
  const reference = productReferences(product)[0];
  const attributes = [reference ? `reference ${reference}` : "", product.side ? `${product.side} side` : "", product.material || ""].filter(Boolean).join(", ");
  return `${product.title.trim()}${fitment ? `. Listed fitment: ${fitment}` : ""}${attributes ? `. ${attributes}` : ""}. Confirm specifications and fitment before ordering.`.slice(0, 158);
}

export function productReferences(product: Product) {
  return [...new Set((product.partNumbers || []).map((value) => value.trim()).filter((value) =>
    /[a-z0-9]/i.test(value) && !/^(?:sjc|n\/a|na|none|unknown)$/i.test(value),
  ))];
}

export function productFitment(product: Product) {
  const category = categorySlug(product);
  if (category === "wheels") return { vehicle: "Vehicle-specific fitment", years: "" };
  const brand = product.brand?.trim() || "";
  const model = product.model?.trim() || "";
  const modelIncludesBrand = brand && model.toLowerCase().startsWith(`${brand.toLowerCase()} `);
  const titleYears = Array.from(product.title.matchAll(/\b(?:19|20)\d{2}(?:\s*[-\u2013]\s*(?:19|20)\d{2})?\b/g), (match) => match[0]);
  return {
    vehicle: modelIncludesBrand || model.toLowerCase() === brand.toLowerCase() ? model : [brand, model].filter(Boolean).join(" "),
    years: product.yearRange || [...new Set(titleYears)].join(" / "),
  };
}

export function productSpecs(product: Product): DetailSpec[] {
  const rows: DetailSpec[] = [];
  const known = (label: string, value: unknown) => {
    const text = Array.isArray(value) ? value.filter(Boolean).join(" / ") : typeof value === "string" ? value.trim() : "";
    if (/[a-z0-9]/i.test(text) && !/^(?:n\/a|na|none|unknown)$/i.test(text)) rows.push({ label, value: text });
  };
  const category = categorySlug(product);
  const references = productReferences(product);
  if (category === "headlights" || category === "tail-lights") {
    known("Side", product.side);
    known("Lighting features", product.features);
    const connector = typeof product.size === "string" && /\b\d+\s*pins?\b/i.test(product.size) ? product.size : "";
    known("Connector options", connector);
    const originalLamp = [product.size, product.color, product.fitment].find((value) => typeof value === "string" && /fit for (?:original )?(?:halogen|xenon|LED)/i.test(value));
    known("Original lamp version", typeof originalLamp === "string" ? originalLamp.replace(/[ /]+$/, "") : "");
    known("Material", product.material);
  } else if (category === "exhaust") {
    const title = product.title;
    const material = /\btitanium\b.*\bstainless steel\b|\bstainless steel\b.*\btitanium\b/i.test(title) ? "Titanium / stainless steel"
      : /\bSS\s*304\b|\b304 stainless steel\b/i.test(title) ? "304 stainless steel"
      : title.match(/\b(?:titanium|stainless steel)\b/i)?.[0];
    known("Material", product.material || material);
    const sections = [
      /\bcat[\s-]?back\b/i.test(title) && "Cat-back",
      /\baxle[\s-]?back\b/i.test(title) && "Axle-back",
      /\bdown[\s-]?pipe\b/i.test(title) && "Downpipe",
      /\bheaders?\b/i.test(title) && "Header",
    ].filter(Boolean);
    known("Exhaust section", sections);
    known("Valve configuration", /\bnon[\s-]?valved\b/i.test(title) ? "Non-valved" : /\bvalved\b/i.test(title) ? "Valved" : "");
    const diameter = title.match(/\b(\d{2,3}(?:\.\d+)?)\s*mm\s+(?:cat[\s-]?back|pipe|exhaust)\b/i)?.[1];
    known("Listed pipe diameter", diameter && `${diameter} mm`);
    known("Engine reference", [...new Set(title.match(/\b\d\.\d\s*[TL]\b/gi) || [])]);
  } else if (category === "wheels") {
    known("Wheel maker", product.brand);
    known("Wheel model", product.model);
    const series = typeof product.wheelSeries === "string" && !/^(?:product|products|wheels?|wheel-designs)$/i.test(product.wheelSeries) ? product.wheelSeries : "";
    known("Wheel series", series);
    known("Material", product.material);
    known("Listed size", product.size);
    known("Listed finish", product.finish || product.color);
    known("PCD / bolt pattern", product.pcd);
    known("Offset", product.offset);
    known("Center bore", product.centerBore);
  } else if (category === "body-kits") {
    known("Material", product.material);
    known("Listed finish", product.finish);
    known("Included parts", product.contents);
  } else {
    known("Material", product.material);
    known("Side", product.side);
    known("Listed features", product.features);
  }
  known("Part number / reference", references);
  known("Catalog type", product.productType);
  return rows;
}

export function productFitmentChecks(product: Product) {
  const common = "Vehicle year, make, model and trim";
  switch (categorySlug(product)) {
    case "headlights":
    case "tail-lights":
      return [common, "Original lamp type, market version and LHD / RHD", "Left, right or pair; plug photo or OE number"];
    case "exhaust":
      return [common, "Engine code, drivetrain and current exhaust layout", "System section, valve needs and destination requirements"];
    case "wheels":
      return [common, "Diameter, width, PCD, offset and center bore", "Brake clearance, load requirement and finish"];
    case "body-kits":
      return [common, "Body style, facelift version and photos of the mounting area", "Components, finish and delivery destination"];
    default:
      return [common, "OE number, required side and a reference photo"];
  }
}

export function productFaqs(product: Product) {
  const vehicle = categorySlug(product) === "wheels" ? "my vehicle" : fitmentLabel(product) || "my vehicle";
  const kind = productKind(product).toLowerCase();
  const reference = productReferences(product)[0];
  return [
    { question: `How do I confirm this ${kind} fits ${vehicle}?`, answer: `${reference ? `Compare catalog reference ${reference} with the original part. ` : ""}Send ${productFitmentChecks(product)[1].toLowerCase()} with the vehicle year, make, model and trim. Fitment must be confirmed before ordering.` },
    { question: "What details should I provide before quotation?", answer: `${productFitmentChecks(product).join("; ")}. Please include your quantity and destination country.` },
    { question: "What is the minimum order and lead time?", answer: "Minimum order quantity and lead time are confirmed in the quote. Include your sample or bulk quantity, packaging needs and destination." },
    { question: "Are product specifications fixed?", answer: "Only the details shown from the product record are confirmed. Connector, configuration, package contents, compliance requirements, and other unlisted specifications must be checked before ordering." },
    { question: "Can Cowinmotors help with packaging and export coordination?", answer: "Product photo confirmation, packaging review, pre-shipment QC coordination, and shipping or export-document support can be arranged subject to the product and destination requirements." },
    { question: "How should vehicle brand names be understood on this page?", answer: "Vehicle brand names are used only to indicate compatibility. Cowinmotors Automotive Parts is an independent automotive parts sourcing and export partner." },
  ];
}

export function productFaqSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: productFaqs(product).map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function productSchema(product: Product, photos: string[]) {
  const title = productDisplayTitle(product);
  const fitment = productFitment(product);
  const vehicle = categorySlug(product) === "wheels" || !product.model || !fitment.vehicle ? undefined : fitment.vehicle;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    ...(photos.length ? { image: photos.map((photo) => new URL(photo, SITE_URL).href) } : {}),
    description: productSeoDescription(product),
    category: product.category,
    sku: productReferences(product)[0] || product.id || product.slug,
    url: `${SITE_URL}${productPath(product)}`,
    ...(vehicle ? { isAccessoryOrSparePartFor: { "@type": "Vehicle", name: vehicle } } : {}),
    additionalProperty: [
      ...(vehicle && fitment.years ? [{ label: "Listed model years", value: fitment.years }] : []),
      ...productSpecs(product),
    ].map((spec) => ({ "@type": "PropertyValue", name: spec.label, value: spec.value })),
  };
}

export function productBreadcrumbSchema(product: Product) {
  const path = productPath(product);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: product.category, item: `${SITE_URL}/${categorySlug(product)}` },
      { "@type": "ListItem", position: 3, name: productDisplayTitle(product), item: `${SITE_URL}${path}` },
    ],
  };
}
