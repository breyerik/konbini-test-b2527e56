// Konbini Empire v3 – Yukis Stadtplan (grafik/stadtplan/stadtplan.json, Version 4) als Datenbasis der Karte
// Planversion: V6 ist von Erik freigegeben (Standard). V5 bleibt per ?plan=5 erreichbar.
// V7 (Standard): V6 + Dichte – Parkstreifen/-ringe bebaut (tools/plan_v7.py); ?plan=6 / ?plan=5 bleiben erreichbar.
const _pq=Number(new URLSearchParams(globalThis.location?location.search:'').get('plan'));export const PLAN_VERSION=_pq===5?5:_pq===6?6:7;
import {loadCityPlan} from './cities.js';
const _city=await loadCityPlan(import.meta.url,PLAN_VERSION);
export const PLAN=_city.plan, CITY=_city.city;// Mehrstadt: cities.js (Tokio Standard, ?stadt=yokohama sobald Yukis Plan da ist)
// v3.2: abschaltbare Kartenteile (true = wieder da). data.js reicht FEATURES weiter.
export const FEATURES={rail:false,haneda:false,hq:false};
export const PLAN_FIX={dropped:[],landfill:0,pruned:0,islands:0};
// v3.2: Yukis Plan V5 (Wahrzeichen auf eigenem Parkblock mit Ringstraße, Odaiba als Insel mit Brücken).
// Laufzeit: Haneda ist per FEATURES abschaltbar (Fläche wird Park, Ringstraße bleibt); Grundstücke müssen ganz auf bebautem Land liegen.
// Brücken: V6 hat sie im Plan (Brückenfelder sind Straße 'bruecke'); V5 aus stadtplan-bruecken.json
export const BRIDGES=PLAN.bruecken||await fetch(new URL('../grafik/stadtplan/stadtplan-bruecken.json',import.meta.url)).then(r=>r.json()).then(j=>j.bruecken||[]).catch(()=>[]);
export const LM_BLOCKS=[];
(function fixPlan(){
 const n=PLAN.raster.n,Fd=PLAN.felder=PLAN.felder.map(r=>r.slice()),inb=(x,y)=>x>=0&&y>=0&&x<n&&y<n;
 if(!FEATURES.haneda){for(const w of PLAN.wahrzeichen.filter(w=>w.wahrzeichen==='haneda'))for(let y=w.y;y<w.y+w.tiefe;y++)for(let x=w.x;x<w.x+w.breite;x++)if(inb(x,y))Fd[y][x]='park';
  PLAN.wahrzeichen=PLAN.wahrzeichen.filter(w=>w.wahrzeichen!=='haneda');}
 // Neue Städte (?neuestaedte=1): Wahrzeichen aus Yukis Bauvorlagen ohne Platz im Plan an realer Lage ergänzen; Tsūtenkaku mit Straße durch die Bögen
 const EXTRA={kyoto:[{wahrzeichen:'toji-pagode',name:'Tō-ji (Pagode)',x:14,y:59,breite:2,tiefe:2,block:{x:13,y:58,breite:5,tiefe:4,typ:'park'}}],// Tō-ji: südwestlich vom Bahnhof Kyoto
  nagoya:[{wahrzeichen:'atsuta-schrein',name:'Atsuta-Schrein',x:29,y:59,breite:3,tiefe:3,block:{x:27,y:58,breite:7,tiefe:5,typ:'park'}}]};// Atsuta: im Süden der Stadt
 for(const w of EXTRA[CITY.id]||[]){const b=w.block;PLAN.wahrzeichen.push(w);
  for(let y=b.y;y<b.y+b.tiefe;y++)for(let x=b.x;x<b.x+b.breite;x++)if(inb(x,y)&&Fd[y][x]==='bebaut')Fd[y][x]='park';
  for(let y=w.y;y<w.y+w.tiefe;y++)for(let x=w.x;x<w.x+w.breite;x++)if(inb(x,y))Fd[y][x]='wahrzeichen';
  PLAN.grundstuecke=PLAN.grundstuecke.filter(g=>g.x+g.breite<=b.x||g.x>=b.x+b.breite||g.y+g.tiefe<=b.y||g.y>=b.y+b.tiefe);}
 if(CITY.id==='osaka'){const w=PLAN.wahrzeichen.find(w=>w.wahrzeichen==='tsutenkaku');if(w){// Straße N–S unter den Bögen, an die Ringstraße angeschlossen
  const r=w.ring||{y:w.y-2,tiefe:w.tiefe+4};for(let y=r.y+1;y<r.y+r.tiefe-1;y++)for(const x of [w.x,w.x+1])if(inb(x,y))Fd[y][x]='hauptstrasse';
  w.block={x:w.x-1,y:w.y-1,breite:1,tiefe:w.tiefe+2,typ:'park'};w.durchfahrt=true;}}
 // Wahrzeichen-Blöcke: nie auf Wasser (Yuki 21.10.: im_wasser-Schiffe ohne Block; Blöcke/Ringe am Ufer auf Landfelder gekürzt)
 const _wet=(x,y)=>{const c=PLAN.felder[y]&&PLAN.felder[y][x];return c==='wasser'||c==='aussen'||c==null;};
 for(const w of PLAN.wahrzeichen){if(w.im_wasser)continue;let b=w.block||{x:w.x-1,y:w.y-1,breite:w.breite+2,tiefe:w.tiefe+2};
  let x0=1e9,y0=1e9,x1=-1,y1=-1;for(let y=b.y;y<b.y+b.tiefe;y++)for(let x=b.x;x<b.x+b.breite;x++)if(!_wet(x,y)){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)continue;b={...b,x:x0,y:y0,breite:x1-x0+1,tiefe:y1-y0+1};
  LM_BLOCKS.push({id:w.wahrzeichen,...b,baeume:(w.baeume||[]).filter(([tx,ty])=>!_wet(Math.floor(tx),Math.floor(ty)))});
  if(w.ring&&[...Array(w.ring.breite).keys()].some(i=>_wet(w.ring.x+i,w.ring.y)||_wet(w.ring.x+i,w.ring.y+w.ring.tiefe-1))||w.ring&&[...Array(w.ring.tiefe).keys()].some(i=>_wet(w.ring.x,w.ring.y+i)||_wet(w.ring.x+w.ring.breite-1,w.ring.y+i)))w.ring=null;// Ring über Wasser: keine Autos im Kreis
 }
 // ?kanaele=1 (Vorschlag für Erik, nicht Standard): Sumida 4 Felder breit + 3 gerade Kanäle auf Gassen-Achsen; Straßenquerungen werden Brücken
 if(new URLSearchParams(globalThis.location?location.search:'').get('kanaele')==='1'){const setW=(x,y)=>{if(!inb(x,y))return;const c=Fd[y][x];if(c==='hauptstrasse'||c==='ringstrasse')Fd[y][x]='bruecke';else if(c==='gasse'||c==='bebaut'||c==='park')Fd[y][x]='wasser';};
  for(let y=0;y<n;y++){if(Fd[y][53]==='wasser'||Fd[y][53]==='bruecke'){for(const x of[55,56]){const c=Fd[y][x];if(c==='bebaut'||c==='park'||c==='gasse')Fd[y][x]='wasser';else if(c==='hauptstrasse')Fd[y][x]='bruecke';}}}
  for(let y=0;y<=20;y++)setW(23,y);for(let x=8;x<=16;x++)setW(x,41);for(let x=31;x<=40;x++)setW(x,51);
  for(const[x,y]of[[23,8],[23,9],[7,41],[6,41],[17,41],[18,41],[41,51],[42,51],[30,51],[29,51]])if(inb(x,y)&&Fd[y][x]==='hauptstrasse')Fd[y][x]='bruecke';}
 PLAN.grundstuecke=PLAN.grundstuecke.filter(l=>{for(let y=l.y;y<l.y+l.tiefe;y++)for(let x=l.x;x<l.x+l.breite;x++)if(!inb(x,y)||Fd[y][x]!=='bebaut'){PLAN_FIX.dropped.push(l.id);return false;}return true;});
})();
const RG=PLAN.raster;
export const N=RG.n, W0=RG.welt_von, F=(RG.welt_bis-RG.welt_von)/RG.n; // ~4,06 Welteinheiten pro 10-m-Feld
export const cellAt=(x,y)=>(x<0||y<0||x>=N||y>=N)?'aussen':PLAN.felder[y][x];
export const wx=gx=>W0+gx*F, wz=gy=>W0+gy*F; // Feldkante -> Welt
export const isRoad=c=>c==='hauptstrasse'||c==='gasse'||c==='ringstrasse'||c==='bruecke';// 'bruecke' (V6) zählt als Straße
export const LAGE_TIER={top:'top',city:'city',wohngebiet:'wohn',stadtrand:'rand'};
export const FLOOR_H=1.3; // Stockwerk ≈ 3,2 m
// Ladenfront eines Grundstücks: Seiten zur Straße zählen (n,s,w,o)
function roadSides(l){
 const s={n:0,s:0,w:0,o:0};
 for(let i=0;i<l.breite;i++){if(isRoad(cellAt(l.x+i,l.y-1)))s.n++;if(isRoad(cellAt(l.x+i,l.y+l.tiefe)))s.s++;}
 for(let j=0;j<l.tiefe;j++){if(isRoad(cellAt(l.x-1,l.y+j)))s.w++;if(isRoad(cellAt(l.x+l.breite,l.y+j)))s.o++;}
 return s;
}
export function shopSides(l){
 const s=roadSides(l),ord=Object.entries(s).sort((a,b)=>b[1]-a[1]);
 let front=ord[0][1]>0?ord[0][0]:'s',side=null;
 if(l.laden.art==='ecke'){const perp=['n','s'].includes(front)?['w','o']:['n','s'];side=s[perp[0]]>=s[perp[1]]?perp[0]:perp[1];}
 return {front,side,missing:ord[0][1]===0};
}
const SIDE_ROT={s:0,o:Math.PI/2,n:Math.PI,w:-Math.PI/2};
// Läden mit Weltposition (vor der Ladenfront)
function mkShop(l,k){
 const {front,side,missing}=shopSides(l);
 const cx=wx(l.x+l.breite/2),cz=wz(l.y+l.tiefe/2),hw=l.breite*F/2,hd=l.tiefe*F/2;
 const off={s:[0,hd],n:[0,-hd],o:[hw,0],w:[-hw,0]}[front];
 return {k,lot:l,id:l.id,front,side,noRoad:missing,x:cx+off[0],z:cz+off[1],cx,cz,rot:SIDE_ROT[front],h:l.stockwerke*FLOOR_H,
  tier:LAGE_TIER[l.laden.lage]||'wohn',owner:l.laden.besitzer,art:l.laden.art};
}
// V4: Yukis Wolkenkratzer (von Erik freigegeben). Quelle der Wahrheit für das Flag; data.js reicht SKYSCRAPERS weiter.
export const SKYSCRAPERS=true;
// Yukis Alternativ-Platzierung (Dokomo-Uhrturm auf #157 statt #190, Tocho frei; Minihalt bleibt auf #190): AUS bis Erik bestätigt. Test: ?dokomo=alt
export const DOKOMO_ALT=false||new URLSearchParams(globalThis.location?location.search:'').get('dokomo')==='alt';
const SKY_URL=f=>new URL('../grafik/stadtplan/'+f,import.meta.url);
const SKY_FILES={standard:'stadtplan-v6-wolkenkratzer.json',alt:'stadtplan-v6-wolkenkratzer-alt.json'};
const _sky=SKYSCRAPERS&&PLAN_VERSION>=6?Object.fromEntries(await Promise.all(Object.entries(SKY_FILES).map(([k,f])=>fetch(SKY_URL(f)).then(r=>r.ok?r.json():null).catch(()=>null).then(j=>[k,j])))):{};
export const SKY_LAYOUT=DOKOMO_ALT&&_sky.alt?'alt':'standard';
export const SKY=CITY.id==='tokio'?(_sky[SKY_LAYOUT]||null):null;// Tokios Wolkenkratzer-Liste gilt nur für Tokio (andere Städte: Türme aus dem eigenen Plan, später)
// alle bekannten Umzüge beider Platzierungen (für Spielstände, die mit der anderen Platzierung gespeichert wurden)
export const ALL_MOVES=Object.values(_sky).filter(Boolean).flatMap(j=>(j.laden_umzuege||[]).map(u=>[u.von,u.nach]));
// Läden vor dem Umzug (für die Spielstand-Migration alter Slots)
export const SHOPS_BASE=PLAN.grundstuecke.filter(l=>l.laden).map((l,k)=>mkShop({...l},k));
export const SHOP_MOVES={};// alte Grundstücks-ID -> neue
export const TOWERS=[];// {turm,name,x,y,breite,tiefe,lot|landmark}
if(SKY){const byId=new Map(PLAN.grundstuecke.map(l=>[l.id,l]));
 for(const u of SKY.laden_umzuege||[]){const a=byId.get(u.von),b=byId.get(u.nach);if(!a||!b||!a.laden)continue;
  const neu=(SKY.grundstuecke_laden_neu||[]).find(g=>g.id===u.nach);b.laden={...(neu?neu.laden:a.laden)};delete a.laden;SHOP_MOVES[u.von]=u.nach;}
 // V6 (Whitebeard-Vorabtest, Vorlage m26): weniger Hochhäuser – Wahrzeichen-Türme bleiben, von den übrigen nur jeder zweite (?tuerme=alle = alle)
 const ALLE_TUERME=new URLSearchParams(globalThis.location?location.search:'').get('tuerme')==='alle';let tk=0;
 for(const t of SKY.tuerme||[]){const lmId=typeof t.id==='string'&&t.id.startsWith('wahrzeichen:')?t.id.slice(12):null;
  if(!lmId&&!ALLE_TUERME&&(tk++%2))continue;
  const l=lmId?null:byId.get(t.id);if(!lmId&&!l)continue;if(l){if(l.laden)continue;/* nie auf einem Laden */l.turm=t.turm;}
  TOWERS.push({turm:t.turm,name:t.name,x:t.x,y:t.y,breite:t.breite,tiefe:t.tiefe,lot:l?l.id:null,landmark:lmId});}}
export const SHOPS=PLAN.grundstuecke.filter(l=>l.laden).map((l,k)=>mkShop(l,k));
export const LANDMARK_AREAS=PLAN.wahrzeichen.map(w=>({...w,cx:wx(w.x+w.breite/2),cz:wz(w.y+w.tiefe/2),w:w.breite*F,d:w.tiefe*F}));
export const lm=id=>LANDMARK_AREAS.find(w=>w.wahrzeichen===id);
