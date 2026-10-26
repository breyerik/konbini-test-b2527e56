// Sortiment des Spielers: welche Artikel sind freigeschaltet (Start, Markenverhandlung, Messe, Eigenmarke, Übernahme)
// V6 (Erik 25.10. 15:49): jedes Produkt einzeln mit eigenem Namen, Umsatz, fester Gruppe und Pflichtgerät (info()).
import * as K from './sortiment_cfg.js';
import {GFX} from './gfx.js';
import {FIRMEN} from './finanzen_data.js';
import {KAUFQUOTE,BASIS_KUNDEN_WOCHE,MESSE,STEUER10,SAISON,ANTEIL_STUFEN} from './finanzen_cfg.js';
import {EIGENMARKEN,NACHFRAGE_START} from './buero_cfg.js';
export {K};
const FM=Object.fromEntries(FIRMEN.map(f=>[f.id,f])),MM=Object.fromEntries(MESSE.marken.map(m=>[m.id,m])),EM=Object.fromEntries(EIGENMARKEN.map(e=>[e.id,e]));
export function ensure(st){if(!st.sortiment){st.sortiment={art:{},alle:true};// alte Spielstände ohne Sortiment: alles bleibt offen
  for(const a of K.START)st.sortiment.art[a.id]={name:a.name,cat:a.cat};}return st.sortiment;}
// feste Gruppe aus der Artikeltabelle; Namensraten (KAT_WORT) nur noch als Rückfall für Unbekanntes (Test: kein Produkt nutzt ihn)
export function katVon(name){const a=K.ARTIKEL[name]||Object.values(K.ARTIKEL).find(x=>x.label===name);if(a)return a.cat;for(const [re,c] of K.KAT_WORT)if(re.test(name))return c;return 'alltag';}
const netto=(typ,vk)=>vk/(STEUER10.has(typ)?1.1:1.08);
// V6 (R43): Anteil an der Herstellerfirma senkt den Einkauf ihrer Produkte (ANTEIL_STUFEN.ek). Banken und Firmen ohne Produkt: 0.
export function anteilStufe(st,f){const fz=st&&st.fz;if(!f||!fz||!fz.depot||!f.aktien)return -1;const an=(fz.depot[f.id]||0)/f.aktien;let i=-1;ANTEIL_STUFEN.forEach((t,k)=>{if(an>=t.p)i=k;});return i;}
export function ekRabatt(st,f){if(!f||f.bank||K.OHNE_PRODUKT.includes(f.id))return 0;const i=anteilStufe(st,f);return i<0?0:ANTEIL_STUFEN[i].ek;}
export function artikel(f){if(!f||K.OHNE_PRODUKT.includes(f.id))return [];
 return (K.FIRMEN_ARTIKEL[f.id]||String(f.liefert||'').split(',')).map(x=>x.trim()).filter(x=>x&&x!=='–'&&!/paket|großhandel/i.test(x)).map((n,i)=>{const a=K.ARTIKEL[n]||{label:n,cat:katVon(n),dev:[],typ:'alltag',vk:449,m:.35,fallback:true};
  return {id:f.id+'#'+i,art:n,name:f.name+' '+(((K.FIRMEN_LABEL||{})[f.id]||{})[n]||a.label),cat:a.cat,dev:a.dev,typ:a.typ,vk:a.vk,ek:a.ek!=null?a.ek:Math.round(netto(a.typ,a.vk)*(1-a.m)),fallback:!!a.fallback};});}
export const messeName=m=>m.name+' '+m.prod.replace(new RegExp('^'+m.name.split(' ').pop()+'\\s*','i'),'');
// Vollständige Produktinfo zu einem Sortiment-Eintrag (null = Startprodukt, läuft über die Gruppe)
export function info(st,id,a){a=a||(ensure(st).art[id])||{};const v=(st.fz&&st.fz.vertraege)||{};
 if(id.startsWith('start:'))return null;
 if(id.startsWith('geraet:')){const g=K.GERAET_PRODUKTE.find(x=>x.id===id);return g?{...g,quelle:'geraet'}:null;}
 if(id.startsWith('messe:')){const mid=id.slice(6),m=MM[mid];if(!m)return null;const P=K.MESSE_PRODUKT[m.typ]||{cat:'drinks',dev:['fridge']},c=v[mid];
  return {id,name:messeName(m),cat:P.cat,dev:P.dev,typ:m.typ,q:KAUFQUOTE[m.typ]||.01,vk:m.vk,ek:c&&c.ek!=null?c.ek:Math.round(netto(m.typ,m.vk)*(1-m.marge)),quelle:'messe',vertrag:mid,exkl:!!(c&&c.exkl)};}
 if(id.startsWith('eigen:')){const e=EM[id.slice(6)],P=e&&K.EIGEN_PRODUKT[e.id];if(!e||!P)return null;
  return {id,name:e.name,cat:P.cat,dev:P.dev,typ:'eigen',q:e.stueck/BASIS_KUNDEN_WOCHE,vk:e.vk,ek:e.ek,quelle:'eigen',start:a.start,f:a.start!=null&&st.week-a.start<NACHFRAGE_START.wochen?NACHFRAGE_START.faktor:1};}// unbekannte Marke: −5 % in den ersten 13 Wochen
 if(id.startsWith('rivale:')){const k=id.split(':')[2];return {id,name:a.name||id,cat:k,dev:K.START_DEV[k]||[],typ:'rivale',q:.008,vk:a.vk||200,ek:a.ek||120,quelle:'rivale'};}
 const [fid]=id.split('#'),f=FM[fid];if(!f)return null;const A=artikel(f).find(x=>x.id===id);if(!A)return null;const c=v[id];
 const ek0=c&&c.ek!=null?c.ek:A.ek,rb=ekRabatt(st,f);
 return {id,name:A.name,cat:A.cat,dev:A.dev,typ:A.typ,q:KAUFQUOTE[A.typ]||.01,vk:c&&c.vk?c.vk:A.vk,ek:Math.round(ek0*(1-rb)),ek0,rabatt:rb,quelle:'vertrag',vertrag:id,exkl:!!(c&&c.exkl),fallback:A.fallback};}
