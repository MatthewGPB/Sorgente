import React, { useState, useMemo } from "react";

// ————— Design tokens —————
// Palette: glass green + cool water tints, luxury coastal
const C = {
  ink: "#16211D",
  bottle: "#1E3D33",
  bottleDeep: "#142B24",
  mist: "#EDF3F1",
  aqua: "#DDE9E5",
  paper: "#FBFCFB",
  line: "#C9D6D1",
  sub: "#5B6D66",
};

const FOUNDER_PHOTO = "/founder.jpg";

const SKUS = [
  {
    id: "evian750",
    brand: "evian",
    name: "Natural Spring Water",
    detail: "750 ml \u00b7 12 bottles",
    origin: "French Alps",
    note: "The table bottle",
    material: "Glass",
    bottle: { shape: "evianGlass" },
  },
  {
    id: "panna1l",
    brand: "Acqua Panna",
    name: "Toscana Still Water",
    detail: "1 L \u00b7 12 bottles",
    origin: "Tuscany, Italy",
    note: "The kitchen staple",
    material: "Glass",
    bottle: { shape: "panna" },
  },
  {
    id: "pellegrino750",
    brand: "S.Pellegrino",
    name: "Sparkling Mineral Water",
    detail: "750 ml \u00b7 12 bottles",
    origin: "San Pellegrino Terme, Italy",
    note: "The table sparkling",
    material: "Glass",
    bottle: { shape: "pellegrino" },
  },
  {
    id: "saratoga28",
    brand: "Saratoga",
    name: "Still Spring Water",
    detail: "28 oz \u00b7 12 bottles",
    origin: "Saratoga Springs, NY",
    note: "The statement bottle",
    material: "Glass",
    bottle: { shape: "saratoga", scale: 1 },
  },
  {
    id: "saratoga12",
    brand: "Saratoga",
    name: "Spring Water",
    detail: "12 oz \u00b7 24 bottles",
    origin: "Saratoga Springs, NY",
    note: "The cocktail-hour pour",
    material: "Glass",
    bottle: { shape: "saratoga", scale: 0.68 },
  },
  {
    id: "evian500",
    brand: "evian",
    name: "Natural Spring Water",
    detail: "500 ml \u00b7 24 bottles",
    origin: "French Alps",
    note: "Fridge, car & gym",
    material: "Plastic",
    bottle: { shape: "plastic" },
  },
];

const BASE_PRICE = 50;
const TIER_PRICE = 45;
const TIER_AT = 10;
const MIN_CASES = 5;

