import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categorySlug, productPath, type Product } from "@/lib/products";
import { ProductPhoto } from "@/components/ProductPhoto";
import { productFitment, productReferences, productSpecs } from "@/lib/product-detail";
import { catalogProductPhotos } from "@/lib/product-media";

export function ProductCard({ product }: { product: Product }) {
  const path = productPath(product);
  const category = categorySlug(product);
  const fitment = productFitment(product);
  const reference = productReferences(product)[0];
  const highlight = productSpecs(product).find((spec) => ["Side", "Material", "Exhaust section", "Lighting features"].includes(spec.label));
  const photo = catalogProductPhotos(product)[0];
  return (
    <article className="cm-part-card">
      <Link className="cm-part-photo" href={path} aria-label={`View ${product.title}`} prefetch={false}>
        <ProductPhoto key={photo} src={photo} category={category} alt={product.title} />
      </Link>
      <div className="cm-part-info">
        <div className="cm-part-meta">{category === "wheels" ? product.brand : [fitment.vehicle, fitment.years].filter(Boolean).join(" / ") || product.category}</div>
        <h3><Link href={path} prefetch={false}>{product.title}</Link></h3>
        {reference || highlight ? <p>{reference ? `Ref. ${reference}` : highlight?.value}</p> : null}
        <div className="cm-part-actions">
          <Link className="cm-text-link" href={path} prefetch={false}>View details <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <Link className="cm-part-quote" href={`${path}#product-inquiry`} prefetch={false}>Get a quote</Link>
        </div>
      </div>
    </article>
  );
}
