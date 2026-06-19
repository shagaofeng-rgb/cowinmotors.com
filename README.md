# cowinmotors.com

Static multi-page website for Cowinmotors automotive headlights, exhaust systems, body kits, product detail pages, RFQ flow, support pages, and WhatsApp contact.

## Local Preview

```bash
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/
```

## Pages

- `index.html`
- `products.html`
- `headlights.html`
- `exhaust.html`
- `body-kits.html`
- `product.html?id=0`
- `quote.html`
- `support.html`

## Deployment Notes

This is a static website. It can be deployed to:

- Nginx / Apache server
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

For GitHub Pages, keep `CNAME` set to:

```text
cowinmotors.com
```

For Nginx, upload all files in this directory to the web root for `cowinmotors.com`.