// alle Zusatzprodukte im Sortiment (ohne Startprodukte) + Geräteware (verkauft nur, wo das Gerät steht)
export function produkte(st){const so=ensure(st),L=[];for(const [id,a] of Object.entries(so.art)){const p=info(st,id,a);if(p)L.push(p);}
 for(const g of K.GERAET_PRODUKTE)L.push({...g,quelle:'geraet'});return L;}
export const devOk=(s,dev)=>(dev||[]).every(k=>s.b&&s.b[k]>=0);
export const devFehlt=(s,dev)=>(dev||[]).filter(k=>!(s.b&&s.b[k]>=0));
export const devText=dev=>(dev||[]).map(k=>K.GERAETE[k]?K.GERAETE[k][1]+' '+K.GERAETE[k][0]:k).join(' + ');
// Saisonfaktor eines Produkts: sf je Jahreszeit (wie CATS) oder SAISON je Typ nach Monat (Bob)
export function saisonP(p,ev,d){if(p.sf)return p.sf[ev.key]??1;const sz=SAISON[p.typ]||{},m=d.getMonth();return 1+(m>=5&&m<=7?sz.sommer||0:(m===11||m<=1)?sz.winter||0:0);}
// Produkte (inkl. Startprodukte), die ohne Gerät k im Laden s nichts verkaufen
export function betroffen(st,s,k){const L=produkte(st).filter(p=>(p.dev||[]).includes(k));for(const a of K.START)if((K.START_DEV[a.cat]||[]).includes(k))L.unshift({id:a.id,name:a.name,dev:K.START_DEV[a.cat]});return L;}
// alter Spielstand: je Laden, welche Geräte für vorhandene Produkte fehlen
export function fehlendeGeraete(st,s){const f=new Set();for(const p of produkte(st))for(const k of devFehlt(s,p.dev))f.add(k);for(const a of K.START)for(const k of devFehlt(s,K.START_DEV[a.cat]))f.add(k);return [...f];}
export function hat(st,id){return !!ensure(st).art[id];}
export function freischalten(st,id,name,cat){const so=ensure(st);if(so.art[id])return false;so.art[id]={name,cat};return true;}
export function entfernen(st,id){const so=ensure(st);if(!so.art[id])return false;delete so.art[id];return true;}
export function arts(st,cat){return Object.values(ensure(st).art).filter(a=>a.cat===cat);}
const startArts=(st,cat)=>Object.entries(ensure(st).art).filter(([id,a])=>id.startsWith('start:')&&a.cat===cat).map(([,a])=>a);
// Gruppe offen = es gibt ein Startprodukt darin (V6: Verträge öffnen keine ganze Gruppe mehr, sie bringen ihr Einzelprodukt)
export function offen(st,cat){if(!K.ON)return true;const so=ensure(st);return so.alle||startArts(st,cat).length>0;}
export function breite(st,cat){if(!K.ON)return 1;return offen(st,cat)?1:0;}
// Gruppenpreis aus den Startartikeln der Gruppe (Option A); null = Gruppenschnitt wie bisher
export function preis(st,k){if(!K.ON||!K.PREIS_JE_ARTIKEL||k.id==='saison')return null;const so=ensure(st);if(so.alle)return null;
 const R=GFX.prices&&GFX.prices[k.id]&&GFX.prices[k.id].rows;if(!R||!R.length)return null;const A=startArts(st,k.id);if(!A.length)return null;
 let vk=0,ek=0,n=0;
 for(const a of A){const sa=K.START.find(x=>x.name===a.name&&x.cat===a.cat);const re=sa?(sa.csv?new RegExp(sa.csv,'i'):null):new RegExp(a.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  const M=re?R.filter(r=>re.test(r.produkt)):R;const use=M.length?M:null;
  if(use){for(const r of use){vk+=r.vk/use.length;ek+=r.ek/use.length;}}else{vk+=k.price;ek+=k.price*k.cost;}n++;}
 return {price:Math.round(vk/n),cost:+(ek/vk).toFixed(3)};}
