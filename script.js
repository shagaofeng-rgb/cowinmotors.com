let allProducts = [];
let activeFilter = "all";
const FEATURED_LIMIT = 8;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function pageName() {
  return document.body.dataset.page || "home";
}

function getParams() {
  return new URLSearchParams(window.location.search);
}

function inferBuyingPath(product) {
  const title = product.title.toLowerCase();
  if (
    title.includes("body") ||
    title.includes("kit") ||
    title.includes("paint") ||
    title.includes("titanium") ||
    title.includes("wholesale")
  ) {
    return "RFQ";
  }
  return "Direct / RFQ";
}

function categorySlug(product) {
  if ((product.category || "").includes("Lighting")) return "headlights";
  if ((product.category || "").includes("Exhaust")) return "exhaust";
  if ((product.category || "").includes("Body")) return "body-kits";
  return "products";
}

function productMatches(product) {
  const params = getParams();
  const title = product.title.toLowerCase();
  const haystack = `${product.title} ${product.category || ""}`.toLowerCase();
  const categoryParam = params.get("category") || "";
  const year = params.get("year") || "";
  const make = params.get("make") || "";
  const search = params.get("q") || "";

  const brandOk = activeFilter === "all" || title.includes(activeFilter.toLowerCase());
  const yearOk = !year || title.includes(year.toLowerCase());
  const makeOk = !make || title.includes(make.toLowerCase());
  const searchOk = !search || haystack.includes(search.toLowerCase());
  const categoryOk = !categoryParam || categorySlug(product) === categoryParam;

  if (pageName() === "headlights") return product.category === "Automotive Lighting" && brandOk && yearOk && makeOk && searchOk;
  if (pageName() === "exhaust") return product.category === "Exhaust Systems" && brandOk && yearOk && makeOk && searchOk;
  if (pageName() === "body-kits") return product.category === "Body Kits" && brandOk && yearOk && makeOk && searchOk;

  return brandOk && yearOk && makeOk && searchOk && categoryOk;
}

function productCard(product, options = {}) {
  const buyingPath = inferBuyingPath(product);
  const id = product.__id;
  return `
    <article class="product-card">
      ${product.status ? `<span class="badge">${product.status}</span>` : ""}
      <span class="quote-badge">${buyingPath}</span>
      <a class="image-wrap" href="product.html?id=${id}">
        <img src="${product.localImage}" alt="${product.title}" loading="lazy">
      </a>
      <div class="product-info">
        <h3>${product.title}</h3>
        <span class="fitment-line">${product.category || "Automotive Parts"} | Confirm fitment before order</span>
        <div class="price-row">
          <span class="price">${product.price || "Request quote"}</span>
          ${product.compareAt ? `<span class="compare">${product.compareAt}</span>` : ""}
        </div>
        <div class="product-actions">
          <a class="product-link" href="product.html?id=${id}">View details</a>
          ${options.showLive ? `<a class="quote-link" href="${product.url}" target="_blank" rel="noreferrer">Live store</a>` : ""}
          <a class="quote-link" href="quote.html?product=${encodeURIComponent(product.title)}">Request quote</a>
        </div>
      </div>
    </article>
  `;
}

function renderProductGrid() {
  const productGrid = $("#productGrid");
  const resultCount = $("#resultCount");
  if (!productGrid) return;

  const filtered = allProducts.filter(productMatches);
  const limit = pageName() === "home" ? FEATURED_LIMIT : filtered.length;
  const visible = filtered.slice(0, limit);

  productGrid.innerHTML = visible.map((product) => productCard(product, { showLive: pageName() !== "home" })).join("");

  if (resultCount) {
    if (pageName() === "home" && filtered.length > FEATURED_LIMIT) {
      resultCount.textContent = `Showing ${visible.length} selected products from ${filtered.length}.`;
    } else {
      resultCount.textContent = `${visible.length} products shown`;
    }
  }
}

