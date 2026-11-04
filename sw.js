// Service Worker: cacht alle Spiel-Dateien (offline spielbar nach dem ersten Laden)
const V='konbini-v7-12';// V7-12 (R55-Ursache, Erik 03.11. 21:07, R104–R106): skipWaiting erst nach Ruhe der Fenster, bei Bedarf ein zweites Mal (Nachschub), neuer Cache;  V7-11 (Yokohama R3 H1/H2/A6/A7, Erik 03.11. 18:17, R98–R103): yokohama/ nur noch über assets.json (wie die anderen Städte), neuer Cache;  V7-10 (Gganbu-Playtest R4, Erik 02.11. 21:43, R90–R97): Fixes B1–B6, neuer Cache;  V7-9 (Erik 02.11. 20:41, R87): Spieltitel „Tanuki Tycoon“ (index.html, manifest, Startbildschirm) – Cache-Präfix „konbini-“ bleibt; V7-8 (Yokohama A mit Hochbahn, 02.11.): neuer Cache, Yokohama-Dateien in CORE; V7-7 (Gganbu R3 Zusatz, 02.11.): Wochen-Aufträge + Gewinnkurve; V7-6 (Gganbu-Playtest R3, 02.11.): neuer Cache; davor V7-5 R2: neuer Cache für die Runde-2-Fixes. // V7-4 (Gganbu-Playtest R1, 02.11.): neuer Cache für die Runde-1-Fixes. // V7-3 (Whitebeard Abnahme 1e14974 O-B/O-E): CORE vollständig, Installation wartet nur auf CORE. V7-2 (659f1e1 B1): neuer Name für konbini-v7-1-Besucher
// Whitebeard Abnahme 1e14974 O-B: alles, was der Start fest lädt (data.js:52 importiert bezirk_zuordnung.js; seed.js steht in index.html;
// ohne kreuzung/plan_a.json fiele Tokio offline auf den alten Plan mit 515 Grundstücken zurück). Prüfung: tests/sw_wechsel_v7.py (statisch).
// Whitebeard Nachprüfung Yokohama R3 H2 (R99): Yokohamas Dateien (yokohama/, Grundplan, Wahrzeichen) einheitlich NUR über assets.json (tools/build_dist.py) –
// sie werden nur in Yokohama dynamisch geladen; js/lm_yokohama.js bleibt in CORE, weil world.js es fest importiert.
const CORE=['./','index.html','favicon.ico','apple-touch-icon.png','js/plan.js','js/city.js','js/screens.js','grafik/stadtplan/stadtplan.json','manifest.webmanifest','css/app.css','css/washi.css','css/washi_fz.css','css/fonts/Nunito-Variable.woff2','css/fonts/MPLUSRounded1c-Regular.woff2','css/fonts/MPLUSRounded1c-Bold.woff2','js/washi.js','js/mitemite.js','js/app.js','js/data.js','js/sim.js','js/gfx.js','js/logo.js','js/world.js','js/lm_yokohama.js','js/stil5.js','js/events_data.js','js/cities.js','js/finanzen.js','js/finanzen_data.js','js/finanzen_cfg.js','css/finanzen.css','daten/DIVIDENDEN.json','js/bahnhof.js','js/neueketten.js','js/buero.js','js/privat.js','js/wachstum_cfg.js','js/sortiment.js','js/sortiment_cfg.js','js/uebernahme_cfg.js','js/privat_cfg.js','js/staedte_neu.js','js/buero_cfg.js','grafik/buero/plan/plan_000.svg','grafik/buero/plan/plan_001.svg','grafik/buero/plan/plan_010.svg','grafik/buero/plan/plan_011.svg','grafik/buero/plan/plan_100.svg','grafik/buero/plan/plan_101.svg','grafik/buero/plan/plan_110.svg','grafik/buero/plan/plan_111.svg','grafik/logos/asayake-mart.svg','grafik/logos/tsubame-eki.svg','js/neueketten_cfg.js','grafik/logos/loop-and-go.svg','grafik/logos/molenmarkt.svg','grafik/logos/bluejay-stop.svg','js/bahnhof_cfg.js','css/bahnhof.css','daten/BAHNHOF_FAHRTEN.json','grafik/bahnhof/ladescreen-zug.svg','grafik/karte/pin-zu-vermieten-v2.svg','lib/three.module.min.js','lib/MapControls.js','lib/OrbitControls.js','marketing/texte.json','grafik/palette/palette.css','grafik/app/icon-192.png','grafik/app/icon-512.png','grafik/app/apple-touch-icon.png','js/bezirk_zuordnung.js','js/seed.js','kreuzung/plan_a.json','kreuzung/bauvorlage_shibuya.json','kreuzung/wege_phasen.json','kreuzung/einbau/kreuzung_bau.js','kreuzung/einbau/spieler_schirm.js','kreuzung/einbau/kreuzung_wege.mjs','kreuzung/ebenen/0_boden_komplett.png','kreuzung/ebenen/0_boden_komplett_reduziert.png','kreuzung/hachiko/hachiko_sprite.png','kreuzung/fussgaenger/fussgaenger_blatt.png','kreuzung/schilder/bahn_piktogramm.png','kreuzung/screens/s1_spielerkette_f1.png','kreuzung/screens/s1_spielerkette_f2.png','kreuzung/screens/s1_spielerkette_f3.png','kreuzung/screens/s1_spielerkette_streifen.png','kreuzung/screens/s2_kiraku_shoji_streifen.png','kreuzung/screens/s3_hotaru_denchi_streifen.png','kreuzung/screens/s4_farbflaechen_streifen.png'];
// cache:'reload' holt jede Datei am HTTP-Cache vorbei (sonst landet bei max-age=600 das alte sim.js/app.js im neuen Cache)
const frisch=u=>new Request(u,{cache:'reload'});
// Whitebeard Abnahme 1e14974 O-E (R55-Härtung): install wartet NUR auf CORE (~90 Dateien), danach skipWaiting. Die übrigen Dateien aus
// assets.json (~570) lädt der Worker erst NACH activate im Hintergrund nach – höchstens 4 gleichzeitig, schon gecachte werden übersprungen,
// nicht in waitUntil von activate (sonst bleibt der Worker 'activating' und Seitenaufrufe warten). Stirbt der Worker vorher, holt die nächste
// Navigation (einmal je Worker-Lebenszeit) den Rest nach; was fehlt, kommt sonst beim ersten Abruf über den fetch-Handler in den Cache.
// Vorrang für Seiten: solange ein Fenster gerade lädt (fetch-Ereignis in den letzten 2 s), pausiert das Nachladen – sonst stauen sich
// die Cache-Schreibvorgänge vor den Seitenabrufen (neuer Tab unter Last > 10 s, sw_wechsel_v7 none).
// R104 (Ursache R55, Erik 03.11. 21:07 „Behebe erst den Update-Fehler“): nach skipWaiting() beendet Chrome den alten Worker, sobald er gerade
// nichts zu tun hat, und aktiviert dann den neuen. Holt die eben neu geladene Seite in diesem Moment noch Dateien, startet Chrome den alten Worker
// neu und vergisst dabei das „sofort beenden“ – die Übernahme wartet dann auf 30 s völlige Ruhe, solange die Seite fragt also beliebig lang.
// Der nächste neue Tab stößt den Wechsel an und bleibt dabei hängen (> 10 s). Darum: gibt es schon einen aktiven Worker, wartet install nach
// dem CORE, bis die Fensterliste 2 s unverändert ist (Navigation durch, Seite fertig geladen), mindestens 3 s, höchstens 10 s – dann skipWaiting().
// Beim allerersten Besuch (kein alter Worker) wird nicht gewartet. Prüfung: tests/sw_ruhe_v7.py (mit Gegenprobe ohne die Wartezeit).
const ruheVorSkip=async()=>{if(!self.registration.active)return;const t0=Date.now();let sig=null,seit=t0;
 while(Date.now()-t0<10000){const s=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).map(c=>c.id).sort().join();
  if(s!==sig){sig=s;seit=Date.now();}if(Date.now()-t0>=3000&&Date.now()-seit>=2000)return;await new Promise(r=>setTimeout(r,250));}};
