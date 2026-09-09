import React, { useState, useEffect } from "react";

const C = {
  ink: "#16211D", bottle: "#1E3D33", bottleDeep: "#142B24",
  mist: "#EDF3F1", paper: "#FBFCFB", line: "#C9D6D1", sub: "#5B6D66",
};

// Palm Beach County (plus Jupiter Island / Hobe Sound edge)
function zipInZone(zip) {
  const z = parseInt(zip, 10);
  return (z >= 33401 && z <= 33499) || z === 33455 || z === 33475;
}
const ROUTE_DAYS = ["Tuesday", "Thursday", "Saturday"];
const DAY_INDEX = { Tuesday: 2, Thursday: 4, Saturday: 6 };

function routeFor(zip) {
  return ROUTE_DAYS[parseInt(zip, 10) % 3];
}
function nextRouteDate(dayName) {
  const min = new Date(Date.now() + 2 * 86400000);
  min.setHours(0, 0, 0, 0);
  const target = DAY_INDEX[dayName];
  const d = new Date(min);
  while (d.getDay() !== target) d.setDate(d.getDate() + 1);
  return d;
}
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
  width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: 16,
  fontFamily: "'Jost', sans-serif", border: `1px solid ${C.line}`, borderRadius: 2,
  background: "#fff", color: C.ink, outline: "none",
};
const btn = {
  background: C.bottle, color: "#fff", border: "none", borderRadius: 999,
  padding: "15px 34px", fontSize: 15, letterSpacing: "0.04em",
  fontFamily: "'Jost', sans-serif", cursor: "pointer", marginTop: 18,
};

export default function TastingFlow() {
  const [step, setStep] = useState(1); // 1 route, 1.5 waitlist-done, 2 confirm, 3 details, 4 pay
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

  // Prefill from the popup handoff (?addr=)
  useEffect(() => {
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

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "'Jost', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />

      <header style={{ padding: "26px 24px 0", maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" alt="" style={{ height: 34, width: 34 }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.bottle }}>Sorgente</span>
        </a>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px 100px" }}>

        {step === 1 && (
          <section>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(32px, 5vw, 46px)", lineHeight: 1.12, color: C.bottleDeep, margin: 0 }}>
              We serve a limited number of homes per route.
            </h1>
            <p style={{ color: C.sub, fontSize: 16, lineHeight: 1.7, marginTop: 16, fontWeight: 300 }}>
              The Tasting Case — evian, Acqua Panna, S.Pellegrino, and Saratoga in glass, $50,
              credited in full toward your first month. Check whether your street is on a route.
            </p>
            <div style={{ marginTop: 30, display: "grid", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, letterSpacing: "0.06em", color: C.bottle, marginBottom: 8 }}>STREET ADDRESS</label>
                <input
                  style={{ ...input, fontSize: 17.5, padding: "16px 18px" }}
                  placeholder="123 Ocean Blvd"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkRoute()}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, letterSpacing: "0.06em", color: C.bottle, marginBottom: 8 }}>ZIP CODE</label>
                <input
                  style={{ ...input, fontSize: 17.5, padding: "16px 18px", maxWidth: 200 }}
                  placeholder="33480"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && checkRoute()}
                />
              </div>
              <div><button style={btn} onClick={() => checkRoute()}>Check my route</button></div>
            </div>
          </section>
        )}

        {step === 2 && inZone && (
          <section>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.sub, letterSpacing: "0.14em" }}>GOOD NEWS</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(30px, 4.6vw, 42px)", lineHeight: 1.15, color: C.bottleDeep, marginTop: 10 }}>
              {streetName(street)} is on our {routeDay} route.
            </h1>
            <p style={{ color: C.sub, fontSize: 16.5, lineHeight: 1.7, marginTop: 16, fontWeight: 300 }}>
              Your Tasting Case can arrive as soon as <span style={{ color: C.bottle }}>{dateLabel}</span>.
            </p>
            <button style={btn} onClick={() => setStep(3)}>Reserve my Tasting Case</button>
          </section>
        )}

        {step === 2 && !inZone && (
          <section>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(30px, 4.6vw, 42px)", lineHeight: 1.15, color: C.bottleDeep, margin: 0 }}>
              We haven't opened your route yet.
            </h1>
            <p style={{ color: C.sub, fontSize: 16, lineHeight: 1.7, marginTop: 16, fontWeight: 300 }}>
              Leave your number and you'll be the first to know when we do.
            </p>
            <div style={{ marginTop: 24 }}>
              <input style={input} placeholder="Mobile number" value={wlPhone} inputMode="tel"
                onChange={(e) => setWlPhone(e.target.value)} />
              <button style={btn} onClick={() => {
                log({ type: "waitlist", address: `${street.trim()}, ${zip.trim()}`, phone: wlPhone });
                setStep(1.5);
              }}>Keep me posted</button>
            </div>
          </section>
        )}

        {step === 1.5 && (
          <section>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 36, color: C.bottleDeep }}>You're on the list.</h1>
            <p style={{ color: C.sub, fontSize: 16, lineHeight: 1.7, fontWeight: 300 }}>
              When your route opens, you'll hear from us first — by text, of course.
            </p>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(28px, 4.2vw, 38px)", color: C.bottleDeep, margin: 0 }}>
              A few details for {routeDay}.
            </h1>
            <div style={{ display: "grid", gap: 14, marginTop: 26 }}>
              <input style={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <input style={input} placeholder="Mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>We text delivery updates — nothing else.</div>
              </div>
              <textarea style={{ ...input, minHeight: 80, resize: "vertical" }}
                placeholder="Gate code, entry notes, preferred drop spot (optional)"
                value={gate} onChange={(e) => setGate(e.target.value)} />
            </div>
            <button style={btn} onClick={() => { setError(null); setStep(4); }}>Continue</button>
          </section>
        )}

        {step === 4 && (
          <section>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(28px, 4.2vw, 38px)", color: C.bottleDeep, margin: 0 }}>
              The Tasting Case
            </h1>
            <div style={{ borderTop: `2px solid ${C.bottle}`, marginTop: 22, paddingTop: 18, fontSize: 16, lineHeight: 2.1 }}>
              <div>evian — 750 ml glass</div>
              <div>Acqua Panna — 1 L glass</div>
              <div>S.Pellegrino — 750 ml sparkling</div>
              <div>Saratoga — 28 oz &amp; 12 oz cobalt glass</div>
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 20 }}>Delivered {dateLabel}</span>
                <span style={{ fontWeight: 500, fontSize: 20 }}>$50</span>
              </div>
            </div>
            <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.65, marginTop: 14 }}>
              Credited in full toward your first month of delivery.
            </p>
            <button style={{ ...btn, opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={pay}>
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
    </div>
  );
}
