import type { APIRoute } from "astro";
import Stripe from "stripe";

export const prerender = false;

/**
 * Stripe webhook — fires when checkout completes and on each monthly renewal.
 * Setup (after first deploy):
 *   Stripe dashboard -> Developers -> Webhooks -> Add endpoint
 *   URL: https://YOUR-DOMAIN/api/webhook
 *   Events: checkout.session.completed, invoice.paid, customer.subscription.deleted
 *   Copy the signing secret (whsec_...) into Vercel env as STRIPE_WEBHOOK_SECRET
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.STRIPE_SECRET_KEY;
  const whSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) return new Response("Not configured", { status: 500 });

  const stripe = new Stripe(secret);
  const sig = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, sig, whSecret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // New customer: session.customer_details has name/email/phone,
      // session.metadata.first_delivery_date has the date they picked.
      const tag = session.metadata?.tasting === "1" ? "TASTING CASE ORDER:" : "NEW SUBSCRIPTION:";
      console.log(
        tag,
        JSON.stringify(session.metadata ?? {}),
        session.customer_details?.name,
        session.customer_details?.email,
        "first delivery:",
        session.metadata?.first_delivery_date
      );
      // TODO: send yourself a notification email / add row to a sheet.
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("RENEWAL PAID:", invoice.customer_email, invoice.id);
      // TODO: this is your monthly "pack this order" trigger.
      break;
    }
    case "customer.subscription.deleted": {
      console.log("SUBSCRIPTION CANCELLED:", event.data.object.id);
      break;
    }
  }

  return new Response("ok", { status: 200 });
};