// R106 (Ursache R55, Nachschub): Chrome stößt das Beenden des alten Workers nur bei wenigen Gelegenheiten an – am Ende von install (dafür
// skipWaiting() schon in install) und beim ersten skipWaiting() im Zustand „installed“. Geht das erste Mal im Rennen verloren (alter Worker wird
// für eine Anfrage neu gestartet), ruft der neue Worker, wenn er 3 s nach install noch wartet, skipWaiting() ein zweites Mal – das stößt es erneut an.
const nachschub=()=>{if(!self.registration.active)return;let n=0;const f=()=>{const s=self.serviceWorker&&self.serviceWorker.state;
 if(s==='installed'){if(++n>=6)return void self.skipWaiting();}else if(s!=='installing')return;setTimeout(f,500);};setTimeout(f,500);};
self.addEventListener('install',e=>{const p=(async()=>{const c=await caches.open(V);await c.addAll(CORE.map(frisch));await ruheVorSkip();self.skipWaiting();})();
 e.waitUntil(p);p.then(()=>nachschub(),()=>{});});
let nachladenP=null,zuletzt=0;const warte=ms=>new Promise(r=>setTimeout(r,ms));const vorrang=async()=>{while(Date.now()-zuletzt<2000)await warte(400);};
const nachladen=()=>nachladenP||(nachladenP=(async()=>{try{const r=await fetch('assets.json',{cache:'no-cache'});if(!r.ok)return 0;const c=await caches.open(V);
 const offen=[];for(const u of await r.json()){await vorrang();if(!(await c.match(u,{ignoreSearch:true})))offen.push(u);}let i=0,n=0;
 const arbeiter=async()=>{while(i<offen.length){await vorrang();if(i>=offen.length)break;const u=offen[i++];try{await c.add(frisch(u));n++;}catch(_){}}};
 await Promise.all([0,1,2,3].map(arbeiter));return n;}catch(_){return 0;}})());
