"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, type FormEvent } from "react";
import { categorySearchPath, type CategorySearchParams } from "@/lib/category-url";

const categories = [["headlights", "Headlights"], ["tail-lights", "Tail lights"], ["exhaust", "Exhaust systems"], ["wheels", "Forged wheels"]];

type Props = { basePath: string; brands: string[]; params: CategorySearchParams; wheelCatalog: boolean; activeCount: number };

export function CatalogFilters({ basePath, brands, params, wheelCatalog, activeCount }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (field: string) => String(data.get(field) || "");
    const path = categorySearchPath(basePath, { category: read("category"), make: read("make"), q: read("q"), year: read("year") });
    dialog.current?.close();
    router.push(path);
  };

  function fields(compact: boolean) {
    const make = params.make || "";
    const all = basePath === "/products";
    return (
      <form className={`cm-filter-form ${compact ? "cm-filter-form-compact" : "cm-filter-form-wide"}`} action={basePath} onSubmit={submit} aria-label="Catalog filters">
        <label className="cm-filter-query">Search parts<input type="search" name="q" defaultValue={params.q} placeholder="Model, part number or keyword" maxLength={120} /></label>
        {all && <label>Category<select name="category" defaultValue={params.category || ""}><option value="">All categories</option>{categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}{params.category && !categories.some(([value]) => value === params.category) && <option value={params.category}>{params.category === "body-kits" ? "Body kits" : params.category}</option>}</select></label>}
        <label>{wheelCatalog ? "Wheel maker" : "Make / brand"}<select name="make" defaultValue={make === "all" ? "" : make}>
          <option value="">All brands</option>{make && make !== "all" && !brands.includes(make) && <option>{make}</option>}{brands.map((brand) => <option key={brand}>{brand}</option>)}
        </select></label>
        {!wheelCatalog || params.year ? <label>Model year<input name="year" defaultValue={params.year} inputMode="numeric" placeholder="e.g. 2018" maxLength={4} /></label> : null}
        <button className="cm-btn cm-btn-primary" type="submit"><Search size={18} aria-hidden="true" /> Apply filters</button>
      </form>
    );
  }

  return (
    <div className="cm-filter-tools">
      {fields(false)}
      <button type="button" ref={trigger} className="cm-btn cm-btn-outline cm-filter-open" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">
        <SlidersHorizontal size={19} aria-hidden="true" /> Search &amp; filter{activeCount ? ` (${activeCount})` : ""}
      </button>
      <dialog className="cm-filter-dialog" ref={dialog} aria-labelledby="catalog-filter-title" onClose={() => trigger.current?.focus()}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="cm-filter-dialog-inner">
          <div className="cm-section-head"><h2 id="catalog-filter-title">Search &amp; filter</h2><button type="button" className="cm-icon-btn" aria-label="Close filters" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
          {fields(true)}
        </div>
      </dialog>
    </div>
  );
}
