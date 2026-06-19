# cowinmotors.com

Next.js website for Cowinmotors automotive headlights, exhaust systems, body kits, product detail pages, RFQ flow, support pages, and WhatsApp contact.

## Stack

- Next.js App Router
- React
- TypeScript
- Static product data from `public/data/site-data.json`
- Local assets under `public/assets`

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Routes

- `/`
- `/products`
- `/headlights`
- `/exhaust`
- `/body-kits`
- `/product/[id]`
- `/quote`
- `/support`

## Deployment

The repository is ready for Vercel Git deployment.

Recommended Vercel settings:

- Project name: `cowinmotors.com`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: leave default
- Production branch: `main`

Domain file:

```text
CNAME -> cowinmotors.com
```
