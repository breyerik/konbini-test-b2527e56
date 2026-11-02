// Bildschirm der Spielerkette (NW-Turm, Ostseite) – Frame 1 wird aus dem Spielstand gezeichnet (Yuki, Runde 2/3).
// Nichts ist eingebrannt: Name und Logo kommen aus look = chainLook('player', logo, {facade:'brand'}) und logoCanvas (js/logo.js).
// Ergebnis: Canvas 1536×288 = 3 Frames nebeneinander (wie *_streifen.png): repeat.x = 1/3, offset.x = frame/3.
// f2/f3 = screens/s1_spielerkette_f2.png und _f3.png (neutral).
// Runde 3: Schrift = Familiennamen, die das Spiel lädt (css/washi.css: "Nunito W", "M PLUS Rounded W") + Rückfall;
//          lange Namen werden per measureText mit „…“ gekürzt; spielerSchirmLive() zeichnet neu nach Fonts/Logo/Bildern.
export const SCHIRM_SCHRIFT = '"Nunito W", "M PLUS Rounded W", Nunito, "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", system-ui, sans-serif';
const MAXB = 230, FS_MAX = 62, FS_MIN = 26;   // Namensfeld x 262…492 (Rahmen innen bei 506)

function kuerze(g, text) {            // Ellipse, bis die Zeile in MAXB passt (zeichenweise, Surrogatpaare bleiben ganz)
  if (g.measureText(text).width <= MAXB) return text;
  const z = Array.from(text);
  while (z.length && g.measureText(z.join('').trimEnd() + '…').width > MAXB) z.pop();
  return z.join('').trimEnd() + '…';
}

// cv optional: in einen vorhandenen Canvas zeichnen (gleiche Textur, nur needsUpdate setzen)
export function spielerSchirm(look, logoCanvas, f2, f3, cv) {
  if (!cv) { cv = document.createElement('canvas'); cv.width = 1536; cv.height = 288; }
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const main = look.main || '#8A8279', schrift = (look.second && look.second.toLowerCase() !== main.toLowerCase()) ? look.second : '#FFFFFF';
  g.fillStyle = main; g.fillRect(0, 0, 512, 288);
  g.fillStyle = '#FFFFFF'; rr(56, 54, 180, 180, 44); g.fill();                                      // Logo-Slot
  try { g.save(); rr(56, 54, 180, 180, 44); g.clip(); g.drawImage(logoCanvas(look.logo, 256), 64, 62, 164, 164); g.restore(); } catch (e) { g.restore(); }
  // Name: bis 2 Zeilen, verkleinern bis FS_MIN, danach Ellipse
  const name = String(look.name || '').trim().replace(/\s+/g, ' '), w = name.split(' ');
  let zeilen = [name]; if (w.length > 1) { const k = Math.ceil(w.length / 2); zeilen = [w.slice(0, k).join(' '), w.slice(k).join(' ')]; }
  const setz = fs => { g.font = `800 ${fs}px ${SCHIRM_SCHRIFT}`; };
  let fs = FS_MAX; setz(fs);
  while (fs > FS_MIN && Math.max(...zeilen.map(z => g.measureText(z).width)) > MAXB) setz(fs -= 2);
  zeilen = zeilen.map(z => kuerze(g, z));
  g.fillStyle = schrift; g.textBaseline = 'alphabetic';
  if (zeilen.length === 1) g.fillText(zeilen[0], 262, 144 + fs * .35); else { g.fillText(zeilen[0], 262, 140); g.fillText(zeilen[1], 262, 140 + fs * 1.05); }
  if (f2 && (f2.complete !== false)) g.drawImage(f2, 512, 0, 512, 288);
  if (f3 && (f3.complete !== false)) g.drawImage(f3, 1024, 0, 512, 288);
  g.strokeStyle = '#3A3632'; g.lineWidth = 6; g.strokeRect(3, 3, 506, 282);
  return cv;
}

// Für den Einbau: zeichnet sofort und erneut, sobald Fonts (document.fonts.ready / load), ein v2-Logo ('logo-ready',
// js/logo.js) oder f2/f3 (onload) fertig sind. onUpdate(cv) z. B. = () => { tex.needsUpdate = true; }.
// Bei Namens-/Farb-/Logo-Wechsel: h.neu(neuerLook). Beim Abbauen: h.weg().
export function spielerSchirmLive(look, logoCanvas, f2, f3, onUpdate) {
  const cv = document.createElement('canvas'); cv.width = 1536; cv.height = 288;
  let L = look, aus = false, geplant = false;
  const jetzt = () => { geplant = false; if (aus) return; spielerSchirm(L, logoCanvas, f2, f3, cv); if (onUpdate) onUpdate(cv); };
  const zeichne = () => { if (geplant || aus) return; geplant = true; (window.requestAnimationFrame || setTimeout)(jetzt); };
  spielerSchirm(L, logoCanvas, f2, f3, cv);
  const F = document.fonts;
  if (F) {
    F.ready.then(zeichne, () => { });
    Promise.all([F.load(`800 62px "Nunito W"`), F.load(`800 62px "M PLUS Rounded W"`, 'あ漢')]).then(zeichne, () => { });
    if (F.addEventListener) F.addEventListener('loadingdone', zeichne);
  }
  window.addEventListener('logo-ready', zeichne);
  for (const im of [f2, f3]) if (im && im.complete === false && im.addEventListener) im.addEventListener('load', zeichne, { once: true });
  return {
    canvas: cv,
    neu(l) { if (l) L = l; zeichne(); },
    weg() { aus = true; window.removeEventListener('logo-ready', zeichne); if (F && F.removeEventListener) F.removeEventListener('loadingdone', zeichne); }
  };
}
