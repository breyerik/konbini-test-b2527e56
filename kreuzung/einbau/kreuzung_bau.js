// Shibuya-Kreuzung V7 – Bausatz (Yuki, Runde 4b). Baut Boden, Gebäude, Hochbahn, Bildschirme, Bäume, Ampeln, Hachiko und die Menge
// aus bauvorlage_shibuya.json + wege_phasen.json (Variante A ODER B – derselbe Bausatz). Benutzt von vorschau/vorschau.html UND von der
// Spiel-Vorschau (vorschau/spiel_einbau_vorschau.js) – also genau ein Stand. Vorschlag für Frankys Einbau (world.js liest nur, ändert nichts).
// Koordinaten: Gruppe sitzt auf dem Ursprung der Meter-Koordinaten (bauvorlage „kreuzungsmitte“); Kinder in Welt-Einheiten (m × F/10).
//   baueKreuzung(THREE, { basis, vorlage, wege, figuren:'lowpoly'|'sprites', n, ampeln, schirm1, kamera, zug })
//   → { gruppe, menge, update(dt), zug, info(), entfernen() }   update(dt) einmal je Frame (dt in s, intern auf 0,1 s begrenzt).
//
// Runde 4b – Draw Calls (Whitebeard B1, Grenze 200, Ziel ≤ 180 für die GANZE Szene): alles Statische ist EIN Mesh.
//   1 Boden · 1 Statik (alle Quader, Fassaden über einen Canvas-Atlas, Rahmen, Bäume, Ampeln inkl. Leuchten über Vertex-Farben,
//   Bahn-Piktogramm, Hachiko als kamerazugewandte Tafel – die Spielkamera dreht nicht) · 1 Zug (eigenes Mesh, abschaltbar: zug:false)
//   · 1 Bildschirm-Atlas (s2–s4 in einer Textur, gemeinsamer Frame-Versatz) · 1 Spielerketten-Bildschirm (Live-Canvas)
//   · 1 Figuren (EIN InstancedMesh für alle 140, Farben je Instanz und Körperteil im Shader) ⇒ 6 Calls, +2 im Schattenpass (Statik, Zug).
import { erzeugeMenge, schritt, phaseBei } from './kreuzung_wege.mjs';
export const F = 4.0625, M = F / 10;
export function baueKreuzung(THREE, { basis, vorlage, wege: W, figuren = 'lowpoly', n = 110, bummler = 14, passanten = null, ampeln = true, schirm1 = null, schatten = true, zeigeAbZoom = 1.5, kamera = null, zug: mitZug = true } = {}) {
  const L = vorlage.wahrzeichen[0], G = new THREE.Group(); G.name = 'shibuya-kreuzung-yuki';
  const fm = v => (v * 10 - 20) * M;                       // Feld-Koordinate der Vorlage → Welt relativ zum Ursprung
  const TL = new THREE.TextureLoader(), TEX = new Set(), MATS = new Set(), GEOS = new Set();
  const tex = (u, ok) => { const t = TL.load(basis + u, ok); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX.add(t); return t; };
  const mat = m => (MATS.add(m), m), geo = g => (GEOS.add(g), g);
  const bild = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = basis + u; });
  const PG = geo(new THREE.PlaneGeometry(1, 1)), BOX = geo(new THREE.BoxGeometry(1, 1, 1));
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), e1 = new THREE.Euler(), c3 = new THREE.Color();
  // ---------- Boden (1 Call; transparent auf bebaut-Feldern) ----------
  { const b = L.boden, w = b.b * F, d = b.t * F;
    const m = new THREE.Mesh(PG, mat(new THREE.MeshLambertMaterial({ map: tex(b.textur), transparent: true, alphaTest: .5 })));
    m.scale.set(w, d, 1); m.rotation.x = -Math.PI / 2; m.position.set(fm(b.x) + w / 2, .03, fm(b.y) + d / 2); m.receiveShadow = true; m.name = 'boden'; G.add(m); }
  // ---------- Atlas (Canvas 2048²): weißes Feld für einfarbige Teile + Fassaden + Piktogramm + Hachiko ----------
  const AT = 2048, AC = document.createElement('canvas'); AC.width = AC.height = AT; const g = AC.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 32);
  const WEISS = [16 / AT, 1 - 16 / AT], PAD = 6;
  let sx = 40, sy = 0, sh = 40;
  function platz(w, h) {
    if (sx + w + 2 * PAD > AT) { sx = 0; sy += sh; sh = 0; }
    const x = sx + PAD, y = sy + PAD; sx += w + 2 * PAD; sh = Math.max(sh, h + 2 * PAD);
    if (y + h > AT) throw new Error('Atlas voll');
    return { x, y, w, h, uv: [x / AT, 1 - (y + h) / AT, (x + w) / AT, 1 - y / AT] };
  }
  const FAS = new Map();
  function fassade(w, h, base, art) {          // w,h in Welt-Einheiten; Zeichnung wie Runde 4 (Fenster/Band/Laden), 24 px je Einheit
    const key = art + base + Math.round(w * 4) + 'x' + Math.round(h * 4); if (FAS.has(key)) return FAS.get(key).uv;
    const pw = Math.max(24, Math.min(512, Math.round(w * 24))), ph = Math.max(24, Math.min(768, Math.round(h * 24))), r = platz(pw, ph);
    g.save(); g.fillStyle = base; g.fillRect(r.x - PAD, r.y - PAD, pw + 2 * PAD, ph + 2 * PAD); g.translate(r.x, r.y);
    g.strokeStyle = '#3A3632'; g.lineWidth = 1.5;
    if (art === 'band') { const ny = Math.max(1, Math.round(h / 1.2)); for (let j = 0; j < ny; j++) { const ch = ph / ny; g.fillStyle = '#9DB4C8'; g.fillRect(4, j * ch + ch * .3, pw - 8, ch * .38); g.strokeRect(4, j * ch + ch * .3, pw - 8, ch * .38); } }
    else if (art === 'laden') { g.fillStyle = '#C7D5E0'; g.fillRect(5, ph * .35, pw - 10, ph * .6); g.strokeRect(5, ph * .35, pw - 10, ph * .6); }
    else { const nx = Math.max(3, Math.round(w / 1.1)), ny = Math.max(2, Math.round(h / 1.0));
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const cw = pw / nx, ch = ph / ny; g.fillStyle = (i + j * 3) % 5 ? '#9DB4C8' : '#C7D5E0'; g.fillRect(i * cw + cw * .18, j * ch + ch * .2, cw * .64, ch * .55); g.strokeRect(i * cw + cw * .18, j * ch + ch * .2, cw * .64, ch * .55); } }
    g.lineWidth = 2; g.strokeRect(1, 1, pw - 2, ph - 2); g.restore();
    FAS.set(key, r); return r.uv;
  }
  const AT_TEX = new THREE.CanvasTexture(AC); AT_TEX.colorSpace = THREE.SRGBColorSpace; AT_TEX.anisotropy = 8; TEX.add(AT_TEX);
  const bildInAtlas = (u, px) => { const r = platz(px, px); bild(u).then(i => { if (i) { g.drawImage(i, r.x, r.y, px, px); AT_TEX.needsUpdate = true; } }); return r.uv; };
  // ---------- Geometrie-Sammler (ein Mesh je Sammler) ----------
  const neu = () => ({ P: [], N: [], U: [], C: [], I: [] }), STAT = neu(), ZUGB = neu();
  function add(B, gq, mtx, farbe, region, normalOben = false) {   // region(gruppe) → uv-Rechteck oder null (= weiß + Vertex-Farbe)
    const gg = gq.clone().applyMatrix4(mtx), p = gg.attributes.position, nn = gg.attributes.normal, uv = gg.attributes.uv, base = B.P.length / 3;
    const vg = new Int8Array(p.count); if (gg.index && gg.groups.length) for (const gr of gg.groups) for (let k = gr.start; k < gr.start + gr.count; k++) vg[gg.index.getX(k)] = gr.materialIndex;
    for (let i = 0; i < p.count; i++) {
      B.P.push(p.getX(i), p.getY(i), p.getZ(i)); if (normalOben) B.N.push(0, 1, 0); else B.N.push(nn.getX(i), nn.getY(i), nn.getZ(i));
      const r = region ? region(vg[i]) : null;
      if (r) { B.U.push(r[0] + uv.getX(i) * (r[2] - r[0]), r[1] + uv.getY(i) * (r[3] - r[1])); c3.set('#ffffff'); }
      else { B.U.push(WEISS[0], WEISS[1]); c3.set(farbe); }
      B.C.push(c3.r, c3.g, c3.b);
    }
    if (gg.index) for (let k = 0; k < gg.index.count; k++) B.I.push(base + gg.index.getX(k)); else for (let k = 0; k < p.count; k++) B.I.push(base + k);
    gg.dispose(); return [base, p.count];
  }
  const quader = (B, x, y, z, w, h, d, farbe, region) => { m4.compose(v3.set(x, y, z), q0, s3.set(Math.max(w, .01), Math.max(h, .01), Math.max(d, .01))); return add(B, BOX, m4, farbe, region); };
  // Gebäude, Viadukt, Zug, Hecken …
  for (const t of L.teile) {
    if (t.rolle === 'zug' && !mitZug) continue;
    const w = t.b * F, d = t.t * F, h = t.h * F, B = t.rolle === 'zug' ? ZUGB : STAT, x = fm(t.x) + w / 2, y = t.z * F + h / 2 + .03, z = fm(t.y) + d / 2;
    if (t.fassade) { const rx = fassade(d, h, t.farbe, t.fassade), rz = fassade(w, h, t.farbe, t.fassade); quader(B, x, y, z, w, h, d, '#D8D1C3', gi => gi < 2 ? rx : gi > 3 ? rz : null); }
    else quader(B, x, y, z, w, h, d, t.farbe, null);
  }
  // Bildschirme: Rahmen → Statik; Bildflächen → 1 Atlas-Mesh (s2–s4) + 1 Live-Mesh (s1)
  const SCR_ATLAS = [], SCR_LIVE = [];
  for (const s of L.bildschirme) {
    const w = s.b * F, h = s.h * F, ry = s.seite === '+x' ? Math.PI / 2 : 0, nx = s.seite === '+x' ? 1 : 0, nz = 1 - nx, px = fm(s.mitte.x), py = s.mitte.z * F, pz = fm(s.mitte.y);
    q1.setFromEuler(e1.set(0, ry, 0)); const rb = s.rahmen_breite * F * 2;
    m4.compose(v3.set(px + nx * .02, py, pz + nz * .02), q1, s3.set(w + rb, h + rb, 1)); add(STAT, PG, m4, s.rahmen || '#3A3632', null);
    const ziel = s.textur_laufzeit && schirm1 ? SCR_LIVE : SCR_ATLAS; ziel.push({ s, mtx: new THREE.Matrix4().compose(new THREE.Vector3(px + nx * .04, py, pz + nz * .04), q1.clone(), new THREE.Vector3(w, h, 1)) });
  }
  const SCR = [];
  function schirmMesh(liste, t, region) {
    const B = neu(); liste.forEach((e, k) => add(B, PG, e.mtx, '#ffffff', () => region(k)));
    const gq = geo(new THREE.BufferGeometry()); gq.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); gq.setAttribute('uv', new THREE.Float32BufferAttribute(B.U, 2)); gq.setIndex(B.I);
    const m = new THREE.Mesh(gq, mat(new THREE.MeshBasicMaterial({ map: t }))); m.name = 'Bildschirme'; G.add(m);
    const fr = liste[0].s.frames, du = liste[0].s.frame_s; if (liste.some(e => e.s.frames !== fr || e.s.frame_s !== du)) throw new Error('Bildschirme im Atlas brauchen gleiche frames/frame_s');
    t.repeat.set(1 / fr, 1); SCR.push({ t, n: fr, dauer: du }); return m;
  }
  if (SCR_LIVE.length) schirmMesh(SCR_LIVE, schirm1, () => [0, 0, 1, 1]);
  if (SCR_ATLAS.length) {          // Streifen (1536 × 288) untereinander in EINE Textur
    const k = SCR_ATLAS.length, SC = document.createElement('canvas'); SC.width = 1536; SC.height = 288 * k;
    const st = new THREE.CanvasTexture(SC); st.colorSpace = THREE.SRGBColorSpace; st.anisotropy = 8; TEX.add(st);
    SCR_ATLAS.forEach((e, i) => bild(e.s.textur).then(im => { if (im) { SC.getContext('2d').drawImage(im, 0, i * 288, 1536, 288); st.needsUpdate = true; } }));
    schirmMesh(SCR_ATLAS, st, i => [0, 1 - (i + 1) / k, 1, 1 - i / k]);
  }
  // Schilder (Bahn-Piktogramm) → Statik über den Atlas
  for (const s of L.schilder || []) { const r = bildInAtlas(s.textur, 128), nx = s.seite === '+x' ? 1 : 0;
    q1.setFromEuler(e1.set(0, s.seite === '+x' ? Math.PI / 2 : 0, 0)); m4.compose(v3.set(fm(s.mitte.x) + nx * .03, s.mitte.z * F, fm(s.mitte.y) + (1 - nx) * .03), q1, s3.set(s.b * F, s.h * F, 1)); add(STAT, PG, m4, '#fff', () => r); }
  // Bäume (Stamm + Krone) → Statik
  { const st = geo(new THREE.CylinderGeometry(.09, .12, 1.2, 6).translate(0, .6, 0)), kr = geo(new THREE.IcosahedronGeometry(.75, 1).translate(0, 1.75, 0));
    for (const b of L.baeume) { m4.makeTranslation(fm(b.x), .03, fm(b.y)); add(STAT, st, m4, '#8A6A4A', null); add(STAT, kr, m4, '#7FA34A', null); } }
  // Hachiko: Tafel zur (festen) Spielkamera → Statik. Ohne Kamera (Draufsicht-Vorschau) als Sprite (+1 Call).
  for (const s of L.sprites || []) {
    const w = s.groesse_felder[0] * F, h = s.groesse_felder[1] * F;
    if (kamera) { const r = bildInAtlas(s.textur, 256), gq = PG.clone().translate(.5 - s.center[0], .5 - s.center[1], 0); kamera.updateMatrixWorld();
      m4.compose(v3.set(fm(s.x), .03, fm(s.y)), kamera.getWorldQuaternion(q1), s3.set(w, h, 1)); add(STAT, gq, m4, '#fff', () => r, true); gq.dispose(); }
    else { const sp = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: tex(s.textur), transparent: true, alphaTest: .05 }))); sp.center.set(s.center[0], s.center[1]); sp.scale.set(w, h, 1); sp.position.set(fm(s.x), .03, fm(s.y)); G.add(sp); }
  }
  // Ampeln (Mast, Kopf, 2 Leuchten je Standort) → Statik; Leuchtfarben = Vertex-Farben, beim Phasenwechsel umgeschrieben
  const EA = L.ebene_ampeln, LAMPEN = { rot: [], gruen: [] };
  if (ampeln) { const mast = geo(new THREE.CylinderGeometry(EA.mast.d / 2 * F, EA.mast.d / 2 * F, EA.mast.h * F, 6).translate(0, EA.mast.h * F / 2, 0));
    for (const a of W.ampeln) { const x = a.x * M, z = a.z * M; m4.makeTranslation(x, .03, z); add(STAT, mast, m4, EA.mast.farbe, null);
      quader(STAT, x, .03 + EA.kopf.z * F + EA.kopf.h * F / 2, z, EA.kopf.b * F, EA.kopf.h * F, EA.kopf.t * F, EA.kopf.farbe, null);
      for (const [k, l] of [['rot', EA.leuchte_rot], ['gruen', EA.leuchte_gruen]]) LAMPEN[k].push(quader(STAT, x, .03 + l.z * F + l.h * F / 2, z, l.b * F * 1.02, l.h * F, l.t * F * 1.02, l.an, null)); } }
  // Sammler → Meshes (gemeinsames Material: Lambert + Atlas + Vertex-Farben)
  const SMAT = mat(new THREE.MeshLambertMaterial({ map: AT_TEX, vertexColors: true, alphaTest: .5 }));
  function mesh(B, name) { const gq = geo(new THREE.BufferGeometry());
    gq.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); gq.setAttribute('normal', new THREE.Float32BufferAttribute(B.N, 3));
    gq.setAttribute('uv', new THREE.Float32BufferAttribute(B.U, 2)); gq.setAttribute('color', new THREE.Float32BufferAttribute(B.C, 3)); gq.setIndex(B.I); gq.computeBoundingSphere();
    const m = new THREE.Mesh(gq, SMAT); m.name = name; m.castShadow = schatten; m.receiveShadow = true; G.add(m); return m; }
  const statik = mesh(STAT, 'statik'), zugMesh = ZUGB.P.length ? mesh(ZUGB, 'zug') : null;
  const FARB = statik.geometry.attributes.color;
  function lampen(gruen) { for (const [k, l] of [['rot', EA.leuchte_rot], ['gruen', EA.leuchte_gruen]]) { c3.set((k === 'gruen') === gruen ? l.an : l.aus);
      for (const [b, n] of LAMPEN[k]) for (let i = b; i < b + n; i++) FARB.setXYZ(i, c3.r, c3.g, c3.b); }
    FARB.needsUpdate = true; }
  // ---------- Menge ----------
  const MENGE = erzeugeMenge(W, { n, bummler, passanten }), LEUTE = MENGE.leute, N = LEUTE.length;
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), lv = new THREE.Vector3(), ls = new THREE.Vector3(1.25, 1.25, 1.25);
  let zeichne, figurMesh;
  if (figuren !== 'sprites') {
    // Standard: Low-Poly-Figuren des Spiels (Maße + Farben wie world.js pLegs/pBody/pHead/pHair; dort nur gelesen) – EIN InstancedMesh,
    // Körperteil je Vertex (Attribut „teil“), 4 Farben je Instanz (c0 Beine, c1 Körper, c2 Haut, c3 Haar).
    // Runde 4b – Dreiecke (Grenze 100 000 für die ganze Szene; ungünstigster Fall Tablet-Zoom 1,5): 48 statt 92 Dreiecke je Figur –
    // Beine EIN Quader (Spalt als dunkle Mitte entfällt), Körper inkl. Arme EIN Quader (Breite wie mit Armen), Kopf Ikosaeder wie im Spiel,
    // Haar-Quader; die Unterseiten der Quader (−y) fallen weg, die Spielkamera sieht sie nie.
    const ohneBoden = x => { const nn = x.toNonIndexed(), pa = nn.attributes.position.array, na = nn.attributes.normal.array, keep = [];
      for (let v = 0; v < nn.attributes.position.count; v += 3) if (!(na[v * 3 + 1] < -.9)) keep.push(v);
      const g2 = new THREE.BufferGeometry(), P2 = [], N2 = []; for (const v of keep) for (let k = 0; k < 9; k++) { P2.push(pa[v * 3 + k]); N2.push(na[v * 3 + k]); }
      g2.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g2.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3)); x.dispose(); nn.dispose(); return g2; };
    const teile = [[ohneBoden(new THREE.BoxGeometry(.205, .22, .1).translate(0, .11, 0))], [ohneBoden(new THREE.BoxGeometry(.30, .25, .15).translate(0, .345, 0))],
      [new THREE.IcosahedronGeometry(.1, 0).translate(0, .57, 0)], [ohneBoden(new THREE.BoxGeometry(.19, .07, .19).translate(0, .645, -.01))]];
    const P = [], Nn = [], T = []; teile.forEach((gs, ti) => gs.forEach(x => { const nn = x.index ? x.toNonIndexed() : x; P.push(...nn.attributes.position.array); Nn.push(...nn.attributes.normal.array); for (let i = 0; i < nn.attributes.position.count; i++) T.push(ti); x.dispose(); }));
    const fg = geo(new THREE.BufferGeometry()); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); fg.setAttribute('teil', new THREE.Float32BufferAttribute(T, 1));
    const PCOL = ['#E94F4F', '#3D7BD9', '#FFC93C', '#5DBB73', '#F7A1B5', '#F2EFE6', '#8E5BD1', '#FF8A3D', '#2E9C9C', '#F5F5F5'], LCOL = ['#2B2D42', '#3B4A6B', '#5A4636', '#6B6B6B', '#1F3A5F'], SKIN = ['#F6D2B4', '#EBC09A', '#D9A77E', '#F2C9A6'], HAIR = ['#2B2D42', '#1E1E24', '#5A3B26', '#8A5A35', '#C9C3BA'];
    [[LCOL, 3], [PCOL, 7], [SKIN, 5], [HAIR, 11]].forEach(([pal, k], ti) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) { c3.set(pal[(i * k) % pal.length]); a.set([c3.r, c3.g, c3.b], i * 3); } fg.setAttribute('c' + ti, new THREE.InstancedBufferAttribute(a, 3)); });
    const pm = mat(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
    pm.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float teil; attribute vec3 c0; attribute vec3 c1; attribute vec3 c2; attribute vec3 c3; varying vec3 vFig;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFig = teil < .5 ? c0 : teil < 1.5 ? c1 : teil < 2.5 ? c2 : c3;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFig;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vFig;'); };
    pm.customProgramCacheKey = () => 'yuki-kreuzung-figur-v1';
    figurMesh = new THREE.InstancedMesh(fg, pm, N); figurMesh.frustumCulled = false; figurMesh.castShadow = false; figurMesh.name = 'figuren'; G.add(figurMesh);
    zeichne = () => { const show = !kamera || kamera.zoom >= zeigeAbZoom; figurMesh.visible = show; if (!show) return;
      for (let i = 0; i < N; i++) { const p = LEUTE[i], bob = p.geht ? Math.abs(Math.sin(p.weg * 4.2 + i)) * .04 : 0; q.setFromEuler(e.set(0, p.ry, 0));
        mtx.compose(lv.set(p.x * M, .03 + bob, p.z * M), q, ls); figurMesh.setMatrixAt(i, mtx); }
      figurMesh.instanceMatrix.needsUpdate = true; };
  } else {
    const sheet = tex('fussgaenger/fussgaenger_blatt.png'), gq = geo(new THREE.InstancedBufferGeometry()); gq.index = PG.index; gq.attributes.position = PG.attributes.position; gq.attributes.uv = PG.attributes.uv; gq.instanceCount = N;
    const iPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), iUV = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2), iFlip = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
    gq.setAttribute('iPos', iPos); gq.setAttribute('iUV', iUV); gq.setAttribute('iFlip', iFlip);
    const sm_ = mat(new THREE.ShaderMaterial({ uniforms: { map: { value: sheet }, size: { value: new THREE.Vector2(.46 * 1.25, .92 * 1.25) } },
      vertexShader: `attribute vec3 iPos; attribute vec2 iUV; attribute float iFlip; uniform vec2 size; varying vec2 vUv;
        void main(){ vec4 mv=modelViewMatrix*vec4(iPos,1.0); vec2 o=(position.xy+vec2(.5)-vec2(.5,.03))*size; mv.xy+=o; gl_Position=projectionMatrix*mv;
          vec2 u=uv; if(iFlip>.5) u.x=1.-u.x; vUv=vec2((iUV.x+u.x)/5., 1.-(iUV.y+1.-u.y)/8.); }`,
      fragmentShader: `uniform sampler2D map; varying vec2 vUv; void main(){ vec4 c=texture2D(map,vUv); if(c.a<.1) discard; gl_FragColor=vec4(c.rgb,1.0);
        #include <colorspace_fragment>
      }` }));
    figurMesh = new THREE.Mesh(gq, sm_); figurMesh.frustumCulled = false; figurMesh.renderOrder = 3; G.add(figurMesh);
    zeichne = () => { figurMesh.visible = !kamera || kamera.zoom >= zeigeAbZoom; LEUTE.forEach((p, i) => { iPos.setXYZ(i, p.x * M, .03, p.z * M); iUV.setXY(i, p.geht ? 1 + Math.floor(p.weg / .45) % 4 : 0, p.variante); iFlip.setX(i, (Math.sin(p.ry) - Math.cos(p.ry)) < 0 ? 1 : 0); });
      iPos.needsUpdate = iUV.needsUpdate = iFlip.needsUpdate = true; };
  }
  let gruenAlt = null;
  function update(dt) {
    if (dt > 0) schritt(MENGE, Math.min(dt, .1));          // Whitebeard O7: höchstens 0,1 s je Frame (Tab-Wechsel)
    const ph = phaseBei(W, MENGE.T), gr = ph.signal === 'gruen';
    if (ampeln && gr !== gruenAlt) { lampen(gr); gruenAlt = gr; }
    for (const s of SCR) s.t.offset.x = (Math.floor(MENGE.T / s.dauer) % s.n) / s.n;
    zeichne();
  }
  update(0);
  const entfernen = () => { G.removeFromParent(); for (const x of GEOS) x.dispose(); for (const x of MATS) x.dispose(); for (const x of TEX) if (x !== schirm1) x.dispose(); statik.geometry.dispose(); };
  return { gruppe: G, menge: MENGE, update, zug: zugMesh, entfernen,
    info: () => ({ T: MENGE.T, phase: phaseBei(W, MENGE.T).name, figuren: N, meshes: G.children.length, materialien: MATS.size, atlas_fassaden: FAS.size,
      dreiecke: G.children.reduce((s, m) => s + (m.isInstancedMesh ? m.count : 1) * ((m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3), 0) }) };
}
