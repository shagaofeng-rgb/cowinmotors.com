"use client";

import { useState } from "react";

export function QuoteForm({ initialProduct = "" }: { initialProduct?: string }) {
  const [note, setNote] = useState("");

  return (
    <form
      className="rfq-form"
      id="rfqForm"
      onSubmit={(event) => {
        event.preventDefault();
        setNote("Preview only: RFQ can be connected to email, WhatsApp, CRM, or Shopline form later.");
      }}
    >
      <label>Name<input type="text" placeholder="Your name" required /></label>
      <label>Email<input type="email" placeholder="name@company.com" required /></label>
      <label>Country<input type="text" placeholder="United States" /></label>
      <label>Product Type<select><option>Headlights</option><option>Exhaust Pipes</option><option>Body Kits</option><option>OEM / ODM / Private Label</option></select></label>
      <label className="wide">Product / SKU<input id="quoteProduct" type="text" placeholder="Product title or SKU" defaultValue={initialProduct} /></label>
      <label>Vehicle Info<input type="text" placeholder="Year / make / model / trim / engine" /></label>
      <label>Quantity / MOQ<input type="text" placeholder="Sample, 5 pcs, 20 sets..." /></label>
      <label className="wide">Requirement<textarea rows={5} placeholder="Material, certification, package contents, LHD/RHD, shipping method, target price" /></label>
      <button className="wide" type="submit">Preview RFQ submission</button>
      <p className="form-note wide" id="rfqNote" role="status">{note}</p>
    </form>
  );
}
