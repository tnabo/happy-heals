# Happy Heals — Stripe + Vercel Setup

A step-by-step guide for getting checkout live, adapted from your GagRx process.
Each Happy Heals = its own Stripe account, its own Vercel project, completely isolated from GagRx.

## What you're setting up

- Move the site from GitHub Pages → Vercel (auto-deploys from your same GitHub repo)
- Add a Stripe account for Happy Heals (separate from GagRx)
- Wire the existing cart to Stripe Checkout
- Optional: custom domain (happyheals.com or whatever you buy)

The architecture is identical to what you did for GagRx — same playbook, just a different brand.

**Shipping is configured as:** FREE shipping on orders $25+, otherwise $4.99 standard.
The cart drawer shows progress toward free shipping ("Add $3.99 more for FREE shipping 🚚").
To change this, edit `FREE_SHIPPING_THRESHOLD` and the fallback amount in `api/checkout.js`.

---

## Step 1 — Create a new Stripe account for Happy Heals

Stripe accounts are per-business. Happy Heals needs its own legal entity, bank account, and branding.

1. Go to stripe.com — if you're signed in to GagRx's account, click the account name in the top-left → **Other accounts** → **Add another account**
2. Create the new account: business name "Happy Heals", country US
3. Pick **"Set up in the Dashboard"** (NOT "Set up with an AI tool")
4. You'll start in **Sandbox/Test mode** — perfect for now
5. Go to **Developers → API keys**, copy the **test secret key** (starts with `sk_test_...`). Keep this somewhere safe.

---

## Step 2 — Deploy to Vercel

1. Go to vercel.com → sign in with GitHub
2. Click **Add New → Project**
3. Find your `happy-heals` repo (the one already on GitHub Pages), click **Import**
4. **Framework Preset:** Other
5. **Build Command:** leave blank
6. **Output Directory:** leave blank
7. **Environment Variables** — add one:
   - Name: `STRIPE_SECRET_KEY`
   - Value: paste the test secret key from Step 1
8. Click **Deploy**

After ~30 seconds you'll have a live URL like `happy-heals-yourname.vercel.app`.

Every push to `main` from now on auto-deploys.

---

## Step 3 — Test checkout

1. Open your Vercel URL
2. Add some items to the cart
3. Click **Checkout** — you should get redirected to a Stripe-hosted page
4. Use Stripe's test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date (e.g., `12/30`)
   - CVC: any 3 digits (e.g., `123`)
   - ZIP: any 5 digits (e.g., `90210`)
5. Complete the purchase
6. You should land back on your site with the "Order placed!" toast
7. Check Stripe Dashboard → **Payments** (make sure "Test mode" toggle is ON to see test transactions)

If the order shows up in Stripe, everything's wired up correctly. 🎉

---

## Step 4 — Disable GitHub Pages (cleanup)

Once Vercel works, kill GitHub Pages so customers don't accidentally land on the old static version:

1. Go to your repo on GitHub → **Settings → Pages**
2. Under **Build and deployment**, change **Source** to **None**
3. Save

The `tnabo.github.io/happy-heals/` URL will stop working. Your Vercel URL becomes the source of truth.

---

## Step 5 — Custom domain (when ready)

1. Buy a domain at any registrar (Namecheap, Cloudflare, Squarespace, GoDaddy — all the same)
2. In Vercel: **Settings → Domains → Add**
   - Add both `happyheals.com` and `www.happyheals.com`
3. Use the **"DNS Records"** tab (NOT "Vercel DNS") — keep DNS at your registrar
4. At your registrar, add these records:
   - **A record** on `@` → `216.198.79.1` (verify the current Vercel IP in their dashboard)
   - **CNAME** on `www` → `cname.vercel-dns.com`
5. Delete any leftover AAAA records or old CNAMEs from GitHub Pages
6. DNS propagates in ~10 min, SSL auto-provisions 1–5 min after that
7. Vercel will automatically redirect the root domain to `www`

If you hit weird SSL errors after switching, your browser might be caching the old HTTPS setup from GitHub Pages. Fix by visiting `chrome://net-internals/#hsts`, finding your domain, deleting it. Or just test in a different browser.

---

## Step 6 — Branding on Stripe (recommended before going live)

In Stripe Dashboard:

- **Settings → Business → Branding** — upload the Happy Heals logo, set brand color (try pink `#ff6fc8`)
- **Settings → Emails** — set "From" name to "Happy Heals", reply-to email, enable customer receipts
- **Settings → Public business details** — public name, support email, support phone

This styling shows on the Stripe checkout page and on receipt emails customers get.

---

## Step 7 — Activate Stripe (going live with real money)

When you're ready to take real orders:

1. Stripe Dashboard → click the **"Activate account"** prompt
2. Fill in:
   - EIN (or SSN if sole proprietor)
   - Business address
   - Personal info (you, as the business owner)
   - Bank account for payouts
   - Statement descriptor — what shows up on customer bank statements, e.g. `HAPPYHEALS`
3. Most activations are instant. Some take 24 hours.
4. After activation, the top-right toggle switches from **Sandbox** to **Live mode**
5. Go to **Developers → API keys** → click **Reveal live secret key** → copy `sk_live_...`
6. Vercel → **Settings → Environment Variables** → edit `STRIPE_SECRET_KEY` → paste the **live key** → save
7. Redeploy (env var changes don't take effect on existing deployments):
   - **Deployments** tab → latest deployment → three-dot menu → **Redeploy**
8. Open your live site in **incognito** and start a checkout. Stripe's checkout page should NOT have a black "Sandbox" badge anymore. If it doesn't = you're LIVE.

---

## Step 8 — Smoke test with real money

Before sharing the site publicly:

1. Buy the cheapest item (`$7.99`) from yourself with a real card
2. Verify the full flow: checkout → success page → receipt email arrives → payment shows in Stripe
3. Refund yourself from the Stripe dashboard (you eat the ~62¢ fee — cost of confidence)

This catches anything that test mode can't — declined cards, real shipping address validation, real receipt emails, etc.

---

## Gotchas (from GagRx experience)

- **Sandbox badge** on Stripe checkout = env var is still the test key. Only goes away when you swap to `sk_live_...` AND redeploy.
- **HSTS cache from GitHub Pages** can cause SSL errors after switching. Fix via `chrome://net-internals/#hsts` or test in a different browser.
- **Don't use Stripe's "Add product" UI** — we use on-the-fly `price_data` in code, so the Stripe product catalog is unnecessary. Skip it.
- **`.env` and `node_modules` must be gitignored.** Already handled in `.gitignore`. Never commit the Stripe secret.
- **Env var changes need redeploy** — Vercel doesn't restart existing deployments when you change an env var.

---

## Adding new products later

Update **both** places, with the SKU matching exactly:

1. The product card in `index.html` (or `dino-bandages.html`) with a button like:
   ```html
   <button class="product-add" data-add-to-cart="new-sku-here">🛒 Add to cart</button>
   ```
2. The `CATALOG` object in `api/checkout.js`:
   ```js
   'new-sku-here': { name: 'Product Name — Size', price: 999, image: 'filename.jpg' },
   ```
   Price is in **cents** (`999` = $9.99).

Don't forget to add the image to `/images/` if it's a new product.

---

## Costs

- Vercel: **$0/mo** at this traffic level
- GitHub: **$0** (private repos work fine)
- Stripe: **$0/mo** + **2.9% + 30¢** per successful card transaction
- Domain: **~$12–25/year** at registrar
