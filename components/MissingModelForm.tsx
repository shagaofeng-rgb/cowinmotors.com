"use client";

import { useState } from "react";

export function MissingModelForm() {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="rfq-form missing-model-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setStatus("");

        const form = event.currentTarget;
        const formData = new FormData(form);
        const payload = {
          source: "homepage-missing-model",
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
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
        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "form_submit",
              page: window.location.pathname,
              pageTitle: document.title,
              targetText: payload.product || "Missing model request",
              visitorId: window.localStorage.getItem("cowinmotors_visitor_id") || "anonymous",
              sessionId: window.sessionStorage.getItem("cowinmotors_session_id") || "session",
            }),
            keepalive: true,
          }).catch(() => {});
          form.reset();
          setStatus(result.emailSent ? "Submitted. Our team will contact you with a solution." : "Submitted. Our team will review it soon.");
        } else {
          setStatus("Submission failed. Please email davidsha@cowinmotors.com.");
        }

        setSubmitting(false);
      }}
    >
      <label>Name<input name="name" type="text" placeholder="Your name" required /></label>
      <label>Email<input name="email" type="email" placeholder="name@company.com" required /></label>
      <label>Phone / WhatsApp<input name="phone" type="tel" placeholder="+1 555 000 0000" required /></label>
      <label>Country<input name="country" type="text" placeholder="United States" /></label>
      <label>Product Type<select name="productType"><option>Headlights</option><option>Exhaust Pipes</option><option>Body Kits</option><option>Other Automotive Parts</option></select></label>
      <label className="wide">Vehicle / Model Needed<input name="product" type="text" placeholder="BMW G82 M4, Audi S5 B9, Porsche 718..." required /></label>
      <label className="wide">Vehicle Details<input name="vehicleInfo" type="text" placeholder="Year / make / model / trim / engine / LHD or RHD" /></label>
      <label>Quantity<input name="quantity" type="text" placeholder="1 set, sample, wholesale order..." /></label>
      <label>Requirement<input name="requirement" type="text" placeholder="Special fitment, finish, shipping, or target price" /></label>
      <button className="wide" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit model request"}</button>
      <p className="form-note wide" role="status">{status}</p>
    </form>
  );
}
