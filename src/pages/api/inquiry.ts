import type { APIRoute } from "astro";
import { notify, clean } from "../../lib/notify";
export const prerender = false;

/**
 * Standing-order inquiries from /estates and /yachts.
 * Validates, logs, and notifies. Never blocks the page on email failure.
 */
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }

  // Honeypot — bots fill every field
  if (clean(body.company, 50)) return json({ ok: true });

  const lead = {
    kind: clean(body.kind, 20) || "estate",
    name: clean(body.name, 100),
    role: clean(body.role, 60),
    phone: clean(body.phone, 30),
    email: clean(body.email, 120),
    property: clean(body.property, 160),
    cases: clean(body.cases, 40),
    notes: clean(body.notes, 800),
    page: clean(body.page, 120),
  };

  if (lead.name.length < 2) return json({ error: "Add your name." }, 400);
  if (lead.phone.replace(/\D/g, "").length < 10 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
    return json({ error: "Add a mobile number or an email so we can reach you." }, 400);
  }

  await notify(`${lead.kind === "yacht" ? "Yacht" : "Estate"} inquiry — ${lead.name}`, lead);
  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
