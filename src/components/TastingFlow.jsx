import React, { useState, useEffect, useRef } from "react";
import { zipInZone, routeFor, nextRouteDate } from "../lib/routes.js";

const C = {
  ink: "#16211D", bottle: "#1E3D33", bottleDeep: "#142B24",
  mist: "#EDF3F1", paper: "#FBFCFB", line: "#C9D6D1", sub: "#5B6D66",
};

const BOTTLES = [
  { img: "/products/evian750.jpg", name: "evian 750 ml", note: "The table bottle" },
  { img: "/products/panna1l.jpg", name: "Acqua Panna 1 L", note: "The kitchen staple" },
  { img: "/products/pellegrino750.jpg", name: "S.Pellegrino 750 ml", note: "The table sparkling" },
  { img: "/products/saratoga28.jpg", name: "Saratoga 28 oz", note: "The statement bottle" },
  { img: "/products/saratoga12.jpg", name: "Saratoga 12 oz", note: "The cocktail-hour pour" },
  { img: "/products/evian500.jpg", name: "evian 500 ml", note: "The traveler" },
];

const WATERS = [
  { w: "Featherlight", b: "Saratoga", d: "Clean, slightly sweet, crisp finish" },
  { w: "Soft", b: "Acqua Panna", d: "Velvety, naturally alkaline" },
  { w: "Balanced", b: "evian", d: "The neutral, complete house pour" },
  { w: "Full-bodied", b: "S.Pellegrino", d: "Structured, saline, fine bubbles" },
];

