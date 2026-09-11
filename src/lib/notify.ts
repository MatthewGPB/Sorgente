/**
 * One place every lead and order goes.
 *
 * Always writes a SORGENTE_LEAD line to the Vercel log.
 * If RESEND_API_KEY is set, also emails you (NOTIFY_TO, default
 * matthew@growpalmbeach.com) so nothing sits unseen in a log.
 *
 * Setup (2 minutes): resend.com -> API key -> Vercel env RESEND_API_KEY.
 * Until you verify a domain, Resend only delivers to the email you signed
 * up with — set NOTIFY_TO to that address.
 */
export async function notify(subject: string, lines: Record<string, unknown>) {
  const body = Object.entries(lines)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");

  console.log("SORGENTE_LEAD", JSON.stringify({ subject, ...lines, at: new Date().toISOString() }));

  const key = import.meta.env.RESEND_API_KEY;
  if (!key) return false;
  const to = import.meta.env.NOTIFY_TO || "matthew@growpalmbeach.com";
  const from = import.meta.env.NOTIFY_FROM || "Sorgente <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `[Sorgente] ${subject}`, text: body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const clean = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
