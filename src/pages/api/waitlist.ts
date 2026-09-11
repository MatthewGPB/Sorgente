import type { APIRoute } from "astro";
import { notify, clean } from "../../lib/notify";
export const prerender = false;

/**
 * Captures route checks and waitlist signups from the Tasting flow.
 * Logs every event; emails you for waitlist signups (a real lead).
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const type = body.type === "waitlist" ? "waitlist" : "route_check";
    const address = clean(body.address, 200);
    const phone = clean(body.phone, 30);
    if (type === "waitlist") {
      await notify(`Waitlist — ${address}`, { type, address, phone });
    } else {
      console.log("SORGENTE_LEAD", JSON.stringify({ type, address, at: new Date().toISOString() }));
    }
  } catch { /* never block the funnel */ }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