// Whitebeard 659f1e1 B1: activate wartet NICHT auf Navigationen (Deadlock: Navigation wartet auf 'activated', activate auf die Navigation).
// Seiten ab V7-2 laden sich selbst einmal bei 'controllerchange' neu (js/app.js). Nur Fenster mit altem Code ohne diesen Handler
// (Caches bis konbini-v7-1) schickt der Worker nach dem Aktivieren einmal neu, ohne darauf zu warten.
const ohneHandler=k=>/^konbini-(v[1-6]-|v7-1$)/.test(k);
self.addEventListener('activate',e=>{const p=(async()=>{let alt=0;for(const k of await caches.keys())if(k!==V){if(ohneHandler(k))alt++;await caches.delete(k);}await self.clients.claim();return alt;})();
 e.waitUntil(p);p.then(alt=>{if(alt)self.clients.matchAll({type:'window'}).then(L=>L.forEach(c=>c.navigate(c.url).catch(()=>{})));});
 p.then(()=>nachladen());});
// Nachladen im Hintergrund mit cache:'no-cache' (fragt den Server; sonst überschreibt ein altes HTTP-Cache-Exemplar die neue Datei im Cache)
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;zuletzt=Date.now();if(e.request.mode==='navigate')e.waitUntil(nachladen());e.respondWith((async()=>{const c=await caches.open(V);const hit=await c.match(e.request,{ignoreSearch:true});
 const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin)c.put(e.request,r.clone());return r;}).catch(()=>null);
 return hit||(await net)||new Response('offline',{status:503});})());});
