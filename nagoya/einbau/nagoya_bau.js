// Osaka – Einbau (Yuki, Runde 3): Bahnhofsplatz Umeda, Plätze an den Wahrzeichen, Kais, Burgpark mit Torweg, Hochbahn mit Zug, Fußgänger.
// Vorschlag für Frankys Einbau – liest nur die Bauvorlage, ändert keine Spieldatei. Ein Stand für Spiel-Vorschau und Einbau.
//   baueNagoya(THREE, { basis, vorlage, kamera, schirm1, schatten, zeigeAbZoom, features }) → { gruppe, update(dt), info(), entfernen(), zug }
//   features = FEATURES aus js/plan.js. Die Hochbahn (Viadukt, Bahnhöfe, Steg, Zug = alle Teile mit gruppe 'hochbahn') wird NUR gebaut,
//   wenn features.hochbahn === true; Teile mit gruppe 'ohne_hochbahn' (Platzfüllung Namba) nur, wenn sie AUS ist. Rein optisch: keine Spielfunktion. FEATURES.rail (Yamanote-Ring, Tokio Hbf, Bahnwerbung) wird
//   hier bewusst NICHT gelesen und muss AUS bleiben; Hochbahn und rail sind unabhängig.
//   update(dt) einmal je Frame (dt in s, intern ≤ 0,1 s). Gruppe ohne Versatz direkt in die Szene (Kinder in Welt-Koordinaten).
// Draw Calls: Boden 1 · Statik 1 · Bildschirme 1 · Figuren 1 · Zug 1 = 5 (+1 Statik im Schattenpass); ohne Hochbahn 4. Osaka hat keine Steinschüttung (V.steine leer → kein Mesh).
import { baueBausatz } from './bausatz_bau.js';
import { baueZug } from './hochbahn_bau.js';
import { erzeugeFiguren, schritt, ohneArt } from './figuren_wege.mjs';
export function baueNagoya(THREE, { basis = '', vorlage: V0, kamera = null, schirm1 = null, schatten = true, zeigeAbZoom = 1.5, figuren = true, features = {} } = {}) {
  const mitHochbahn = !!features && features.hochbahn === true;          // eigener optischer Schalter, unabhängig von features.rail
  // Gganbu R3 Pt 6: gruppe 'ohne_hochbahn' (Beet, Bäume, Bänke auf den Treppenzellen am Namba-Platz) nur OHNE Hochbahn – das Gegenstück zu 'hochbahn'.
  const nimm = o => mitHochbahn ? o.gruppe !== 'ohne_hochbahn' : o.gruppe !== 'hochbahn';
  const V = { ...V0, teile: V0.teile.filter(nimm), zylinder: V0.zylinder.filter(nimm), schilder: V0.schilder.filter(nimm), baeume: V0.baeume.filter(nimm) };
  const mitZug = mitHochbahn && !!V0.hochbahn;   // Nagoya: keine Hochbahn in der Vorlage → kein Zug-Mesh
  const G = new THREE.Group(); G.name = 'nagoya-yuki-r3';
  const F = V.raster.feld_welt, W0 = V.raster.welt_von, basisY = .03;
  const S = baueBausatz(THREE, { basis, vorlage: V, schirm1, schatten, basisY }); for (const m of S.meshes) G.add(m);
  const Z = mitZug ? baueZug(THREE, { HB: V.hochbahn, raster: V.raster, basisY }) : null; if (Z) G.add(Z.mesh);
  // Figuren (gleiche Low-Poly-Figur wie die Kreuzung: 48 Dreiecke, Farben je Instanz/Körperteil im Shader)
  // WB R3 O5: ohne Hochbahn gibt es keine Bahnhofstreppen ⇒ Treppenfuß-Knoten (Art 'treppe') vor erzeugeFiguren aus dem Graph nehmen
  const WEGE = mitHochbahn ? V.wege : ohneArt(V.wege, 'treppe');
  let FM = null, fig = null, zeichne = () => { };
  if (figuren) {
    FM = erzeugeFiguren(WEGE, { saat: 1907 }); const N = FM.leute.length;
    const ohneBoden = x => { const nn = x.toNonIndexed(), pa = nn.attributes.position.array, na = nn.attributes.normal.array, P2 = [], N2 = [];
      for (let v = 0; v < nn.attributes.position.count; v += 3) if (!(na[v * 3 + 1] < -.9)) for (let k = 0; k < 9; k++) { P2.push(pa[v * 3 + k]); N2.push(na[v * 3 + k]); }
      const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g2.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3)); x.dispose(); nn.dispose(); return g2; };
    const teile = [ohneBoden(new THREE.BoxGeometry(.205, .22, .1).translate(0, .11, 0)), ohneBoden(new THREE.BoxGeometry(.30, .25, .15).translate(0, .345, 0)),
      new THREE.IcosahedronGeometry(.1, 0).translate(0, .57, 0), ohneBoden(new THREE.BoxGeometry(.19, .07, .19).translate(0, .645, -.01))];
    const P = [], Nn = [], T = []; teile.forEach((x, ti) => { const nn = x.index ? x.toNonIndexed() : x; P.push(...nn.attributes.position.array); Nn.push(...nn.attributes.normal.array); for (let i = 0; i < nn.attributes.position.count; i++) T.push(ti); x.dispose(); });
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); fg.setAttribute('teil', new THREE.Float32BufferAttribute(T, 1));
    const PCOL = ['#E94F4F', '#3D7BD9', '#FFC93C', '#5DBB73', '#F7A1B5', '#F2EFE6', '#8E5BD1', '#FF8A3D', '#2E9C9C', '#F5F5F5'], LCOL = ['#2B2D42', '#3B4A6B', '#5A4636', '#6B6B6B', '#1F3A5F'], SKIN = ['#F6D2B4', '#EBC09A', '#D9A77E', '#F2C9A6'], HAIR = ['#2B2D42', '#1E1E24', '#5A3B26', '#8A5A35', '#C9C3BA'], c3 = new THREE.Color();
    [[LCOL, 3], [PCOL, 7], [SKIN, 5], [HAIR, 11]].forEach(([pal, k], ti) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) { c3.set(pal[(i * k) % pal.length]); a.set([c3.r, c3.g, c3.b], i * 3); } fg.setAttribute('c' + ti, new THREE.InstancedBufferAttribute(a, 3)); });
    const pm = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    pm.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float teil; attribute vec3 c0; attribute vec3 c1; attribute vec3 c2; attribute vec3 c3; varying vec3 vFig;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFig = teil < .5 ? c0 : teil < 1.5 ? c1 : teil < 2.5 ? c2 : c3;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFig;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vFig;'); };
    pm.customProgramCacheKey = () => 'yuki-figur-v1';
    fig = new THREE.InstancedMesh(fg, pm, N); fig.frustumCulled = false; fig.castShadow = false; fig.name = 'figuren-nagoya'; G.add(fig);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), lv = new THREE.Vector3(), ls = new THREE.Vector3(1.25, 1.25, 1.25);
    zeichne = () => { const show = !kamera || kamera.zoom >= zeigeAbZoom; fig.visible = show; if (!show) return;
      FM.leute.forEach((p, i) => { const bob = p.geht ? Math.abs(Math.sin(p.weg * 4.2 + i)) * .04 : 0; q.setFromEuler(e.set(0, p.ry, 0));
        mtx.compose(lv.set(W0 + p.x * F, basisY + (p.z || 0) * F + bob, W0 + p.y * F), q, ls); fig.setMatrixAt(i, mtx); });
      fig.instanceMatrix.needsUpdate = true; };
  }
  let T = 0;
  function update(dt) { dt = Math.min(Math.max(dt || 0, 0), .1); T += dt; if (FM && dt > 0) schritt(FM, dt); if (Z) Z.setze(T); S.update(T); zeichne(); }
  update(0);
  const entfernen = () => { S.entfernen(); if (Z) Z.entfernen(); if (fig) { fig.removeFromParent(); fig.geometry.dispose(); fig.material.dispose(); } G.removeFromParent(); };
  const info = () => ({ T, hochbahn: mitHochbahn, figuren: FM ? FM.leute.length : 0, wegknoten: WEGE.knoten.length, treppenknoten: WEGE.knoten.filter(k => k[2] === 'treppe').length,
    figuren_an_treppe: FM ? FM.leute.filter(p => FM.K[p.a][2] === 'treppe' || FM.K[p.b][2] === 'treppe').length : 0, zug_wagen: Z ? Z.mesh.count : 0, meshes: G.children.length, ...S.info(),
    dreiecke: G.children.reduce((s, m) => s + (m.isInstancedMesh ? m.count : 1) * ((m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3), 0) });
  return { gruppe: G, update, info, entfernen, zug: Z, figurenMenge: FM, zeit: () => T };
}
