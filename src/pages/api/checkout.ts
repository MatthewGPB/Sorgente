import type { APIRoute } from "astro";
import Stripe from "stripe";
import priceMap from "../../../stripe-prices.json";
import { zipInZone, routeFor, DAY_INDEX } from "../../lib/routes.js";

export const prerender = false;

const MIN_CASES = 5;
const ESTATE_AT = 10;

export const POST: APIRoute = async ({ request, url }) => {
  const secret = import.meta.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return json({ error: "Payments are not configured yet." }, 500);
  }
  const stripe = new Stripe(secret);

  let body: { qty?: Record<string, number>; deliveryDate?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const qty = body.qty ?? {};
  const deliveryDate = body.deliveryDate ?? "";

  // Build line items from known SKUs only; ignore anything unexpected
  const prices: Record<string, string> = priceMap.prices;
  const line_items = Object.entries(prices)
    .map(([sku, price]) => ({ price, quantity: Math.max(0, Math.floor(qty[sku] ?? 0)) }))
    .filter((li) => li.quantity > 0);

  const totalCases = line_items.reduce((s, li) => s + li.quantity, 0);
  if (totalCases < MIN_CASES) {
    return json({ error: `Deliveries begin at ${MIN_CASES} cases.` }, 400);
  }

  // Enforce the 48-hour lead AND the zip's route day server-side
  const zip = String(body.zip ?? "");
  if (!/^\d{5}$/.test(zip) || !zipInZone(zip)) {
    return json({ error: "Enter a zip code inside our delivery area." }, 400);
  }
  const routeDay = routeFor(zip);
  const d = new Date(deliveryDate + "T12:00:00");
  const minDate = new Date(Date.now() + 2 * 86400000);
  minDate.setHours(0, 0, 0, 0);
  if (isNaN(d.getTime()) || d < minDate || d.getDay() !== DAY_INDEX[routeDay]) {
    return json({ error: `Choose an upcoming ${routeDay} — that's your street's route day.` }, 400);
  }

  // Tasting conversion: $50-off-once credit via pre-filled link (?tasting50=1).
  // Stripe Checkout allows one coupon: the credit wins; if the order is ALSO
  // estate-size, metadata flags it so the 10% forever coupon gets added to the
  // subscription in the dashboard afterward.
  const tasting50 = body.tasting50 === true;
  let discounts: { coupon: string }[] = [];
  if (tasting50) {
    const CREDIT_ID = "TASTING50";
    try { await stripe.coupons.retrieve(CREDIT_ID); }
    catch {
      await stripe.coupons.create({ id: CREDIT_ID, name: "Tasting Case credit", amount_off: 5000, currency: "usd", duration: "once" });
    }
    discounts = [{ coupon: CREDIT_ID }];
  } else if (totalCases >= ESTATE_AT) {
    discounts = [{ coupon: priceMap.coupon }];
  }
  const estatePending = tasting50 && totalCases >= ESTATE_AT ? "1" : "0";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items,
      ...(discounts.length ? { discounts } : {}),
      subscription_data: {
        metadata: { first_delivery_date: deliveryDate, total_cases: String(totalCases), zip, route_day: routeDay, tasting_credit: tasting50 ? "1" : "0", estate_rate_pending: estatePending },
      },
      metadata: { first_delivery_date: deliveryDate, zip, route_day: routeDay },
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      success_url: `${site(request, url)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site(request, url)}/`,
    });
    return json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    return json({ error: "Checkout could not be started. Please try again." }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function site(request: Request, url: URL) {
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  return host.includes("localhost") ? "https://www.sorgentepb.com" : `https://${host}`;
}