function fmt(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ————— Calendar helpers —————
const DAY_MS = 86400000;
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function WaterDeliverySite() {
  const today = startOfDay(new Date());
  const minDate = new Date(today.getTime() + 2 * DAY_MS); // 48-hour lead

  const [qty, setQty] = useState(() => Object.fromEntries(SKUS.map((s) => [s.id, 0])));
  const [viewMonth, setViewMonth] = useState(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const totalCases = SKUS.reduce((sum, s) => sum + qty[s.id], 0);
  const perCase = totalCases >= TIER_AT ? TIER_PRICE : BASE_PRICE;
  const total = totalCases * perCase;
  const savings = totalCases >= TIER_AT ? totalCases * (BASE_PRICE - TIER_PRICE) : 0;
  const belowMin = totalCases > 0 && totalCases < MIN_CASES;
  const ready = totalCases >= MIN_CASES && selected;

  const change = (id, delta) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, q[id] + delta) }));

  // Build the visible month grid
  const grid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const days = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    return cells;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const canGoBack =
    viewMonth.getFullYear() > minDate.getFullYear() ||
    (viewMonth.getFullYear() === minDate.getFullYear() && viewMonth.getMonth() > minDate.getMonth());

  const selLabel = selected
    ? selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "'Jost', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Masthead */}
      <header style={{ padding: "26px 24px 0", maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, letterSpacing: "0.02em", color: C.bottle }}>
          Sorgente
        </div>
        <div style={{ fontSize: 13, color: C.sub, letterSpacing: "0.06em" }}>Palm Beach · Jupiter Island · Manalapan</div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px 56px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(38px, 5.5vw, 64px)", lineHeight: 1.08, maxWidth: 640, margin: 0, color: C.bottleDeep }}>
          Fine water, in glass, stocked in your home every month.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: C.sub, maxWidth: 520, marginTop: 22, fontWeight: 300 }}>
          Still and sparkling — evian, Acqua Panna, S.Pellegrino, and Saratoga by the case,
          delivered on your schedule. We carry it in, put it away, and take the empty glass with us.
          One monthly delivery, paused whenever you travel.
        </p>
      </section>

      {/* Order builder */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 100px", display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}` }}>
          {SKUS.map((s) => (
            <div key={s.id} style={{ background: qty[s.id] > 0 ? C.mist : "#fff", padding: "26px 24px", transition: "background .25s", display: "flex", flexDirection: "column" }}>
              <Bottle spec={s.bottle} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 16 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.bottle }}>{s.brand}</div>
                <span style={{
                  fontSize: 11.5, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 999,
                  border: `1px solid ${s.material === "Glass" ? C.bottle : C.line}`,
                  color: s.material === "Glass" ? C.bottle : C.sub,
                }}>{s.material}</span>
              </div>
              <div style={{ fontSize: 15, marginTop: 2 }}>{s.name}</div>
              <div style={{ fontSize: 13.5, color: C.sub, marginTop: 8 }}>{s.detail}</div>
              <div style={{ fontSize: 13.5, color: C.sub }}>{s.origin} — {s.note}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto", paddingTop: 20 }}>
                <button aria-label={`Remove a case of ${s.brand} ${s.detail}`} onClick={() => change(s.id, -1)}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.line}`, background: "#fff", fontSize: 18, cursor: "pointer", color: C.bottle }}>−</button>
                <div style={{ fontSize: 20, minWidth: 70, textAlign: "center" }}>
                  {qty[s.id]} <span style={{ fontSize: 13, color: C.sub }}>{qty[s.id] === 1 ? "case" : "cases"}</span>
                </div>
                <button aria-label={`Add a case of ${s.brand} ${s.detail}`} onClick={() => change(s.id, 1)}
                  style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: C.bottle, color: "#fff", fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: C.sub, margin: "-26px 0 0", lineHeight: 1.6 }}>
          All bottles are glass except the 500 ml evian, which is plastic — the practical choice for cars, boats, and poolside where glass isn't welcome.
        </p>

        {/* Calculator + calendar row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "start" }}>

          {/* Running total */}
          <div style={{ borderTop: `2px solid ${C.bottle}`, paddingTop: 22 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.bottle, fontWeight: 600 }}>Your monthly delivery</div>
            <div style={{ marginTop: 18, fontSize: 15.5, lineHeight: 2 }}>
              <Row label="Cases" value={totalCases === 0 ? "—" : `${totalCases}`} />
              <Row label="Per case" value={totalCases === 0 ? "—" : fmt(perCase)} />
              {savings > 0 && <Row label="Estate rate (10+ cases)" value={`− ${fmt(savings)}`} accent />}
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 22 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Monthly total</span>
                <span style={{ fontWeight: 500 }}>{totalCases === 0 ? "—" : fmt(total)}</span>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.65, marginTop: 14 }}>
              {belowMin
                ? `Deliveries begin at ${MIN_CASES} cases — add ${MIN_CASES - totalCases} more.`
                : totalCases >= TIER_AT
                ? "Estate rate applied. Delivery, in-home stocking, and glass pickup included."
                : totalCases > 0
                ? `Ten or more cases unlocks the estate rate of ${fmt(TIER_PRICE)} per case.`
                : "Choose your cases above to see your monthly total."}
            </p>
          </div>

          {/* Calendar */}
          <div style={{ borderTop: `2px solid ${C.bottle}`, paddingTop: 22 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.bottle, fontWeight: 600 }}>First delivery date</div>
            <p style={{ fontSize: 13.5, color: C.sub, marginTop: 6 }}>We prepare each order by hand — the earliest delivery is two days out.</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button aria-label="Previous month" disabled={!canGoBack} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                style={{ background: "none", border: "none", fontSize: 18, cursor: canGoBack ? "pointer" : "default", color: canGoBack ? C.bottle : C.line }}>‹</button>
              <div style={{ fontSize: 15, letterSpacing: "0.03em" }}>{monthLabel}</div>
              <button aria-label="Next month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.bottle }}>›</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 12, fontSize: 12.5, color: C.sub, textAlign: "center" }}>
              {["S", "M", "T", "W", "T2", "F", "S2"].map((d) => (
                <div key={d}>{d.replace("2", "")}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 6 }}>
              {grid.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const disabled = d < minDate;
                const isSel = selected && d.getTime() === selected.getTime();
                return (
                  <button
                    key={d.getTime()}
                    disabled={disabled}
                    onClick={() => setSelected(d)}
                    style={{
                      aspectRatio: "1", borderRadius: "50%", fontSize: 14, fontFamily: "'Jost', sans-serif",
                      border: isSel ? "none" : "1px solid transparent",
                      background: isSel ? C.bottle : "none",
                      color: disabled ? C.line : isSel ? "#fff" : C.ink,
                      cursor: disabled ? "default" : "pointer",
                      textDecoration: disabled ? "line-through" : "none",
                      transition: "background .15s",
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            {selLabel && (
              <p style={{ fontSize: 14, marginTop: 12, color: C.bottle }}>
                First delivery {selLabel}, then monthly.
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div>
          <button
            disabled={!ready || busy}
            onClick={async () => {
              setBusy(true);
              setCheckoutError(null);
              try {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ qty, deliveryDate: selected.toISOString().slice(0, 10) }),
                });
                const data = await res.json();
                if (!res.ok || !data.url) throw new Error(data.error || "Checkout could not be started.");
                window.location.href = data.url;
              } catch (e) {
                setCheckoutError(e.message);
                setBusy(false);
              }
            }}
            style={{
              background: ready ? C.bottle : C.aqua,
              color: ready ? "#fff" : C.sub,
              border: "none", borderRadius: 999, padding: "18px 44px",
              fontSize: 15.5, letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif",
              cursor: ready ? "pointer" : "default", transition: "background .2s",
            }}
          >
            {busy ? "Opening secure checkout…" : ready ? `Continue to payment — ${fmt(total)}/month` : "Choose cases and a delivery date"}
          </button>
          {checkoutError && (
            <p style={{ fontSize: 13.5, color: "#8C3B33", marginTop: 12 }}>{checkoutError} Try again, or write hello@sorgentepb.com.</p>
          )}
          <p style={{ fontSize: 12.5, color: C.sub, marginTop: 12 }}>
            Billed monthly via Stripe secure checkout. Pause for travel or cancel anytime with two days' notice.
          </p>
        </div>
      </section>

      {/* Service area map */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 90px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, color: C.bottleDeep, lineHeight: 1.25 }}>
              Where we deliver
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: C.sub, marginTop: 16, fontWeight: 300 }}>
              Sorgente serves Palm Beach County — from Jupiter Island and Juno Beach
              down through Palm Beach, Manalapan, and Boca Raton. Marinas and yacht
              provisioning included.
            </p>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 14 }}>
              Outside the area? Write us — larger standing orders travel farther.
            </p>
          </div>

          <svg viewBox="0 0 360 460" role="img" aria-label="Map of South Florida with the Palm Beach County service area highlighted"
            style={{ width: "100%", maxWidth: 400, margin: "0 auto", display: "block" }}>
            {/* Ocean */}
            <rect x="0" y="0" width="360" height="460" fill="#EDF3F1" />
            {/* Florida mainland (stylized SE coast, Stuart to Homestead) */}
            <path
              d="M 20 0 L 232 0
                 C 236 22 240 44 238 66
                 C 236 92 240 118 246 142
                 C 252 168 254 196 252 224
                 C 250 254 246 284 238 312
                 C 230 342 220 370 206 396
                 C 192 422 176 444 158 460
                 L 20 460 Z"
              fill="#FFFFFF" stroke="#C9D6D1" strokeWidth="1.5" />
            {/* Lake Okeechobee */}
            <ellipse cx="78" cy="118" rx="34" ry="30" fill="#DDE9E5" />
            {/* Palm Beach County band (Jupiter ~ y46 to Boca ~ y210) */}
            <path
              d="M 20 46 L 234 46
                 C 233 66 236 88 241 110
                 C 247 134 250 160 250 186
                 C 250 194 249 202 249 210
                 L 20 210 Z"
              fill="#1E3D33" opacity="0.92" />
            {/* County label */}
            <text x="96" y="140" fill="#FFFFFF" fontFamily="Cormorant Garamond, serif" fontSize="21" fontStyle="italic">Palm Beach</text>
            <text x="106" y="162" fill="#FFFFFF" fontFamily="Cormorant Garamond, serif" fontSize="21" fontStyle="italic">County</text>
            {/* Served towns along the coast */}
            {[
              { y: 58, label: "Jupiter Island" },
              { y: 84, label: "Juno Beach" },
              { y: 122, label: "Palm Beach" },
              { y: 152, label: "Manalapan" },
              { y: 196, label: "Boca Raton" },
            ].map((t) => (
              <g key={t.label}>
                <circle cx={t.y < 100 ? 236 + (t.y - 46) * 0.1 : 244} cy={t.y} r="3.4" fill="#FFFFFF" />
                <circle cx={t.y < 100 ? 236 + (t.y - 46) * 0.1 : 244} cy={t.y} r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" values="3.4;7;3.4" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                </circle>
                <text x={(t.y < 100 ? 236 + (t.y - 46) * 0.1 : 244) + 12} y={t.y + 4} fill="#FFFFFF" fontFamily="Jost, sans-serif" fontSize="12.5">{t.label}</text>
              </g>
            ))}
            {/* Cities outside service area, muted */}
            <circle cx="226" cy="268" r="2.6" fill="#C9D6D1" />
            <text x="196" y="258" fill="#8FA39B" fontFamily="Jost, sans-serif" fontSize="11.5">Fort Lauderdale</text>
            <circle cx="204" cy="352" r="2.6" fill="#C9D6D1" />
            <text x="176" y="344" fill="#8FA39B" fontFamily="Jost, sans-serif" fontSize="11.5">Miami</text>
            {/* Atlantic label */}
            <text x="286" y="300" fill="#8FA39B" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" transform="rotate(78 286 300)">Atlantic Ocean</text>
          </svg>
        </div>
      </section>

      {/* Founder note */}
      <section style={{ background: C.mist, padding: "76px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48, alignItems: "center" }}>
          <img
            src={FOUNDER_PHOTO}
            alt="Matthew, founder of Sorgente, at the Ironman Florida finish"
            style={{ width: "100%", maxWidth: 340, margin: "0 auto", display: "block", borderRadius: 2, boxShadow: "0 18px 44px rgba(20,43,36,0.18)" }}
          />
          <div style={{ maxWidth: 480 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, color: C.bottleDeep, lineHeight: 1.25 }}>
            Why I only deliver water I'd train on
          </div>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: C.ink, marginTop: 20, fontWeight: 300 }}>
            I'm an Ironman. When you swim 2.4 miles, ride 112, and run a marathon in Florida heat,
            hydration stops being a preference and becomes the whole game — what's in the water,
            how it's bottled, how it tastes when you actually need it. Evian and Acqua Panna, in glass,
            are what I keep in my own home. Sorgente exists so the houses I serve never think about
            water again: it simply appears, chilled and put away, every month.
          </p>
          <p style={{ fontSize: 15, color: C.sub, marginTop: 22 }}>
            — Matthew, founder · Ironman Florida finisher
          </p>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "26px 24px", maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub }}>
        <span>Sorgente — private water delivery</span>
        <span>hello@sorgentepb.com</span>
      </footer>
    </div>
  );
}

function Bottle({ spec }) {
  const s = spec.scale || 1;
  // All shapes drawn in a 0 0 80 140 viewBox, ground line y=130
  if (spec.shape === "evianGlass") {
    // evian glass: slender straight cylinder, quick shoulder, short neck, pink cap
    return (
      <svg viewBox="0 0 80 140" style={{ height: 120, display: "block", margin: "0 auto" }} aria-hidden="true">
        <ellipse cx="40" cy="132" rx="15" ry="3.5" fill="rgba(22,33,29,0.08)" />
        <path d="M 28 52 L 28 126 Q 28 130 32 130 L 48 130 Q 52 130 52 126 L 52 52
                 Q 52 44 45 41 L 45 34 L 35 34 L 35 41 Q 28 44 28 52 Z"
          fill="#F5EDEC" stroke="rgba(22,33,29,0.16)" strokeWidth="1" />
        <rect x="34" y="26" width="12" height="9" rx="1.5" fill="#E7A9B4" />
        <line x1="28" y1="112" x2="52" y2="112" stroke="#E7A9B4" strokeWidth="2" opacity="0.8" />
        <path d="M 32 56 L 32 120" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 30 96 L 36 88 L 41 94 L 47 85 L 50 90" stroke="rgba(199,214,209,0.9)" strokeWidth="1.4" fill="none" />
      </svg>
    );
  }
  if (spec.shape === "panna") {
    // Acqua Panna: soft sloped shoulders, longer neck, cream oval crest label, deep green cap
    return (
      <svg viewBox="0 0 80 140" style={{ height: 120, display: "block", margin: "0 auto" }} aria-hidden="true">
        <ellipse cx="40" cy="132" rx="16" ry="3.5" fill="rgba(22,33,29,0.08)" />
        <path d="M 26 66 L 26 125 Q 26 130 31 130 L 49 130 Q 54 130 54 125 L 54 66
                 C 54 52 47 48 45 44 L 45 24 L 35 24 L 35 44 C 33 48 26 52 26 66 Z"
          fill="#EDF2EC" stroke="rgba(22,33,29,0.16)" strokeWidth="1" />
        <rect x="33.5" y="16" width="13" height="12" rx="1.5" fill="#1E3D33" />
        <rect x="34.5" y="28" width="11" height="14" fill="rgba(30,61,51,0.14)" />
        <ellipse cx="40" cy="96" rx="11.5" ry="15" fill="#F6F2E3" stroke="#1E3D33" strokeWidth="1.4" />
        <text x="40" y="94" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="8.5" fill="#1E3D33" fontStyle="italic">Acqua</text>
        <text x="40" y="103" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="8.5" fill="#1E3D33" fontStyle="italic">Panna</text>
        <path d="M 30 68 L 30 122" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (spec.shape === "pellegrino") {
    // S.Pellegrino: emerald green glass, rounded shoulders, foil neck, red star on cream label
    return (
      <svg viewBox="0 0 80 140" style={{ height: 120, display: "block", margin: "0 auto" }} aria-hidden="true">
        <ellipse cx="40" cy="132" rx="16" ry="3.5" fill="rgba(22,33,29,0.08)" />
        <path d="M 25 72 L 25 125 Q 25 130 30 130 L 50 130 Q 55 130 55 125 L 55 72
                 C 55 58 48 54 46 50 L 46 30 L 34 30 L 34 50 C 32 54 25 58 25 72 Z"
          fill="#2E5B45" stroke="rgba(22,33,29,0.2)" strokeWidth="1" />
        <path d="M 34 30 L 34 52 C 32 55 27 59 26 66 L 54 66 C 53 59 48 55 46 52 L 46 30 Z"
          fill="#3C6B52" />
        <rect x="33" y="24" width="14" height="8" rx="1.5" fill="#3C6B52" />
        <rect x="27" y="86" width="26" height="22" rx="2" fill="#F6F2E3" />
        <path d="M 40 89 L 42 95 L 48 95 L 43.5 98.5 L 45.5 104 L 40 100.5 L 34.5 104 L 36.5 98.5 L 32 95 L 38 95 Z"
          fill="#B5352C" />
        <path d="M 29 74 L 29 122" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="47" cy="44" r="1" fill="rgba(255,255,255,0.5)" />
        <circle cx="44" cy="38" r="0.8" fill="rgba(255,255,255,0.45)" />
        <circle cx="48" cy="35" r="0.7" fill="rgba(255,255,255,0.4)" />
      </svg>
    );
  }
  if (spec.shape === "saratoga") {
    // Saratoga: cobalt blue, broad rounded shoulders, short neck, small cream oval label
    const top = 130 - 92 * s;
    const halfW = 15 * (0.85 + 0.15 * s);
    const shoulder = top + 22 * s;
    return (
      <svg viewBox="0 0 80 140" style={{ height: 120, display: "block", margin: "0 auto" }} aria-hidden="true">
        <ellipse cx="40" cy="132" rx={halfW + 1} ry="3.5" fill="rgba(22,33,29,0.08)" />
        <path d={`M ${40 - halfW} ${shoulder} L ${40 - halfW} 125 Q ${40 - halfW} 130 ${40 - halfW + 5} 130
                  L ${40 + halfW - 5} 130 Q ${40 + halfW} 130 ${40 + halfW} 125 L ${40 + halfW} ${shoulder}
                  C ${40 + halfW} ${top + 6 * s} ${40 + 6} ${top + 4 * s} ${40 + 6} ${top}
                  L ${40 - 6} ${top}
                  C ${40 - 6} ${top + 4 * s} ${40 - halfW} ${top + 6 * s} ${40 - halfW} ${shoulder} Z`}
          fill="#1B3C7A" stroke="rgba(18,38,78,0.5)" strokeWidth="1" />
        <rect x="33" y={top - 8} width="14" height="9" rx="1.5" fill="#12264E" />
        <ellipse cx="40" cy={shoulder + (128 - shoulder) * 0.42} rx="9" ry={11 * (0.8 + 0.2 * s)} fill="#F6F2E3" opacity="0.95" />
        <path d={`M ${40 - halfW + 4} ${shoulder + 4} L ${40 - halfW + 4} 122`} stroke="rgba(255,255,255,0.32)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  // plastic: evian 500ml PET — slim, gentle waist, pink label band, flat cap
  return (
    <svg viewBox="0 0 80 140" style={{ height: 120, display: "block", margin: "0 auto" }} aria-hidden="true">
      <ellipse cx="40" cy="132" rx="11" ry="3" fill="rgba(22,33,29,0.07)" />
      <path d="M 31 78 C 31 72 33 70 33 66 L 33 60 L 47 60 L 47 66 C 47 70 49 72 49 78
               L 49 92 C 49 96 47.5 97 47.5 101 C 47.5 105 49 106 49 110 L 49 126 Q 49 130 45 130
               L 35 130 Q 31 130 31 126 L 31 110 C 31 106 32.5 105 32.5 101 C 32.5 97 31 96 31 92 Z"
        fill="#E3EEF2" stroke="rgba(22,33,29,0.14)" strokeWidth="1" />
      <rect x="34.5" y="54" width="11" height="7" rx="1.5" fill="#EDF3F1" stroke="rgba(22,33,29,0.18)" strokeWidth="0.8" />
      <rect x="31.5" y="82" width="17" height="12" fill="#F0C6CE" opacity="0.9" />
      <path d="M 34 84 L 37 80 L 40 83 L 43 78 L 46 82" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
      <path d="M 34 100 L 34 124" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: accent ? "#1E3D33" : "inherit" }}>
      <span style={{ color: "#5B6D66" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
