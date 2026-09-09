import type { APIRoute } from "astro";
import Stripe from "stripe";
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.STRIPE_SECRET_KEY;
  if (!secret) return json({ error: "Payments are not configured yet." }, 500);
  const stripe = new Stripe(secret);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const clean = (v: unknown, n: number) => String(v ?? "").slice(0, n);
  const meta = {
    tasting: "1",
    name: clean(body.name, 100),
    phone: clean(body.phone, 30),
    address: clean(body.address, 200),
    gate_notes: clean(body.gate, 300),
    route_day: clean(body.routeDay, 12),
    delivery_date: clean(body.deliveryDate, 12),
  };
  if (meta.name.length < 2 || meta.phone.replace(/\D/g, "").length < 10) {
    return json({ error: "Name and mobile number are required." }, 400);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 5000,
          product_data: {
            name: "The Tasting Case",
            description: "Six bottles — evian 750ml & 500ml · Acqua Panna 1L · S.Pellegrino sparkling · Saratoga 28oz & 12oz — credited in full toward your first month of delivery.",
          },
        },
      }],
      metadata: meta,
      payment_intent_data: { metadata: meta },
      success_url: `${site(request)}/success?tasting=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site(request)}/tasting`,
    });
    return json({ url: session.url });
  } catch (err: any) {
    console.error("Tasting checkout error:", err.message);
    return json({ error: "Checkout could not be started. Please try again." }, 500);
  }
};

function site(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? new URL(request.url).host;
  return host.includes("localhost") ? "https://www.sorgentepb.com" : `https://${host}`;
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
