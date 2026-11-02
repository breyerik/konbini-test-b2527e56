// Shibuya-Kreuzung V7 – Gehlogik (Yuki, Runde 2/3/4). Runde 3: Mindestabstand in den Wartezonen (O5). Runde 4: Passanten auf den Arm-Gehwegen,
// Start nur bis start_spaetestens_s nach Grün. Ohne Abhängigkeiten, läuft im Browser und in Node.
// Alles in METERN, Ursprung = Kreuzungsmitte (wege_phasen.json: einheit), +x Ost, +z Süd. Welt = Meter × F/10 (F = 4.0625 → × 0.40625).
// Benutzung:  const M = erzeugeMenge(W)  (W = wege_phasen.json)  →  jedes Frame  schritt(M, dt)  →  M.leute[i].{x,z,ry,geht,weg,v}
// Kein Zurücksetzen pro Zyklus: das Ziel einer Querung ist der nächste Start (B1). Bewegung wird nur integriert (pos += richtung·v·dt),
// es gibt keinen Sprung – auch nicht beim Phasenwechsel zu den Nachzüglern (dort nur v × tempo_faktor).
export function phaseBei(W, T) {
  const C = W.zyklus_s; let t = ((T % C) + C) % C;
  for (const p of W.phasen) { if (t < p.dauer_s) return { name: p.name, t, signal: p.signal, faktor: p.tempo_faktor || 1 }; t -= p.dauer_s; }
  const p = W.phasen[W.phasen.length - 1]; return { name: p.name, t: p.dauer_s, signal: p.signal, faktor: p.tempo_faktor || 1 };
}
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const ECKEN = ['nw', 'ne', 'se', 'sw'];
const SGN = { nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1] };

function art(a, b) { const A = SGN[a], B = SGN[b]; if (A[0] !== B[0] && A[1] !== B[1]) return 'diagonal'; return A[1] === B[1] ? 'ost_west' : 'nord_sued'; }

