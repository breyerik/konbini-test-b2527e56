import {NEUESTAEDTE} from './cities.js';
// Bahnhof: Stadtwechsel-Menü + Zug-Ladescreen (Franky nach Yukis Entwurf). Standard an (Erik 21.10.), ?bahnhof=0 = altes ✈️-Menü.
import * as B from './bahnhof_cfg.js';
export const ON=new URLSearchParams(location.search).get('bahnhof')!=='0';
let FAHRT=null,SVG=null;
export function load(){if(!ON)return;
 fetch('daten/BAHNHOF_FAHRTEN.json').then(r=>r.json()).then(j=>FAHRT=j.verbindungen).catch(()=>{});
 fetch('grafik/bahnhof/ladescreen-zug.svg').then(r=>r.text()).then(t=>SVG=t).catch(()=>{});
 if(!document.getElementById('bfcss')){const l=document.createElement('link');l.id='bfcss';l.rel='stylesheet';l.href='css/bahnhof.css';document.head.appendChild(l);}}
export const staedte=()=>B.STAEDTE.filter(s=>s.live||(NEUESTAEDTE&&['nagoya','kyoto','osaka'].includes(s.id)));// andere Städte bleiben verborgen, bis sie spielbar sind
export function fahrt(vonId,nachId){const v=B.STAEDTE.find(s=>s.id===vonId),n=B.STAEDTE.find(s=>s.id===nachId);if(!v||!n||v===n)return null;
 const x=(FAHRT||[]).find(f=>(f.von===v.json&&f.nach===n.json)||(f.symmetrisch&&f.von===n.json&&f.nach===v.json));
 if(x)return {preis:x.preis_erwachsen_nicht_reserviert_yen,min:x.fahrzeit_min_schnellste};
 const e=n.ersatz&&n.ersatz.von===vonId?n.ersatz:v.ersatz&&v.ersatz.von===nachId?v.ersatz:null;return e?{preis:e.preis,min:e.min}:null;}
const yen=n=>'¥'+n.toLocaleString('de-DE'),dauer=m=>m<60?`${m} Min.`:`${Math.floor(m/60)} Std. ${String(m%60).padStart(2,'0')}`;
const ICON={tokio:'🗼',yokohama:'🎡',nagoya:'🏯',kyoto:'⛩️',osaka:'🏙️'};
// Abfahrtstafel: nur echte, erreichbare Ziele aus daten/BAHNHOF_FAHRTEN.json (spielbare Städte); Uhrzeit/Gleis Deko
export function abfahrten(cur){const v=B.STAEDTE.find(s=>s.id===cur);if(!v)return [];const out=[];
 for(const n of staedte()){if(n===v)continue;const x=(FAHRT||[]).find(f=>(f.von===v.json&&f.nach===n.json)||(f.symmetrisch&&f.von===n.json&&f.nach===v.json));
  const zug=x&&x.zug&&(x.zug.match(/\((.+)\)/)||[])[1]||'のぞみ';const jp=x?(x.von===v.json?x.nach_jp:x.von_jp):n.jp;out.push([zug,n.bahnhof,jp]);}
 if(!out.length)return [];const rows=[];for(let i=0;i<B.TAFEL.zeilen;i++){const o=out[i%out.length],m=B.TAFEL.start+i*B.TAFEL.takt;
  rows.push([`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`,o[0],o[1],o[2],String(B.TAFEL.gleis+(i%2))]);}return rows;}
export function render(cur){const rows=abfahrten(cur).map((r,i)=>`<div class="bfdep ${i?'':'a'}"><span>${r[0]}</span><span>${r[1]}</span><span class="z">${r[2]}</span><span>${r[3]}</span><span>${r[4]}</span></div>`).join('');
 const cards=staedte().map(s=>{const here=s.id===cur,f=here?null:fahrt(cur,s.id);
  return `<div class="bfcard ${here?'here':''}"><div class="bfic">${ICON[s.id]||'🏙️'}</div><div class="bfname"><b>${s.name}</b><small>${s.jp}</small><small>Bhf. ${s.bahnhof}</small></div>
  ${here?'<span class="bfnow">● Aktuell</span><span class="bfbtn off">Du bist hier</span>':`<div class="bfinfo"><small>Preis</small><b>${f?yen(f.preis):'–'}</b></div><div class="bfinfo"><small>Fahrzeit</small><b>${f?dauer(f.min):'–'}</b></div><button class="bfbtn" data-act="abfahrt" data-v="${s.id}">Abfahrt ▶</button>`}</div>`;}).join('');
 return `<div class="bfroof"></div><div class="bfhead"><button class="bfback" data-act="bfzu" aria-label="Zurück">‹</button><div><b>Bahnhof</b><small>駅 · えき</small></div></div>
 <div class="bfboard"><div class="bft"><b>発車案内</b> Abfahrten</div><div class="bfdep h"><span>Zeit</span><span>Zug</span><span class="z">Ziel</span><span></span><span>Gleis</span></div>${rows}<small>Zeiten und Gleise nur Deko · Preise: nicht reservierter Wagen</small></div>
 <div class="bfq">Wohin geht die Reise?</div>${cards}
 <div class="bfkobo"><img src="grafik/maskottchen/kobo.svg" alt=""><div><b>Gute Reise!</b> いってらっしゃい</div></div>`;}
export function ladescreen(ziel){const s=B.STAEDTE.find(x=>x.id===ziel)||{name:ziel,jp:''};let svg=(SVG||'').replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')
 // Vollbild (slice schneidet ~10 % links/rechts): Textkarte + Balken schmaler, damit sie auf schmalen Handys ganz sichtbar bleiben
 svg=svg.replace('x="80" y="1460" width="920"','x="170" y="1460" width="740"').replace(/x="160" y="1676" width="760"/g,'x="220" y="1676" width="640"').replace('to{width:760px}','to{width:640px}').replace('font-size="64"','font-size="54"');
 svg=svg.replace(/Fahrt nach Yokohama/g,'Fahrt nach '+s.name).replace(/横浜へ向かっています/g,s.jp+'へ向かっています');
 const el=document.createElement('div');el.id='bfload';el.innerHTML=svg||`<div class="bffb">🚄 Fahrt nach ${s.name} …</div>`;document.body.appendChild(el);return el;}
export const LADEZEIT=B.LADEZEIT_MS;
