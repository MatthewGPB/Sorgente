// Single source of truth for Sorgente delivery routes.
// Change the mapping here and every page + server check follows.

export const ROUTE_DAYS = ["Tuesday", "Thursday", "Saturday"];
export const DAY_INDEX = { Tuesday: 2, Thursday: 4, Saturday: 6 };

// Palm Beach County (+ Jupiter Island / Hobe Sound edge)
export function zipInZone(zip) {
  const z = parseInt(zip, 10);
  return (z >= 33401 && z <= 33499) || z === 33455 || z === 33475;
}

export function routeFor(zip) {
  return ROUTE_DAYS[parseInt(zip, 10) % 3];
}

// Earliest occurrence of the route day, respecting the 48-hour lead
export function nextRouteDate(dayName, from = Date.now()) {
  const min = new Date(from + 2 * 86400000);
  min.setHours(0, 0, 0, 0);
  const d = new Date(min);
  while (d.getDay() !== DAY_INDEX[dayName]) d.setDate(d.getDate() + 1);
  return d;
}
