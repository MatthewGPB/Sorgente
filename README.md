# Sorgente — private water delivery

Astro site + Stripe subscriptions. Order page with case picker, estate-rate
pricing, 48-hour delivery calendar; checkout via Stripe; webhook records orders.

## Deploy (one time)

1. Push this folder to a new GitHub repo.
2. vercel.com -> Add New Project -> import the repo. Astro is auto-detected. Deploy.
3. Vercel -> Project -> Settings -> Environment Variables, add:
   - STRIPE_SECRET_KEY = sk_live_... (from Stripe dashboard, keep secret)
   - STRIPE_WEBHOOK_SECRET = whsec_... (created in step 4)
   - RESEND_API_KEY = re_... (optional but recommended — emails you every
     lead, order, renewal, and cancellation; without it they only go to
     Vercel logs, search "SORGENTE_LEAD")
   - NOTIFY_TO = the email you want notified (default matthew@growpalmbeach.com;
     until you verify a domain in Resend it must be your Resend signup email)
   - NOTIFY_FROM = "Sorgente <hello@yourdomain>" once a domain is verified
4. Stripe dashboard -> Developers -> Webhooks -> Add endpoint:
   - URL: https://YOUR-DOMAIN/api/webhook
   - Events: checkout.session.completed, invoice.paid, customer.subscription.deleted
   - Copy the signing secret into the Vercel env var above, then redeploy.
5. Stripe dashboard -> Settings -> Billing -> Customer portal: turn on, add logo.
6. Point your domain at Vercel (Project -> Settings -> Domains).

## Where things live

- src/components/OrderPage.jsx — the home/order page (SKUs, prices, calendar)
- src/components/TastingFlow.jsx — the $50 Tasting Case funnel (/tasting)
- src/pages/estates.astro       — house-manager / family-office landing + proposal form
- src/pages/yachts.astro        — captain / stew provisioning landing + quote form
- src/pages/faq.astro           — objections answered; FAQPage schema for Google
- src/layouts/Base.astro        — shared head/nav/footer for the static pages
- src/lib/notify.ts             — every lead + order goes through here (log + email)
- src/pages/api/inquiry.ts      — proposal/quote form handler
- src/lib/routes.js             — zip -> route day; bump ROUTE_TAKEN as homes sign
- src/pages/api/checkout.ts   — creates the Stripe Checkout session
- src/pages/api/webhook.ts    — new-order + renewal notifications (add email later)
- stripe-prices.json          — live Stripe price IDs + estate coupon

## Changing prices

Create the new price in Stripe, paste its price_... id into stripe-prices.json,
and update BASE_PRICE / TIER_PRICE in OrderPage.jsx to match. Push to deploy.
