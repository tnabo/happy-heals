// api/checkout.js
// Vercel serverless function that creates a Stripe Checkout Session.
//
// SECURITY: the CATALOG below is the SINGLE SOURCE OF TRUTH for prices.
// The browser sends SKUs and quantities only — never trust prices from the client.
// To add or change a product, update BOTH the HTML and this CATALOG.

const Stripe = require('stripe');

const CATALOG = {
  // Dino Bandages — all size variants
  'dino-25':      { name: 'Dino Bandages — 25 ct',           price: 599,  image: 'dino.jpg' },
  'dino-50':      { name: 'Dino Bandages — 50 ct',           price: 899,  image: 'dino.jpg' },
  'dino-100':     { name: 'Dino Bandages — 100 ct',          price: 1499, image: 'dino.jpg' },
  'dino-family':  { name: 'Dino Bandages — Family Pack',     price: 3299, image: 'dino.jpg' },

  // Other product packs (single variant each, for now)
  'space-24':     { name: 'Outer Space Bandages — 24 ct',    price: 799,  image: 'outer-space.jpg' },
  'race-24':      { name: 'Race Day Bandages — 24 ct',       price: 799,  image: 'race-day.jpg' },
  'responder-50': { name: '1st Responder Bandages — 50 ct',  price: 999,  image: 'first-responder.jpg' },
  'adventure-24': { name: 'Adventure Bandages — 24 ct',      price: 799,  image: 'adventure.jpg' },
  'miracles-50':  { name: 'Little Miracles Bandages — 50 ct', price: 999, image: 'little-miracles.jpg' },
};

module.exports = async (req, res) => {
  // CORS for local dev (Vercel handles same-origin in prod automatically)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
    }
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { items, origin } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Build line items from SERVER catalog only — never trust client prices
    const line_items = [];
    for (const item of items) {
      const product = CATALOG[item.sku];
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${item.sku}` });
      }
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1 || qty > 99) {
        return res.status(400).json({ error: `Invalid quantity for ${item.sku}` });
      }
      const baseUrl = origin || `https://${req.headers.host}`;
      line_items.push({
        price_data: {
          currency: 'usd',
          unit_amount: product.price,
          product_data: {
            name: product.name,
            images: [`${baseUrl}/images/${product.image}`],
          },
        },
        quantity: qty,
      });
    }

    const baseUrl = origin || `https://${req.headers.host}`;

    // Calculate subtotal to determine shipping
    const subtotal = line_items.reduce((sum, li) => sum + (li.price_data.unit_amount * li.quantity), 0);
    const FREE_SHIPPING_THRESHOLD = 2500; // $25.00 in cents

    const shipping_options = subtotal >= FREE_SHIPPING_THRESHOLD
      ? [{
          shipping_rate_data: {
            display_name: 'FREE shipping (3–5 business days)',
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        }]
      : [{
          shipping_rate_data: {
            display_name: 'Standard shipping (3–5 business days)',
            type: 'fixed_amount',
            fixed_amount: { amount: 499, currency: 'usd' },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        }];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,

      // Where Stripe sends customers afterward
      success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,

      // Collect shipping address (US + Canada — adjust as you expand)
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },

      shipping_options,

      // Let customer add an order note
      custom_text: {
        submit: { message: 'Thanks for choosing Happy Heals! 🩹' },
      },

      // Automatic tax (optional — enable in Stripe dashboard first)
      // automatic_tax: { enabled: true },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed' });
  }
};
