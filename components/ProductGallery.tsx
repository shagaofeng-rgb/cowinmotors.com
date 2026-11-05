"use client";

import { ChevronLeft, ChevronRight, Image as PhotoIcon, Maximize2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ProductPhoto } from "@/components/ProductPhoto";

export function ProductGallery({ photos, title, category }: { photos: string[]; title: string; category: string }) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = photos[selected];
  const canView = current && !failed.includes(current);
  const markUnavailable = useCallback(() => setFailed((values) => !current || values.includes(current) ? values : [...values, current]), [current]);
  const multiple = photos.length > 1;
  const alt = multiple ? `${title}, photo ${selected + 1}` : title;
  const step = (offset: number) => setSelected((index) => (index + offset + photos.length) % photos.length);

  return (
    <figure className="cm-gallery">
      <div className="cm-photo-stage">
        <ProductPhoto key={current} src={current} category={category} alt={alt} eager onUnavailable={markUnavailable} />
      </div>
      <figcaption className="cm-gallery-caption">
        <span><PhotoIcon size={16} aria-hidden="true" /> {canView ? "Catalog photo" : "No verified photo"}</span>
        {multiple && <span aria-live="polite">{selected + 1} / {photos.length}</span>}
        {canView ? (
          <button className="cm-icon-btn cm-gallery-open" type="button" ref={trigger} aria-label="Enlarge product photo" title="Enlarge product photo" onClick={() => dialog.current?.showModal()}>
            <Maximize2 size={18} aria-hidden="true" />
          </button>
        ) : <a href="#product-inquiry" className="cm-text-link">Request a photo</a>}
      </figcaption>
      {multiple && (
        <div className="cm-gallery-thumbs" role="group" aria-label="Product photos">
          {photos.map((src, index) => (
            <button type="button" key={src} aria-label={`View photo ${index + 1}`} aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <ProductPhoto src={src} alt="" category={category} />
            </button>
          ))}
        </div>
      )}
      {current && (
        <dialog className="cm-photo-dialog" aria-label={`${title} product photos`} ref={dialog}
          onClose={() => trigger.current?.focus()}
          onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
          onKeyDown={(event) => {
            if (multiple && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
              event.preventDefault();
              step(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}>
          <div className="cm-photo-dialog-inner">
            <div className="cm-dialog-toolbar">
              <strong>{title}</strong>
              <button type="button" className="cm-icon-btn" aria-label="Close photo" title="Close photo" autoFocus onClick={() => dialog.current?.close()}><X size={22} /></button>
            </div>
            <div className="cm-dialog-media"><ProductPhoto key={current} src={current} category={category} alt={alt} /></div>
            {multiple && (
              <div className="cm-dialog-controls">
                <button type="button" className="cm-icon-btn" aria-label="Previous photo" title="Previous photo" onClick={() => step(-1)}><ChevronLeft size={22} /></button>
                <span aria-live="polite">{selected + 1} / {photos.length}</span>
                <button type="button" className="cm-icon-btn" aria-label="Next photo" title="Next photo" onClick={() => step(1)}><ChevronRight size={22} /></button>
              </div>
            )}
          </div>
        </dialog>
      )}
    </figure>
  );
}
