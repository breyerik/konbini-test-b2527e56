// Neue Ketten (Franky, Erik freigegeben 21.10.2026): Zabu nach 10 Spieljahren; ausländische Ketten, sobald keine Konkurrenz mehr übrig ist.
// Alle Werte in neueketten_cfg.js. Zustand: state.nk = {chains:{id:{start,kapital,ergebnis,weg,messe}}, leerSeit, zeigen}
import * as K from './neueketten_cfg.js';
import * as FC from './finanzen_cfg.js';
let S=null,H=null;
const ALL=[K.ZABU,...K.AUSLAND],BY=Object.fromEntries(ALL.map(c=>[c.id,c]));
export const cfg=id=>BY[id];
export function init(sim,helpers){S=sim;H=helpers;// Logos vorladen, damit Karten-Pins sofort das Logo haben
 for(const c of [K.ZABU])if(!H.GFX.svg['logo_'+c.id])fetch(`grafik/logos/${c.file}.svg`).then(r=>r.ok?r.text():'').then(t=>{if(t)H.GFX.svg['logo_'+c.id]=t;}).catch(()=>{});
 sync(S.state);}
export function sync(s){if(s&&s.nk){for(const id in s.nk.chains)if(!s.nk.chains[id].weg)register(id);for(const n of s.nk.nf||[])nfRegister(n,s);}}
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
export function weekHook(s,rep){const nk=ensure(s),R=K.REGELN,w=s.week;sync(s);planHook(s,rep);
 if(!nk.chains.zabu&&!(nk.nf||[]).some(n=>n.id==='zabu')&&w>=K.ZABU.abJahr*52+1)zabuRein(s,rep);
 const rv=s.fz&&s.fz.rv;const alte=rv?H.RIVALS.filter(c=>!(rv[c]&&rv[c].weg)).length:allStores(s).filter(x=>H.RIVALS.includes(x.chain)).length;// mit Finanzmenü: Kette lebt, bis übernommen/weg (auch mit 0 Läden auf der Karte)
 if(alte===0){if(nk.leerSeit==null)nk.leerSeit=w;}else nk.leerSeit=null;
 if(nk.leerSeit!=null){const k=(nk.nf||[]).filter(n=>K.AUSLAND.some(a=>a.id===n.id)).length,next=auslandFrei(s,{nf:nk.nf||[],chains:nk.chains})[0];
  if(next&&auslandAktiv(s).length<R.maxAktiv&&w>=nk.leerSeit+R.startNachWochen+k*R.abstandWochen)auslandRein(s,next.id,rep);}
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
export const bieter=s=>auslandAktiv(s).concat(aktiv(s).includes('zabu')?['zabu']:[]);// alte Spielstände
export function messeGewonnen(s,id){const c=((s.nk||{}).chains||{})[id];if(c)c.messe=true;}
/* ---------- Nachrücker-Ketten (Erik 23.10.) ---------- */
const NF=Object.fromEntries(K.NACHFOLGER.map(c=>[c.id,c]));
// Pool leer → Ersatzname aus Silben (erfunden), z. B. „Aomori Mart 2“; Nummer macht ihn eindeutig
const SIL=[['Aoi','あおい'],['Kiri','きり'],['Kaede','かえで'],['Sora','そら'],['Mori','もり'],['Yuzu','ゆず']],END=[['Mart','マート'],['24','24'],['Store','ストア']],FB_COL=[['#5A7D9A','#F2E3B3'],['#A0522D','#FFE8C2'],['#3E8E7E','#FFF4D6']];
function nfErsatz(k){const a=SIL[k%SIL.length],e=END[Math.floor(k/SIL.length)%END.length],f=FB_COL[k%FB_COL.length],r=Math.floor(k/(SIL.length*END.length));
 return {id:'neu'+k,name:`${a[0]} ${e[0]}${r?' '+(r+1):''}`,jp:`${a[1]}${e[1]}${r?' '+(r+1):''}`,color:f[0],color2:f[1],brand:.95,aggr:.09};}
function nfGet(id){if(!NF[id]&&/^neu\d+$/.test(id))NF[id]=nfErsatz(+id.slice(3));
 if(!NF[id]&&(K.AUSLAND.some(a=>a.id===id)||id==='zabu')){const a=BY[id];NF[id]={id,name:a.name,jp:a.jp,color:a.color,color2:a.color2,brand:a.brand,aggr:a.aggr,land:a.land,ausland:id!=='zabu'};}return NF[id];}
// Ausländische Ketten (Erik 23.10.): rücken wie Nachfolger auf einen freien Platz, gleiche Startbedingungen
const ausLand=l=>{const m=(l||'').match(/^(\S+)\s+(.*)$/),n=m?m[2]:l,f=m?m[1]:'';return ({Niederlande:'den Niederlanden',USA:'den USA'}[n]||n)+(f?' '+f:'');};
const auslandFrei=(s,nk)=>K.AUSLAND.filter(a=>!nk.nf.some(n=>n.id===a.id)&&!(nk.chains||{})[a.id]&&!H.CHAINS[a.id]&&!((s.nk||{}).plan||[]).some(p=>p.id===a.id));
export const nfCfg=id=>nfGet(id);
// Als normaler Rivale anmelden: Karte (CHAINS/RIVALS), Ketten-GuV im Finanzmenü (RIVAL_START …), Konkurrenz-Liste
function nfRegister(n,s){const c=nfGet(n.id);if(!c)return;if(n.id==='zabu')register('zabu');// Zabu: eigenes Logo (vorhanden)
const weg=s&&s.fz&&s.fz.rv&&s.fz.rv[n.id]&&s.fz.rv[n.id].weg;
 if(!H.CHAINS[n.id])H.CHAINS[n.id]={name:c.name,jp:c.jp,color:c.color,color2:c.color2,brand:c.brand,aggr:c.aggr,file:null,logo:(K.LOGO_FREIGEGEBEN||{})[n.id]?(c.logo||n.id):null,nachfolger:true};
 if(!weg&&!H.RIVALS.includes(n.id))H.RIVALS.push(n.id);
 const R=K.NACHFOLGER_REGEL;if(FC.RIVAL_START[n.id]==null)FC.RIVAL_START[n.id]=R.kasse;if(FC.RIVAL_WACHSTUM[n.id]==null)FC.RIVAL_WACHSTUM[n.id]=R.wachstum;
 if(FC.RIVAL_IPO.chance[n.id]==null)FC.RIVAL_IPO.chance[n.id]=R.ipoChance;if(!FC.RIVAL_STAEDTE.heimat[n.id])FC.RIVAL_STAEDTE.heimat[n.id]=n.heimat||'tokio';
 if(!FC.KONKURRENZ.some(k=>k.c===n.id))FC.KONKURRENZ.push({c:n.id});}
// Eine Kette ist weg (grund: 'pleite' | 'uebernommen') → nächster freier Name rückt nach, 0 Läden. Meldung genau einmal (id).
// Erik 23.10.: Nachfolger kommt nicht sofort – Platz bleibt leer, nach ansageWochen Ankündigung (Name fest), nach startWochen Start
export const NF_START=K.NACHFOLGER_REGEL.startWochen;
export const wartend=s=>((s.nk||{}).plan||[]);
export function nachfolger(s,alt,grund,rep){const nk=ensure(s);nk.nf=nk.nf||[];nk.plan=nk.plan||[];if(nk.nf.some(n=>n.alt===alt)||nk.plan.some(p=>p.alt===alt))return null;
 const p={alt,grund,week:s.week,altName:(H.CHAINS[alt]||{name:alt}).name,heimat:FC.RIVAL_STAEDTE.heimat[alt]||'tokio',id:null};
 if(K.NACHFOLGER_REGEL.startWochen<=0){const c=nfWaehlen(s,nk);return nfStart(s,nk,p,c,rep);}// alter Weg (Tests): sofort
 nk.plan.push(p);return null;}
function nfWaehlen(s,nk){const belegt=id=>nk.nf.some(n=>n.id===id)||(nk.plan||[]).some(p=>p.id===id)||!!H.CHAINS[id];
 const fr=auslandFrei(s,nk).filter(a=>!belegt(a.id));let c=fr.length&&Math.random()<K.NACHFOLGER_REGEL.auslandChance?nfGet(fr[Math.floor(Math.random()*fr.length)].id):null;
 c=c||K.NACHFOLGER.find(x=>!belegt(x.id));
 for(let k=0;!c;k++){const e=nfGet('neu'+k);if(!belegt(e.id))c=e;}return c;}
export function planHook(s,rep){const nk=ensure(s);nk.nf=nk.nf||[];const R=K.NACHFOLGER_REGEL;
 for(const p of [...(nk.plan||[])]){
  if(!p.id&&s.week>=p.week+R.ansageWochen){const c=nfWaehlen(s,nk);p.id=c.id;p.ab=p.week+R.startWochen;
   const m={id:'ansage:'+c.id,chain:p.alt,text:c.ausland?`📣 Kobo: <b>${c.name}</b> aus ${ausLand(c.land)} will nächstes Jahr in Japan an den Start – auf den freien Platz von ${p.altName}.`:`📣 Kobo: Neue Kette <b>${c.name}</b> (${c.jp}) will nächstes Jahr an den Start – auf den freien Platz von ${p.altName}.`};
   if(!(s.news||[]).some(x=>x.id===m.id)){news(s,m);if(rep&&rep.news)rep.news.push({...m,week:s.week});}}
  if(p.id&&s.week>=p.week+R.startWochen){nk.plan=nk.plan.filter(x=>x!==p);nfStart(s,nk,p,nfGet(p.id),rep);}}}
function nfStart(s,nk,p,c,rep){const alt=p.alt,grund=p.grund;
 const altName=p.altName,n={id:c.id,alt,grund,week:s.week,heimat:p.heimat};nk.nf.push(n);nfRegister(n,s);
 const warum=grund==='pleite'?`Nach der Pleite von ${altName}`:`Nach der Übernahme von ${altName}`;
 const m={id:'nachfolger:'+c.id,chain:c.id,text:c.ausland?`🌏 <b>${c.name}</b> aus ${ausLand(c.land)} steigt in den japanischen Markt ein und übernimmt den freien Platz von ${altName} – Start bei null: 0 Läden, ${H.fY(K.NACHFOLGER_REGEL.kasse)} Startkapital.`:`🌱 Neue Kette gegründet: <b>${c.name}</b> (${c.jp}). ${warum} startet sie wie wir bei null – 0 Läden, ${H.fY(K.NACHFOLGER_REGEL.kasse)} Startkapital, Ziel: von ganz unten nach ganz oben.`};
 if(!(s.news||[]).some(x=>x.id===m.id)){news(s,m);if(rep&&rep.news)rep.news.push({...m,week:s.week});}
 if(rep&&rep.events)rep.events.push(c.ausland?`🌏 Neue Kette aus dem Ausland: ${c.name}`:`🌱 Neue Kette: ${c.name}`);return c.id;}
// Leerer Markt (alter Weg): ausländische Kette kommt ebenfalls gleichberechtigt (¥5 Mio, 0 Läden) statt mit Milliarden
function auslandRein(s,id,rep){const nk=ensure(s);nk.nf=nk.nf||[];const c=nfGet(id),n={id,alt:null,grund:'leer',week:s.week,heimat:'tokio'};nk.nf.push(n);nfRegister(n,s);
 const m={id:'nachfolger:'+id,chain:id,text:`🌏 <b>${c.name}</b> aus ${ausLand(c.land)} steigt in den japanischen Markt ein und übernimmt den freien Platz – Start bei null: 0 Läden, ${H.fY(K.NACHFOLGER_REGEL.kasse)} Startkapital.`};
 if(!(s.news||[]).some(x=>x.id===m.id)){news(s,m);if(rep&&rep.news)rep.news.push({...m,week:s.week});}if(rep&&rep.events)rep.events.push(`🌏 Neue Kette aus dem Ausland: ${c.name}`);}
// Zabu (Erik 23.10.): startet gleich wie alle – ¥5 Mio + Startkredit, 0 Läden (kein Milliarden-Minimum mehr)
function zabuRein(s,rep){const nk=ensure(s);nk.nf=nk.nf||[];const c=nfGet('zabu'),n={id:'zabu',alt:null,grund:'neu',week:s.week,heimat:'tokio'};nk.nf.push(n);nfRegister(n,s);
 const m={id:'nachfolger:zabu',chain:'zabu',text:`🌱 Neue japanische Kette: <b>${c.name}</b> (${c.jp}) wird gegründet – Start bei null wie alle: 0 Läden, ${H.fY(K.NACHFOLGER_REGEL.kasse)} Startkapital.`};
 if(!(s.news||[]).some(x=>x.id===m.id)){news(s,m);if(rep&&rep.news)rep.news.push({...m,week:s.week});}if(rep&&rep.events)rep.events.push(`🌱 Neue Kette: ${c.name}`);}
export {K};
