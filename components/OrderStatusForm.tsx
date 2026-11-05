"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

export function OrderStatusForm() {
  const [draft, setDraft] = useState("");

  return (
    <form className="cm-order-form" aria-label="Order status request" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const read = (name: string) => String(data.get(name) || "").trim();
      const reference = read("reference");
      const subject = `Shipment status request: ${reference}`;
      const body = `Hello Cowinmotors,\n\nPlease share a shipment status update.\n\nOrder or quotation reference: ${reference}\nReceiving company or name: ${read("recipient")}\nDestination country: ${read("country")}\n`;
      const url = `mailto:info@cowinmotors.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setDraft(url);
      window.location.href = url;
    }}>
      <div className="cm-form-grid">
        <label className="cm-wide">Order or quotation reference<input name="reference" required maxLength={100} /></label>
        <label>Receiving company or name<input name="recipient" required maxLength={120} /></label>
        <label>Destination country<input name="country" autoComplete="country-name" required maxLength={100} /></label>
      </div>
      <button className="cm-btn cm-btn-primary" type="submit"><Mail size={18} aria-hidden="true" /> Open email draft</button>
      {draft && <p className="cm-form-status" role="status">Send the draft from your email app. <a className="cm-text-link" href={draft}>Reopen email draft</a></p>}
    </form>
  );
}