// Diagonale: Richtung d = (sx,sz)/√2, quer n = (1, -sx·sz)/√2 – n ist für beide Enden derselben Diagonale gleich
function diagPunkt(ecke, u, q) { const [sx, sz] = SGN[ecke], nz = -sx * sz; return { x: (sx * u + q) / Math.SQRT2, z: (sz * u + nz * q) / Math.SQRT2 }; }
function frei(W, pt) { return Math.hypot(pt.x - W.hachiko.x, pt.z - W.hachiko.z) >= W.hachiko_abstand_m + 0.2; }
// Punkt in der Wartezone: gerade Querungen = Rechteck im Zebraband, diagonal = Streifen entlang der Diagonale.
// Runde 3 (O5): Wartestellen werden reserviert (belegt: id → {ecke,x,z}); neue Stelle hält W.warte_mindestabstand_m (0,6 m)
// zu allen anderen Wartestellen derselben Ecke. Ist die Zone voll, wird die Stelle mit dem größten Abstand genommen (nie Abbruch).
function wartePunkt(W, ecke, typ, r, belegt, id) {
  const z = W.wartezonen[ecke][typ], MIN = W.warte_mindestabstand_m || 0;
  let best = null, bestD = -1;
  for (let i = 0; i < 500; i++) {
    const u = typ === 'diagonal' ? z.u[0] + r() * (z.u[1] - z.u[0]) : 0, q = typ === 'diagonal' ? z.quer[0] + r() * (z.quer[1] - z.quer[0]) : 0;
    if (typ === 'diagonal' && z.raute && (u + Math.abs(q) > z.raute[1] || u - Math.abs(q) < z.raute[0])) continue;   // Raute: zwischen Bordstein und Hauskante
    const pt = typ === 'diagonal' ? diagPunkt(ecke, u, q) : { x: z.x[0] + r() * (z.x[1] - z.x[0]), z: z.z[0] + r() * (z.z[1] - z.z[0]) };
    if (!frei(W, pt)) continue;
    if (!belegt || !MIN) return pt;
    let d = Infinity; for (const [k, b] of belegt) if (k !== id && b.ecke === ecke) d = Math.min(d, Math.hypot(pt.x - b.x, pt.z - b.z));
    if (d >= MIN) return pt;
    if (d > bestD) { bestD = d; best = pt; }
    if (i >= 120 && best) break;      // genug probiert: bestmögliche Stelle
  }
  if (best) return best;
  throw new Error('keine Wartestelle frei: ' + ecke + ' ' + typ);
}
// Gegenstück auf der Zielecke mit gleicher Querlage → der Weg läuft parallel im Zebraband
function zielPunkt(W, von, nach, typ, a, r) {
  const z = W.wartezonen[nach][typ];
  for (let i = 0; i < 500; i++) {
    let pt;
    if (typ === 'ost_west') pt = { x: z.x[0] + r() * (z.x[1] - z.x[0]), z: a.z };
    else if (typ === 'nord_sued') pt = { x: a.x, z: z.z[0] + r() * (z.z[1] - z.z[0]) };
    else { const [sx, sz] = SGN[von], q = (a.x + (-sx * sz) * a.z) / Math.SQRT2; pt = diagPunkt(nach, z.u[0] + r() * (z.u[1] - z.u[0]), q); }
    if (frei(W, pt)) return pt;
  }
  throw new Error('kein Ziel frei: ' + von + '→' + nach);
}
function partner(c, r) { const i = ECKEN.indexOf(c), q = r(); return q < .36 ? ECKEN[(i + 1) % 4] : q < .72 ? ECKEN[(i + 3) % 4] : ECKEN[(i + 2) % 4]; }
function plane(W, p, r, belegt) {   // nächste Querung ab der aktuellen Ecke planen
  p.nach = partner(p.ecke, r);
  p.typ = art(p.ecke, p.nach);
  if (belegt) belegt.delete(p.id);
  p.start = wartePunkt(W, p.ecke, p.typ, r, belegt, p.id);
  if (belegt) belegt.set(p.id, { ecke: p.ecke, x: p.start.x, z: p.start.z });
  p.ziel = zielPunkt(W, p.ecke, p.nach, p.typ, p.start, r);
}
// Bummler auf dem Hachiko-Platz: erlaubte Stelle?
export function bummlerFrei(W, x, z) {
  const B = W.bummler, h = W.hachiko;
  if (x < B.x[0] || x > B.x[1] || z < B.z[0] || z > B.z[1]) return false;
  if (Math.hypot(x - h.x, z - h.z) < W.hachiko_abstand_m + 0.2) return false;
  for (const s of B.sperr) if (x > s.x[0] && x < s.x[1] && z > s.z[0] && z < s.z[1]) return false;
  for (const a of W.ampeln) if (Math.hypot(x - a.x, z - a.z) < 0.9) return false;
  return true;
}
function bummlerZiel(W, p, r) {
  const B = W.bummler;
  for (let i = 0; i < 400; i++) {
    const x = B.x[0] + r() * (B.x[1] - B.x[0]), z = B.z[0] + r() * (B.z[1] - B.z[0]);
    if (!bummlerFrei(W, x, z)) continue;
    const L = Math.hypot(x - p.x, z - p.z); if (L < 1.5) continue; let ok = true;
    for (let k = 1; k < 40; k++) { const s = k / 40; if (!bummlerFrei(W, p.x + (x - p.x) * s, p.z + (z - p.z) * s)) { ok = false; break; } }
    if (ok) return [{ x, z }];
  }
  return [];
}
// Passanten (Runde 4): gehen auf einer Gehweg-Linie (Polylinie mit seitlichem Versatz q) hin und her, Pause an den Enden.
// Punkt i der Linie = punkte[i] + q · versatz[i] (Ecke: versatz (±1,±1) → gleicher Abstand zu beiden Bordsteinen).
function passantPunkte(W, p) { const L = W.passanten.linien[p.linie]; return L.punkte.map((a, i) => ({ x: a[0] + p.q * L.versatz[i][0], z: a[1] + p.q * L.versatz[i][1] })); }
export function erzeugeMenge(W, { n = 110, bummler = 14, passanten = null, seed = 7 } = {}) {
  if (passanten === null) passanten = W.passanten ? W.passanten.anzahl : 0;
  const r = rng(seed), leute = [], belegt = new Map();
  for (let i = 0; i < n; i++) {
    const p = { id: i, rolle: 'quer', variante: (i * 3 + Math.floor(i / 4)) % 8, ecke: ECKEN[i % 4], v: W.tempo_m_s[0] + r() * (W.tempo_m_s[1] - W.tempo_m_s[0]), weg: 0, geht: false, ry: 0 };
    plane(W, p, r, belegt); p.x = p.start.x; p.z = p.start.z; p.modus = 'warten'; p.route = []; p.verz = r() * W.startversatz_s; leute.push(p);
  }
  for (let i = 0; i < bummler; i++) {
    const p = { id: n + i, rolle: 'bummler', variante: (i * 5 + 1) % 8, v: W.tempo_m_s[0] + r() * (W.tempo_m_s[1] - W.tempo_m_s[0]), weg: 0, geht: false, ry: 0, pause: r() * 4 };
    let x, z; do { x = W.bummler.x[0] + r() * (W.bummler.x[1] - W.bummler.x[0]); z = W.bummler.z[0] + r() * (W.bummler.z[1] - W.bummler.z[0]); } while (!bummlerFrei(W, x, z));
    p.x = x; p.z = z; p.route = []; leute.push(p);
  }
  for (let i = 0; i < passanten; i++) {
    const PW = W.passanten, nl = PW.linien.length;
    const p = { id: n + bummler + i, rolle: 'passant', variante: (i * 3 + 2) % 8, linie: i % nl, v: W.tempo_m_s[0] + r() * (W.tempo_m_s[1] - W.tempo_m_s[0]), weg: 0, geht: false, ry: 0,
      q: PW.versatz_m[0] + r() * (PW.versatz_m[1] - PW.versatz_m[0]), pause: r() * 2 };
    const pts = passantPunkte(W, p), k = Math.floor(r() * (pts.length - 1)), t = r(), vor = r() < .5;   // Start irgendwo auf einem Abschnitt
    p.x = pts[k].x + (pts[k + 1].x - pts[k].x) * t; p.z = pts[k].z + (pts[k + 1].z - pts[k].z) * t;
    p.route = vor ? pts.slice(k + 1) : pts.slice(0, k + 1).reverse(); p.rueck = !vor; leute.push(p);
  }
  return { W, T: 0, r, leute, belegt, phase: phaseBei(W, 0), letzteGruen: -1 };
}
// eine Strecke entlang der Route gehen; liefert true, wenn die Route fertig ist
function gehe(p, dist) {
  let rest = dist, dx = 0, dz = 0;
  while (rest > 1e-9 && p.route.length) {
    const t = p.route[0], ex = t.x - p.x, ez = t.z - p.z, L = Math.hypot(ex, ez);
    if (L > 1e-9) { dx = ex; dz = ez; }
    if (L <= rest) { p.x = t.x; p.z = t.z; rest -= L; p.weg += L; p.route.shift(); }
    else { p.x += ex / L * rest; p.z += ez / L * rest; p.weg += rest; rest = 0; }
  }
  if (dx || dz) p.ry = Math.atan2(dx, dz);
  return p.route.length === 0;
}
export function schritt(M, dt) {
  const W = M.W, ph = phaseBei(W, M.T), r = M.r;
  const zyk = Math.floor(M.T / W.zyklus_s);
  for (const p of M.leute) {
    p.geht = false;
    if (p.rolle === 'bummler') {
      if (p.pause > 0) { p.pause -= dt; continue; }
      if (!p.route.length) { p.route = bummlerZiel(W, p, r); if (!p.route.length) { p.pause = 1; continue; } }
      p.geht = true; if (gehe(p, p.v * dt)) p.pause = 2 + r() * 4;
      continue;
    }
    if (p.rolle === 'passant') {
      if (p.pause > 0) { p.pause -= dt; continue; }
      if (!p.route.length) { const pts = passantPunkte(W, p); p.rueck = !p.rueck; p.route = p.rueck ? pts.slice(0, -1).reverse() : pts.slice(1); }
      p.geht = true; if (gehe(p, p.v * dt)) p.pause = W.passanten.pause_s[0] + r() * (W.passanten.pause_s[1] - W.passanten.pause_s[0]);
      continue;
    }
    if (p.modus === 'warten') {
      // Start nur in der Grünphase, mit eigenem Versatz, einmal je Zyklus
      if (ph.name === 'alle_gehen' && ph.t >= p.verz && ph.t <= (W.start_spaetestens_s ?? Infinity) && p.zyk !== zyk) { p.zyk = zyk; p.modus = 'queren'; p.route = [p.ziel]; }
      else continue;
    }
    const f = p.modus === 'queren' ? ph.faktor : 1;     // Nachzügler: nur schneller, kein Sprung
    p.geht = true;
    if (gehe(p, p.v * f * dt)) {
      if (p.modus === 'queren') {             // angekommen: Ziel = neuer Start (B1)
        p.ecke = p.nach; plane(W, p, r, M.belegt); p.verz = r() * W.startversatz_s;
        const [sx, sz] = SGN[p.ecke]; p.route = [{ x: sx * W.knoten_m, z: sz * W.knoten_m }, p.start]; p.modus = 'umstellen';
      } else p.modus = 'warten';
    }
  }
  M.T += dt; M.phase = phaseBei(W, M.T);
}
