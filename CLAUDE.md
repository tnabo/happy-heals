# Happy Heals — Project Instructions for Claude

This is a static ecommerce site for Happy Heals, a kids' bandage brand.
It deploys to Vercel and uses a Stripe-hosted Checkout for payments.

## Architecture

- **Static HTML/CSS/JS** in two pages: `index.html` and `dino-bandages.html`
  - CSS and JavaScript are inlined inside each HTML file — intentional, do not refactor
  - Cart is client-side JavaScript with `localStorage` persistence
- **One serverless function** at `/api/checkout.js` that creates Stripe Checkout Sessions
- **Stripe Checkout** (hosted page) handles all payment, shipping address, and tax — no card data ever touches our code
- Images live in `/images/`

## Critical security pattern

The serverless function `api/checkout.js` has a server-side `CATALOG` object that is the
**single source of truth for prices**. The browser sends SKUs and quantities only.
Stripe ALWAYS charges the price in `CATALOG`, never anything the client sends.
This prevents someone from editing prices in devtools to pay $1 for a $14 product.

## When adding or editing a product

Update **BOTH** places:
1. The HTML product card (display name, price, description)
2. The `CATALOG` object in `api/checkout.js` (price in cents, image filename)

The SKU string (e.g. `'dino-50'`) is the link between them and must match exactly.

## Catalog SKU convention

- `<product>-<sizecount>` — examples: `dino-50`, `space-24`, `responder-50`
- Variant suffixes use the count: `dino-25`, `dino-50`, `dino-100`, `dino-family`
- Cart engine in HTML and CATALOG in `api/checkout.js` must agree on SKU spelling

## Hard rules

- **Never commit** `STRIPE_SECRET_KEY` — env vars only, configured in Vercel
- **Don't refactor** to a framework (Next.js, Astro, etc.) — single HTML files are intentional
- **Don't migrate to Stripe's Products catalog** — we use `price_data` on-the-fly deliberately
- **Don't trust client-sent prices** — server CATALOG is authoritative
- **Server CATALOG is the source of truth** — if a price disagrees with the HTML, the customer was shown wrong info but charged the CATALOG price

## Local development

```
npm install
vercel dev    # runs the static site + serverless function locally
```

Set `STRIPE_SECRET_KEY` in a local `.env` file (gitignored) for local testing.

## Deployment

- Pushed to `main` branch → Vercel auto-deploys
- Environment variables managed in Vercel dashboard
- Custom domain DNS managed at registrar (NOT Vercel DNS)
- After changing env vars, must redeploy (Deployments → latest → Redeploy)

## Live vs Test mode

Stripe has Test/Sandbox and Live modes. Each has its own secret key (`sk_test_...` and `sk_live_...`).
Production uses Live. The Vercel env var `STRIPE_SECRET_KEY` is what determines which mode.
Stripe checkout page shows a black "Sandbox" badge when using a test key.
