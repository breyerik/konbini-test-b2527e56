// Hochbahn-Zug (Yuki, Runde 3) – generischer Washi-Zug als EIN InstancedMesh „hochbahn-zug“ (2 Züge × 3 Wagen = 6 Instanzen, 1 Draw Call).
// Lage je Frame rein aus der Zeit (hochbahn_fahrt.mjs) ⇒ kein Teleportieren, kein Ruckeln bei Frame-Einbrüchen. Kein Schatten (Budget).
// Name ohne „car/auto/fahrzeug“ (tests/keine_autos_v7.py), Grundriss 1,32 × 0,27 Feld (kein Auto-Grundriss 1 × 0,52 Welt).
import { fahrplan, wagenLagen } from './hochbahn_fahrt.mjs';
export function baueZug(THREE, { HB, raster, basisY = .03 }) {
  const F = raster.feld_welt, W0 = raster.welt_von, Z = HB.zug, P = fahrplan(HB);
  const L = Z.wagen_laenge * F, B = Z.breite * F, H = Z.hoehe * F, teile = [      // [y0, y1, Breite-Faktor, Länge-Faktor, Farbe]
    [0, .035, .8, .9, '#3A3632'],          // Unterbau
    [.035, .3, 1, 1, '#FBF8F2'],           // Kasten (hell)
    [.075, .105, 1.012, .995, '#C0614A'],  // Akzentstreifen
    [.14, .225, 1.012, .97, '#4A5560'],    // Fensterband
    [.3, .32, .86, .94, '#E6DFD2']];       // Dach (beton)
  const P3 = [], N3 = [], C3 = [], c = new THREE.Color();
  for (const [y0, y1, fb, fl, farbe] of teile) {
    const g = new THREE.BoxGeometry(L * fl, (y1 - y0) / Z.hoehe * H, B * fb).translate(0, (y0 + y1) / 2 / Z.hoehe * H, 0).toNonIndexed();
    const pa = g.attributes.position.array, na = g.attributes.normal.array; c.set(farbe);
    for (let v = 0; v < pa.length / 3; v++) { if (na[v * 3 + 1] < -.9) continue; P3.push(pa[v * 3], pa[v * 3 + 1], pa[v * 3 + 2]); N3.push(na[v * 3], na[v * 3 + 1], na[v * 3 + 2]); C3.push(c.r, c.g, c.b); }
    g.dispose();
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C3, 3));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }), n = 2 * Z.wagen;
  const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.name = 'hochbahn-zug'; mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1), y = HB.deck_z * F + .012 * F + basisY;
  let letzte = [];
  function setze(t) {
    letzte = wagenLagen(P, t);
    letzte.forEach((w, i) => { q.setFromEuler(e.set(0, -w.h, 0)); m4.compose(v.set(W0 + w.x * F, y, W0 + w.y * F), q, s1); mesh.setMatrixAt(i, m4); });
    mesh.instanceMatrix.needsUpdate = true;
  }
  setze(0);
  return { mesh, plan: P, setze, lagen: () => letzte, entfernen() { mesh.removeFromParent(); geo.dispose(); mat.dispose(); mesh.dispose && mesh.dispose(); } };
}
