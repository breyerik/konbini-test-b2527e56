// Neue Ketten (Franky, Erik freigegeben 21.10.2026): Zabu nach 10 Spieljahren; ausländische Ketten, sobald keine Konkurrenz mehr übrig ist.
// Alle Werte in neueketten_cfg.js. Zustand: state.nk = {chains:{id:{start,kapital,ergebnis,weg,messe}}, leerSeit, zeigen}
import * as K from './neueketten_cfg.js';
let S=null,H=null;
const ALL=[K.ZABU,...K.AUSLAND],BY=Object.fromEntries(ALL.map(c=>[c.id,c]));
export const cfg=id=>BY[id];
export function init(sim,helpers){S=sim;H=helpers;// Logos vorladen, damit Karten-Pins sofort das Logo haben
 for(const c of ALL)if(!H.GFX.svg['logo_'+c.id])fetch(`grafik/logos/${c.file}.svg`).then(r=>r.ok?r.text():'').then(t=>{if(t)H.GFX.svg['logo_'+c.id]=t;}).catch(()=>{});
 sync(S.state);}
export function sync(s){if(s&&s.nk)for(const id in s.nk.chains)if(!s.nk.chains[id].weg)register(id);}
// Hooks laufen nach dem Zeitungs-Update der Woche → Meldungen direkt in state.news
function news(s,n){s.news=[{...n,week:s.week}].concat(s.news||[]).slice(0,14);}
function ensure(s){if(!s.nk)s.nk={chains:{},leerSeit:null,zeigen:null};return s.nk;}
// Kette im Spiel bekannt machen (Logo/Name für Karte, Listen, Finanzmenü)
function register(id){const c=BY[id];if(!c||H.CHAINS[id])return;
 H.CHAINS[id]={name:c.name,jp:c.jp,color:c.color,color2:c.color2,brand:c.brand,aggr:c.aggr,file:c.file,neu:true};
 if(!H.GFX.svg['logo_'+id])fetch(`grafik/logos/${c.file}.svg`).then(r=>r.ok?r.text():'').then(t=>{if(t)H.GFX.svg['logo_'+id]=t;}).catch(()=>{});}
const allStores=s=>s.stores.concat(...Object.values(s.away||{}).map(a=>a.stores||[]));
export const aktiv=s=>Object.entries((s.nk||{}).chains||{}).filter(([,c])=>!c.weg).map(([id])=>id);
const auslandAktiv=s=>aktiv(s).filter(id=>id!=='zabu');
function eintritt(s,id,rep){const nk=ensure(s),R=K.REGELN,n=Object.keys(nk.chains).filter(x=>x!=='zabu').length;
 const fw=Math.max(0,(H.firmenwert(s)||{}).wert||0),kap=Math.max(R.kapitalMin,fw*R.kapitalAnteil)*(id==='zabu'?1:Math.pow(1+R.kapitalPlus,n));
 nk.chains[id]={start:s.week,kapital:kap,start_kapital:kap,ergebnis:0,weg:false,messe:false,fw};register(id);nk.zeigen=id;
 const c=BY[id];news(s,{chain:id,text:`🚨 <b>${c.name}</b> kommt nach Japan! ${c.land} · Startkapital ${H.fY(kap)} · Preise 5 % unter unseren.`});
 rep.events.push(`🚨 Neue Kette: ${c.name}`);}
// Wochen-Hook (sim.endWeek → weekHooks)
export function weekHook(s,rep){const nk=ensure(s),R=K.REGELN,w=s.week;sync(s);
 if(!nk.chains.zabu&&w>=K.ZABU.abJahr*52+1)eintritt(s,'zabu',rep);
 const rv=s.fz&&s.fz.rv;const alte=rv?H.RIVALS.filter(c=>!(rv[c]&&rv[c].weg)).length:allStores(s).filter(x=>H.RIVALS.includes(x.chain)).length;// mit Finanzmenü: Kette lebt, bis übernommen/weg (auch mit 0 Läden auf der Karte)
 if(alte===0){if(nk.leerSeit==null)nk.leerSeit=w;}else nk.leerSeit=null;
 if(nk.leerSeit!=null){const k=Object.keys(nk.chains).filter(x=>x!=='zabu').length,next=K.AUSLAND[k];
  if(next&&auslandAktiv(s).length<R.maxAktiv&&w>=nk.leerSeit+R.startNachWochen+k*R.abstandWochen)eintritt(s,next.id,rep);}
 for(const id of aktiv(s)){const c=nk.chains[id],age=w-c.start,mine=s.stores.filter(x=>x.chain===id);
  // Expansion: Jahr 1 jede Woche, danach jede 2. Woche, solange Kapital reicht
  const takt=age<R.jahr1Wochen?R.taktJahr1:R.taktDanach;
  if(age%takt===0&&c.kapital>=R.ladenKosten&&S.freeTotal()>0){const o=S.rivalOpen(id,w);if(o){c.kapital-=R.ladenKosten;
   news(s,{chain:id,near:!!o.near,text:`<b>${BY[id].name}</b> eröffnet eine Filiale in ${H.dname(o.st.d)}.`});}}
  // Preise 2 Jahre −5 %: Dauer-Rabattaktion auf nahe Spieler-Filialen
  s.priceActs=s.priceActs||{};if(age<R.preisWochen)s.priceActs[id]=Math.max(s.priceActs[id]||0,1);
  // grobe Ketten-GuV je Laden (Spielwerte)
  let g=0;for(const st of mine){const pl=s.stores.filter(x=>x.chain==='player'&&x.d===st.d).length;
   g+=R.ladenGewinn-R.minusJeSpielerLaden*pl-(age<R.preisWochen?R.preisKampfKosten:0)-(c.messe?0:R.ohneMarkenMalus);}
  c.kapital+=g;c.ergebnis+=g;c.letzte=g;
  // Verlustpuffer 3 Jahre, dann Rückzug ohne Gewinn
  if(age>=R.verlustWochen&&c.ergebnis<0){c.weg=true;c.wegWoche=w;s.stores=s.stores.filter(x=>x.chain!==id);delete s.priceActs[id];
   news(s,{chain:id,text:`🏳️ <b>${BY[id].name}</b> zieht sich aus Japan zurück. Alle Läden schließen.`});rep.events.push(`🏳️ ${BY[id].name} gibt auf`);}}
}
// Firmenwert für Konkurrenz-Liste: Kapital + Läden × Baukosten
export const wert=(s,id)=>{const c=((s.nk||{}).chains||{})[id];if(!c)return null;return Math.max(0,c.kapital)+s.stores.filter(x=>x.chain===id).length*K.REGELN.ladenKosten;};
// Messe: neue Ketten dürfen bieten; gewinnen sie, haben sie ab dann Marken-Deals
export const bieter=s=>auslandAktiv(s).concat(aktiv(s).includes('zabu')?['zabu']:[]);
export function messeGewonnen(s,id){const c=((s.nk||{}).chains||{})[id];if(c)c.messe=true;}
export {K};
