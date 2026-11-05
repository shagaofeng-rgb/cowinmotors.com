"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { sessionAttribution } from "@/lib/visitorAttribution";

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
    const sessionTimeKey = "cowinmotors_session_at";
    const visitorId = window.localStorage.getItem(visitorKey) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const existingSession = window.sessionStorage.getItem(sessionKey);
    const sessionTouchedAt = Number(window.sessionStorage.getItem(sessionTimeKey) || 0);
    const sessionExpired = Date.now() - sessionTouchedAt > 30 * 60 * 1000;
    const sessionId = existingSession && !sessionExpired ? existingSession : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(visitorKey, visitorId);
    window.sessionStorage.setItem(sessionKey, sessionId);
    window.sessionStorage.setItem(sessionTimeKey, String(Date.now()));
    const attribution = sessionAttribution(sessionId);
    return {
      visitorId,
      sessionId,
      landingPage: `${window.location.pathname}${window.location.search}`,
      referrer: attribution.referrer,
      utm: attribution.utm,
    };
  } catch {
    return { visitorId: "", sessionId: "", landingPage: "", referrer: "", utm: {} };
  }
}

export function QuoteForm({ initialProduct = "", initialCategory = "", productUrl, lighting = true }: {
  initialProduct?: string;
  initialCategory?: string;
  productUrl?: string;
  lighting?: boolean;
}) {
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="cm-rfq"
      id="rfqForm"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setNote("");
        setFailed(false);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const file = formData.get("productPhoto");
        if (file instanceof File && file.size > 3 * 1024 * 1024) {
          setFailed(true);
          setNote("Please upload an image or PDF up to 3 MB, or send a larger file over WhatsApp.");
          setSubmitting(false);
          return;
        }
        if (file instanceof File && file.size && !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
          setFailed(true);
          setNote("Please upload a JPG, PNG, WebP, or PDF reference file.");
          setSubmitting(false);
          return;
        }
        try {
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

          const result = await response.json().catch(() => ({}));
          if (response.ok && result.ok) {
            window.dispatchEvent(new CustomEvent("cowinmotors:form-submit", { detail: payload }));
            form.reset();
            setNote(result.emailSent === false && !result.testExcluded
              ? "Your request was saved, but email notification could not be sent. You can also reach us on WhatsApp."
              : "Quote request received. We'll review fitment, quantity and shipping details.");
          } else {
            setFailed(true);
            setNote(result.error || "We couldn't send your request. Try again or email info@cowinmotors.com.");
          }
        } catch {
          setFailed(true);
          setNote("We couldn't send your request. Check your connection and try again, or email info@cowinmotors.com.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <fieldset>
        <legend>Contact details</legend>
        <div className="cm-form-grid">
          <label>Name <span aria-hidden="true">*</span><input name="name" autoComplete="name" required /></label>
          <label>Email <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" required /></label>
          <label>WhatsApp / phone <span aria-hidden="true">*</span><input name="phone" type="tel" autoComplete="tel" required /></label>
          <label>Country<input name="country" autoComplete="country-name" /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>{productUrl ? "Vehicle & order" : "Product & vehicle"}</legend>
        {productUrl ? (
          <><input name="productType" type="hidden" value={initialCategory} /><input name="productUrl" type="hidden" value={productUrl} /><input name="product" type="hidden" value={initialProduct} /></>
        ) : (
          <div className="cm-form-grid cm-rfq-product">
            <label>Product category<select name="productType" defaultValue={initialCategory}><option value="">Select category</option><option>Headlights</option><option>Tail Lights</option><option>Exhaust Systems</option><option>Forged Wheels</option><option>Body Kits</option><option>Other Automotive Parts</option></select></label>
            <label>Product name or SKU<input id="quoteProduct" name="product" defaultValue={initialProduct} /></label>
          </div>
        )}
        <div className="cm-form-grid">
          <label>Vehicle make<input name="vehicleMake" placeholder="e.g. Audi" /></label>
          <label>Vehicle model<input name="vehicleModel" placeholder="e.g. A3 8V" /></label>
          <label>Model year<input name="vehicleYear" inputMode="numeric" placeholder="e.g. 2018" /></label>
          <label>Trim / engine<input name="trimEngine" /></label>
          <label>Quantity<input name="quantity" placeholder="e.g. 2 sets" /></label>
          <label>Destination port / country<input name="destination" /></label>
          <label className="cm-wide">Requirements<textarea name="requirement" rows={3} placeholder="Fitment questions, finish or packaging requirements" /></label>
        </div>
      </fieldset>
      <details className="cm-rfq-extra">
        <summary>Company details &amp; reference files <ChevronDown size={18} aria-hidden="true" /></summary>
        <div className="cm-form-grid">
          <label>Company<input name="companyName" autoComplete="organization" /></label>
          <label>Buyer type<select name="buyerType"><option value="">Select buyer type</option><option>Importer / Distributor</option><option>Retailer / E-commerce Seller</option><option>Repair or Modification Shop</option><option>Vehicle Owner</option><option>Other</option></select></label>
          {!productUrl && <label>Product URL<input name="productUrl" placeholder="Catalog link or reference" /></label>}
          <label>OE number<input name="oeNumber" /></label>
          {lighting && <>
            <label>Left- or right-hand drive<select name="driveSide"><option value="">Select if applicable</option><option>LHD</option><option>RHD</option><option>Not applicable / unsure</option></select></label>
            <label>Left / right / pair<select name="sideSet"><option value="">Select if applicable</option><option>Left</option><option>Right</option><option>Pair / full set</option><option>Not applicable / unsure</option></select></label>
          </>}
          <label className="cm-wide">Reference file <span className="cm-field-note">JPG, PNG, WebP or PDF, up to 3 MB</span><input name="productPhoto" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></label>
        </div>
      </details>
      <div className="cm-rfq-submit">
        <button className="cm-btn cm-btn-primary" type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send quote request"} <ArrowUpRight size={18} aria-hidden="true" /></button>
        <a className="cm-text-link" href="/privacy-policy">Privacy policy</a>
      </div>
      <p className={note ? `cm-form-status ${failed ? "cm-status-error" : "cm-status-success"}` : "cm-form-status"} id="rfqNote" role={failed ? "alert" : "status"}>{note}</p>
    </form>
  );
}
