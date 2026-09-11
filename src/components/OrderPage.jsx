import React, { useState, useMemo, useEffect, useRef } from "react";
import { zipInZone, routeFor, DAY_INDEX, routeStatus } from "../lib/routes.js";

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
const navLink = { color: "#1E3D33", textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 1 };

const SKUS = [
  {
    id: "evian750",
    img: "/products/evian750.jpg",
    brand: "evian",
    name: "Natural Spring Water",
    detail: "750 ml \u00b7 12 bottles",
    origin: "French Alps",
    note: "The table bottle",
    material: "Glass",
  },
  {
    id: "panna1l",
    img: "/products/panna1l.jpg",
    brand: "Acqua Panna",
    name: "Toscana Still Water",
    detail: "1 L \u00b7 12 bottles",
    origin: "Tuscany, Italy",
    note: "The kitchen staple",
    material: "Glass",
  },
  {
    id: "pellegrino750",
    img: "/products/pellegrino750.jpg",
    brand: "S.Pellegrino",
    name: "Sparkling Mineral Water",
    detail: "750 ml \u00b7 12 bottles",
    origin: "San Pellegrino Terme, Italy",
    note: "The table sparkling",
    material: "Glass",
  },
  {
    id: "saratoga28",
    img: "/products/saratoga28.jpg",
    brand: "Saratoga",
    name: "Still Spring Water",
    detail: "28 oz \u00b7 12 bottles",
    origin: "Saratoga Springs, NY",
    note: "The statement bottle",
    material: "Glass",
  },
  {
    id: "saratoga12",
    img: "/products/saratoga12.jpg",
    brand: "Saratoga",
    name: "Spring Water",
    detail: "12 oz \u00b7 24 bottles",
    origin: "Saratoga Springs, NY",
    note: "The cocktail-hour pour",
    material: "Glass",
  },
  {
    id: "evian500",
    img: "/products/evian500.jpg",
    brand: "evian",
    name: "Natural Spring Water",
    detail: "500 ml \u00b7 24 bottles",
    origin: "French Alps",
    note: "Fridge, car & gym",
    material: "Plastic",
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


function TastingPopup() {
  const [show, setShow] = useState(false);
  const [addr, setAddr] = useState("");
  const done = useRef(false); // true once shown-and-dismissed OR previously seen

  useEffect(() => {
    try { if (localStorage.getItem("sorgente_tasting_seen")) { done.current = true; return; } } catch {}
    const maybeShow = () => { if (!done.current) setShow(true); };
    const timer = setTimeout(maybeShow, 7000);
    const exit = (e) => { if (e.clientY <= 0) maybeShow(); };
    document.addEventListener("mouseleave", exit);
    return () => { clearTimeout(timer); document.removeEventListener("mouseleave", exit); };
  }, []);

  const dismiss = () => {
    done.current = true;
    setShow(false);
    try { localStorage.setItem("sorgente_tasting_seen", "1"); } catch {}
  };
  if (!show) return null;
  return (
    <div onClick={dismiss} style={{ position: "fixed", inset: 0, background: "rgba(20,43,36,0.42)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FBFCFB", borderRadius: 3, maxWidth: 440, width: "100%", padding: "40px 36px", boxShadow: "0 30px 80px rgba(20,43,36,0.3)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500, color: "#142B24", lineHeight: 1.15 }}>
          Begin with a tasting.
        </div>
        <p style={{ color: "#5B6D66", fontSize: 15, lineHeight: 1.65, marginTop: 12, fontWeight: 300 }}>
          Six fine waters in glass — evian, Acqua Panna, S.Pellegrino, Saratoga — delivered
          to your door. $50, credited in full toward your first month.
        </p>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && addr.trim()) { try { localStorage.setItem("sorgente_tasting_seen", "1"); } catch {}; window.location.href = "/tasting?addr=" + encodeURIComponent(addr); } }}
          placeholder="Street address & zip"
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 15px", fontSize: 15.5, fontFamily: "'Jost', sans-serif", border: "1px solid #C9D6D1", borderRadius: 2, marginTop: 18, outline: "none" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
          <button
            onClick={() => { if (!addr.trim()) return; try { localStorage.setItem("sorgente_tasting_seen", "1"); } catch {}; window.location.href = "/tasting?addr=" + encodeURIComponent(addr); }}
            style={{ background: "#1E3D33", color: "#fff", border: "none", borderRadius: 999, padding: "13px 26px", fontSize: 14.5, fontFamily: "'Jost', sans-serif", cursor: "pointer" }}>
            Check my route
          </button>
          <button onClick={dismiss} style={{ background: "none", border: "none", color: "#5B6D66", fontSize: 13.5, cursor: "pointer", fontFamily: "'Jost', sans-serif", padding: 0 }}>
            No thanks, just looking
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WaterDeliverySite() {
  const today = startOfDay(new Date());
  const minDate = new Date(today.getTime() + 2 * DAY_MS); // 48-hour lead

  const [qty, setQty] = useState(() => Object.fromEntries(SKUS.map((s) => [s.id, 0])));
  const [viewMonth, setViewMonth] = useState(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [selected, setSelected] = useState(null);
  const [zip, setZip] = useState("");
  const [tasting50, setTasting50] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const totalCases = SKUS.reduce((sum, s) => sum + qty[s.id], 0);
  const zipValid = /^\d{5}$/.test(zip);
  const zipServed = zipValid && zipInZone(zip);
  const routeDay = zipServed ? routeFor(zip) : null;
  const perCase = totalCases >= TIER_AT ? TIER_PRICE : BASE_PRICE;
  const total = totalCases * perCase;
  const savings = totalCases >= TIER_AT ? totalCases * (BASE_PRICE - TIER_PRICE) : 0;
  const belowMin = totalCases > 0 && totalCases < MIN_CASES;
  const ready = totalCases >= MIN_CASES && selected && zipServed;

  useEffect(() => { setSelected(null); }, [routeDay]);

  // Pre-filled conversion links: /?case=panna1l:5,saratoga28:5&zip=33480&tasting50=1#order
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const caseParam = sp.get("case");
    if (caseParam) {
      const next = Object.fromEntries(SKUS.map((s) => [s.id, 0]));
      for (const part of caseParam.split(",")) {
        const [id, n] = part.split(":");
        if (id in next) next[id] = Math.max(0, Math.min(99, parseInt(n, 10) || 0));
      }
      setQty(next);
    }
    const z = sp.get("zip");
    if (z && /^\d{5}$/.test(z)) setZip(z);
    if (sp.get("tasting50") === "1") setTasting50(true);
    if (caseParam || window.location.hash === "#order") {
      setTimeout(() => document.getElementById("order")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  const change = (id, delta) => {
    setActivePreset(null);
    setQty((q) => ({ ...q, [id]: Math.max(0, q[id] + delta) }));
  };

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
      <style>{`@media (max-width: 719px) { .hero-img-first { order: -1; } }`}</style>
      <TastingPopup />

      {/* Announcement bar */}
      <a href="/tasting" style={{ display: "block", background: C.bottleDeep, color: "#fff", textDecoration: "none", textAlign: "center", padding: "11px 16px", fontSize: 13.5, letterSpacing: "0.05em" }}>
        Begin with the Tasting Case — six bottles, $50, credited toward your first month&nbsp;&nbsp;→
      </a>

      {/* Masthead */}
      <header style={{ padding: "26px 24px 0", maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", rowGap: 8, columnGap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="" style={{ height: 34, width: 34 }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, letterSpacing: "0.02em", color: C.bottle }}>
            Sorgente
          </span>
        </div>
        <nav aria-label="Site" style={{ display: "flex", alignItems: "center", gap: "8px 20px", flexWrap: "wrap", fontSize: 14 }}>
          <a href="#waters" style={navLink}>The waters</a>
          <a href="/estates" style={navLink}>For estates</a>
          <a href="/yachts" style={navLink}>Yachts</a>
          <a href="/faq" style={navLink}>FAQ</a>
          <a href="/tasting" style={navLink}>Tasting Case</a>
          <a href="sms:+15614010695" style={{ ...navLink, color: C.sub }}>Text (561) 401-0695</a>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 52, alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "clamp(34px, 4.4vw, 54px)", lineHeight: 1.1, margin: 0, color: C.bottleDeep }}>
              Fine water, in glass, stocked in your home every month.
            </h1>
            <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.sub, marginTop: 20, fontWeight: 300 }}>
              Still and sparkling — evian, Acqua Panna, S.Pellegrino, and Saratoga by the case,
              on your street's delivery day each month. We carry it in, put it away, and take the
              empty glass with us. Nobody needs to be home. One text pauses it when you travel.
            </p>
            <p style={{ fontSize: 15, marginTop: 22 }}>
              <a href="sms:+15614010695" style={{ color: C.bottle, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}>
                Text us anytime — (561) 401-0695
              </a>
            </p>
            <p style={{ fontSize: 15, marginTop: 10 }}>
              <a href="/tasting" style={{ color: C.sub, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}>
                New here? Begin with a $50 Tasting Case →
              </a>
            </p>
          </div>
          <img src="/collection.jpg" alt="The Sorgente collection: evian, Acqua Panna, S.Pellegrino, and Saratoga in glass" className="hero-img-first"
            style={{ width: "100%", borderRadius: 2, display: "block", boxShadow: "0 24px 60px rgba(20,43,36,0.12)" }} />
        </div>

        {/* How it works */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, marginTop: 64 }}>
          {[
            ["01", "Compose your delivery", "Choose your cases below — still, sparkling, glass for the table, small bottles for the fridge."],
            ["02", "We stock your home", "Your delivery arrives on your day. We carry it in, put it away, and take the empty glass."],
            ["03", "It simply repeats", "Same order, same day, every month. Traveling? One text pauses it until you're back."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.sub, letterSpacing: "0.14em" }}>{n}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 600, color: C.bottle, marginTop: 6 }}>{t}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.sub, marginTop: 8, fontWeight: 300 }}>{d}</p>
            </div>
          ))}
        </div>

        {/* What a house manager checks first */}
        <div style={{ marginTop: 56, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "22px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px 32px", fontSize: 14, color: C.ink }}>
          {[
            ["No signature needed", "Standing access instructions, taken once."],
            ["Window texted the morning of", "To you or to staff — your choice."],
            ["Put where you keep it", "Pantry, bar, garage fridge, guest house."],
            ["Empties leave with us", "Nothing for staff to haul."],
          ].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontWeight: 500, color: C.bottle }}>{t}</div>
              <div style={{ color: C.sub, fontSize: 13.5, marginTop: 2 }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, color: C.sub, marginTop: 14 }}>
          Managing a property or a boat? <a href="/estates" style={{ color: C.bottle }}>See how estate accounts work</a> or <a href="/yachts" style={{ color: C.bottle }}>yacht provisioning</a>.
        </p>
      </section>

      {/* The Waters */}
      <section id="waters" style={{ background: C.mist, padding: "72px 24px", marginBottom: 72, scrollMarginTop: 16 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500, color: C.bottleDeep }}>
            The Waters
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: C.sub, maxWidth: 620, marginTop: 14, fontWeight: 300 }}>
            Still water has terroir. Every spring carries the minerals of the rock it rose through,
            and the difference is on the palate — from featherlight to full-bodied. Palm Beach tap
            is perfectly safe; it's just not what you want at a dinner table. These four cover the
            whole spectrum.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}`, marginTop: 36 }}>
            {[
              {
                brand: "Saratoga", origin: "Saratoga Springs, NY — since 1872",
                weight: "Featherlight", stats: "TDS under 150 · pH 6.4–6.7",
                note: "Clean and slightly sweet with a crisp finish — the closest water comes to weightless.",
                serve: "Sushi, oysters, delicate fish",
              },
              {
                brand: "Acqua Panna", origin: "Tuscany — a 14-year journey through the hills",
                weight: "Soft", stats: "TDS ~150 · naturally alkaline",
                note: "Velvety and smooth — rounds off acidity and never competes with the wine.",
                serve: "White fish, salads, fine wine",
              },
              {
                brand: "evian", origin: "French Alps — 15 years through glacial rock",
                weight: "Balanced", stats: "TDS 345 · pH 7.2",
                note: "Calcium and magnesium in easy proportion — neutral, complete, the house pour.",
                serve: "Every day, every table",
              },
              {
                brand: "S.Pellegrino", origin: "San Pellegrino Terme — since 1899",
                weight: "Full-bodied", stats: "TDS 854 · fine bubbles",
                note: "Calcium- and sulfate-rich with a structured, saline edge — built for the table.",
                serve: "Rich dishes, aperitivo hour",
              },
            ].map((w) => (
              <div key={w.brand} style={{ background: "#fff", padding: "28px 24px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.sub, letterSpacing: "0.14em", textTransform: "uppercase" }}>{w.weight}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 25, fontWeight: 600, color: C.bottle, marginTop: 6 }}>{w.brand}</div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{w.origin}</div>
                <div style={{ fontSize: 13.5, color: C.bottle, marginTop: 12, letterSpacing: "0.03em" }}>{w.stats}</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink, marginTop: 10, fontWeight: 300 }}>{w.note}</p>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 12, borderTop: `1px solid ${C.mist}`, paddingTop: 10 }}>
                  Serve with — {w.serve}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: C.sub, marginTop: 16 }}>
            Mineral figures from each producer's published water analysis. Most homes run one still
            for every day, a second for the table, and S.Pellegrino for guests.
          </p>
        </div>
      </section>

      {/* Order builder */}
      <section id="order" style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 100px", display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, color: C.bottleDeep }}>
            Compose your delivery
          </div>
          <p style={{ fontSize: 14.5, color: C.sub, marginTop: 8, fontWeight: 300 }}>
            Start from how most homes run it — then adjust any case below.
          </p>
          <p style={{ fontSize: 15, color: C.ink, marginTop: 10 }}>
            <span style={{ fontWeight: 500 }}>{fmt(BASE_PRICE)} per case</span>, any water — <span style={{ fontWeight: 500 }}>{fmt(TIER_PRICE)}</span> at {TIER_AT} or more. Five-case minimum. Delivery, stocking, and glass pickup included.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}`, marginTop: 18 }}>
            {[
              { name: "The Couple", sub: "5 cases · $250/mo", d: "Still water for two — table and kitchen.", mix: { evian750: 2, panna1l: 1, pellegrino750: 1, saratoga28: 1, saratoga12: 0, evian500: 0 } },
              { name: "The Household", sub: "10 cases · $450/mo", d: "Family and entertaining — the full spectrum, estate rate.", tag: "MOST HOMES", mix: { evian750: 2, panna1l: 2, pellegrino750: 2, saratoga28: 2, saratoga12: 1, evian500: 1 } },
              { name: "The Estate", sub: "20 cases · $900/mo", d: "Main house, guests, staff — composed generously.", mix: { evian750: 4, panna1l: 4, pellegrino750: 4, saratoga28: 3, saratoga12: 3, evian500: 2 } },
            ].map((t) => (
              <button key={t.name}
                onClick={() => {
                  setQty({ ...t.mix });
                  setActivePreset(t.name);
                  setTimeout(() => document.getElementById("cases-grid")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                }}
                style={{ background: activePreset === t.name ? C.mist : "#fff", border: "none", outline: activePreset === t.name ? `2px solid ${C.bottle}` : "none", outlineOffset: -2, textAlign: "left", padding: "24px 22px", cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background .2s" }}>
                {t.tag && <div style={{ fontSize: 11, letterSpacing: "0.12em", color: C.bottle, marginBottom: 6 }}>{t.tag}</div>}
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.bottle }}>{t.name}</div>
                <div style={{ fontSize: 14.5, color: C.ink, marginTop: 4 }}>{t.sub}</div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.55 }}>{t.d}</div>
                <div style={{ fontSize: 13, color: C.bottle, marginTop: 12, borderBottom: activePreset === t.name ? "none" : `1px solid ${C.line}`, display: "inline-block", fontWeight: activePreset === t.name ? 500 : 400 }}>
                  {activePreset === t.name ? "✓ Selected — your cases are below" : "Start with this →"}
                </div>
              </button>
            ))}
          </div>
          {activePreset && (
            <p style={{ fontSize: 14, color: C.bottle, marginTop: 14 }}>
              {activePreset} loaded — {totalCases} cases below. Adjust any of them, then choose your route day.
            </p>
          )}
        </div>
        <div id="cases-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}`, scrollMarginTop: 24 }}>
          {SKUS.map((s) => (
            <div key={s.id} style={{ background: qty[s.id] > 0 ? C.mist : "#fff", padding: "26px 24px", transition: "background .25s", display: "flex", flexDirection: "column" }}>
              <img src={s.img} alt={`${s.brand} ${s.detail}`} loading="lazy"
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 2, display: "block" }} />
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
              <div style={{ fontSize: 13.5, color: C.bottle, marginTop: 8 }}>{fmt(BASE_PRICE)} / case · {fmt(TIER_PRICE)} at {TIER_AT}+</div>
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
              {tasting50 && totalCases > 0 && <Row label="Tasting Case credit (first month)" value="− $50" accent />}
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
            <p style={{ fontSize: 13.5, color: C.sub, marginTop: 6 }}>We deliver by neighborhood route — your zip decides your delivery day.</p>
            <div style={{ background: zipServed ? "transparent" : C.mist, padding: zipServed ? 0 : "16px 16px 18px", borderRadius: 2, marginTop: 14, transition: "all .25s" }}>
              <label htmlFor="route-zip" style={{ display: "block", fontSize: 14, color: C.bottle, fontWeight: 500 }}>
                Your zip code
              </label>
              <input
                id="route-zip"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="33480"
                name="postal-code"
                autoComplete="postal-code"
                inputMode="numeric"
                style={{ width: 190, boxSizing: "border-box", padding: "15px 17px", fontSize: 19, letterSpacing: "0.08em", fontFamily: "'Jost', sans-serif", border: `1.5px solid ${zipServed ? C.line : C.bottle}`, borderRadius: 2, marginTop: 10, outline: "none", background: "#fff", color: C.ink }}
              />
            </div>
            {zipServed && (
              <p style={{ fontSize: 14, color: C.bottle, marginTop: 12 }}>
                Your street is on our {routeDay} route ({routeStatus(routeDay)}). Choose your first {routeDay}.
              </p>
            )}
            {zipValid && !zipServed && (
              <p style={{ fontSize: 14, color: "#8C3B33", marginTop: 10 }}>
                We haven't opened your route yet — <a href="/tasting" style={{ color: "inherit" }}>join the waitlist</a> and you'll be first to know.
              </p>
            )}

            {!zipServed && !zipValid && (
              <p style={{ fontSize: 13.5, color: C.sub, marginTop: 12 }}>
                Routes run Tuesday, Thursday, and Saturday. Your calendar appears once we know your zip.
              </p>
            )}
            {zipServed && (
            <div style={{ position: "relative" }}>
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
                const disabled = d < minDate || !zipServed || d.getDay() !== DAY_INDEX[routeDay];
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
                      textDecoration: d < minDate ? "line-through" : "none",
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
              try { window.fbq && window.fbq("track", "InitiateCheckout", { value: total, currency: "USD" }); } catch {}
              try { window.gtag && window.gtag("event", "begin_checkout", { value: total, currency: "USD" }); } catch {}
              try {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ qty, deliveryDate: selected.toISOString().slice(0, 10), zip, routeDay, tasting50 }),
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
            {busy ? "Opening secure checkout…" : ready ? `Continue to payment — ${fmt(total)}/month` : "Choose cases, your zip, and a route day"}
          </button>
          {checkoutError && (
            <p style={{ fontSize: 13.5, color: "#8C3B33", marginTop: 12 }}>{checkoutError} Try again, or write matthew@growpalmbeach.com.</p>
          )}
          <p style={{ fontSize: 12.5, color: C.sub, marginTop: 12 }}>
            Billed monthly via Stripe secure checkout. Pause for travel or cancel anytime with two days' notice.
          </p>
          <p style={{ fontSize: 13.5, color: C.sub, marginTop: 10, lineHeight: 1.6, maxWidth: 560 }}>
            After checkout you'll get a text to confirm access — gate code, where the cases go, who to notify — and a delivery window the morning of your day.
          </p>
          <p style={{ fontSize: 13.5, color: C.sub, marginTop: 14, lineHeight: 1.6, maxWidth: 560 }}>
            Founder's guarantee: if your first month isn't exactly what I promised — carried in,
            put away, on your day — text me and the month is on me.
          </p>
          <p style={{ fontSize: 13.5, marginTop: 10 }}>
            <a href="sms:+15614010695" style={{ color: C.bottle, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}>
              Rather talk it through? Text Matthew — (561) 401-0695
            </a>
          </p>
        </div>
      </section>

      {/* Tasting bridge */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 90px" }}>
        <div style={{ border: `1px solid ${C.line}`, padding: "40px 36px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, color: C.bottleDeep }}>
              Not ready for monthly? Begin with a tasting.
            </div>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, marginTop: 10, fontWeight: 300 }}>
              Six bottles across all four waters, delivered on your street's route day.
              $50 — credited in full toward your first month if you continue.
            </p>
          </div>
          <a href="/tasting" style={{ background: C.bottle, color: "#fff", textDecoration: "none", borderRadius: 999, padding: "16px 34px", fontSize: 15, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            Check my route
          </a>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderTop: "none", padding: "26px 36px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px 24px", background: C.mist }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.bottle }}>
              Ordering for a property you manage, or a boat?
            </div>
            <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.65, marginTop: 6, fontWeight: 300 }}>
              Twenty cases and up, several properties, or a season's provisioning — I'll put a proposal together instead of having you guess.
            </p>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14.5 }}>
            <a href="/estates" style={{ color: C.bottle, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}>Estate accounts</a>
            <a href="/yachts" style={{ color: C.bottle, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}>Yacht provisioning</a>
          </div>
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
              down through Palm Beach, Manalapan, and Boca Raton. Each route is capped at
              twenty homes so the same person delivers every month.
            </p>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 14 }}>
              Marinas and private docks: <a href="/yachts" style={{ color: C.bottle }}>yacht provisioning</a>.
              Outside the county? Write us — larger standing orders travel farther.
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
            alt="Matthew, founder of Sorgente"
            style={{ width: "100%", maxWidth: 340, margin: "0 auto", display: "block", borderRadius: 2, boxShadow: "0 18px 44px rgba(20,43,36,0.18)" }}
          />
          <div style={{ maxWidth: 480 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, color: C.bottleDeep, lineHeight: 1.25 }}>
            Delivered by the founder, not a fleet.
          </div>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: C.ink, marginTop: 20, fontWeight: 300 }}>
            I'm Matthew. I keep evian and Acqua Panna in glass at home, and I started Sorgente
            because there was no good way to have that just appear every month — carried in,
            put away, empties gone — without someone on staff managing it. So I do it myself.
            Every route is capped at twenty homes so the person who knows your gate code and
            your pantry is the same person every time.
          </p>
          <p style={{ fontSize: 16.5, lineHeight: 1.8, color: C.ink, marginTop: 14, fontWeight: 300 }}>
            I'm also an Ironman, which in practice means two things: I show up when I say I
            will, and twenty cases up a staircase isn't a problem.
          </p>
          <p style={{ fontSize: 15, color: C.sub, marginTop: 22 }}>
            — Matthew, founder · (561) 401-0695
          </p>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "26px 24px", maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px 24px", fontSize: 13, color: C.sub }}>
        <span>Sorgente — private water delivery</span>
        <nav aria-label="Footer" style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
          <a href="/estates" style={{ color: "inherit", textDecoration: "none" }}>For estates</a>
          <a href="/yachts" style={{ color: "inherit", textDecoration: "none" }}>Yachts</a>
          <a href="/faq" style={{ color: "inherit", textDecoration: "none" }}>FAQ</a>
          <a href="/policies" style={{ color: "inherit", textDecoration: "none" }}>Policies</a>
          <a href="sms:+15614010695" style={{ color: "inherit", textDecoration: "none" }}>(561) 401-0695</a>
          <a href="mailto:matthew@growpalmbeach.com" style={{ color: "inherit", textDecoration: "none" }}>matthew@growpalmbeach.com</a>
        </nav>
      </footer>
    </div>
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
