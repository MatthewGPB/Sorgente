import type { APIRoute } from "astro";
export const prerender = false;

/**
 * Captures route checks and waitlist signups.
 * V1: writes to Vercel logs (project -> Logs, search "SORGENTE_LEAD").
 * Upgrade later: forward to a Google Sheet, Airtable, or email.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const type = body.type === "waitlist" ? "waitlist" : "route_check";
    console.log("SORGENTE_LEAD", JSON.stringify({
      type,
      address: String(body.address ?? "").slice(0, 200),
      phone: String(body.phone ?? "").slice(0, 30),
      at: new Date().toISOString(),
    }));
  } catch { /* never block the funnel */ }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
