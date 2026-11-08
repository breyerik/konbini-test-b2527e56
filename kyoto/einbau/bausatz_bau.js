// Bausatz (Yuki, Runde 3) – baut aus einer Bauvorlage (bauvorlage_kyoto.json) das Statische: Boden (Pflaster/Kai/Kap), alle Quader
// (Hochbahn-Viadukt, Bahnhöfe, Halle, Promenade, Stege, Treppen, Bänke, Laternen, Geländer …), Zylinder (Stützen, Leuchtturm, Pfähle),
// Bäume, Zebrastreifen, Schilder und Bildschirme. Wiederverwendbar für jede Stadt: nur die Vorlage ist stadtspezifisch.
// Koordinaten absolut in Welt-Einheiten (Feld → Welt: X = W0 + x·F, Z = W0 + y·F, Y = z·F), d. h. Gruppe ohne Versatz in die Szene.
//   baueBausatz(THREE, { basis, vorlage, schirm1, schatten }) → { meshes:[…], update(T), entfernen(), info() }
// Draw Calls: 1 Boden · 1 Statik (Atlas + Vertex-Farben, inkl. Zebras/Schilder/Rahmen/Bäume) · 1 Bildschirme (Live-Schirm + Marken in EINER
// Textur, WB R3: vorher 2 Meshes) · 1 Steinschüttung (InstancedMesh, WB R3 O3, ohne Schatten) = 4 (+1 Statik im Schattenpass).
// Quader-Konvention (wie generator/bausteine.py): M = T · Ry(−w) · Rz(n) · Rx(−nq) · S(l, z1−z0, b) – w Kurs in der Feldebene (+x → +y),
// n hebt das lokale +x-Ende (Geländer), nq das lokale +y-Ende (Stegbögen). Fassaden auf BoxGeometry-Gruppe 0 (+x = 'o') und 4 (+z = 's').
export function baueBausatz(THREE, { basis = '', vorlage: V, schirm1 = null, schatten = true, bodenY = .025, basisY = .03 } = {}) {
  const F = V.raster.feld_welt, W0 = V.raster.welt_von, n = V.raster.n;
  const X = x => W0 + x * F, Z = y => W0 + y * F, Y = z => z * F + basisY;
  const TEX = new Set(), MATS = new Set(), GEOS = new Set(), meshes = [];
  const mat = m => (MATS.add(m), m), geo = g => (GEOS.add(g), g);
  const bild = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = basis + u; });
  const BOX = geo(new THREE.BoxGeometry(1, 1, 1)), PG = geo(new THREE.PlaneGeometry(1, 1));
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), q1 = new THREE.Quaternion(), e1 = new THREE.Euler(), c3 = new THREE.Color();
  const canvasTex = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX.add(t); return t; };
  // ---------- Boden: EIN Quad über die Karte, Canvas 2048² (32 px je Feld), transparent außer auf den neuen Flächen ----------
  { const PX = 2048 / n, cv = document.createElement('canvas'); cv.width = cv.height = 2048; const g = cv.getContext('2d');
    const NUTZ = new Map(V.nutzung.map(([x, y, a]) => [x + ',' + y, a]));
    const GRUND = { platz: '#ECE5D8', kai: '#E4DCCD', kap: '#E9E2D2', burgpark: '#CDD3AE', deck: null, steg: null };
    for (const [k, a] of NUTZ) { const c = GRUND[a]; if (!c) continue; const [x, y] = k.split(',').map(Number); g.fillStyle = c; g.fillRect(x * PX, y * PX, PX, PX); }
    // Fugen: Platz = Rasterpflaster (½ Feld), Kai = Längsplatten, Kap = Kies-Punkte
    g.lineWidth = 1;
    for (const [k, a] of NUTZ) { const [x, y] = k.split(',').map(Number), x0 = x * PX, y0 = y * PX;
      if (a === 'platz') { g.strokeStyle = '#D9CFBF'; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(x0 + i * PX / 2, y0); g.lineTo(x0 + i * PX / 2, y0 + PX); g.moveTo(x0, y0 + i * PX / 2); g.lineTo(x0 + PX, y0 + i * PX / 2); g.stroke(); } }
      else if (a === 'kai') { g.strokeStyle = '#D3C9B8'; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(x0, y0 + i * PX / 4); g.lineTo(x0 + PX, y0 + i * PX / 4); g.stroke(); } }
      else if (a === 'kap') { g.fillStyle = '#D8CFBD'; for (let i = 0; i < 9; i++) g.fillRect(x0 + ((i * 7) % 9) * PX / 9 + 1, y0 + ((i * 4) % 9) * PX / 9 + 1, 2, 2); }
      else if (a === 'burgpark') { g.fillStyle = '#E2D9C4'; g.fillRect(x0 + PX * .36, y0, PX * .28, PX); g.fillRect(x0, y0 + PX * .36, PX, PX * .28);   // Osaka: Kiesweg-Kreuz im Rasen
        g.fillStyle = '#B9C293'; for (let i = 0; i < 9; i++) g.fillRect(x0 + ((i * 7) % 9) * PX / 9 + 1, y0 + ((i * 4) % 9) * PX / 9 + 1, 2, 2); } }
    // Kaikante: dunklere Steinkante zum Wasser (Wasser = nicht begehbar und nicht in nutzung, aus dem Plan der Vorlage)
    const wasser = new Set((V.wasser || []).map(([x, y]) => x + ',' + y));
    g.fillStyle = '#CDBFA9';
    for (const [k, a] of NUTZ) { if (a !== 'kai' && a !== 'kap' && a !== 'platz' && a !== 'burgpark') continue; const [x, y] = k.split(',').map(Number), e = PX * .14;
      if (wasser.has(x + ',' + (y - 1))) g.fillRect(x * PX, y * PX, PX, e); if (wasser.has(x + ',' + (y + 1))) g.fillRect(x * PX, (y + 1) * PX - e, PX, e);
      if (wasser.has((x - 1) + ',' + y)) g.fillRect(x * PX, y * PX, e, PX); if (wasser.has((x + 1) + ',' + y)) g.fillRect((x + 1) * PX - e, y * PX, e, PX); }
    // Rasen-Inseln unter Bäumen auf dem Kap
    g.fillStyle = '#C7D1A2'; for (const b of V.baeume) if (NUTZ.get(Math.floor(b.x) + ',' + Math.floor(b.y)) === 'kap') { g.beginPath(); g.arc(b.x * PX, b.y * PX, PX * .42, 0, 7); g.fill(); }
    const m = new THREE.Mesh(PG, mat(new THREE.MeshLambertMaterial({ map: canvasTex(cv), transparent: true, alphaTest: .5, depthWrite: true })));
    m.scale.set(n * F, n * F, 1); m.rotation.x = -Math.PI / 2; m.position.set(W0 + n * F / 2, bodenY, W0 + n * F / 2); m.receiveShadow = true; m.name = (V.stadt || 'stadt') + '-boden'; meshes.push(m); }
  // ---------- Atlas 2048² für Fassaden, Schilder, Piktogramme ----------
  const AT = 2048, AC = document.createElement('canvas'); AC.width = AC.height = AT; const g = AC.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 32); const WEISS = [16 / AT, 1 - 16 / AT], PAD = 4;
  let sx = 40, sy = 0, sh = 40;
  function platz(w, h) { if (sx + w + 2 * PAD > AT) { sx = 0; sy += sh; sh = 0; } const x = sx + PAD, y = sy + PAD; sx += w + 2 * PAD; sh = Math.max(sh, h + 2 * PAD);
    if (y + h > AT) throw new Error('Atlas voll'); return { x, y, w, h, uv: [x / AT, 1 - (y + h) / AT, (x + w) / AT, 1 - y / AT] }; }
  const INK = '#3A3632', FAS = new Map();
  function fassade(art, base, w, h) {             // w, h in Welt-Einheiten (24 px je Einheit)
    const pw = Math.max(24, Math.min(640, Math.round(w * 24))), ph = Math.max(16, Math.min(640, Math.round(h * 24))), key = art + base + pw + 'x' + ph;
    if (FAS.has(key)) return FAS.get(key).uv; const r = platz(pw, ph);
    g.save(); g.fillStyle = base; g.fillRect(r.x - PAD, r.y - PAD, pw + 2 * PAD, ph + 2 * PAD); g.translate(r.x, r.y); g.strokeStyle = INK; g.lineWidth = 1.5;
    if (art === 'halle_glas') {              // Glasfront: Pfosten-Riegel, unten drei Türöffnungen
      g.fillStyle = '#B9CAD8'; g.fillRect(6, 6, pw - 12, ph - 12); g.strokeRect(6, 6, pw - 12, ph - 12);
      const nx = Math.max(4, Math.round(pw / 22)); for (let i = 1; i < nx; i++) { g.beginPath(); g.moveTo(6 + i * (pw - 12) / nx, 6); g.lineTo(6 + i * (pw - 12) / nx, ph - 6); g.stroke(); }
      g.beginPath(); g.moveTo(6, ph * .42); g.lineTo(pw - 6, ph * .42); g.stroke();
      g.fillStyle = '#5E6B75'; for (const f of [.3, .5, .7]) { g.fillRect(pw * f - 8, ph - 6 - ph * .3, 16, ph * .3); g.strokeRect(pw * f - 8, ph - 6 - ph * .3, 16, ph * .3); } }
    else if (art === 'halle_band') { g.fillStyle = '#9DB4C8'; g.fillRect(6, ph * .18, pw - 12, ph * .26); g.strokeRect(6, ph * .18, pw - 12, ph * .26);
      const nx = Math.max(3, Math.round(pw / 26)); for (let i = 1; i < nx; i++) { g.beginPath(); g.moveTo(6 + i * (pw - 12) / nx, ph * .18); g.lineTo(6 + i * (pw - 12) / nx, ph * .44); g.stroke(); } }
    else if (art === 'band_glas') { g.fillStyle = '#B9CAD8'; g.fillRect(2, 2, pw - 4, ph - 4); const nx = Math.max(2, Math.round(pw / 18)); for (let i = 1; i < nx; i++) { g.beginPath(); g.moveTo(i * pw / nx, 2); g.lineTo(i * pw / nx, ph - 2); g.stroke(); } }
    g.lineWidth = 2; g.strokeRect(1, 1, pw - 2, ph - 2); g.restore(); FAS.set(key, r); return r.uv; }
  const SCHRIFT = '"M PLUS Rounded W", "Nunito W", "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", system-ui, sans-serif';
  function pikto(art, x, y, s) {             // dünne Tuschelinien
    g.save(); g.translate(x, y); g.strokeStyle = INK; g.lineWidth = Math.max(2, s * .06); g.lineCap = g.lineJoin = 'round';
    if (art === 'zug') { const w = s * .62, h = s * .62, x0 = (s - w) / 2, y0 = s * .1; g.beginPath(); g.roundRect ? g.roundRect(x0, y0, w, h, s * .12) : g.rect(x0, y0, w, h); g.stroke();
      g.strokeRect(x0 + w * .16, y0 + h * .16, w * .68, h * .32); g.beginPath(); g.arc(x0 + w * .28, y0 + h * .76, s * .04, 0, 7); g.arc(x0 + w * .72, y0 + h * .76, s * .04, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(x0 + w * .2, y0 + h + s * .04); g.lineTo(x0 - s * .02, s * .94); g.moveTo(x0 + w * .8, y0 + h + s * .04); g.lineTo(x0 + w + s * .02, s * .94); g.stroke(); }
    else if (art === 'uhr') { g.beginPath(); g.arc(s / 2, s / 2, s * .4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(s / 2, s / 2); g.lineTo(s / 2, s * .2); g.moveTo(s / 2, s / 2); g.lineTo(s * .72, s * .58); g.stroke();
      g.strokeStyle = '#C0614A'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(s / 2 + Math.cos(a) * s * .34, s / 2 + Math.sin(a) * s * .34); g.lineTo(s / 2 + Math.cos(a) * s * .38, s / 2 + Math.sin(a) * s * .38); g.stroke(); } }
    g.restore(); }
  function schildBild(s) {
    const ppf = 560, pw = Math.round(s.b * ppf), ph = Math.round(s.h * ppf), r = platz(pw, ph);
    const zeichne = () => { g.save(); g.translate(r.x, r.y); g.fillStyle = s.grund; g.fillRect(-PAD, -PAD, pw + 2 * PAD, ph + 2 * PAD);
      g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(1.5, 1.5, pw - 3, ph - 3);
      if (!s.text) { pikto(s.pikto, 0, 0, Math.min(pw, ph)); g.restore(); return; }
      g.fillStyle = '#C0614A'; g.fillRect(3, ph - 3 - ph * .1, pw - 6, ph * .1);                          // Akzentlinie
      const p = ph * .78; if (s.pikto) pikto(s.pikto, ph * .1, ph * .06, p);
      const x0 = s.pikto ? ph * .1 + p + ph * .12 : ph * .2; g.fillStyle = s.schrift; g.textBaseline = 'alphabetic';
      let fs = ph * .52; g.font = `800 ${fs}px ${SCHRIFT}`; while (g.measureText(s.text).width > pw * .5 && fs > 8) g.font = `800 ${fs -= 2}px ${SCHRIFT}`;
      g.fillText(s.text, x0, ph * .62); const tw = g.measureText(s.text).width;
      if (s.unter) { let f2 = ph * .26; g.font = `700 ${f2}px ${SCHRIFT}`; while (g.measureText(s.unter).width > pw - x0 - tw - ph * .3 && f2 > 6) g.font = `700 ${f2 -= 1}px ${SCHRIFT}`; g.fillText(s.unter, x0 + tw + ph * .2, ph * .6); }
      g.restore(); };
    zeichne(); return { uv: r.uv, zeichne }; }
  const AT_TEX = canvasTex(AC);
  // ---------- Geometrie-Sammler ----------
  const B = { P: [], N: [], U: [], C: [], I: [] };
  function add(gq, mtx, farbe, region, ohneGruppe = -1) {   // ohneGruppe: Index-Gruppe weglassen (3 = −y-Unterseite bodenstehender Quader, nie sichtbar)
    const gg = gq.clone().applyMatrix4(mtx), p = gg.attributes.position, nn = gg.attributes.normal, uv = gg.attributes.uv, base = B.P.length / 3;
    const vg = new Int8Array(p.count); if (gg.index && gg.groups.length) for (const gr of gg.groups) for (let k = gr.start; k < gr.start + gr.count; k++) vg[gg.index.getX(k)] = gr.materialIndex;
    for (let i = 0; i < p.count; i++) { B.P.push(p.getX(i), p.getY(i), p.getZ(i)); B.N.push(nn.getX(i), nn.getY(i), nn.getZ(i));
      const r = region ? region(vg[i]) : null;
      if (r) { B.U.push(r[0] + uv.getX(i) * (r[2] - r[0]), r[1] + uv.getY(i) * (r[3] - r[1])); c3.set('#ffffff'); } else { B.U.push(WEISS[0], WEISS[1]); c3.set(farbe); }
      B.C.push(c3.r, c3.g, c3.b); }
    const weg = ohneGruppe >= 0 && gg.groups.find(gr => gr.materialIndex === ohneGruppe);
    if (gg.index) { for (let k = 0; k < gg.index.count; k++) if (!weg || k < weg.start || k >= weg.start + weg.count) B.I.push(base + gg.index.getX(k)); } else for (let k = 0; k < p.count; k++) B.I.push(base + k);
    gg.dispose(); }
  const quaderMatrix = t => { e1.set(-(t.nq || 0), -(t.w || 0), t.n || 0, 'YZX'); q1.setFromEuler(e1);
    return m4.compose(v3.set(X(t.cx), Y((t.z0 + t.z1) / 2), Z(t.cy)), q1, s3.set(Math.max(t.l * F, .005), Math.max((t.z1 - t.z0) * F, .005), Math.max(t.b * F, .005))); };
  for (const t of V.teile) {
    const mtx = quaderMatrix(t);
    if (t.fassade) { const h = (t.z1 - t.z0) * F, ro = t.fassade.o ? fassade(t.fassade.o, t.farbe, t.b * F, h) : null, rs = t.fassade.s ? fassade(t.fassade.s, t.farbe, t.l * F, h) : null;
      add(BOX, mtx, t.farbe, gi => gi === 0 ? ro : gi === 4 ? rs : null, t.z0 <= .005 ? 3 : -1); }
    else add(BOX, mtx, t.farbe, null, t.z0 <= .005 && !t.n && !t.nq ? 3 : -1);   // Budget WB R3: Unterseite am Boden (z0 ≤ 0,005) fällt weg – die Kamera (fest, 35° von oben) sieht sie nie
  }
  const ZYL = new Map(); const zylGeo = (r0, r1, seg) => { const k = r0 + '|' + r1 + '|' + seg; if (!ZYL.has(k)) ZYL.set(k, geo(new THREE.CylinderGeometry(r1 * F, r0 * F, 1, seg))); return ZYL.get(k); };
  for (const c of V.zylinder) { m4.compose(v3.set(X(c.x), Y((c.z0 + c.z1) / 2), Z(c.y)), q1.identity(), s3.set(1, Math.max((c.z1 - c.z0) * F, .005), 1)); add(zylGeo(c.r0, c.r1, c.seg || 8), m4, c.farbe, null); }
  // Bäume wie im Spiel (world.js Parkbäume): Krone Ikosaeder Stufe 0 (20 Dreiecke), Stamm offener 5-Kant (10) – Budget WB R3 (vorher 80 + 24)
  { const st = geo(new THREE.CylinderGeometry(.09, .12, 1.2, 5, 1, true).translate(0, .6, 0)), kr = geo(new THREE.IcosahedronGeometry(.75, 0).translate(0, 1.75, 0));
    for (const b of V.baeume) { m4.compose(v3.set(X(b.x), Y(b.z || 0), Z(b.y)), q1.identity(), s3.set(b.s, b.s, b.s)); add(st, m4, V.farben.stamm, null); add(kr, m4, V.farben.gruen, null); } }
  // Zebras: weiße Balken parallel zur Fahrbahn (quer zur Gehrichtung), 0,5 m breit, 0,5 m Abstand
  for (const z of V.zebras || []) { const along = z.richtung === 'y', len = along ? z.y1 - z.y0 : z.x1 - z.x0, k = Math.floor(len / .1);
    for (let i = 0; i < k; i++) { const c = (along ? z.y0 : z.x0) + (i + .5) * len / k;
      const cx = along ? (z.x0 + z.x1) / 2 : c, cy = along ? c : (z.y0 + z.y1) / 2, w = along ? (z.x1 - z.x0) : .05, d = along ? .05 : (z.y1 - z.y0);
      m4.compose(v3.set(X(cx), bodenY + .012, Z(cy)), q1.setFromEuler(e1.set(-Math.PI / 2, 0, 0)), s3.set(w * F, d * F, 1)); add(PG, m4, '#F7F4EE', null); } }
  // Schilder (Atlas)
  const SCHILDER = [];
  for (const s of V.schilder) { const sb = schildBild(s); SCHILDER.push(sb); const ry = s.blick === 'o' ? Math.PI / 2 : 0;
    m4.compose(v3.set(X(s.cx), Y(s.z), Z(s.cy)), q1.setFromEuler(e1.set(0, ry, 0)), s3.set(s.b * F, s.h * F, 1)); add(PG, m4, '#fff', () => sb.uv); }
  // Bildschirme: Rahmen (Statik) + Bildfläche (Atlas-Mesh bzw. Live-Mesh)
  const LIVE = [], ATL = [];
  for (const s of V.schirme) { const ry = s.blick === 'o' ? Math.PI / 2 : 0, nx = s.blick === 'o' ? 1 : 0, nz = 1 - nx, px = X(s.cx), py = Y(s.z), pz = Z(s.cy), rb = s.rahmen * F * 2;
    q1.setFromEuler(e1.set(0, ry, 0)); m4.compose(v3.set(px + nx * .004, py, pz + nz * .004), q1, s3.set(s.b * F + rb, s.h * F + rb, 1)); add(PG, m4, INK, null);
    (s.bild === 'live' && schirm1 ? LIVE : ATL).push({ s, mtx: new THREE.Matrix4().compose(new THREE.Vector3(px + nx * .02, py, pz + nz * .02), q1.clone(), new THREE.Vector3(s.b * F, s.h * F, 1)) }); }
  const SMAT = mat(new THREE.MeshLambertMaterial({ map: AT_TEX, vertexColors: true }));
  { const gq = geo(new THREE.BufferGeometry()); gq.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); gq.setAttribute('normal', new THREE.Float32BufferAttribute(B.N, 3));
    gq.setAttribute('uv', new THREE.Float32BufferAttribute(B.U, 2)); gq.setAttribute('color', new THREE.Float32BufferAttribute(B.C, 3)); gq.setIndex(B.I); gq.computeBoundingSphere(); gq.computeBoundingBox();
    const m = new THREE.Mesh(gq, SMAT); m.name = (V.stadt || 'stadt') + '-statik'; m.castShadow = schatten; m.receiveShadow = true; meshes.push(m); }
  // ---------- Steinschüttung (WB R3 O3): EIN InstancedMesh, Farbe je Instanz. Die Kamera ist fest (world.js CAM yaw 45°, elev 35°, enableRotate=false),
  // sie sieht nur +x, +y, +z eines Quaders, solange die Drehung |w| < 45° bleibt (Steine: ±0,35 rad) ⇒ nur diese 3 Seiten (6 Dreiecke). Steine werfen keinen Schatten.
  if ((V.steine || []).length) {
    const sg = new THREE.BoxGeometry(1, 1, 1), idx = [...sg.index.array], wmax = Math.max(...V.steine.map(s => Math.abs(s[4])));
    const behalten = wmax < Math.PI / 4 - .05 ? [0, 2, 4] : [0, 1, 2, 4, 5];               // BoxGeometry-Gruppen: 0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z
    sg.setIndex(sg.groups.filter(gr => behalten.includes(gr.materialIndex)).flatMap(gr => idx.slice(gr.start, gr.start + gr.count))); sg.clearGroups(); geo(sg);
    const sm = new THREE.InstancedMesh(sg, mat(new THREE.MeshLambertMaterial({ color: '#ffffff' })), V.steine.length);
    V.steine.forEach(([cx, cy, l, b, w, z0, z1, farbe], i) => { sm.setMatrixAt(i, quaderMatrix({ cx, cy, l, b, w, z0, z1 })); sm.setColorAt(i, c3.set(farbe)); });
    sm.instanceMatrix.needsUpdate = true; sm.instanceColor.needsUpdate = true; sm.computeBoundingSphere(); sm.castShadow = false; sm.receiveShadow = true;
    sm.name = (V.stadt || 'stadt') + '-steinschuettung'; meshes.push(sm); }
  const SCR = [];
  function schirmMesh(liste, t, region, name) {
    const P = [], U = [], I = []; liste.forEach((e, k) => { const gg = PG.clone().applyMatrix4(e.mtx), r = region(k), base = P.length / 3;
      for (let i = 0; i < 4; i++) { P.push(gg.attributes.position.getX(i), gg.attributes.position.getY(i), gg.attributes.position.getZ(i)); U.push(r[0] + gg.attributes.uv.getX(i) * (r[2] - r[0]), r[1] + gg.attributes.uv.getY(i) * (r[3] - r[1])); }
      for (let k2 = 0; k2 < gg.index.count; k2++) I.push(base + gg.index.getX(k2)); gg.dispose(); });
    const gq = geo(new THREE.BufferGeometry()); gq.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gq.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); gq.setIndex(I);
    const m = new THREE.Mesh(gq, mat(new THREE.MeshBasicMaterial({ map: t }))); m.name = name; meshes.push(m);
    const fr = liste[0].s.frames; t.repeat.set(1 / fr, 1); SCR.push({ t, n: fr, dauer: liste[0].s.frame_s }); }
  // Alle Bildschirme in EINER Textur/EINEM Mesh (WB R3: spart 1 Draw Call für die Steinschüttung). Zeile 0 = Live-Schirm der Spielerkette
  // (Kopie von schirm1.image, neu kopiert, sobald schirm1.version wechselt – spielerSchirmLive() zeichnet nur bei Fonts/Logo/Bildern neu),
  // Zeilen 1… = Marken-Streifen. Alle Streifen 1536×288 mit 3 Frames nebeneinander und gleicher Frame-Dauer ⇒ ein gemeinsamer offset.x.
  let LIVE_KOPIE = null;
  { const ALLE = [...LIVE, ...ATL], k = ALLE.length;
    if (k) { const SC = document.createElement('canvas'); SC.width = 1536; SC.height = 288 * k; const st = canvasTex(SC), sg = SC.getContext('2d');
      ATL.forEach((e, i) => bild(e.s.bild).then(im => { if (im) { sg.drawImage(im, 0, (i + LIVE.length) * 288, 1536, 288); st.needsUpdate = true; } }));
      if (LIVE.length) { let ver = -1; LIVE_KOPIE = () => { if (schirm1.version === ver || !schirm1.image) return; ver = schirm1.version;
        sg.clearRect(0, 0, 1536, 288); sg.drawImage(schirm1.image, 0, 0, 1536, 288); st.needsUpdate = true; }; LIVE_KOPIE(); }
      const fr = new Set(ALLE.map(e => e.s.frames + '/' + e.s.frame_s)); if (fr.size > 1) console.warn('Bildschirme mit verschiedenen Frames:', [...fr]);
      schirmMesh(ALLE, st, i => [0, 1 - (i + 1) / k, 1, 1 - i / k], 'bildschirme'); } }
  // Schrift kann später laden → Schilder neu zeichnen
  if (document.fonts) document.fonts.ready.then(() => { for (const s of SCHILDER) s.zeichne(); AT_TEX.needsUpdate = true; }, () => { });
  return {
    meshes,
    update(T) { if (LIVE_KOPIE) LIVE_KOPIE(); for (const s of SCR) s.t.offset.x = (Math.floor(T / s.dauer) % s.n) / s.n; },
    entfernen() { for (const m of meshes) m.removeFromParent(); for (const x of GEOS) x.dispose(); for (const x of MATS) x.dispose(); for (const x of TEX) if (x !== schirm1) x.dispose(); },
    info: () => ({ quader: V.teile.length, steine: (V.steine || []).length, zylinder: V.zylinder.length, baeume: V.baeume.length, schilder: V.schilder.length, schirme: V.schirme.length, fassaden: FAS.size })
  };
}
