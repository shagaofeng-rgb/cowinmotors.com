"use client";

import { useState } from "react";

export function QuoteForm({ initialProduct = "" }: { initialProduct?: string }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="rfq-form"
      id="rfqForm"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setNote("");

        const form = event.currentTarget;
        const formData = new FormData(form);
        const payload = {
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          country: String(formData.get("country") || ""),
          productType: String(formData.get("productType") || ""),
          product: String(formData.get("product") || ""),
          vehicleInfo: String(formData.get("vehicleInfo") || ""),
          quantity: String(formData.get("quantity") || ""),
          requirement: String(formData.get("requirement") || ""),
        };

        const response = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          window.dispatchEvent(new CustomEvent("cowinmotors:form-submit", { detail: payload }));
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "form_submit",
              page: window.location.pathname,
              pageTitle: document.title,
              targetText: payload.product || payload.productType,
              visitorId: window.localStorage.getItem("cowinmotors_visitor_id") || "anonymous",
              sessionId: window.sessionStorage.getItem("cowinmotors_session_id") || "session",
            }),
            keepalive: true,
          }).catch(() => {});
          form.reset();
          setNote("RFQ received. Our team will review fitment, MOQ, lead time, and shipping details.");
        } else {
          setNote("Submission failed. Please email racheljiang@cowinmotors.com or use WhatsApp.");
        }
        setSubmitting(false);
      }}
    >
      <label>Name<input name="name" type="text" placeholder="Your name" required /></label>
      <label>Email<input name="email" type="email" placeholder="name@company.com" required /></label>
      <label>Country<input name="country" type="text" placeholder="United States" /></label>
      <label>Product Type<select name="productType"><option>Headlights</option><option>Exhaust Pipes</option><option>Body Kits</option><option>OEM / ODM / Private Label</option></select></label>
      <label className="wide">Product / SKU<input id="quoteProduct" name="product" type="text" placeholder="Product title or SKU" defaultValue={initialProduct} /></label>
      <label>Vehicle Info<input name="vehicleInfo" type="text" placeholder="Year / make / model / trim / engine" /></label>
      <label>Quantity / MOQ<input name="quantity" type="text" placeholder="Sample, 5 pcs, 20 sets..." /></label>
      <label className="wide">Requirement<textarea name="requirement" rows={5} placeholder="Material, certification, package contents, LHD/RHD, shipping method, target price" /></label>
      <button className="wide" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit RFQ"}</button>
      <p className="form-note wide" id="rfqNote" role="status">{note}</p>
    </form>
  );
}
