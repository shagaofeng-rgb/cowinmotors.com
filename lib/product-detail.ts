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
  return [product.brand, product.model, product.yearRange].filter(Boolean).join(" ").trim();
}

export function productDisplayTitle(product: Product) {
  const kind = productKind(product);
  const fitment = fitmentLabel(product);
  if (categorySlug(product) === "wheels") return `${kind} Inquiry | ${product.title}`;
  return fitment ? `${kind} Compatible with ${fitment}` : product.title;
}

export function productSeoDescription(product: Product) {
  const fitment = fitmentLabel(product);
  const subject = fitment ? `${productKind(product)} compatible with ${fitment}` : productKind(product);
  return `Request a sourcing quote for this ${subject}. Confirm vehicle configuration, product details, packaging, quantity, and destination before ordering.`.slice(0, 158);
}

export function productSpecs(product: Product): DetailSpec[] {
  const common: DetailSpec[] = [
    { label: "Product category", value: productKind(product) },
    { label: "Compatible vehicle", value: [product.brand, product.model].filter(Boolean).join(" ") || "Confirm with sales before ordering" },
    { label: "Year range", value: product.yearRange || "Available upon confirmation" },
  ];
  const known = (label: string, value?: string | string[]) => {
    const text = Array.isArray(value) ? value.filter(Boolean).join(" / ") : value || "";
    if (text) common.push({ label, value: text });
  };
  const category = categorySlug(product);
  if (category === "headlights" || category === "tail-lights") {
    known("Part number / reference", product.partNumbers);
    known("Side", product.side);
    known("Listed features", product.features);
    common.push(
      { label: "Market version", value: "Confirm LHD / RHD and market version before ordering" },
      { label: "Connector and coding", value: "Depends on vehicle configuration; confirm before ordering" },
      { label: "Package contents", value: "Confirm with sales before ordering" },
      { label: "Certification status", value: "Available upon confirmation" },
    );
  } else if (category === "exhaust") {
    known("Listed material", product.material);
    known("Listed features", product.features);
    known("Fitment reference", product.fitment as string);
    common.push(
      { label: "Vehicle / engine", value: fitmentLabel(product) || "Confirm with sales before ordering" },
      { label: "Installation position", value: "Confirm with sales before ordering" },
      { label: "Road-use notice", value: "Confirm destination-country requirements before ordering" },
      { label: "Package contents", value: "Confirm with sales before ordering" },
    );
  } else if (category === "wheels") {
    known("Wheel series", product.wheelSeries as string);
    known("Listed size", product.size as string);
    known("Listed finish", product.color as string);
    known("Part number / reference", product.partNumbers);
    common.push(
      { label: "PCD / bolt pattern", value: "Available upon confirmation" },
      { label: "Offset", value: "Available upon confirmation" },
      { label: "Center bore", value: "Available upon confirmation" },
      { label: "Load rating", value: "Available upon confirmation" },
      { label: "Packaging", value: "Confirm with sales before ordering" },
    );
  } else if (category === "body-kits") {
    known("Listed material", product.material);
    known("Parts reference", product.partNumbers);
    known("Listed features", product.features);
    common.push(
      { label: "Surface finish", value: "Confirm with sales before ordering" },
      { label: "Paint requirement", value: "Confirm with sales before ordering" },
      { label: "Installation type", value: "Confirm with sales before ordering" },
      { label: "Package contents", value: "Confirm with sales before ordering" },
    );
  }
  return common;
}

export function productFaqs(product: Product) {
  const vehicle = fitmentLabel(product) || "my vehicle";
  const kind = productKind(product).toLowerCase();
  return [
    { question: `How do I confirm this ${kind} fits ${vehicle}?`, answer: "Send the vehicle year, make, model, trim, engine, market version, and OE number or product photo where available. Fitment must be confirmed before ordering." },
    { question: "What vehicle details should I provide before quotation?", answer: "Please include the year, make, model, trim, engine, LHD or RHD, required side or set, destination country, quantity, and any OE number or reference photo." },
    { question: "Can I order a sample or wholesale quantity?", answer: "Both retail-friendly and wholesale inquiries can be reviewed. Quantity, packaging requirements, and destination are confirmed before quotation." },
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

export function productSchema(product: Product) {
  const title = productDisplayTitle(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: [`${SITE_URL}${product.localImage.startsWith("/") ? product.localImage : `/${product.localImage}`}`],
    description: productSeoDescription(product),
    category: product.category,
    sku: product.partNumbers?.[0] || product.id || product.slug,
    url: `${SITE_URL}${productPath(product)}`,
    additionalProperty: productSpecs(product).map((spec) => ({ "@type": "PropertyValue", name: spec.label, value: spec.value })),
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