function renderProductDetail() {
  const detail = $("#productDetail");
  if (!detail) return;

  const id = Number(getParams().get("id") || 0);
  const product = allProducts[id] || allProducts[0];
  if (!product) return;

  document.title = `${product.title} | Cowinmotors`;
  detail.innerHTML = `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="index.html">Home</a>
      <span>/</span>
      <a href="products.html">Products</a>
      <span>/</span>
      <span>${product.category}</span>
    </nav>
    <section class="pdp">
      <div class="pdp-media">
        <img src="${product.localImage}" alt="${product.title}">
      </div>
      <div class="pdp-copy">
        <p class="eyebrow">${product.category || "Automotive Parts"}</p>
        <h1>${product.title}</h1>
        <div class="price-row pdp-price">
          <span class="price">${product.price || "Request quote"}</span>
          ${product.compareAt ? `<span class="compare">${product.compareAt}</span>` : ""}
        </div>
        <div class="pdp-actions">
          <a class="button primary" href="quote.html?product=${encodeURIComponent(product.title)}">Request quote</a>
          <a class="button secondary" href="${product.url}" target="_blank" rel="noreferrer">Open live store product</a>
        </div>
        <dl class="spec-table">
          <div><dt>Buying path</dt><dd>${inferBuyingPath(product)}</dd></div>
          <div><dt>Fitment</dt><dd>Confirm year / make / model / trim before ordering.</dd></div>
          <div><dt>Lead time</dt><dd>Estimated before dispatch. Confirm with sales for wholesale or custom orders.</dd></div>
          <div><dt>Shipping</dt><dd>Destination, carton size, tax/VAT and customs duties should be confirmed before payment.</dd></div>
          <div><dt>QC</dt><dd>Product and packaging checks can be arranged before shipment.</dd></div>
        </dl>
      </div>
    </section>
  `;
}

function bindFilters() {
  $$(".filter-row button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".filter-row button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderProductGrid();
    });
  });
}

function bindFinder() {
  const finderForm = $("#finderForm");
  if (!finderForm) return;
  finderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const year = $("#yearSelect")?.value.trim();
    const make = $("#makeSelect")?.value.trim();
    const type = $("#typeSelect")?.value.trim();
    const search = $("#searchInput")?.value.trim();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (type === "Automotive Lighting") params.set("category", "headlights");
    if (type === "Exhaust Systems") params.set("category", "exhaust");
    if (type === "Body Kits") params.set("category", "body-kits");
    if (search) params.set("q", search);
    window.location.href = `products.html${params.toString() ? `?${params}` : ""}`;
  });
}

function bindQuoteForm() {
  const rfqForm = $("#rfqForm");
  const rfqNote = $("#rfqNote");
  if (!rfqForm) return;

  const productInput = $("#quoteProduct");
  if (productInput && getParams().get("product")) {
    productInput.value = getParams().get("product");
  }

  rfqForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (rfqNote) {
      rfqNote.textContent = "Preview only: RFQ can be connected to email, WhatsApp, CRM, or Shopline form later.";
    }
  });
}

function ensureWhatsAppFloat() {
  if ($(".whatsapp-float")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `<a class="whatsapp-float" href="https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" aria-label="Contact Cowinmotors on WhatsApp">
      <span class="whatsapp-pulse" aria-hidden="true"></span>
      <span class="whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" focusable="false"><path d="M16.01 3.2c-7.03 0-12.75 5.69-12.75 12.68 0 2.39.67 4.72 1.94 6.74L3.2 29l6.57-1.93a12.86 12.86 0 0 0 6.24 1.6c7.03 0 12.75-5.69 12.75-12.69S23.04 3.2 16.01 3.2Zm0 23.33c-1.95 0-3.86-.53-5.52-1.52l-.4-.24-3.89 1.14 1.17-3.77-.26-.41a10.5 10.5 0 0 1-1.72-5.85c0-5.82 4.76-10.55 10.62-10.55s10.62 4.73 10.62 10.55-4.76 10.65-10.62 10.65Zm5.82-7.89c-.32-.16-1.88-.92-2.17-1.02-.29-.11-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.56-.94-.83-1.58-1.86-1.77-2.17-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.7-.97-2.33-.26-.61-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.39-.29.32-1.1 1.07-1.1 2.61s1.13 3.03 1.28 3.24c.16.21 2.23 3.39 5.4 4.75.75.32 1.34.51 1.8.65.76.24 1.45.21 2 .13.61-.09 1.88-.76 2.14-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37Z" /></svg>
      </span>
      <span class="whatsapp-text">WhatsApp</span>
    </a>`
  );
}

fetch("data/site-data.json")
  .then((response) => response.json())
  .then((data) => {
    allProducts = data.products.map((product, index) => ({ ...product, __id: index }));
    renderProductGrid();
    renderProductDetail();
  })
  .catch(() => {
    const resultCount = $("#resultCount");
    if (resultCount) resultCount.textContent = "Product data could not be loaded.";
  });

bindFilters();
bindFinder();
bindQuoteForm();
ensureWhatsAppFloat();
