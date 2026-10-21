// Lädt Yukis SVG-Grafiken (grafik/) und Bobs Preisdaten (daten/), mit Fallback auf eigene Zeichnungen
import {fillCity} from './cities.js';
import {CATS,SERVICES,BUILD,BUILD_CSV,CAMPAIGNS,CAMP_CSV,MGR_TIERS,TIERS,rebuildTierMap} from './data.js';
export const GFX={svg:{},prices:null,services:null,texte:null,standorte:null,src:{}};
const FILES={
 logo_eight:'logos/eight.svg',logo_lawsun:'logos/lawsun.svg',logo_familia:'logos/familia.svg',logo_minihalt:'logos/minihalt.svg',logo_zabu:'logos/zabu.svg',
  svc_geldautomat:'icons/services/geldautomat.svg',dev_smoothie:'geraete/smoothie-maschine.svg',dev_hot:'geraete/heissgetraenke-vitrine.svg',dev_self:'geraete/selbstbedienungskasse.svg',dev_regal:'geraete/regal.svg',dev_kuehlregal:'geraete/kuehlregal.svg',dev_tiefkuehltruhe:'geraete/tiefkuehltruhe.svg',dev_kaffeemaschine:'geraete/kaffeemaschine.svg',dev_fritteuse:'geraete/fritteuse.svg',dev_oden:'geraete/oden-topf.svg',dev_dampfgarer:'geraete/dampfgarer.svg',dev_kasse:'geraete/kasse.svg',
 icon_onigiri:'icons/onigiri.svg',icon_bento:'icons/bento.svg',icon_sandwich:'icons/sandwich.svg',icon_oden:'icons/oden.svg',icon_kaffee:'icons/kaffee.svg',icon_getraenke:'icons/getraenke.svg',icon_snacks:'icons/snacks.svg',icon_saisonware:'icons/saisonware.svg',icon_alltagsartikel:'icons/alltagsartikel.svg',
 sign0:'laden/schild-leuchtkasten.svg',sign1:'laden/schild-noren.svg',sign2:'laden/schild-pylon.svg',
 awn1:'laden/markise-glatt.svg',awn2:'laden/markise-streifen.svg',awn3:'laden/markise-wellen.svg',
 fac0:'laden/fassade-stadtladen.svg',fac1:'laden/fassade-eckladen.svg',
 partner_shironeko:'logos/shironeko-express.svg',
 iso_fac0:'iso/fassade-standard.svg',iso_fac1:'iso/fassade-neon-tokio.svg',iso_fac2:'iso/fassade-holz-machiya.svg',
 iso_inn0:'iso/innen-standard.svg',iso_inn1:'iso/innen-retro-showa.svg',iso_inn2:'iso/innen-natural-premium.svg',
 pin_own:'karte/pin-eigener-laden.svg',pin_rival:'karte/pin-konkurrenz.svg',pin_lease:'karte/pin-zu-vermieten.svg',
 ban_soon:'karte/banner-bald-eroeffnet.svg',ban_new:'karte/banner-neueroeffnung.svg',shimbun:'zeitung/konbini-shimbun-kopf.svg',
 kobo:'maskottchen/kobo.svg',kobo_besorgt:'maskottchen/kobo-besorgt.svg',kobo_jubelnd:'maskottchen/kobo-jubelnd.svg',
 lage_top:'karte/lage-top.svg',lage_city:'karte/lage-city.svg',lage_wohn:'karte/lage-wohngebiet.svg',lage_rand:'karte/lage-stadtrand.svg',hub_station:'karte/wahrzeichen-tokyo-station.svg',hub_haneda:'karte/wahrzeichen-haneda.svg',
 bh_logo:'bewertung/buuhuu-logo.svg',bh_full:'bewertung/geist-voll.svg',bh_half:'bewertung/geist-halb.svg',bh_empty:'bewertung/geist-leer.svg',
};
export async function loadGfx(){
 await Promise.all(Object.entries(FILES).map(async([k,f])=>{try{const r=await fetch('grafik/'+f,{cache:'no-cache'});if(r.ok){const t=await r.text();if(t.includes('<svg'))GFX.svg[k]=dedupeAttrs(t);}}catch(e){}}));
 await loadData();
}
// Doppelte Attribute (z. B. font-weight zweimal) machen SVG als <img> ungültig – hier bereinigen
function dedupeAttrs(svg){return svg.replace(/<([a-zA-Z][\w:-]*)(\s[^<>]*?)(\/?)>/g,(m,tag,attrs,sl)=>{const seen=new Set();const out=attrs.replace(/\s([\w:-]+)=("[^"]*"|'[^']*')/g,(a,n)=>{if(seen.has(n))return '';seen.add(n);return a;});return `<${tag}${out}${sl}>`;});}
export const has=k=>!!GFX.svg[k];
export function svgColored(key,{main='#E94F4F',second='#FFFFFF',logoBg,name,nameJp,logo,datum}={}){
 let s=GFX.svg[key];if(!s)return null;
 if(logo)s=s.replace(/<g data-placeholder="logo"(\/>|>[\s\S]*?<\/g>)/,`<image href="${logo}" x="30" y="28" width="68" height="68"/>`);
 if(datum!=null)s=s.replace(/(<text[^>]*data-placeholder="datum"[^>]*>)([^<]*)(<\/text>)/g,(m,a,b,c)=>a+datum+c);
 s=s.replace(/var\(--ladenfarbe,[^)]*\)/g,main).replace(/var\(--zweitfarbe,[^)]*\)/g,second).replace(/var\(--logo-bg,[^)]*\)/g,logoBg||main);
 const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 if(name!=null)s=s.replace(/(<text[^>]*data-placeholder="name"[^>]*>)([^<]*)(<\/text>)/g,(m,a,b,c)=>a+esc(name.toUpperCase())+c);
 if(nameJp!=null)s=s.replace(/(<text[^>]*data-placeholder="name-jp"[^>]*>)([^<]*)(<\/text>)/g,(m,a,b,c)=>a+esc(nameJp)+c);
 // Schriftgrößen bei langen Namen verkleinern
 if(name&&name.length>11)s=s.replace(/(<text[^>]*data-placeholder="name"[^>]*font-size=")(\d+)/g,(m,a,n)=>a+Math.round(+n*11/name.length));
 return s;
}
export const svgURL=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
export function svgImage(s){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=svgURL(s);});}

/* ---- Bobs Daten: daten/preise.csv & daten/services.csv (optional) ---- */
export function parseCSV(t){
 const lines=t.replace(/\r/g,'').split('\n').filter(l=>l.trim());if(lines.length<2)return [];
 const sep=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?';':',';
 const split=l=>{const o=[];let cur='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue}if(ch===sep&&!q){o.push(cur.trim());cur=''}else cur+=ch}o.push(cur.trim());return o};
 const head=split(lines[0]).map(h=>h.toLowerCase());
 return lines.slice(1).map(l=>{const v=split(l),o={};head.forEach((h,i)=>o[h]=v[i]);return o});
}
export const num=v=>{if(v==null)return NaN;return parseFloat(String(v).replace(/[¥\s]/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',','.'))};
async function getCSV(f){try{const r=await fetch('daten/'+f,{cache:'no-cache'});if(r.ok){GFX.src[f]=true;return parseCSV(await r.text());}}catch(e){}return null}
async function loadData(){
 const [ab,mk,pe,so]=await Promise.all(['ausbau.csv','marketing.csv','personal.csv','standorte.csv'].map(getCSV));
 if(ab)applyAusbau(ab);if(mk)applyMarketing(mk);if(pe)applyPersonal(pe);if(so&&so.length){GFX.standorte=so;applyStandorte(so);}
 try{const r=await fetch('marketing/texte.json',{cache:'no-cache'});if(r.ok)GFX.texte=fillCity(await r.json());}catch(e){}
 try{const r=await fetch('daten/preise.csv',{cache:'no-cache'});if(r.ok){const rows=parseCSV(await r.text());applyPrices(rows);}}catch(e){}
 try{const r=await fetch('daten/services.csv',{cache:'no-cache'});if(r.ok){const rows=parseCSV(await r.text());applyServices(rows);}}catch(e){}
}
export function applyPrices(rows){
 // Spalten: Produkt, Warengruppe, Verkaufspreis, Einkaufspreis, Haltbarkeit (in Tagen), Saisonfaktor, Verkaufspreis_netto …
 const agg={};
 for(const r of rows){
  const k=CATS.find(c=>c.csv.toLowerCase()===(r['warengruppe']||'').trim().toLowerCase());
  const vk=num(r['verkaufspreis_netto'])||num(r['verkaufspreis']),ek=num(r['einkaufspreis']);
  const hb=num(r['haltbarkeit (in tagen)']??r['haltbarkeit in tagen']??r['haltbarkeit']);
  if(!k||!(vk>0)||!(ek>0))continue;
  const sf={};String(r['saisonfaktor']||'').split('|').forEach(x=>{const [a,b]=x.split(':');const m={fruehling:'spring',sommer:'summer',herbst:'autumn',winter:'winter'}[a];if(m)sf[m]=num(b)});
  const a=agg[k.id]||(agg[k.id]={rows:[]});a.rows.push({produkt:r['produkt'],vk,ek,hb:isNaN(hb)?30:hb,sf,hinweis:r['hinweis']||''});
 }
 for(const k of CATS){const a=agg[k.id];if(!a)continue;const R=a.rows,n=R.length;
  k.items=R.map(r=>r.produkt);k.fromCSV=true;
  if(k.id==='saison')continue; // Preis kommt je Event aus saisonFor()
  // Tabak (10 % Marge) nicht in den Gruppenschnitt einrechnen, damit Alltagsartikel realistisch bleiben
  k.price=Math.round(R.reduce((x,r)=>x+r.vk,0)/n);k.cost=+(R.reduce((x,r)=>x+r.ek,0)/R.reduce((x,r)=>x+r.vk,0)).toFixed(3);
  k.fresh=R.reduce((x,r)=>x+r.hb,0)/n<=3;
  for(const se of ['spring','summer','autumn','winter']){const v=R.map(r=>r.sf[se]).filter(x=>x>=0);if(v.length)k.sf[se]=+(v.reduce((x,y)=>x+y,0)/v.length).toFixed(2);}
 }
 GFX.prices=Object.keys(agg).length?agg:null;
}
export function applyServices(rows){
 // Spalten: Service, Freischaltkosten, Laufende_Kosten_Monat, Provision_pro_Vorgang, Vorgaenge_pro_Tag_Start, Kundenbonus_Prozent
 let n=0;
 for(const r of rows){const name=(r['service']||'').trim().toLowerCase();
  const v=Object.values(SERVICES).find(v=>v.csv.toLowerCase()===name);if(!v)continue;
  const f=(col,cb)=>{const x=num(r[col]);if(!isNaN(x))cb(x)};
  f('freischaltkosten',x=>v.sign=x);f('laufende_kosten_monat',x=>v.monthly=x);f('provision_pro_vorgang',x=>v.commission=x);
  f('vorgaenge_pro_tag_start',x=>v.perDay=x);f('kundenbonus_prozent',x=>v.bonus=x/100);v.fromCSV=true;n++;}
 GFX.services=n||null;
}

export function applyAusbau(rows){
 const grp={};for(const r of rows){const k=BUILD_CSV[(r['geraet_stil']||'').trim()];if(!k)continue;(grp[k]=grp[k]||[]).push(r);}
 for(const k in grp){const B=BUILD[k];
  const mk=(r,o={})=>({...o,name:(r['modell']||o.name||'').replace(/ \(.*\)/,''),price:num(r['preis'])||o.price,n:Math.max(1,num(r['anzahl_standard'])||o.n||1),q:num(r['qualitaet_1_5'])||o.q,prod:num(r['produktivitaet_1_5'])||o.prod,dep:num(r['abschreibung_jahre'])||o.dep||6,fromCSV:true});
  if(['smoothie','hot','self'].includes(k)){B.opts=grp[k].map((r,i)=>mk(r,{...(B.opts[i]||{}),desc:(B.opts[i]||{}).desc||r['hinweis']||''}));continue;}
  grp[k].forEach((r,i)=>{const o=B.opts.find(o=>o.name.toLowerCase().startsWith((r['modell']||'').toLowerCase().slice(0,6)))||B.opts[i];if(!o)return;Object.assign(o,mk(r,o),{name:o.name,desc:o.desc,gfx:o.gfx,night:o.night,tourist:o.tourist,power:o.power,eat:o.eat});});}
}
export function applyMarketing(rows){
 for(const r of rows){const id=CAMP_CSV[(r['kampagne']||'').trim()];const c=CAMPAIGNS.find(x=>x.id===id);if(!c)continue;
  const kosten=num(r['kosten']),art=(r['kostenart']||'').toLowerCase(),eff=num(r['wirkung_kunden_prozent']);
  if(!isNaN(eff))c.cust=eff/100;
  if(kosten>0){if(art.startsWith('%'))c.revPct=kosten/100;else if(art.includes('pro woche'))c.weekly=kosten;else c.once=kosten;}
  const m=(r['einheit']||'').match(/\+([\d.]+) einmalig/);if(m)c.setup=num(m[1]);
  const d=parseInt(r['dauer_wochen']);if(!isNaN(d)&&!c.weekly)c.dur=Math.max(c.dur||0,d);
  c.desc=[r['wirkung_absatz'],r['nebenwirkung']].filter(x=>x&&x!=='-').join(' · ');c.fromCSV=true;}
}
export function applyPersonal(rows){
 const L=rows.filter(r=>(r['rolle']||'')==='Filialleiter');
 L.forEach((r,i)=>{const t=MGR_TIERS.find(t=>t.stufe===r['stufe'])||MGR_TIERS[i];if(!t)return;const v=num(r['wert']);if(v>0)t.salary=v;
  const sk=['menschen','produkt','marketing','ethik'].map(k=>num(r[k]));if(sk.every(x=>x>0))t.sk=sk;});
}

export function applyStandorte(rows){
 for(const r of rows){const t=Object.values(TIERS).find(t=>t.csv.toLowerCase()===(r['lage-stufe']||'').trim().toLowerCase());if(!t)continue;
  const m=num(r['miete pro monat']),d=num(r['kaution in monatsmieten']),p=num(r['passanten pro woche']);
  if(m>0)t.rentM=m;if(d>0)t.depM=d;if(p>0)t.pass=p;t.fromCSV=true;}
}
