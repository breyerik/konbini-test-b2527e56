// Hochbahn Osaka/Kyoto – Fahrt (Yuki, Runde 3). Reine Rechnung ohne THREE: Weg, Fahrplan, Wagenlagen. JS-Zwilling von generator/bahn_geometrie.py
// (gleiche Formeln; pruefung/pruef_zug.mjs vergleicht beide). Feld-Koordinaten (1 Feld = 10 m), Zeit in s.
//   const F = fahrplan(vorlage.hochbahn)  → { zuege:[{weg,halte,…}], zyklus }
//   wagenLagen(F, t) → [{x, y, h, zug, wagen}]  (x/y = Wagenmitte im Feld, h = Kurs in rad, Feldebene: 0 = +x, +π/2 = +y)
// Glatt: Trapez-Geschwindigkeit mit Sinus-Rampen (Ruck begrenzt), Lage rein aus der Zeit ⇒ kein Springen, auch nicht bei großem dt.
const norm = (dx, dy) => { const l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
export function gleisEcken(ecken, v) {
  const n = ecken.length, out = [];
  for (let i = 0; i < n; i++) {
    let d1, d2;
    if (i === 0) d1 = d2 = norm(ecken[1][0] - ecken[0][0], ecken[1][1] - ecken[0][1]);
    else if (i === n - 1) d1 = d2 = norm(ecken[i][0] - ecken[i - 1][0], ecken[i][1] - ecken[i - 1][1]);
    else { d1 = norm(ecken[i][0] - ecken[i - 1][0], ecken[i][1] - ecken[i - 1][1]); d2 = norm(ecken[i + 1][0] - ecken[i][0], ecken[i + 1][1] - ecken[i][1]); }
    const n1 = [d1[1], -d1[0]], n2 = [d2[1], -d2[0]], k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    out.push([ecken[i][0] + v * (n1[0] + n2[0]) / k, ecken[i][1] + v * (n1[1] + n2[1]) / k]);
  }
  return out;
}
export function baueWeg(ecken, radius, versatz = 0) {
  const E = versatz ? gleisEcken(ecken, versatz) : ecken.map(e => [e[0], e[1]]), st = [];
  let start = E[0];
  for (let i = 1; i < E.length - 1; i++) {
    const p0 = E[i - 1], p1 = E[i], p2 = E[i + 1], d1 = norm(p1[0] - p0[0], p1[1] - p0[1]), d2 = norm(p2[0] - p1[0], p2[1] - p1[1]);
    const th = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
    const n1 = [d1[1], -d1[0]], seite = (n1[0] * d2[0] + n1[1] * d2[1]) > 0 ? 1 : -1;
    const r = versatz ? radius - versatz * seite : radius, t = r * Math.tan(Math.abs(th) / 2);
    const a = [p1[0] - d1[0] * t, p1[1] - d1[1] * t], b = [p1[0] + d2[0] * t, p1[1] + d2[1] * t];
    st.push(['g', start, a]);
    const m = [a[0] + n1[0] * seite * r, a[1] + n1[1] * seite * r];
    const w0 = Math.atan2(a[1] - m[1], a[0] - m[0]), w1 = Math.atan2(b[1] - m[1], b[0] - m[0]);
    let dw = w1 - w0; while (dw > Math.PI) dw -= 2 * Math.PI; while (dw < -Math.PI) dw += 2 * Math.PI;
    st.push(['b', m, r, w0, dw]); start = b;
  }
  st.push(['g', start, E[E.length - 1]]);
  const stuecke = []; let tot = 0;
  for (const s of st) { const l = s[0] === 'g' ? Math.hypot(s[2][0] - s[1][0], s[2][1] - s[1][1]) : Math.abs(s[4]) * s[2]; stuecke.push([tot, l, s]); tot += l; }
  return { stuecke, laenge: tot };
}
export function punkt(weg, s) {
  s = Math.max(0, Math.min(weg.laenge, s));
  for (const [s0, l, st] of weg.stuecke) if (s <= s0 + l + 1e-9) {
    const u = l === 0 ? 0 : (s - s0) / l;
    if (st[0] === 'g') { const a = st[1], b = st[2]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])]; }
    const [, m, r, w0, dw] = st, w = w0 + dw * u; return [m[0] + r * Math.cos(w), m[1] + r * Math.sin(w), w + (dw > 0 ? Math.PI / 2 : -Math.PI / 2)];
  }
  const b = weg.stuecke[weg.stuecke.length - 1][2][2]; return [b[0], b[1], 0];
}
export function projektion(weg, x, y, schritt = .01) {
  let best = 1e9, bs = 0;
  for (let s = 0; s <= weg.laenge; s += schritt) { const p = punkt(weg, s), d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < best) { best = d; bs = s; } }
  return bs;
}
// Fahrt über D mit vmax und Rampenzeit Tr (Sinus-Rampe: Beschleunigung 0 → max → 0). Gibt Dauer und s(t).
export function fahrt(D, vmax, Tr) {
  let v = vmax; if (D < v * Tr) v = D / Tr;                       // kurze Strecke: Profil verkleinern (reine Rampen)
  const T = D / v + Tr, rampe = t => v * (t / 2 - Tr / (2 * Math.PI) * Math.sin(Math.PI * t / Tr));
  const s = t => t <= 0 ? 0 : t >= T ? D : t < Tr ? rampe(t) : t > T - Tr ? D - rampe(T - t) : v * Tr / 2 + v * (t - Tr);
  return { T, s, v };
}
// Fahrplan: jeder Zug hat sein eigenes Gleis (±gleis_versatz) und pendelt Kopf → … → Kopf → … zurück. Halte = Zugmitte (Bogenlänge).
export function fahrplan(HB) {
  const Z = HB.zug, lz = Z.wagen * Z.wagen_laenge + (Z.wagen - 1) * Z.luecke, zuege = [];
  for (const [k, v] of [[0, HB.gleis_versatz], [1, -HB.gleis_versatz]]) {
    const weg = baueWeg(HB.ecken, HB.radius, v), L = weg.laenge;
    const bhf = HB.bahnhoefe.map(b => ({ id: b.id, typ: b.typ, s: b.typ === 'kopf' ? (b.s < HB.laenge / 2 ? Z.abstand_kopf + lz / 2 : L - Z.abstand_kopf - lz / 2) : projektion(weg, b.mitte[0], b.mitte[1]) }));
    bhf.sort((a, b) => a.s - b.s);
    const folge = [...bhf, ...bhf.slice(1, -1).reverse()], abschn = [];     // A, K, B, K (dann wieder A)
    let t = 0;
    for (let i = 0; i < folge.length; i++) {
      const h = folge[i], n = folge[(i + 1) % folge.length], halt = h.typ === 'kopf' ? Z.halt_kopf_s : Z.halt_s;
      abschn.push({ art: 'halt', t0: t, T: halt, s: h.s, bhf: h.id }); t += halt;
      const f = fahrt(Math.abs(n.s - h.s), Z.vmax, Z.anfahr_s);
      abschn.push({ art: 'fahrt', t0: t, T: f.T, von: h.s, nach: n.s, f, bhf: h.id + '→' + n.id }); t += f.T;
    }
    zuege.push({ k, versatz: v, weg, laenge_zug: lz, abschn, zyklus: t, phase: k * (Z.versatz_zug2 ?? .5) });
  }
  const zyklus = Math.max(...zuege.map(z => z.zyklus));
  // Gleicher Umlauf (Kyoto 06.11.2026, Gganbu K-H1): Innen- und Außengleis sind im Bogen verschieden lang → verschiedene Umläufe → der
  // Phasenabstand wandert, nach ~17 min treffen sich die Züge im Bogen. Mit zug.gleicher_umlauf = true bekommt jeder kürzere Zug die
  // fehlende Zeit gleichmäßig auf seine Kopfhalte verteilt → alle Umläufe = zyklus, Versatz bleibt für immer fest. Ohne das Feld: unverändert.
  if (Z.gleicher_umlauf === true) for (const z of zuege) {
    const kopf = z.abschn.filter(a => a.art === 'halt' && HB.bahnhoefe.find(b => b.id === a.bhf)?.typ === 'kopf'), extra = zyklus - z.zyklus;
    if (!kopf.length || extra <= 0) continue;
    for (const a of kopf) a.T += extra / kopf.length;
    let t = 0; for (const a of z.abschn) { a.t0 = t; t += a.T; } z.zyklus = t;
  }
  return { zuege, zyklus, Z };
}
// Zugmitte (Bogenlänge) und Zustand zur Zeit t
export function zugLage(z, t) {
  let u = ((t + z.phase * z.zyklus) % z.zyklus + z.zyklus) % z.zyklus;
  for (const a of z.abschn) if (u < a.t0 + a.T || a === z.abschn[z.abschn.length - 1]) {
    if (a.art === 'halt') return { s: a.s, v: 0, halt: a.bhf };
    const d = Math.sign(a.nach - a.von), tt = Math.min(u - a.t0, a.T);
    return { s: a.von + d * a.f.s(tt), v: d, halt: null, strecke: a.bhf };
  }
}
export function wagenLagen(P, t) {
  const Z = P.Z, out = [];
  for (const z of P.zuege) {
    const c = zugLage(z, t).s;
    for (let i = 0; i < Z.wagen; i++) {
      const m = c + (i - (Z.wagen - 1) / 2) * (Z.wagen_laenge + Z.luecke), a = punkt(z.weg, m - Z.drehgestell), b = punkt(z.weg, m + Z.drehgestell);
      out.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, h: Math.atan2(b[1] - a[1], b[0] - a[0]), zug: z.k, wagen: i, s: m });
    }
  }
  return out;
}
