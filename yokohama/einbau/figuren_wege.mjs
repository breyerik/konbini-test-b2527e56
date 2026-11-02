// Fußgänger Yokohama (Yuki, Runde 3): Figuren laufen auf dem Wegegraph der Bauvorlage (wege.knoten/kanten/gruppen) – nie quer durch Gebäude,
// Halle, Pflanzinsel, Marktstände oder Leuchtturm (die Knoten dort sind im Generator gesperrt). Reine Rechnung ohne THREE, mit fester Saat.
//   const M = erzeugeFiguren(wege, { saat }) → { leute:[{x,y,ry,geht,weg}], T }   ·   schritt(M, dt)
//   ohneArt(wege, 'treppe') → neuer Wegegraph ohne diese Knotenart (WB R3 O5: bei hochbahn:false die Treppenfüße der Bahnhöfe).
// x/y in Feld-Koordinaten, z = Gehhöhe (Deck, Stegbogen) linear entlang der Kante. Seitlicher Versatz je Figur fest (|v| ≤ 0,08 Feld) ⇒ an Knoten kein Sprung; Drehung mit begrenzter Rate.
export function rng(saat) { let a = saat >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function erzeugeFiguren(W, { saat = 1907, tempo = [.11, .17] } = {}) {
  const R = rng(saat), K = W.knoten, nb = K.map(() => []);
  for (const [a, b] of W.kanten) { nb[a].push(b); nb[b].push(a); }
  const leute = [];
  for (const g of W.gruppen) {
    const ks = g.knoten.filter(k => nb[k].length);
    for (let i = 0; i < g.figuren; i++) {
      const a = ks[Math.floor(R() * ks.length)], b = nb[a][Math.floor(R() * nb[a].length)], w = R() * Math.PI * 2, r = Math.sqrt(R()) * .08;
      const p = { a, b, u: R(), v: tempo[0] + R() * (tempo[1] - tempo[0]), ox: Math.cos(w) * r, oy: Math.sin(w) * r, pause: R() < .2 ? R() * 3 : 0, x: 0, y: 0, ry: 0, geht: false, weg: R() * 10 };
      lage(K, p); p.ry = p.ziel; leute.push(p);
    }
  }
  const M = { K, nb, leute, R, T: 0 };
  return M;
}
function lage(K, p) {
  const A = K[p.a], B = K[p.b], dx = B[0] - A[0], dy = B[1] - A[1];
  p.x = A[0] + dx * p.u + p.ox; p.y = A[1] + dy * p.u + p.oy; p.z = (A[3] || 0) + ((B[3] || 0) - (A[3] || 0)) * p.u;
  if (dx || dy) p.ziel = Math.atan2(dx, dy);                  // THREE: rotation.y so, dass +z der Figur in Laufrichtung zeigt (Feld x→Welt x, y→Welt z)
}
export function schritt(M, dt) {
  dt = Math.min(Math.max(dt, 0), .1); M.T += dt;
  for (const p of M.leute) {
    if (p.pause > 0) { p.pause -= dt; p.geht = false; }
    else {
      const A = M.K[p.a], B = M.K[p.b], L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1e-6;
      p.u += p.v * dt / L; p.weg += p.v * dt * 10; p.geht = true;
      while (p.u >= 1) {                                        // Knoten erreicht → nächste Kante (nicht direkt zurück, außer Sackgasse)
        const rest = (p.u - 1) * L, alt = p.a; p.a = p.b; const n = M.nb[p.a], w = n.length > 1 ? n.filter(k => k !== alt) : n;
        p.b = w[Math.floor(M.R() * w.length)]; const L2 = Math.hypot(M.K[p.b][0] - M.K[p.a][0], M.K[p.b][1] - M.K[p.a][1]) || 1e-6; p.u = rest / L2;
        if (M.R() < .06) { p.pause = 1 + M.R() * 3; p.u = 0; break; }
      }
    }
    lage(M.K, p);
    let d = p.ziel - p.ry; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const max = 6 * dt; p.ry += Math.max(-max, Math.min(max, d));
  }
}
// WB R3 O5: Knoten einer Art (Treppenfüße der Hochbahn) samt Kanten entfernen, dazu alles, was danach nur noch allein oder ohne
// Kante dasteht (eine Komponente zählt nur mit ≥ 2 Knoten und ≥ 1 Knoten anderer Art). Knoten neu nummeriert, Gruppen umgeschrieben;
// die Figurenzahl je Gruppe bleibt – verliert eine Gruppe alle Knoten, gehen ihre Figuren an die größte Gruppe (Gesamtzahl gleich).
export function ohneArt(W, art = 'treppe') {
  const K = W.knoten, raus = new Set(K.map((k, i) => k[2] === art ? i : -1).filter(i => i >= 0));
  const nb = K.map(() => []); for (const [a, b] of W.kanten) if (!raus.has(a) && !raus.has(b)) { nb[a].push(b); nb[b].push(a); }
  const komp = new Array(K.length).fill(-1); let nk = 0; const groesse = [];
  for (let i = 0; i < K.length; i++) { if (raus.has(i) || komp[i] >= 0) continue; const st = [i]; komp[i] = nk; let n = 0;
    while (st.length) { const j = st.pop(); n++; for (const k of nb[j]) if (komp[k] < 0) { komp[k] = nk; st.push(k); } } groesse.push(n); nk++; }
  for (let i = 0; i < K.length; i++) if (!raus.has(i) && groesse[komp[i]] < 2) raus.add(i);
  const neu = new Map(); const knoten = []; K.forEach((k, i) => { if (!raus.has(i)) { neu.set(i, knoten.length); knoten.push(k); } });
  const kanten = W.kanten.filter(([a, b]) => neu.has(a) && neu.has(b)).map(([a, b]) => [neu.get(a), neu.get(b)]);
  const gruppen = W.gruppen.map(g => ({ ...g, knoten: g.knoten.filter(k => neu.has(k)).map(k => neu.get(k)) }));
  const groesste = gruppen.reduce((m, g, i) => g.knoten.length > gruppen[m].knoten.length ? i : m, 0);
  for (const g of gruppen) if (!g.knoten.length && g.figuren) { gruppen[groesste].figuren += g.figuren; g.figuren = 0; }
  return { ...W, knoten, kanten, gruppen: gruppen.filter(g => g.knoten.length), entfernt: { art, knoten: raus.size } };
}
