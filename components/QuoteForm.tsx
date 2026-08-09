"use client";

import { useState } from "react";

async function encodeAttachment(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
    reader.readAsDataURL(file);
  });
}

function trackingContext() {
  try {
    const visitorKey = "cowinmotors_visitor_id";
    const sessionKey = "cowinmotors_session_id";
    const visitorId = window.localStorage.getItem(visitorKey) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const sessionId = window.sessionStorage.getItem(sessionKey) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(visitorKey, visitorId);
    window.sessionStorage.setItem(sessionKey, sessionId);
    return {
      visitorId,
      sessionId,
      landingPage: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer,
    };
  } catch {
    return { visitorId: "", sessionId: "", landingPage: "", referrer: "" };
  }
}

export function QuoteForm({ initialProduct = "", initialCategory = "" }: { initialProduct?: string; initialCategory?: string }) {
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
        const file = formData.get("productPhoto");
        if (file instanceof File && file.size > 5 * 1024 * 1024) {
          setNote("Please upload an image or PDF smaller than 5 MB.");
          setSubmitting(false);
          return;
        }
        if (file instanceof File && file.size && !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
          setNote("Please upload a JPG, PNG, WebP, or PDF reference file.");
          setSubmitting(false);
          return;
        }
        const attachment = file instanceof File && file.size
          ? { name: file.name, type: file.type, contentBase64: await encodeAttachment(file) }
          : undefined;
        const payload = {
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          country: String(formData.get("country") || ""),
          productType: String(formData.get("productType") || initialCategory || ""),
          product: String(formData.get("product") || ""),
          vehicleInfo: [
            `Vehicle make: ${String(formData.get("vehicleMake") || "")}`,
            `Vehicle model: ${String(formData.get("vehicleModel") || "")}`,
            `Year: ${String(formData.get("vehicleYear") || "")}`,
            `Trim / engine: ${String(formData.get("trimEngine") || "")}`,
            `LHD / RHD: ${String(formData.get("driveSide") || "")}`,
            `Side / set: ${String(formData.get("sideSet") || "")}`,
          ].filter((item) => !item.endsWith(": ")).join(" | ") || String(formData.get("vehicleInfo") || ""),
          quantity: String(formData.get("quantity") || ""),
          requirement: [
            `Company: ${String(formData.get("companyName") || "")}`,
            `Buyer type: ${String(formData.get("buyerType") || "")}`,
            `Product URL / SKU: ${String(formData.get("productUrl") || "")}`,
            `OE number: ${String(formData.get("oeNumber") || "")}`,
            `Destination port / country: ${String(formData.get("destination") || "")}`,
            `Reference attachment: ${attachment?.name || ""}`,
            `Requirement: ${String(formData.get("requirement") || "")}`,
          ].filter((item) => !item.endsWith(": ")).join(" | "),
          attachment,
          ...trackingContext(),
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
              visitorId: payload.visitorId || "anonymous",
              sessionId: payload.sessionId || "session",
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
      <label>Company Name<input name="companyName" type="text" placeholder="Your company" /></label>
      <label>Email<input name="email" type="email" placeholder="name@company.com" required /></label>
      <label>WhatsApp / Phone<input name="phone" type="tel" placeholder="+1 555 000 0000" required /></label>
      <label>Country<input name="country" type="text" placeholder="United States" /></label>
      <label>Buyer Type<select name="buyerType"><option value="">Select buyer type</option><option>Importer / Distributor</option><option>Retailer / E-commerce Seller</option><option>Repair or Modification Shop</option><option>Vehicle Owner</option><option>Other</option></select></label>
      <label>Product Category<select name="productType" defaultValue={initialCategory}><option value="">Select category</option><option>Headlights</option><option>Tail Lights</option><option>Exhaust Systems</option><option>Forged Wheels</option><option>Body Kits</option><option>Other Automotive Parts</option></select></label>
      <label>Product URL / SKU<input name="productUrl" type="text" placeholder="URL, SKU, or part number" /></label>
      <label className="wide">Product Name<input id="quoteProduct" name="product" type="text" placeholder="Product title or SKU" defaultValue={initialProduct} /></label>
      <label>Vehicle Make<input name="vehicleMake" type="text" placeholder="Audi, BMW, Mercedes-Benz..." /></label>
      <label>Vehicle Model<input name="vehicleModel" type="text" placeholder="A3 8V, G20, W205..." /></label>
      <label>Year<input name="vehicleYear" type="text" placeholder="2019-2022" /></label>
      <label>Trim / Engine<input name="trimEngine" type="text" placeholder="Trim, engine, market version" /></label>
      <label>LHD / RHD<select name="driveSide"><option value="">Select if applicable</option><option>LHD</option><option>RHD</option><option>Not applicable / unsure</option></select></label>
      <label>Left / Right / Pair<select name="sideSet"><option value="">Select if applicable</option><option>Left</option><option>Right</option><option>Pair / full set</option><option>Not applicable / unsure</option></select></label>
      <label>OE Number<input name="oeNumber" type="text" placeholder="If available" /></label>
      <label>Quantity<input name="quantity" type="text" placeholder="1 sample, 5 pcs, 20 sets..." /></label>
      <label>Destination Port / Country<input name="destination" type="text" placeholder="Port and country" /></label>
      <label>Product Photo / File<input name="productPhoto" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
      <label className="wide">Requirement<textarea name="requirement" rows={5} placeholder="Product reference, packaging, shipping, or other requirements" /></label>
      <button className="wide" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Request a Quote"}</button>
      <p className="form-note wide" id="rfqNote" role="status">{note}</p>
    </form>
  );
}