function streetName(address) {
  const m = address.trim().replace(/^[0-9-\s]+/, "").split(",")[0].trim();
  return m || "your street";
}
function log(payload) {
  fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

const input = {
  width: "100%", boxSizing: "border-box", padding: "15px 17px", fontSize: 16.5,
  fontFamily: "'Jost', sans-serif", border: `1px solid ${C.line}`, borderRadius: 2,
  background: "#fff", color: C.ink, outline: "none",
};
const btn = {
  background: C.bottle, color: "#fff", border: "none", borderRadius: 999,
  padding: "16px 36px", fontSize: 15.5, letterSpacing: "0.04em",
  fontFamily: "'Jost', sans-serif", cursor: "pointer",
};
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const PLACES_KEY = import.meta.env.PUBLIC_GOOGLE_PLACES_KEY;
let placesLoading = null;
function loadPlaces() {
  if (!PLACES_KEY) return Promise.reject();
  if (window.google?.maps?.places) return Promise.resolve();
  if (!placesLoading) {
    placesLoading = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_KEY}&libraries=places&loading=async`;
      sc.async = true;
      sc.onload = () => resolve();
      sc.onerror = reject;
      document.head.appendChild(sc);
    });
  }
  return placesLoading;
}

function RouteCheck({ street, zip, setStreet, setZip, onCheck, error, autoFocus, inputId }) {
  useEffect(() => {
    if (!PLACES_KEY) return;
    let ac;
    loadPlaces().then(() => {
      const el = document.getElementById(inputId);
      if (!el || !window.google?.maps?.places) return;
      ac = new window.google.maps.places.Autocomplete(el, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["address_components"],
      });
      ac.addListener("place_changed", () => {
        const comps = ac.getPlace()?.address_components ?? [];
        const get = (t) => comps.find((c) => c.types.includes(t))?.long_name ?? "";
        const num = get("street_number");
        const route = get("route");
        const z = comps.find((c) => c.types.includes("postal_code"))?.long_name ?? "";
        if (route) setStreet(`${num} ${route}`.trim());
        if (z) setZip(z.slice(0, 5));
      });
    }).catch(() => {});
    return () => { if (ac) window.google?.maps?.event?.clearInstanceListeners(ac); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputId]);
  return (
    <div>
      <div style={{ display: "grid", gap: 12 }}>
        <input style={input} placeholder="Street address — 123 Ocean Blvd" value={street}
          id={inputId} name="street-address" autoComplete="street-address"
          autoFocus={autoFocus} onChange={(e) => setStreet(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCheck()} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input style={{ ...input, width: 150 }} placeholder="Zip" inputMode="numeric" maxLength={5}
            name="postal-code" autoComplete="postal-code"
            value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && onCheck()} />
          <button style={btn} onClick={onCheck}>Check my route</button>
        </div>
      </div>
      {error && <p style={{ color: "#8C3B33", fontSize: 14.5, marginTop: 12 }}>{error}</p>}
      <p style={{ fontSize: 13, color: C.sub, marginTop: 12 }}>
        We serve a limited number of homes per route — your street decides your delivery day.
      </p>
    </div>
  );
}

export default function TastingFlow() {
  const [step, setStep] = useState(1); // 1 landing, 1.5 waitlist-done, 2 confirm, 3 details, 4 pay
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [inZone, setInZone] = useState(null);
  const [routeDay, setRouteDay] = useState(null);
  const [firstDate, setFirstDate] = useState(null);
  const [wlPhone, setWlPhone] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gate, setGate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    try { window.fbq && window.fbq("track", "ViewContent", { content_name: "Tasting Case", value: 50, currency: "USD" }); } catch {}
    const a = new URLSearchParams(window.location.search).get("addr");
    if (a) {
      const m = a.match(/\b(3\d{4})\b/);
      const st = m ? a.replace(m[1], "").replace(/[,\s]+$/, "").trim() : a.trim();
      setStreet(st);
      if (m) setZip(m[1]);
      checkRoute(st, m ? m[1] : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== 1) window.scrollTo({ top: 0 });
  }, [step]);

  function checkRoute(st, zp) {
    const a = (st ?? street).trim();
    const z = (zp ?? zip).trim();
    if (a.length < 4) { setError("Enter your street address — like 123 Ocean Blvd."); return; }
    if (!/^\d{5}$/.test(z)) { setError("Enter your 5-digit zip code."); return; }
    setError(null);
    log({ type: "route_check", address: `${a}, ${z}` });
    if (zipInZone(z)) {
      const day = routeFor(z);
      setRouteDay(day);
      setFirstDate(nextRouteDate(day));
      setInZone(true);
    } else {
      setInZone(false);
    }
    setStep(2);
  }

  async function pay() {
    if (name.trim().length < 2) { setError("Add your name."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("Add a mobile number — it's how we coordinate delivery."); return; }
    setError(null);
    setBusy(true);
    try { window.fbq && window.fbq("track", "InitiateCheckout", { value: 50, currency: "USD" }); } catch {}
    try { window.gtag && window.gtag("event", "begin_checkout", { value: 50, currency: "USD" }); } catch {}
    try {
      const res = await fetch("/api/tasting-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: `${street.trim()}, ${zip.trim()}`, name, phone, gate,
          routeDay, deliveryDate: firstDate.toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout could not be started.");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const dateLabel = firstDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const checkProps = { street, zip, setStreet, setZip, onCheck: () => checkRoute(), error };

  return (
    <div ref={topRef} style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "'Jost', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />

      <header style={{ padding: "26px 24px 0", maxWidth: 1080, margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" alt="" style={{ height: 34, width: 34 }} />
          <span style={{ ...serif, fontSize: 26, fontWeight: 600, color: C.bottle }}>Sorgente</span>
        </a>
      </header>

      {step === 1 && (
        <main>
          {/* Hero: the product + the check, together */}
          <section style={{ maxWidth: 1080, margin: "0 auto", padding: "52px 24px 64px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 52, alignItems: "center" }}>
              <div>
                <div style={{ ...serif, fontSize: 15, color: C.sub, letterSpacing: "0.16em" }}>THE TASTING CASE — $50</div>
                <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(34px, 4.6vw, 52px)", lineHeight: 1.1, margin: "10px 0 0", color: C.bottleDeep }}>
                  Six of the world's finest waters, at your door.
                </h1>
                <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.sub, marginTop: 18, fontWeight: 300 }}>
                  evian, Acqua Panna, S.Pellegrino, and Saratoga — curated like a flight,
                  delivered on your street's route day. It's the first delivery of a monthly
                  service that stocks your home with fine water — and the $50 comes back as
                  credit, so if you continue, the tasting was free.
                </p>
                <div style={{ marginTop: 26 }}>
                  <RouteCheck {...checkProps} inputId="route-street-hero" autoFocus={false} />
                  <p style={{ fontSize: 13.5, marginTop: 14 }}>
                    <a href="/#order" style={{ color: C.sub, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}>
                      Already know your waters? Skip the tasting — start monthly delivery →
                    </a>
                  </p>
                </div>
              </div>
              <img src="/collection.jpg" alt="The six bottles of the Sorgente Tasting Case"
                style={{ width: "100%", borderRadius: 2, display: "block", boxShadow: "0 24px 60px rgba(20,43,36,0.12)" }} />
            </div>
          </section>

          {/* What's inside */}
          <section style={{ background: C.mist, padding: "64px 24px" }}>
            <div style={{ maxWidth: 1080, margin: "0 auto" }}>
              <div style={{ ...serif, fontSize: 30, fontWeight: 500, color: C.bottleDeep }}>Inside the case</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginTop: 26 }}>
                {BOTTLES.map((b) => (
                  <div key={b.name} style={{ background: "#fff", padding: 12 }}>
                    <img src={b.img} alt={b.name} loading="lazy"
                      style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                    <div style={{ ...serif, fontSize: 17, fontWeight: 600, color: C.bottle, marginTop: 10 }}>{b.name}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{b.note}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 30 }}>
                {WATERS.map((x) => (
                  <div key={x.b} style={{ borderTop: `2px solid ${C.bottle}`, paddingTop: 12 }}>
                    <div style={{ ...serif, fontSize: 13.5, color: C.sub, letterSpacing: "0.14em", textTransform: "uppercase" }}>{x.w}</div>
                    <div style={{ ...serif, fontSize: 19, fontWeight: 600, color: C.bottle }}>{x.b}</div>
                    <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4 }}>{x.d}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: C.sub, marginTop: 22, fontWeight: 300, maxWidth: 620 }}>
                Still water has terroir — every spring carries the rock it rose through.
                The case spans the whole spectrum, featherlight to full-bodied, so your
                table finds its favorites.
              </p>
            </div>
          </section>

          {/* How the $50 comes back */}
          <section style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px" }}>
            <div style={{ ...serif, fontSize: 30, fontWeight: 500, color: C.bottleDeep }}>How the tasting works</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32, marginTop: 28 }}>
              {[
                ["01", "Taste all six", "Your case arrives on your route day, chilled. Take the week — table, kitchen, poolside."],
                ["02", "Text us your favorites", "Reply to our delivery text at (561) 401-0695. Two words is enough."],
                ["03", "We compose your case", "Your monthly delivery, built around your favorites — from $250/month, with the $50 credited to your first invoice."],
              ].map(([n, t, d]) => (
                <div key={n}>
                  <div style={{ ...serif, fontSize: 15, color: C.sub, letterSpacing: "0.14em" }}>{n}</div>
                  <div style={{ ...serif, fontSize: 21, fontWeight: 600, color: C.bottle, marginTop: 6 }}>{t}</div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.sub, marginTop: 8, fontWeight: 300 }}>{d}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14.5, color: C.sub, marginTop: 20, fontWeight: 300 }}>
              Keep it a one-time case if you like — no obligation, no follow-up beyond one text.
            </p>
          </section>

          {/* The service behind the case */}
          <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 72px" }}>
            <div style={{ ...serif, fontSize: 30, fontWeight: 500, color: C.bottleDeep }}>
              What you're tasting your way into
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.sub, maxWidth: 620, marginTop: 12, fontWeight: 300 }}>
              Sorgente is a monthly water service for Palm Beach homes. Your cases arrive on
              your street's route day — carried in, put away, empty glass taken — and pause
              whenever you travel. The Tasting Case is how homes find their mix.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}`, marginTop: 30 }}>
              {[
                ["The Couple", "5 cases · $250/mo", "Still water for two — table and kitchen, every day."],
                ["The Household", "10 cases · $450/mo", "Family, guests, entertaining — the full spectrum at the estate rate.", true],
                ["The Estate", "20+ cases · custom", "Main house, guest house, staff, events — composed with you."],
              ].map(([t, pr, d, popular]) => (
                <div key={t} style={{ background: popular ? C.mist : "#fff", padding: "28px 26px" }}>
                  {popular && <div style={{ fontSize: 11.5, letterSpacing: "0.12em", color: C.bottle, marginBottom: 8 }}>MOST HOMES</div>}
                  <div style={{ ...serif, fontSize: 23, fontWeight: 600, color: C.bottle }}>{t}</div>
                  <div style={{ fontSize: 15, color: C.ink, marginTop: 6 }}>{pr}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: C.sub, marginTop: 8, fontWeight: 300 }}>{d}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 16, fontWeight: 300 }}>
              Begin with the Tasting Case and your first month arrives $50 lighter.
            </p>
          </section>

          {/* Founder trust */}
          <section style={{ background: C.mist, padding: "64px 24px" }}>
            <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 44, alignItems: "center" }}>
              <img src="/founder.jpg" alt="Matthew, founder of Sorgente"
                style={{ width: "100%", maxWidth: 300, margin: "0 auto", display: "block", borderRadius: 2, boxShadow: "0 18px 44px rgba(20,43,36,0.18)" }} />
              <div>
                <div style={{ ...serif, fontSize: 26, fontWeight: 500, color: C.bottleDeep, lineHeight: 1.25 }}>
                  Delivered by the founder, not a fleet.
                </div>
                <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.ink, marginTop: 14, fontWeight: 300 }}>
                  I'm Matthew — an Ironman, which means I take hydration more seriously than
                  is strictly reasonable. I carry every case in myself, put it where you keep
                  your water, and take the empty glass when I go.
                </p>
                <p style={{ fontSize: 14, color: C.sub, marginTop: 14 }}>— Matthew, founder · Ironman Florida finisher</p>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 100px" }}>
            <div style={{ ...serif, fontSize: "clamp(28px, 4.4vw, 40px)", fontWeight: 500, color: C.bottleDeep, lineHeight: 1.15 }}>
              See when your street's route runs.
            </div>
            <div style={{ marginTop: 24 }}>
              <RouteCheck {...checkProps} inputId="route-street-footer" autoFocus={false} />
            </div>
          </section>
        </main>
      )}

      {step !== 1 && (
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px 100px" }}>
          {step === 2 && inZone && (
            <section>
              <div style={{ ...serif, fontSize: 15, color: C.sub, letterSpacing: "0.14em" }}>GOOD NEWS</div>
              <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(30px, 4.6vw, 42px)", lineHeight: 1.15, color: C.bottleDeep, marginTop: 10 }}>
                {streetName(street)} is on our {routeDay} route.
              </h1>
              <p style={{ color: C.sub, fontSize: 16.5, lineHeight: 1.7, marginTop: 16, fontWeight: 300 }}>
                Your Tasting Case can arrive as soon as <span style={{ color: C.bottle }}>{dateLabel}</span> — chilled, carried in, six waters. If you continue monthly, this becomes your standing delivery day.
              </p>
              <button style={{ ...btn, marginTop: 22 }} onClick={() => setStep(3)}>Reserve my Tasting Case</button>
            </section>
          )}

          {step === 2 && !inZone && (
            <section>
              <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(30px, 4.6vw, 42px)", lineHeight: 1.15, color: C.bottleDeep, margin: 0 }}>
                We haven't opened your route yet.
              </h1>
              <p style={{ color: C.sub, fontSize: 16, lineHeight: 1.7, marginTop: 16, fontWeight: 300 }}>
                Leave your number and you'll be the first to know when we do.
              </p>
              <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
                <input style={input} placeholder="Mobile number" inputMode="tel" value={wlPhone}
                  onChange={(e) => setWlPhone(e.target.value)} />
                <div><button style={btn} onClick={() => {
                  log({ type: "waitlist", address: `${street.trim()}, ${zip.trim()}`, phone: wlPhone });
                  setStep(1.5);
                }}>Keep me posted</button></div>
              </div>
            </section>
          )}

          {step === 1.5 && (
            <section>
              <h1 style={{ ...serif, fontWeight: 500, fontSize: 36, color: C.bottleDeep }}>You're on the list.</h1>
              <p style={{ color: C.sub, fontSize: 16, lineHeight: 1.7, fontWeight: 300 }}>
                When your route opens, you'll hear from us first — by text, of course.
              </p>
            </section>
          )}

          {step === 3 && (
            <section>
              <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(28px, 4.2vw, 38px)", color: C.bottleDeep, margin: 0 }}>
                A few details for {routeDay}.
              </h1>
              <div style={{ display: "grid", gap: 14, marginTop: 26 }}>
                <input style={input} placeholder="Name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                <div>
                  <input style={input} placeholder="Mobile" name="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>We text delivery updates — nothing else.</div>
                </div>
                <textarea style={{ ...input, minHeight: 80, resize: "vertical" }}
                  placeholder="Gate code, entry notes, preferred drop spot (optional)"
                  value={gate} onChange={(e) => setGate(e.target.value)} />
              </div>
              <button style={{ ...btn, marginTop: 22 }} onClick={() => { setError(null); setStep(4); }}>Continue</button>
            </section>
          )}

          {step === 4 && (
            <section>
              <h1 style={{ ...serif, fontWeight: 500, fontSize: "clamp(28px, 4.2vw, 38px)", color: C.bottleDeep, margin: 0 }}>
                The Tasting Case
              </h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 22 }}>
                {BOTTLES.map((b) => (
                  <img key={b.name} src={b.img} alt={b.name}
                    style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block", borderRadius: 2 }} />
                ))}
              </div>
              <div style={{ borderTop: `2px solid ${C.bottle}`, marginTop: 22, paddingTop: 16, fontSize: 15.5, lineHeight: 1.9 }}>
                <div>evian 750 ml &amp; 500 ml · Acqua Panna 1 L · S.Pellegrino sparkling · Saratoga 28 oz &amp; 12 oz</div>
                <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...serif, fontWeight: 600, fontSize: 20 }}>Delivered {dateLabel}</span>
                  <span style={{ fontWeight: 500, fontSize: 20 }}>$50</span>
                </div>
              </div>
              <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.65, marginTop: 14 }}>
                Credited in full toward your first month of delivery.
              </p>
              <button style={{ ...btn, marginTop: 20, opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={pay}>
                {busy ? "Opening secure checkout…" : "Reserve for $50"}
              </button>
            </section>
          )}

          {error && <p style={{ color: "#8C3B33", fontSize: 14.5, marginTop: 16 }}>{error}</p>}

          {step >= 2 && step !== 1.5 && (
            <button onClick={() => setStep(step === 2 ? 1 : step - 1)}
              style={{ background: "none", border: "none", color: C.sub, fontSize: 13.5, marginTop: 34, cursor: "pointer", fontFamily: "'Jost', sans-serif", padding: 0 }}>
              ← Back
            </button>
          )}
        </main>
      )}
    </div>
  );
}
