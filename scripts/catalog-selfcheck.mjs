import rawData from "../public/data/site-data.json" with { type: "json" };

const wheelAccessoryTerms = /sticker|decal|lug nut|center cap|valve stem|tpms|hub centric|hub ring|assembly bolt|gloves|coin pouch|bracket adapter/i;
const unsupportedWheelUseTerms = /trailer|caravan|\bRV\b|motorcycle|motorbike|\btire\b|\btyre\b/i;
const trustedForgedWheelBrands = new Set(["AL13 Wheels", "BC Forged NA", "Brixton Forged", "HRE Wheels"]);
const verifiedVossenForgedSeries = /\b(?:EVO|M-X|S17|S21|LC2|LC3|CG-|GNS-|VPS-|ML-[XR]|ERA-|HC-|RS\d|VFX-)\b|3-Piece|Vossen Forged/i;

function supported(product) {
  if (product.category !== "Wheels") return true;
  const searchable = `${product.title || ""} ${product.description || ""}`;
  if (wheelAccessoryTerms.test(searchable) || unsupportedWheelUseTerms.test(searchable)) return false;
  if (trustedForgedWheelBrands.has(product.brand || "")) return true;
  if (product.brand === "Vossen Wheels") return verifiedVossenForgedSeries.test(product.title || "");
  return /forg/i.test(searchable);
}

const wheels = rawData.products.filter((product) => product.category === "Wheels");
const included = wheels.filter(supported);
const invalid = included.filter((product) => wheelAccessoryTerms.test(product.title) || unsupportedWheelUseTerms.test(product.title));
if (invalid.length) throw new Error(`Unsupported wheel records remain: ${invalid.map((item) => item.title).join(", ")}`);
if (included.some((product) => /\bHF-?\d/i.test(product.title))) throw new Error("Vossen HF hybrid wheels must not be public.");
console.log(JSON.stringify({ ok: true, sourceWheelRecords: wheels.length, publicForgedWheelRecords: included.length, excludedRecords: wheels.length - included.length }, null, 2));
