# Happy Heals 🩹

The coolest bandages on Earth — designer adhesive bandages for kids in fun shapes and characters.

## Architecture

- Static HTML/CSS/JS deployed on **Vercel** (free tier, auto-deploys from GitHub)
- **Stripe Checkout** for payments via one serverless function (`api/checkout.js`)
- Cart is client-side JavaScript with `localStorage` persistence

## Structure

```
happy-heals/
├── index.html              ← Home page (cart + product grid)
├── dino-bandages.html      ← Dino Bandages product detail page
├── api/
│   └── checkout.js         ← Vercel serverless function (Stripe)
├── images/                 ← Logo and product photos
├── package.json            ← Declares `stripe` dependency
├── CLAUDE.md               ← Instructions for Claude Code
├── STRIPE_SETUP.md         ← Step-by-step Stripe + Vercel setup
├── .gitignore
└── README.md
```

## Setup

See [`STRIPE_SETUP.md`](./STRIPE_SETUP.md) for the full setup walkthrough.

Quick summary:
1. Create a Stripe account
2. Import this repo to Vercel
3. Set the `STRIPE_SECRET_KEY` environment variable
4. Deploy

## Local development

```
npm install
vercel dev
```

Create a local `.env` file (gitignored) with `STRIPE_SECRET_KEY=sk_test_...` for local testing.

## Adding products

Update **both** places (the SKU links them):

1. The HTML product card with a `data-add-to-cart="sku-name"` button
2. The `CATALOG` object in `api/checkout.js` with name, price (in cents), and image

## License

© 2026 Happy Heals. All rights reserved.
