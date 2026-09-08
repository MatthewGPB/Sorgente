# Sorgente — private water delivery

Astro site + Stripe subscriptions. Order page with case picker, estate-rate
pricing, 48-hour delivery calendar; checkout via Stripe; webhook records orders.

## Deploy (one time)

1. Push this folder to a new GitHub repo.
2. vercel.com -> Add New Project -> import the repo. Astro is auto-detected. Deploy.
3. Vercel -> Project -> Settings -> Environment Variables, add:
   - STRIPE_SECRET_KEY = sk_live_... (from Stripe dashboard, keep secret)
   - STRIPE_WEBHOOK_SECRET = whsec_... (created in step 4)
4. Stripe dashboard -> Developers -> Webhooks -> Add endpoint:
   - URL: https://YOUR-DOMAIN/api/webhook
   - Events: checkout.session.completed, invoice.paid, customer.subscription.deleted
   - Copy the signing secret into the Vercel env var above, then redeploy.
5. Stripe dashboard -> Settings -> Billing -> Customer portal: turn on, add logo.
6. Point your domain at Vercel (Project -> Settings -> Domains).

## Where things live

- src/components/OrderPage.jsx — the whole order page (SKUs, prices, calendar)
- src/pages/api/checkout.ts   — creates the Stripe Checkout session
- src/pages/api/webhook.ts    — new-order + renewal notifications (add email later)
- stripe-prices.json          — live Stripe price IDs + estate coupon

## Changing prices

Create the new price in Stripe, paste its price_... id into stripe-prices.json,
and update BASE_PRICE / TIER_PRICE in OrderPage.jsx to match. Push to deploy.
