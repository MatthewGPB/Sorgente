import type { APIRoute } from "astro";
import Stripe from "stripe";
import { notify } from "../../lib/notify";

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
      const m = session.metadata ?? {};
      const isTasting = m.tasting === "1";
      await notify(
        isTasting ? `Tasting Case order — ${m.name || session.customer_details?.name}` : `New subscription — ${session.customer_details?.name}`,
        {
          name: m.name || session.customer_details?.name,
          phone: m.phone || session.customer_details?.phone,
          email: session.customer_details?.email,
          address: m.address || shippingLine(session),
          route_day: m.route_day,
          first_delivery: m.first_delivery_date || m.delivery_date,
          gate_notes: m.gate_notes,
          total: session.amount_total != null ? `$${(session.amount_total / 100).toFixed(2)}` : undefined,
          stripe: `https://dashboard.stripe.com/${isTasting ? "payments" : "subscriptions"}`,
        }
      );
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      // Monthly "pack this order" trigger
      await notify(`Renewal paid — ${invoice.customer_name ?? invoice.customer_email}`, {
        customer: invoice.customer_name,
        email: invoice.customer_email,
        amount: `$${((invoice.amount_paid ?? 0) / 100).toFixed(2)}`,
        invoice: invoice.hosted_invoice_url,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await notify("Subscription cancelled", { subscription: sub.id, cases: sub.metadata?.total_cases, zip: sub.metadata?.zip });
      break;
    }
  }

  return new Response("ok", { status: 200 });
};

function shippingLine(session: any): string {
  const a = session?.shipping_details?.address ?? session?.collected_information?.shipping_details?.address;
  return a ? [a.line1, a.city, a.postal_code].filter(Boolean).join(", ") : "";
}
