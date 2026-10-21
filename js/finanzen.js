// Finanzmenü V7 (Franky nach Yukis Mockups screens/finanzmenue/a–j und Bobs Konzept V2): Filialen · Börse (+Kredite) · Produkte (+Messe) · Konkurrenz (+IPO)
// Standard an (Erik 21.10. 18:53), ?finanzen=0 schaltet es ab (dann altes Finanzen-Panel).
import {FIRMEN} from './finanzen_data.js';
import * as C from './finanzen_cfg.js';
export const ON=new URLSearchParams(location.search).get('finanzen')!=='0';
let S,H;// Sim-Modul und Helfer aus app.js (chainLogo, esc, rerender, toast)
import * as NK from './neueketten.js';
import * as BU from './buero.js';
import * as PV from './privat.js';
import * as UE from './uebernahme_cfg.js';
import {NEUESTAEDTE} from './cities.js';
const V={praemie:UE.PRAEMIE.standard,wochen:UE.LAUFZEIT.standard,div:PV.CFG.DIVIDENDE.standard,ein:PV.CFG.EINLAGE.start,einArt:PV.CFG.EINLAGE.standard,tab:'filialen',view:null,id:null,laufzeit:12,exkl:false,jahre:2,gebot:0,streu:25,kaufen:null};
let DIV={};// daten/DIVIDENDEN.json (Bob): Rendite %, Stichtag-Monate
const MON={Jan:0,Feb:1,'Mär':2,Apr:3,Mai:4,Jun:5,Jul:6,Aug:7,Sep:8,Okt:9,Nov:10,Dez:11};
const FM=Object.fromEntries(FIRMEN.map(f=>[f.id,f]));
const MM=Object.fromEntries(C.MESSE.marken.map(m=>[m.id,m]));
/* ---------- Format ---------- */
const de=(n,d)=>n.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
export function fY(n,plus){const s=n<0?'−':plus?'+':'';n=Math.abs(n);if(n>=1e12)return s+'¥'+de(n/1e12,n>=1e13?1:2).replace(/,?0+$/,'')+' Bio';if(n>=1e9)return s+'¥'+de(n/1e9,n>=1e10?1:2)+' Mrd';if(n>=1e6)return s+'¥'+de(n/1e6,n>=1e7?1:2)+' Mio';return s+'¥'+de(Math.round(n),0);}
const fK=k=>'¥'+de(k,1),pc=x=>(x>0&&x<.001?de(x*100,4):de(x*100,x<.1?1:0).replace(/,0$/,''))+' %';
const cls=n=>n>=0?'p':'n';
/* ---------- Zustand ---------- */
function rnd(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%1e6)/1e6};}
const gauss=r=>{const u=r()||1e-6,v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v);};
export function ensure(s){if(s.fz&&s.fz.v===1)return s.fz;
 const fz={v:1,kurse:{},depot:{},pending:0,kredite:[],vertraege:{},messe:{},auktion:null,ipo:null,verh:{}};
 for(const f of FIRMEN){const r=rnd([...f.id].reduce((a,c)=>a*31+c.charCodeAt(0),7));const sw=f.vol/Math.sqrt(52);let k=f.kurs;const h=[k];
  for(let i=0;i<29;i++){k=k/Math.exp(sw*gauss(r));h.unshift(k);}// Verlauf rückwärts, endet beim heutigen Kurs aus Bobs Tabelle
  fz.kurse[f.id]={k:f.kurs,ch:f.kurs/h[28]-1,h};}
 return s.fz=fz;}
/* ---------- Rechnungen ---------- */
const allMine=s=>s.stores.filter(x=>x.chain==='player').concat(...Object.values(s.away||{}).map(a=>a.stores.filter(x=>x.chain==='player')));
const nStores=s=>allMine(s).length;
const custWeek=s=>{const ms=allMine(s);return ms.reduce((a,x)=>a+(x.last&&!x.last.building&&x.last.cust?x.last.cust:C.BASIS_KUNDEN_WOCHE),0);};
const stufeIdx=n=>Math.max(0,C.STUFEN.findIndex(t=>n>=t.von&&n<=t.bis));
const tierPrices=(ek,fix)=>fix||C.STUFEN.map(t=>Math.round(ek*t.f));
function saison(typ,d){const m=d.getMonth(),sz=C.SAISON[typ]||{};return 1+(m>=5&&m<=7?sz.sommer||0:(m===11||m<=1)?sz.winter||0:0);}
// Absatz je Woche (alle eigenen Läden) = Kunden/Woche × Kaufquote × Saison (Bob)
function unitsWeek(s,typ,d){return custWeek(s)*(C.KAUFQUOTE[typ]||.01)*saison(typ,d||S.weekDate(s.week));}
const netVK=(s,typ,vk)=>vk/(1+(C.STEUER10.has(typ)?.1:(S.foodTaxCut&&S.foodTaxCut(s.week)?.01:.08)));// Margen immer auf Netto-VK (Bob)
const ekBase=(s,typ,vk,m)=>Math.round(netVK(s,typ,vk)*(1-m));
function weeksUntil(s,end){return Math.max(0,Math.round((end-S.weekDate(s.week))/(7*864e5)));}
// Erwarteter Ertrag: nur Mehrertrag ggü. Ersatzmarke (40 % des Rohertrags) über die Laufzeit
// konsistent zur Anzeige: Läden × Ø Stück/Laden/Woche (gerundet, inkl. Saison) × Marge × Wochen × 40 %
function forecast(s,typ,marge,weeks){marge=Math.round(marge);let U=0;const d0=S.weekDate(s.week),n=Math.max(1,nStores(s));for(let i=0;i<weeks;i++){const d=new Date(d0);d.setDate(d.getDate()+i*7);U+=unitsWeek(s,typ,d);}
 const u=weeks?Math.round(U/(n*weeks)):0,roh=n*u*marge*weeks;return {roh,mehr:roh*C.MEHRERTRAG,u};}
const year=s=>Math.floor((s.week-1)/52)+1;
const MM0=C.MESSE_TERMIN.monat-1;const isApril=s=>S.weekDate(s.week).getMonth()===MM0;// Messe-Monat
function fairYear(s){const d=S.weekDate(s.week);return d.getMonth()>=MM0?d.getFullYear():d.getFullYear()-1;}
const endDate=(y,n)=>{const e=new Date(y+n,C.VERTRAG_ENDE.monat-1,C.VERTRAG_ENDE.tag),f=new Date(y+n,MM0+1,0);return e<f?f:e;};// nie vor Ende des Messe-Monats
const dl=d=>{d=new Date(d);return d.getDate()+'.'+(d.getMonth()+1)+'.';},dly=d=>dl(d)+new Date(d).getFullYear();
const depotWert=fz=>Object.entries(fz.depot).reduce((a,[id,n])=>a+n*fz.kurse[id].k,0);
const kreditSumme=(s,fz)=>s.loan+fz.kredite.reduce((a,k)=>a+k.rest,0);
function cf13(s){const h=s.hist.slice(-13);return h.length?h.reduce((a,x)=>a+x.net,0)/h.length:0;}
const annW=(P,zins,jahre)=>{const i=zins/100/52,n=jahre*52;return i?P*i/(1-Math.pow(1+i,-n)):P/n;};
const rateAll=(s,fz)=>fz.kredite.reduce((a,k)=>a+k.rate,0)+(s.loanPay||0)/52*0;
function bankOffer(s,fz,b){const zins=C.LEITZINS+b.aufschlag,cf=cf13(s),monat=cf*52/12;
 const room=Math.max(0,cf/C.CF_REGEL-rateAll(s,fz));// Wochenrate, die noch in die 1,5×-Regel passt
 const maxRate=annW(1,zins,b.jahre),bisCF=room/maxRate;const bis=Math.max(0,Math.min(b.mult*monat,bisCF));
 return {zins,bis,rate:annW(bis,zins,b.jahre),ok:bis>=1e5};}
function companyValue(s,fz){const h=s.hist.slice(-52),g=h.reduce((a,x)=>a+x.net,0),book=allMine(s).reduce((a,x)=>a+S.bookValue(x),0);
 const FW=C.FIRMENWERT,n=allMine(s).length;return {wert:Math.max(0,s.cash+.5*n*FW.ladenWert+FW.gewinnFaktor*g-kreditSumme(s,fz)-((s.privat&&s.privat.darlehen)||0)),gewinn:g,book};}// Gesellschafterdarlehen zählt als Schuld (Whitebeard)
/* ---------- Rivalen als Firmen (Erik 20:16): privat → eigener Börsengang → Aktien kaufbar → ab 51 % Übernahme ---------- */
const RVK=c=>'rv-'+c;
const seedOf=c=>[...c].reduce((a,x)=>a*31+x.charCodeAt(0),11);
const rvChains=s=>Object.keys(H.CHAINS).filter(c=>C.RIVAL_START[c]!=null);
const rvStores=(s,c)=>s.stores.filter(x=>x.chain===c).concat(...Object.values(s.away||{}).map(a=>(a.stores||[]).filter(x=>x.chain===c)));
const rvN=(s,c)=>{const r=((ensure(s).rv)||{})[c];return rvStores(s,c).length+(r&&r.virt||0);};// Karte + übrige Städte
function rvState(s,fz,c){fz.rv=fz.rv||{};if(!fz.rv[c])fz.rv[c]={kasse:C.RIVAL_START[c]!=null?C.RIVAL_START[c]:5e6,laeden:rvStores(s,c).length,hist:[],boerse:null,sperre:0,weg:false};return fz.rv[c];}
// Bewertung wie beim Spieler (Bob): 15 × Jahresgewinn + Kasse − Schulden + ½ Buchwert Läden
export function rvWert(s,c){const fz=ensure(s),r=rvState(s,fz,c),h=r.hist.slice(-52),g=h.reduce((a,x)=>a+x.g,0),n=rvN(s,c),FW=C.FIRMENWERT;
 return Math.max(0,Math.max(0,r.kasse)+.5*n*FW.ladenWert+FW.gewinnFaktor*g-Math.max(0,-r.kasse));}
function rvIpoOk(s,r,c){const y1=r.hist.slice(-52),y2=r.hist.slice(-104,-52);return !r.boerse&&year(s)>=C.RIVAL_IPO.abJahr&&rvN(s,c)>=C.IPO.filialen&&y1.reduce((a,x)=>a+x.rev,0)>=C.IPO.umsatz&&y2.length===52&&y1.reduce((a,x)=>a+x.g,0)>0&&y2.reduce((a,x)=>a+x.g,0)>0;}
// Börsennotierte Rivalen erscheinen als Firma im Börse-Tab
function rvFirma(s,c){const r=(ensure(s).rv||{})[c],ch=H.CHAINS[c]||{name:c};if(!r||!r.boerse)return null;const id=RVK(c);
 if(!FM[id])FM[id]={id,name:ch.name,code:'',branche:'Konbini-Kette',kurs:r.boerse.k,aktien:r.boerse.aktien,logo:`grafik/logos/${ch.file||c}.svg`,desc:'',vol:C.RIVAL_KURS.vol,bank:false,rival:c,rv:true};return FM[id];}
function rvIPO(s,fz,c,r){const st=C.RIVAL_IPO.streu,rr=rnd(seedOf(c)),streu=Math.round(st[0]+rr()*(st[1]-st[0]))/100,w=rvWert(s,c),A=C.RIVAL_IPO.aktien,k=w/A;
 r.boerse={aktien:A,streu,k,ch:0,h:[k],woche:s.week};const id=RVK(c);rvFirma(s,c);fz.kurse[id]={k,ch:0,h:[k]};
 news(s,{chain:c,text:`🔔 <b>${H.CHAINS[c].name}</b> geht an die Börse! Bewertung ${fY(w)}, ${Math.round(streu*100)} % Streubesitz – im Börse-Tab kaufbar.`});}
// Itos Texte (marketing/texte.json → uebernahme), alle Platzhalter füllen
const TX={warnung_fremdbesitz:'Kobo: Pass auf! {kette} besitzt schon {anteil} % unserer Aktien.',eilmeldung_uebernahme_droht:'🚨 Eilmeldung: Übernahme droht! {kette} hält bereits {anteil} % von {laden}.',angebot_eingang:'{kette} bietet {betrag} für alle Aktien. Das sind {aufschlag} % über dem Kurs.',angebot_abgelehnt:'Kobo: Wir halten die Mehrheit und haben das Angebot von {kette} abgelehnt.',uebernahme_erfolgt:'{kette} hat dein Imperium übernommen.',ipo_warnung:'Achtung: Nach dem Börsengang können Rivalen dich übernehmen, wenn du unter 51 % fällst.',ipo_streubesitz_rot:'Streubesitz über 49 % = Übernahme möglich'};
export function tx(id,o={}){const T=(H.texte&&H.texte()||{}).uebernahme||{};return String(T[id]||TX[id]).replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:m);}
function news(s,n){s.news=[{...n,week:s.week}].concat(s.news||[]).slice(0,14);}
// Übernahme: Läden der Kette werden unsere (alle Städte), Kette verschwindet als Konkurrent
export function uebernahme(s,c){const fz=ensure(s),r=rvState(s,fz,c),ch=H.CHAINS[c];let n=0;
 const conv=st=>{const no=Math.max(0,...s.stores.filter(x=>x.chain==='player'&&x.d===st.d).map(x=>x.no||0))+1;Object.assign(st,{chain:'player',no,cfg:S.playerCfg(),mgr:null,deleg:{staff:false,prod:false,mkt:false,inc:false},deposit:0,invest:C.RIVAL_LADEN.buchwert,bh:{sauber:3,frische:3,service:3,auswahl:3,overall:3},von:c,build:0});n++;};
 s.stores.filter(x=>x.chain===c).forEach(conv);for(const a of Object.values(s.away||{}))(a.stores||[]).filter(x=>x.chain===c).forEach(conv);
 if(r.virt){s.away=s.away||{};const j=s.away.japan=s.away.japan||{stores:[],op:0};j.n=(j.n||0)+r.virt;j.op=(j.op||0)+r.virt*C.RIVAL_LADEN.umsatzWoche*C.RIVAL_LADEN.gewinnQuote;n+=r.virt;r.virt=0;}
 r.weg=true;r.uebernommen=s.week;const i=H.RIVALS.indexOf(c);if(i>=0)H.RIVALS.splice(i,1);s.uebernommen=(s.uebernommen||[]).concat(c);
 news(s,{chain:'player',text:`🏆 Übernahme! <b>${ch?ch.name:c}</b> gehört jetzt uns – ${n} Läden kommen dazu.`});S.save();return n;}
/* ---------- Rivalen in mehreren Städten (Erik 23:17) ---------- */
const rvAktiveStaedte=()=>Object.keys(C.RIVAL_STAEDTE.staedte).filter(k=>NEUESTAEDTE||['tokio','yokohama'].includes(k));
export function rvHeimat(c){const h=C.RIVAL_STAEDTE.heimat[c]||'tokio';return rvAktiveStaedte().includes(h)?h:'tokio';}
function rvStadtWahl(r,c){const RS=C.RIVAL_STAEDTE,h=rvHeimat(c),st=r.staedte;if((st[h]||0)<RS.abLaeden)return h;
 const L=rvAktiveStaedte().map(k=>{const d=Math.abs(RS.staedte[k].km-RS.staedte[h].km);return [k,RS.staedte[k].groesse/(1+d/RS.kmSkala)*(k===h?RS.heimGewicht:1)];});
 let x=Math.random()*L.reduce((a,v)=>a+v[1],0);for(const [k,w] of L){x-=w;if(x<=0)return k;}return h;}
function rvStaedteInit(s,r,c,n0){if(!r.staedte){r.staedte={[rvHeimat(c)]:n0+(r.virt||0)};r.neuStadt={};}}
// Umsatzabschlag in neuen Städten (Vorschlag Bob): Läden in Städten, die die Kette vor < 52 Wochen betreten hat
function rvNeuAbzug(s,r){const N=C.RIVAL_STAEDTE.neuStadt;if(!N.an)return 0;let a=0;for(const [k,w0] of Object.entries(r.neuStadt||{}))if(s.week-w0<N.wochen)a+=(r.staedte[k]||0)*(1-N.umsatzFaktor);return a;}
const rvRate=a=>{const K=C.RIVAL_KREDIT,i=K.zins/52;return a*i/(1-Math.pow(1+i,-K.laufWochen));};
function rvWeek(s,fz,rep){const w=s.week,L=C.RIVAL_LADEN,K=C.RIVAL_KREDIT;
 for(const c of rvChains(s)){const r=rvState(s,fz,c);if(r.weg)continue;r.loans=r.loans||[];r.virt=r.virt||0;
  const n0=rvStores(s,c).length;if(n0>r.laeden)r.kasse-=(n0-r.laeden)*L.ladenKosten;r.laeden=n0;// Läden, die anders entstanden sind, aus der Kasse
  if(!r.startKredit){r.startKredit=true;r.loans.push({rest:K.start,rate:rvRate(K.start)});r.kasse+=K.start;}// Startkredit für den ersten Laden
  rvStaedteInit(s,r,c,n0);const n=n0+r.virt,rev=(n-rvNeuAbzug(s,r))*L.umsatzWoche;let zins=0,inst=0;
  for(const l of r.loans){const z=l.rest*K.zins/52,t=Math.min(l.rest,l.rate-z);l.rest-=t;zins+=z;inst+=z+t;}r.loans=r.loans.filter(l=>l.rest>1);
  const g=rev*L.gewinnQuote-zins;r.kasse+=rev*L.gewinnQuote-inst;r.hist.push({rev,g});if(r.hist.length>104)r.hist.shift();
  // Expansion: Chance/Woche; bar bezahlen oder Kredit nach 1,5×-Regel
  const avg=r.hist.slice(-13).reduce((a,x)=>a+x.g,0)/Math.min(13,r.hist.length),raten=r.loans.reduce((a,l)=>a+l.rate,0);
  let neu=false;if(n===0&&r.kasse>=L.ladenKosten){r.kasse-=L.ladenKosten;neu=true;}
  else if(Math.random()<(C.RIVAL_WACHSTUM[c]??.1)){if(r.kasse>=L.ladenKosten+K.reserve){r.kasse-=L.ladenKosten;neu=true;}
   else if(n>0&&avg>=K.regel*(raten+rvRate(L.ladenKosten))){r.loans.push({rest:L.ladenKosten,rate:rvRate(L.ladenKosten)});neu=true;}}
  if(neu){const stadt=rvStadtWahl(r,c),RS=C.RIVAL_STAEDTE,erst=!(r.staedte[stadt]>0);r.staedte[stadt]=(r.staedte[stadt]||0)+1;
   if(erst&&stadt!==rvHeimat(c)){if(RS.neuStadt.an)r.kasse-=RS.neuStadt.einmal;r.neuStadt[stadt]=w;const kn=(H.CHAINS[c]||{name:c}).name;(n=>{news(s,n);if(rep&&rep.news)rep.news.push(n);})({chain:c,text:`🐾 Kobo: <b>${kn}</b> eröffnet den ersten Laden in ${RS.staedte[stadt].name}!${stadt===(s.city||'tokio')?' Jetzt auch bei uns in der Stadt.':''}`});}
   let o=null;if(stadt===(s.city||'tokio')&&Math.random()<C.RIVAL_KARTE.anteil&&S.freeTotal()>C.RIVAL_KARTE.freiLassen&&H.RIVALS.includes(c))o=S.rivalOpen(c,w);
   if(o){r.laeden++;const ch=H.CHAINS[c];(n=>{news(s,n);if(rep&&rep.news)rep.news.push(n);})({chain:c,near:!!o.near,text:o.near?`<b>${ch.name}</b> eröffnet ${o.gegenueber?'gegenüber':'in der Nähe'} deiner Filiale in ${H.dname(o.st.d)}.`:`<b>${ch.name}</b> eröffnet eine neue Filiale in ${H.dname(o.st.d)}.`});}else r.virt++;}
  if(r.sperre>0)r.sperre--;
  if(r.boerse&&g>0){const an=(fz.depot[RVK(c)]||0)/r.boerse.aktien,dv=g*C.IPO.dividende;r.kasse-=dv;if(an>0){s.cash+=dv*an;fz.rvDiv=(fz.rvDiv||0)+dv*an;}}// börsennotiert: 30 % Pflicht-Dividende
  if(!r.boerse){if(rvIpoOk(s,r,c)&&Math.random()<(C.RIVAL_IPO.chance[c]??.03))rvIPO(s,fz,c,r);}
  else{const q=fz.kurse[RVK(c)]||(fz.kurse[RVK(c)]={k:r.boerse.k,ch:0,h:[r.boerse.k]}),fair=rvWert(s,c)/r.boerse.aktien,nk=Math.max(.01,(q.k*.8+fair*.2)*Math.exp(C.RIVAL_KURS.vol/Math.sqrt(52)*gauss(Math.random)));q.ch=nk/q.k-1;q.k=nk;q.h.push(nk);if(q.h.length>30)q.h.shift();r.boerse.k=nk;}
  // Rivalen kaufen unsere Aktien, wenn wir börsennotiert sind
  if(fz.ipo&&r.kasse>0&&Math.random()<C.FREMD.chance){fz.fremd=fz.fremd||{};const frei=fz.ipo.streu/100-Object.values(fz.fremd).reduce((a,x)=>a+x,0);const add=Math.min(frei,C.FREMD.anteil);
   if(add>0){fz.fremd[c]=(fz.fremd[c]||0)+add;const tot=Object.values(fz.fremd).reduce((a,x)=>a+x,0);
    const lad=H.esc(s.logo.name||'Hoshi Mart'),an=Math.round(fz.fremd[c]*100),kn=H.CHAINS[c].name;
    if(tot>=C.FREMD.warnung&&!fz.fremdWarn){fz.fremdWarn=true;news(s,{chain:c,text:tx('warnung_fremdbesitz',{kette:kn,anteil:Math.round(tot*100),laden:lad})});}
    if(tot>=C.FREMD.eilmeldung&&!fz.fremdEil){fz.fremdEil=true;news(s,{chain:c,text:tx('eilmeldung_uebernahme_droht',{kette:kn,anteil:Math.round((fz.fremd[c]||0)*100),laden:lad})});}}}
  // Übernahme-Gebot für ALLE unsere Aktien (Schalter ?uebernahme_spieler=1)
  if(C.RIVAL_UEBERNAHME&&fz.ipo&&!fz.angebotAn&&Math.random()<C.SPIELER_UEBERNAHME.chance){const U=C.SPIELER_UEBERNAHME,auf=UE.ON?UE.RIVALE_AUF_SPIELER.praemieMin/100:U.aufschlag,h=(fz.pwert||[]).slice(-U.schnittWochen),avg=h.length?h.reduce((a,x)=>a+x,0)/h.length:0,preis=avg*(1+auf),jg=r.hist.slice(-52).reduce((a,x)=>a+x.g,0);
   if(avg>0&&r.kasse+Math.max(0,jg)*U.kreditJahresgewinne>=preis){const eigen=1-fz.ipo.streu/100+(fz.rueck||0);fz.angebotAn={c,preis,woche:w};
    const kn=H.CHAINS[c].name;news(s,{chain:c,text:tx('angebot_eingang',{kette:kn,betrag:fY(preis),aufschlag:Math.round(auf*100)})});
    if(UE.ON?(eigen<=UE.KONTROLLE&&Math.random()<ueChance(auf*100,true)):eigen<U.eigenMin){s.lost=true;s.lostReason=tx('uebernahme_erfolgt',{kette:kn});news(s,{chain:c,text:s.lostReason});H.gameOver&&H.gameOver();}
    else news(s,{chain:'player',text:tx('angebot_abgelehnt',{kette:kn})});}}}}
/* ---------- Realistische Übernahme (Bob, Erik 22:34): 5 % Meldung, Börse bis 29,9 %, ab 30 % nur Angebot an alle ---------- */
export function ueChance(p,feind){const T=UE.CHANCE;let c=T[0][1];if(p<=T[0][0])c=T[0][1]*p/T[0][0];else if(p>=T[T.length-1][0])c=T[T.length-1][1];else for(let i=1;i<T.length;i++)if(p<=T[i][0]){const [a,ca]=T[i-1],[b,cb]=T[i];c=ca+(cb-ca)*(p-a)/(b-a);break;}return Math.max(0,Math.min(1,c-(feind?UE.FEINDLICH_MINUS:0)));}
const ueSchnitt=q=>{const h=(q.h||[q.k]).slice(-UE.SCHNITT_WOCHEN);return h.reduce((a,x)=>a+x,0)/h.length;};
const ueStabil=c=>{const r=rnd(seedOf(c)+7)();return UE.STABIL.min+r*(UE.STABIL.max-UE.STABIL.min);};
const vorstandLehntAb=p=>p<UE.VORSTAND_EMPFIEHLT_AB;const ueFeind=vorstandLehntAb;// feindlich = Vorstand des Ziels lehnt ab
export function ueAngebot(s,fz,c,praemie,wochen){const id=RVK(c),f=rvFirma(s,c),q=fz.kurse[id],r=rvState(s,fz,c);if(!f||!q)return null;
 const have=(fz.depot[id]||0)/f.aktien,preis=ueSchnitt(q)*(1+praemie/100),rest=(1-have)*f.aktien*preis,kosten=Math.max(UE.KOSTEN.beraterMin,UE.KOSTEN.berater*rest)+UE.KOSTEN.pruefung,feind=ueFeind(praemie);
 return {c,id,have,preis,rest,kosten,feind,chance:ueChance(praemie,feind),praemie,wochen,stabil:ueStabil(c),laeden:rvN(s,c)};}
function ueStart(s,fz,c){const A=ueAngebot(s,fz,c,V.praemie,V.wochen);if(!A)return;if(fz.tender){H.toast('Es läuft schon ein Übernahmeangebot');return;}
 if(V.praemie<UE.PRAEMIE.min){H.toast(`Mindestens +${UE.PRAEMIE.min} % Prämie`);return;}
 if(s.cash<A.rest+A.kosten){H.toast(`Nicht genug Geld 💸 (${fY(A.rest+A.kosten)})`);return;}
 s.cash-=A.kosten;fz.tender={c,praemie:V.praemie,preis:A.preis,ende:s.week+V.wochen,start:s.week,kosten:A.kosten,feind:A.feind};
 news(s,{chain:'player',text:`📣 Übernahmeangebot an alle Aktionäre von <b>${H.CHAINS[c].name}</b>: +${V.praemie} % Prämie, ${V.wochen} Wochen Annahmefrist.${A.feind?' Der Vorstand lehnt ab – feindliche Übernahme.':''}`});
 H.toast(`📣 Angebot läuft ${V.wochen} Wochen`);V.view='firma';S.save();}
function ueIntegration(s,c,vorher){const I=UE.INTEGRATION;let n=0,zu=0;const neu=s.stores.filter(x=>x.chain==='player'&&x.von===c&&!x.integ);
 for(const a of Object.values(s.away||{}))for(const st of (a.stores||[]))if(st.chain==='player'&&st.von===c&&!st.integ){s.cash-=I.jeLaden;st.integ={bis:s.week+I.wochen,kunden:I.kunden,ek:I.ekDanach};n++;}
 for(const st of neu){s.cash-=I.jeLaden;st.integ={bis:s.week+I.wochen,kunden:I.kunden,ek:I.ekDanach};n++;
  const nah=vorher.find(o=>S.storeDist&&S.storeDist(o,st)<I.abstandFelder);if(nah){s.stores=s.stores.filter(x=>x!==st);zu++;}}
 return {n,zu};}
function ueWoche(s,fz){const T=fz.tender;if(!T||s.week<T.ende)return;const c=T.c,id=RVK(c),f=rvFirma(s,c),r=rvState(s,fz,c),kn=H.CHAINS[c]?H.CHAINS[c].name:c;fz.tender=null;
 if(!f){return;}const have=(fz.depot[id]||0)/f.aktien,stabil=ueStabil(c);let ch=ueChance(T.praemie,T.feind),grund='';
 const ritter=T.feind&&Object.entries(fz.rv||{}).some(([k,x])=>k!==c&&!x.weg&&x.kasse>=(1-have)*f.aktien*T.preis*(1+UE.ABWEHR.ritterAufschlag));
 if(ritter&&Math.random()<UE.ABWEHR.weisserRitter){fz.ueLog={c,ok:false,grund:'weißer Ritter'};news(s,{chain:c,text:`🛡️ Weißer Ritter: Ein befreundeter Investor kauft <b>${kn}</b> – unser Angebot ist gescheitert. Die Beraterkosten (${fY(T.kosten)}) sind weg.`});return;}
 let hv=have;if(T.feind&&have>=UE.ABWEHR.giftpilleAb){hv=have*UE.ABWEHR.giftpilleFaktor;fz.depot[id]=(fz.depot[id]||0)*UE.ABWEHR.giftpilleFaktor;grund=' (Abwehr: neue Aktien für die Altaktionäre halbieren unseren Anteil)';}// Spielvereinfachung, nicht als echte Regel beschriftet
 const angeboten=Math.max(0,1-hv-stabil),acc=angeboten*ch,tot=hv+acc;
 if(tot<=UE.KONTROLLE){fz.ueLog={c,ok:false,anteil:tot};news(s,{chain:c,text:`❌ Übernahmeangebot für <b>${kn}</b> gescheitert: nur ${Math.round(tot*100)} % angedient${grund}. Beraterkosten ${fY(T.kosten)} verloren.`});return;}
 let teil=tot>=UE.SQUEEZE_OUT?1-hv:acc;const preis=teil*f.aktien*T.preis;s.cash-=preis;
 const vorher=s.stores.filter(x=>x.chain==='player');const n=uebernahme(s,c);delete fz.depot[id];const I=ueIntegration(s,c,vorher);
 fz.ueLog={c,ok:true,anteil:tot,preis,n,zu:I.zu};
 news(s,{chain:'player',text:`🏆 Übernahme von <b>${kn}</b> gelungen: ${Math.round(tot*100)} % angedient${tot>=UE.SQUEEZE_OUT?', Rest per Squeeze-out':''}. ${n} Läden, Integration ${fY(I.n*UE.INTEGRATION.jeLaden)}${I.zu?`, ${I.zu} Läden zu nah an eigenen – geschlossen`:''}.`});}
// Spieler kauft Rivalen-Aktien: je 5 % Anteil steigt der Kurs ~3 %; ohne Gründer-Verkauf nur Streubesitz kaufbar
function rvMax(r){if(UE.ON)return Math.min(UE.MARKT_MAX,r.boerse.streu);return C.GRUENDER_VERKAUF?1:r.boerse.streu;}
function rvKauf(s,fz,c,anteil){const r=rvState(s,fz,c),id=RVK(c),f=rvFirma(s,c),q=fz.kurse[id],have=(fz.depot[id]||0)/f.aktien;
 let a=Math.max(0,Math.min(anteil,1-have));const frei=Math.max(0,rvMax(r)-have),ueber=UE.ON?0:Math.max(0,a-Math.max(0,r.boerse.streu-have));if(!C.GRUENDER_VERKAUF||UE.ON)a=Math.min(a,frei);
 if(a<=0){H.toast(UE.ON?`Über die Börse höchstens ${de(UE.MARKT_MAX*100,1)} % – darüber nur per Übernahmeangebot`:C.GRUENDER_VERKAUF?'Schon alles gekauft':'Mehr Aktien sind nicht im Umlauf – der Gründer verkauft nicht');return false;}
 const k1=q.k*(1+C.RIVAL_KURS.plus*a/C.RIVAL_KURS.jeAnteil),avg=(q.k+k1)/2,cost=a*f.aktien*avg*(1+(C.GRUENDER_VERKAUF&&a>0?C.GRUENDER_AUFSCHLAG*ueber/a:0))*(1+C.GEBUEHR_AKTIEN);
 if(cost>s.cash){H.toast(`Nicht genug Geld 💸 (${fY(cost)})`);return false;}
 s.cash-=cost;fz.depot[id]=(fz.depot[id]||0)+a*f.aktien;q.ch=k1/q.k-1;q.k=k1;r.boerse.k=k1;H.toast(`📈 ${f.name}: ${pc(a)} für ${fY(cost)} gekauft`);
 const nh=fz.depot[id]/f.aktien;if(UE.ON&&have<UE.MELDE_SCHWELLE&&nh>=UE.MELDE_SCHWELLE)news(s,{chain:'player',text:`📋 Kobo: Meldepflicht! Wir halten jetzt ${de(nh*100,1)} % an ${f.name} – das ist jetzt öffentlich.`});
 if(!UE.ON&&(fz.depot[id]/f.aktien)>=C.UEBERNAHME_AB-1e-9){const n=uebernahme(s,c);delete fz.depot[id];H.toast(`🏆 ${f.name} übernommen – ${n} Läden!`);V.view=null;V.tab='konkurrenz';}
 S.save();return true;}
// Kaufangebot an private Kette (Schalter ?kaufangebot=1): Chance linear 0 % bei 100 % → 100 % bei 130 % des Firmenwerts
export const angebotChance=f=>Math.max(0,Math.min(1,(f-C.ANGEBOT.von)/(C.ANGEBOT.bis-C.ANGEBOT.von)));
function angebot(s,fz,c,f){const r=rvState(s,fz,c),w=rvWert(s,c),preis=w*f;if(!C.KAUFANGEBOT)return;if(rvN(s,c)<C.ANGEBOT.abLaeden){H.toast(`Kaufangebot erst, wenn die Kette ${C.ANGEBOT.abLaeden} Läden hat`);return;}if(r.sperre>0){H.toast(`Gesperrt – noch ${r.sperre} Wochen`);return;}
 if(preis>s.cash){H.toast(`Nicht genug Geld 💸 (${fY(preis)})`);return;}
 if(Math.random()<angebotChance(f)){s.cash-=preis;const n=uebernahme(s,c);H.toast(`🤝 Angebot angenommen – ${n} Läden!`);V.view=null;}
 else{r.sperre=C.ANGEBOT.sperreWochen;H.toast(`❌ Abgelehnt – ${C.ANGEBOT.sperreWochen} Wochen kein neues Angebot`);}S.save();}
function ueKarte(s,fz,f,c,r,have,frei,btn){const T=fz.tender,L=fz.ueLog&&fz.ueLog.c===c?fz.ueLog:null;
 return `<div class="fzc"><b>📈 Aktien über die Börse</b><div class="fzsm">Bis ${de(UE.MARKT_MAX*100,1)} % frei kaufbar · ab ${Math.round(UE.MELDE_SCHWELLE*100)} % wird es öffentlich gemeldet · noch frei: ${de(frei*100,1)} %</div><div class="fzbtns">${[.01,.05,.1].map(btn).join('')}</div></div>
 ${T&&T.c===c?`<div class="fzc fzline">📣 <b>Übernahmeangebot läuft</b><span class="grow"></span><small>+${T.praemie} % · noch ${Math.max(0,T.ende-s.week)} Wo.</small></div>`
 :`<button class="fzbtn full" data-act="fz" data-v="tender" ${T?'disabled':''}>📣 Übernahmeangebot an alle Aktionäre</button>`}
 ${L?`<div class="fzc ${L.ok?'':'fzwarn'}">${L.ok?'🏆 Übernahme gelungen':'❌ Letztes Angebot gescheitert'}${L.anteil!=null?` · ${Math.round(L.anteil*100)} % angedient`:''}${L.grund?` · ${L.grund}`:''}</div>`:''}
 ${kobo(`Über die Börse bekommst du höchstens ${de(UE.MARKT_MAX*100,1)} %. Für die Mehrheit brauchst du ein Angebot an alle – je höher die Prämie, desto mehr verkaufen.`)}`;}
function pTender(s,fz){const f=FM[V.id],c=f.rival,A=ueAngebot(s,fz,c,V.praemie,V.wochen),P=UE.PRAEMIE,Lz=UE.LAUFZEIT,ges=A.rest+A.kosten,ok=s.cash>=ges;
 return `<button class="fzlink" data-act="fz" data-v="firma" data-x="${f.id}">◀ ${f.name}</button><div class="fzc fzdet">${H.chainLogo(c,56)}<div class="grow"><b class="big">Übernahmeangebot</b><small>an alle Aktionäre von ${f.name}</small></div></div>
 <div class="fzc"><div class="fzrow t"><span>Prämie <small>auf den ${UE.SCHNITT_WOCHEN}-Wochen-Schnitt</small></span><b class="y">+${V.praemie} %</b></div><input type="range" class="fzrange" min="${P.min}" max="${P.max}" step="${P.schritt}" value="${V.praemie}" data-fzin="praemie">
 <div class="fzsm">Annahmefrist ${V.wochen} Wochen. Ab ${de(UE.SQUEEZE_OUT*100,1)} % werden die letzten Aktionäre herausgekauft.</div></div>
 <div class="fzc fzlist"><div class="fzrow"><span>🎯 Annahmechance</span><b class="${A.chance>=.6?'p':A.chance>=.3?'y':'n'}">${Math.round(A.chance*100)} %</b></div>
 ${A.feind?`<div class="fzsm n">🛑 Vorstand lehnt ab → feindliches Angebot: −${Math.round(UE.FEINDLICH_MINUS*100)} Punkte Chance, Abwehr möglich.</div>`:`<div class="fzsm">✅ Vorstand empfiehlt das Angebot (freundlich).</div>`}
 <div class="fzrow"><span>💴 Kosten: Kaufpreis bei Erfolg</span><b>${fY(A.rest)}</b></div><div class="fzrow"><span>🧾 Kosten: Berater + Prüfung</span><b class="n">${fY(-A.kosten)}</b></div><div class="fzsm">Die Kosten sind weg, wenn das Angebot scheitert.</div></div>

 <button class="fzbtn full" data-act="fz" data-v="tenderstart" ${ok?'':'disabled'}>${ok?`📣 Angebot starten · ${fY(A.kosten)} jetzt`:`💸 Nicht genug Geld (${fY(ges)})`}</button>`;}
function pRival(s,fz){const f=FM[V.id],c=f.rival,r=rvState(s,fz,c),q=fz.kurse[f.id],have=(fz.depot[f.id]||0)/f.aktien,w=q.k*f.aktien,frei=Math.max(0,rvMax(r)-have);
 const need=Math.max(0,C.UEBERNAHME_AB-have),btn=a=>`<button class="fzbtn s" data-act="fz" data-v="rvkauf" data-x="${a}">${pc(a)}</button>`;
 return `<div class="fzc fzdet">${H.chainLogo(c,64)}<div class="grow"><button class="fzlink" data-act="fz" data-v="back">◀ Börse</button><b class="big">${f.name}</b><small>Konkurrenz · ${H.ladenN(rvN(s,c))} · seit KW ${r.boerse.woche} an der Börse</small></div><div class="r"><b>${fK(q.k)}</b><small class="${cls(q.ch)}">${q.ch>=0?'▲ +':'▼ −'}${de(Math.abs(q.ch)*100,1)} %</small></div></div>
 <div class="fzg2"><div class="fzc"><small>Börsenwert</small><b>${fY(w)}</b></div><div class="fzc"><small>Unser Anteil</small><b class="${have>0?'p':''}">${have>0?de(have*100,1)+' %':'–'}</b></div></div>
 <div class="fzc fzline">30 Wochen<span class="grow"></span>${spark(q.h)}</div>
 ${UE.ON?ueKarte(s,fz,f,c,r,have,frei,btn):`<div class="fzc"><small>🏆 Übernahme ab ${pc(C.UEBERNAHME_AB)}: alle Läden werden deine · Streubesitz ${pc(r.boerse.streu)}${C.GRUENDER_VERKAUF?` · Gründer verkauft den Rest zu +${Math.round(C.GRUENDER_AUFSCHLAG*100)} %`:' · Gründer verkauft nicht'}</small>
 <div class="fzsm">Je 5 % Kauf steigt der Kurs um ~${Math.round(C.RIVAL_KURS.plus*100)} %. Kaufbar: ${pc(Math.max(0,(r.boerse?r.boerse.streu:0)-have))} an der Börse${C.GRUENDER_VERKAUF?` · danach Rest vom Gründer (+${Math.round(C.GRUENDER_AUFSCHLAG*100)} %)`:''}</div>
 <div class="fzbtns">${[.01,.05,.1].map(btn).join('')}${need>0&&need<=frei+1e-9?`<button class="fzbtn s" data-act="fz" data-v="rvkauf" data-x="${need}">🏆 ${pc(need)} → Übernahme</button>`:''}</div></div>
 ${kobo(need<=frei+1e-9?'Mit 51 % gehört die Kette uns!':'Nur der Streubesitz ist kaufbar – für 51 % reicht das nicht.')}`}`;}
function pAngebot(s,fz){const c=V.id,ch=H.CHAINS[c],r=rvState(s,fz,c),w=rvWert(s,c),f=V.angebot||1.1,ch2=angebotChance(f);
 return `<div class="fzc fzdet">${H.chainLogo(c,64)}<div class="grow"><button class="fzlink" data-act="fz" data-v="back">◀ Konkurrenz</button><small>🤝 Kaufangebot</small><b class="big">${ch.name}</b><small>Firmenwert ≈ ${fY(w)} · ${H.ladenN(rvN(s,c))}</small></div></div>
 <div class="fzyrs">${C.ANGEBOT.stufen.map(x=>`<button class="${Math.abs(x-f)<1e-6?'on':''}" data-act="fz" data-v="angebotf" data-x="${x}"><b>${Math.round(x*100)} %</b><small>${fY(w*x)}</small></button>`).join('')}</div>
 <div class="fzc fzline">Annahme-Chance <span class="grow"></span><b class="${ch2>=.5?'p':'n'}">${Math.round(ch2*100)} %</b></div>
 <div class="fzsm">Bei Absage ${C.ANGEBOT.sperreWochen} Wochen kein neues Angebot${r.sperre>0?` · gesperrt: noch ${r.sperre} Wo.`:''}</div>
 <button class="fzbtn full" data-act="fz" data-v="angebot" ${r.sperre>0?'disabled':''}>🤝 Angebot über ${fY(w*f)} senden</button>`;}
/* ---------- Wochen-Hook (aus sim.endWeek) ---------- */
export function weekHook(s,rep,T){if(!ON)return;const fz=ensure(s);const w=s.week,d=S.weekDate(w);
 for(const f of FIRMEN){const q=fz.kurse[f.id],r=Math.random;const nk=q.k*Math.exp(f.vol/Math.sqrt(52)*gauss(r));q.ch=nk/q.k-1;q.k=nk;q.h.push(nk);if(q.h.length>30)q.h.shift();}
 let cash=0,net=0;if(fz.pending){cash+=fz.pending;fz.pending=0;}
 const pm=S.weekDate(Math.max(1,w-1)).getMonth();if(w>1&&pm!==d.getMonth())for(const [id,n] of Object.entries(fz.depot)){const f=FM[id],dv=f&&DIV[f.name];if(dv&&dv.stichtag_monate.some(m=>MON[m]===pm)){const g=n*fz.kurse[id].k*dv.rendite_prozent/100/dv.ausschuettungen_pro_jahr;cash+=g;net+=g;}}// Dividende je Stichtag (Bob)
 for(const k of fz.kredite){if(k.rest<=0)continue;const i=k.zins/100/52,z=k.rest*i,t=Math.min(k.rest,k.rate-z);k.rest-=t;cash-=z+t;net-=z;}
 fz.kredite=fz.kredite.filter(k=>k.rest>1);
 const extra=[];for(const [id,v] of Object.entries(fz.vertraege)){if(d>new Date(v.ende)){delete fz.vertraege[id];if(MM[id])delete fz.messe[id];continue;}
  const g=unitsWeek(s,v.typ,d)*((v.net||v.vk/1.08)-v.ek)*C.MEHRERTRAG;cash+=g;net+=g;extra.push([id,g]);}
 for(const [id,m] of Object.entries(fz.messe))if(m.holder!=='player'&&d>new Date(m.ende))delete fz.messe[id];
 if(fz.ipo&&T.net>0){const div=PV.dividende(s,T.net);cash-=div;net-=div;}// Spieler: freiwillige Dividende (Erik 22:07), Rivalen bleiben bei 30 %
 if(fz.ipo){fz.pwert=(fz.pwert||[]).concat(companyValue(s,fz).wert).slice(-52);}
 rvWeek(s,fz,rep);if(UE.ON)ueWoche(s,fz);
 s.cash+=cash;T.net+=net;rep.fz={cash,net,extra};}
/* ---------- Aktionen ---------- */
export function act(b){const s=S.state,fz=ensure(s),a=b.dataset.v,x=b.dataset.x;
 switch(a){
 case 'tab':V.tab=x;V.view=null;V.zentrale=false;break;
 case 'back':V.view=V.view==='deal'||V.view==='bieten'?'messe':null;stopTimer();break;
 case 'firma':V.view='firma';V.id=x;V.kaufen=null;break;
 case 'rvaktie':V.tab='boerse';V.view='firma';V.id=x;break;
 case 'rueckkauf':{if(!C.RUECKKAUF)break;const fr=fz.fremd||{},tot=Object.values(fr).reduce((a,x)=>a+x,0),a=Math.min(C.FREMD.rueckkauf,tot);if(a<=0){H.toast('Keine fremden Aktien');break;}const cost=companyValue(s,fz).wert*a;if(cost>s.cash){H.toast(`Nicht genug Geld 💸 (${fY(cost)})`);break;}
  s.cash-=cost;for(const k in fr)fr[k]-=fr[k]/tot*a;H.toast(`🛡️ ${pc(a)} eigene Aktien zurückgekauft`);S.save();break;}
 case 'tender':V.view='tender';break;
 case 'tenderstart':ueStart(s,fz,FM[V.id].rival);break;
 case 'rvkauf':rvKauf(s,fz,FM[V.id].rival,+x);break;
 case 'kaufangebot':V.tab='konkurrenz';V.view='angebot';V.id=x;V.angebot=1.1;break;
 case 'angebotf':V.angebot=+x;break;
 case 'angebot':angebot(s,fz,V.id,V.angebot||1.1);break;
 case 'kredite':V.view='kredite';break;
 case 'kaufen':V.kaufen=V.kaufen==='k'?null:'k';break;
 case 'verkaufen':V.kaufen=V.kaufen==='v'?null:'v';break;
 case 'order':{const f=FM[V.id],q=fz.kurse[f.id],amt=+x;
  if(V.kaufen==='k'){const cost=amt*(1+C.GEBUEHR_AKTIEN);if(cost>s.cash){H.toast('Nicht genug Geld 💸');break;}s.cash-=cost;fz.depot[f.id]=(fz.depot[f.id]||0)+amt/q.k;H.toast(`📈 ${f.name}: für ${fY(amt)} gekauft`);}
  else{const have=(fz.depot[f.id]||0)*q.k,v=Math.min(have,amt);if(v<=0){H.toast('Keine Aktien im Depot');break;}fz.depot[f.id]-=v/q.k;if(fz.depot[f.id]*q.k<1)delete fz.depot[f.id];fz.pending+=v*(1-C.GEBUEHR_AKTIEN);H.toast(`Verkauft – ${fY(v*(1-C.GEBUEHR_AKTIEN))} kommen nächste Woche`);}
  V.kaufen=null;S.save();break;}
 case 'kredit':{const bk=C.BANKEN.find(q=>q.id===x),o=bankOffer(s,fz,bk);if(!o.ok){H.toast('Dein Cashflow reicht für diese Bank noch nicht');break;}
  fz.kredite.push({bank:bk.id,betrag:o.bis,rest:o.bis,zins:o.zins,rate:o.rate,jahre:bk.jahre,seit:s.week});s.cash+=o.bis;S.save();H.toast(`🏦 ${FM[bk.id].name}: ${fY(o.bis)} Kredit`);break;}
 case 'marke':V.view='verhandeln';V.id=x;V.laufzeit=12;V.exkl=false;break;
 case 'exkl':V.exkl=!V.exkl;break;
 case 'angebot':{const o=inlandDeal(s,FM[V.id]);const e=new Date(S.weekDate(s.week));e.setMonth(e.getMonth()+V.laufzeit);
  if(o.zahlung>s.cash){H.toast('Nicht genug Geld 💸');break;}s.cash-=o.zahlung;fz.vertraege[V.id]={typ:o.p[3],vk:o.p[1],net:o.net,ek:o.ek,ende:+e,exkl:V.exkl,seit:s.week};delete fz.verh[V.id];V.view=null;S.save();H.toast(`🤝 Vertrag mit ${FM[V.id].name}`);break;}
 case 'ablehnen':fz.verh[V.id]=1;V.view=null;break;
 case 'messe':V.view='messe';break;
 case 'stand':{const m=MM[x];V.id=x;V.jahre=2;if(m.art==='bieten'&&!(fz.messe[x]&&fz.messe[x].holder==='player')){if(!isApril(s)){V.view='deal';break;}startAuction(s,fz,m);V.view='bieten';}else V.view='deal';break;}
 case 'jahre':V.jahre=+x;if(V.view==='bieten'&&fz.auktion)fz.auktion.jahre=V.jahre;break;
 case 'deal':{const m=MM[V.id],o=messeDeal(s,m,V.jahre);if(!isApril(s)){H.toast('Messe-Verträge gibt es nur im April');break;}if(o.zahlung>s.cash){H.toast('Nicht genug Geld 💸');break;}
  s.cash-=o.zahlung;fz.vertraege[m.id]={typ:m.typ,vk:m.vk,net:o.net,ek:o.ek,ende:+o.ende,exkl:true,seit:s.week,messe:true};fz.messe[m.id]={holder:'player',ende:+o.ende};V.view='messe';S.save();H.toast(`✅ ${m.name} bis ${dly(o.ende)}`);break;}
 case 'auslaufen':V.view='messe';H.toast('Vertrag läuft am '+dl(endDate(fairYear(s),0))+' aus');break;
 case 'gebot':V.gebot=Math.max(C.BIETEN.schritt,V.gebot+(+x)*C.BIETEN.schritt);break;
 case 'bieten':bid(s,fz);break;
 case 'ipo':V.view='ipo';break;
 case 'zentrale':V.zentrale=true;break;
 case 'vermoegen':V.tab='filialen';V.view='vermoegen';break;
 case 'einart':V.einArt=x;break;
 case 'einbetrag':V.ein=Math.max(PV.CFG.EINLAGE.schritt,Math.min(PV.ensure(s).kasse,V.ein+(+x)*PV.CFG.EINLAGE.schritt));break;
 case 'einlegen':{const b0=x?+x:V.ein;if(PV.einlegen(s,b0,V.einArt)){H.toast(PV.tx('einlage_erfolgt',{name:PV.ensure(s).name||PV.CFG.NAME_STANDARD,betrag:fY(b0)}));S.save();}break;}
 case 'einnein':PV.ensure(s).frage=null;break;
 case 'bu':BU.act(x);break;
 case 'neukette':V.tab='konkurrenz';V.view='neukette';V.id=x;break;
 case 'ipostart':{const r=ipoReq(s,fz);if(!r.ok){H.toast('Voraussetzungen noch nicht erfüllt');break;}const cap=r.wert*V.streu/100*(1-C.IPO.gebuehr);s.cash+=cap;fz.ipo={streu:V.streu,week:s.week,cap,dividende:V.div};S.save();H.toast(`🔔 Börsengang: ${fY(cap)}`);break;}
 }
 H.rerender();}
export function onInput(el){const k=el.dataset.fzin;if(k==='laufzeit')V.laufzeit=+el.value;if(k==='streu')V.streu=+el.value;if(k==='praemie')V.praemie=+el.value;if(k==='wochen')V.wochen=+el.value;if(k==='div'){V.div=+el.value;const fz=ensure(S.state);if(fz.ipo&&V.view==='vermoegen')fz.ipo.dividende=V.div;}H.rerender();}
/* ---------- Deals ---------- */
function inlandDeal(s,f){const p=C.PRODUKT[f.branche],n=nStores(s),si=stufeIdx(n),tp=tierPrices(ekBase(s,p[3],p[1],p[2])),net=netVK(s,p[3],p[1]);
 const ek=Math.round(tp[si]*(1+C.LAUFZEIT_RABATT(V.laufzeit))*(V.exkl?1-C.EXKL.ekMinus:1)),zahlung=V.exkl?C.EXKL.zahlungJeLaden*n:0;
 const wk=Math.round(V.laufzeit*52/12),fc=forecast(s,p[3],net-ek,wk),u=unitsWeek(s,p[3]);
 return {p,net,n,si,tp,ek,zahlung,wk,fc,u,netto:fc.mehr-zahlung};}
// Laufzeit in Wochen aus Datentabelle (Bob): Neuabschluss 54/106, nahtlose Verlängerung 52/104
const messeWochen=(s,m,j)=>{const c=(ensure(s).messe||{})[m.id];return C.MESSE_WOCHEN[c&&c.holder==='player'?'verl':'neu'][j];};
function messeDeal(s,m,jahre){const n=nStores(s),si=stufeIdx(n),net=netVK(s,m.typ,m.vk),tp=tierPrices(ekBase(s,m.typ,m.vk,m.marge)),ek=tp[si],ende=endDate(fairYear(s),jahre),wk=messeWochen(s,m,jahre),fc=forecast(s,m.typ,net-ek,wk);
 const ende1=endDate(fairYear(s),1),fc1=forecast(s,m.typ,net-ek,messeWochen(s,m,1));
 return {net,n,si,tp,ek,ende,wk,fc,fc1,u:unitsWeek(s,m.typ),zahlung:m.zahlung||0,netto:fc.mehr-(m.zahlung||0),netto1:fc1.mehr-(m.zahlung||0)};}
/* ---------- Bietverfahren ---------- */
let timer=null;
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
// Break-even eines Rivalen: unser Mehrertrag je Laden × seine Läden (Karte + übrige Städte, mind. 1)
export function rvBreakEven(s,o,c){const nk=NK.cfg(c),n=nk?s.stores.filter(x=>x.chain===c).length:rvN(s,c);return o.fc.mehr/Math.max(1,o.n)*Math.max(1,n);}
function startAuction(s,fz,m){const o=messeDeal(s,m,V.jahre),r=rnd(s.week*97+m.id.length*13);const val=o.fc.mehr;
 if(!fz.auktion||fz.auktion.id!==m.id){fz.auktion={id:m.id,jahre:V.jahre,ends:Date.now()+C.BIETEN.sekunden*1000,bids:C.BIETEN.rivalen.filter(c=>H.CHAINS[c]).concat(NK.bieter(s)).slice(0,3).map((c,i)=>{const max=rvBreakEven(s,o,c)*(C.BIETEN_ANTEIL[c]??C.BIETEN_ANTEIL.standard);return {c,max,v:Math.round(max*(.55+.12*(2-i))/1e5)*1e5,t:Date.now()-(2+i*8)*1000};})};}
 const top=Math.max(0,...fz.auktion.bids.map(b=>b.v));V.gebot=top+C.BIETEN.schritt;
 stopTimer();timer=setInterval(()=>tick(s,fz),1000);}
function tick(s,fz){const a=fz.auktion;if(!a||V.view!=='bieten'){stopTimer();return;}
 if(!a.bids.length){if(Date.now()>=a.ends){stopTimer();fz.auktion=null;V.view='messe';H.toast('Keine Gebote – Stand bleibt frei');S.save();H.rerender();}return;}const now=Date.now(),top=a.bids.reduce((p,b)=>b.v>p.v?b:p,a.bids[0]);
 if(top.c==='player'){for(const b of a.bids)if(b.c!=='player'&&b.max>=top.v+C.BIETEN.schritt&&now-top.t>1500){b.v=top.v+C.BIETEN.schritt;b.t=now;a.ends=Math.max(a.ends,now+6000);break;}}
 if(now>=a.ends){stopTimer();const w=a.bids.reduce((p,b)=>b.v>p.v?b:p,a.bids[0]),m=MM[a.id],ende=endDate(fairYear(s),a.jahre);
  if(w.c==='player'){const o=messeDeal(s,m,a.jahre);s.cash-=w.v;fz.vertraege[m.id]={typ:m.typ,vk:m.vk,net:o.net,ek:o.ek,ende:+ende,exkl:true,seit:s.week,messe:true};fz.messe[m.id]={holder:'player',ende:+ende};H.toast(`🔨 Zuschlag: ${m.name} für ${fY(w.v)}`);}
  else{fz.messe[m.id]={holder:w.c,ende:+ende};if(NK.cfg(w.c))NK.messeGewonnen(s,w.c);H.toast(`🔨 ${H.CHAINS[w.c]?H.CHAINS[w.c].name:w.c} bekommt ${m.name}`);}
  fz.auktion=null;V.view='messe';S.save();}
 H.rerender();}
function bid(s,fz){const a=fz.auktion;if(!a)return;const top=Math.max(...a.bids.map(b=>b.v));if(V.gebot<=top){H.toast('Gebot muss höher sein als das Höchstgebot');return;}
 if(V.gebot>s.cash){H.toast('Nicht genug Geld 💸');return;}
 const me=a.bids.find(b=>b.c==='player');if(me){me.v=V.gebot;me.t=Date.now();}else a.bids.push({c:'player',v:V.gebot,t:Date.now(),max:0});a.ends=Math.max(a.ends,Date.now()+6000);}
function ipoReq(s,fz){const h=s.hist,y1=h.slice(-52),y2=h.slice(-104,-52),um=y1.reduce((a,x)=>a+x.rev,0),g1=y1.reduce((a,x)=>a+x.net,0),g2=y2.reduce((a,x)=>a+x.net,0),n=nStores(s),cv=companyValue(s,fz);
 const r=[[um>=C.IPO.umsatz,`Jahresumsatz ≥ ${fY(C.IPO.umsatz)}`,fY(um)],[y2.length>=52&&g1>0&&g2>0,'2 Jahre in Folge Gewinn',''],[n>=C.IPO.filialen,`≥ ${C.IPO.filialen} Filialen`,String(n)]];
 return {r,ok:r.every(x=>x[0])&&!fz.ipo,wert:cv.wert,cv};}
/* ---------- Ansichten ---------- */
const logo=(src,sz=48,bg)=>`<img class="fzlogo" src="${src}" width="${sz}" height="${sz}" alt="">`;
const kobo=t=>`<div class="fzkobo"><img src="grafik/maskottchen/kobo.svg" alt=""><div>${t}</div></div>`;
function head(s){const T=s.lastReport&&s.lastReport.T;
 return `<div class="fzhead"><button class="fzx" data-act="tab" data-t="map" aria-label="Schließen">✕</button>${H.chainLogo('player',44)}<div class="grow"><b>${H.esc(s.logo.name||'Hoshi Mart')}</b><small>KW ${s.week} · Finanzen</small></div><div class="r"><b>${fY(s.cash)}</b><small class="${T?cls(T.net):''}">${T?fY(T.net,1)+' / Woche':'–'}</small></div></div>
 <div class="fztabs">${[['filialen','🏪','Filialen'],['boerse','📈','Börse'],['produkte','🤝','Produkte'],['konkurrenz','🏁','Konkurrenz']].map(([k,i,t])=>`<button class="${V.tab===k?'on':''}" data-act="fz" data-v="tab" data-x="${k}">${i} ${t}</button>`).join('')}</div>`;}
function pvKarte(s){const p=PV.ensure(s);return `${p.frage?`<div class="fzc fzwarn">💴 ${PV.tx('einlage_frage',{betrag:fY(p.frage)})}<div class="fzg2" style="margin-top:8px"><button class="fzbtn s" data-act="fz" data-v="einlegen" data-x="${p.frage}">Einzahlen</button><button class="fzbtn s d" data-act="fz" data-v="einnein">Nein danke</button></div></div>`:''}<button class="fzc bul" data-act="fz" data-v="vermoegen">👤 <b>${PV.tx('titel')}</b><span class="grow"></span><small>${H.esc(p.name||'')} · privat <b class="y">${fY(p.kasse)}</b> ›</small></button>`;}
function pVermoegen(s,fz){const p=PV.ensure(s),j=p.jahr[Math.floor((s.week-1)/52)+1]||{gehalt:0,div:0,zins:0},fw=companyValue(s,fz).wert,an=PV.firmenAnteil(s),dep=depotWert(fz),ges=PV.vermoegen(s),h=p.hist.slice(-260);
 const mx=Math.max(1,...h),mn=Math.min(0,...h),sp=h.length>1?h.map((v,i)=>`${i?'L':'M'}${(i/(h.length-1)*150).toFixed(1)} ${(40-(v-mn)/(mx-mn||1)*36).toFixed(1)}`).join(''):'';
 const nm=H.esc(s.logo.name||'Hoshi Mart'),D=PV.CFG.DIVIDENDE;
 return `<button class="fzlink" data-act="fz" data-v="back">◀ Filialen</button><div class="pvtitle">👤 ${PV.tx('titel')}</div><div class="fzc pvtop"><div class="grow"><small>Gesamtvermögen</small><b class="huge y">≈ ${fY(ges)}</b><small>${H.esc(p.name||PV.CFG.NAME_STANDARD)} · ${fz.ipo?'▲ seit Börsengang':'privat'}</small></div><svg viewBox="0 0 150 44" class="pvspark"><path d="${sp}" fill="none" stroke="#5DBB73" stroke-width="2"/></svg></div>
 <div class="fzc fzlist"><div class="fzrow"><span>💴 Privatkasse</span><b class="y">${fY(p.kasse)}</b></div><div class="fzrow"><span>🏢 ${nm}${fz.ipo?' AG':''} · ${pc(an)} von ${fY(fw)}</span><b>${fY(an*fw)}</b></div>${dep?`<div class="fzrow"><span>📈 Aktien im Firmendepot</span><b>${fY(dep)}</b></div>`:''}<div class="fzrow"><span>🤝 Darlehen an die Firma</span><b>${p.darlehen>0?fY(p.darlehen):'¥0 · zurückgezahlt ✅'}</b></div></div>
 <div class="fzh">Einnahmen dieses Jahr</div><div class="fzc fzlist"><div class="fzrow"><span>👔 CEO-Gehalt · ${fY(PV.CFG.GEHALT_MONAT)}/Monat</span><b class="p">${fY(j.gehalt,1)}</b></div><div class="fzrow"><span>💰 Dividenden <small>${PV.tx('dividende_steuer_hinweis')}</small></span><b class="p">${fY(j.div,1)}</b></div><div class="fzrow"><span>🏦 Darlehenszinsen</span><b class="p">${fY(j.zins,1)}</b></div></div>
 ${fz.ipo?`<div class="fzh">Dividende (${D.min}–${D.max} % vom Gewinn)</div><div class="fzc"><div class="fzrow t"><span>Ausschüttung</span><b class="y">${fz.ipo.dividende??D.standard} %</b></div><input type="range" class="fzrange" min="${D.min}" max="${D.max}" value="${fz.ipo.dividende??D.standard}" data-fzin="div"><div class="fzsm">${tx('ipo_dividende')}${p.darlehen>0?' · Solange dein Darlehen läuft, wird zuerst zurückgezahlt.':''}</div></div>`:''}
 <div class="fzh">💴 Geld in die Firma stecken</div><div class="fzc"><div class="fzg2"><button class="fzc pvart ${V.einArt==='darlehen'?'on':''}" data-act="fz" data-v="einart" data-x="darlehen"><b>${V.einArt==='darlehen'?'🔘':'⚪'} Darlehen</b>${PV.CFG.EINLAGE.standard==='darlehen'?' <span class="fzpill y">Standard</span>':''}<small>${PV.tx('einlage_darlehen')}</small></button><button class="fzc pvart ${V.einArt==='eigen'?'on':''}" data-act="fz" data-v="einart" data-x="eigen"><b>${V.einArt==='eigen'?'🔘':'⚪'} Eigenkapital</b><small>${PV.tx('einlage_eigenkapital')}</small></button></div>
 <div class="pvbetrag"><button class="fzbtn s d" data-act="fz" data-v="einbetrag" data-x="-1">−</button><div><b class="big">${fY(Math.min(V.ein,p.kasse))}</b><small>Schritt ${fY(PV.CFG.EINLAGE.schritt)} · max. ${fY(p.kasse)}</small></div><button class="fzbtn s d" data-act="fz" data-v="einbetrag" data-x="1">+</button></div></div>
 <button class="fzbtn full" data-act="fz" data-v="einlegen" ${p.kasse>=PV.CFG.EINLAGE.schritt?'':'disabled'}>💴 Geld in die Firma stecken</button>`;}
function pFilialen(s,fz){const T=s.lastReport&&s.lastReport.T,dep=depotWert(fz),kr=kreditSumme(s,fz),book=allMine(s).reduce((a,x)=>a+S.bookValue(x),0),ek=s.cash+dep+book-kr;
 const cities=[[s.city,s.stores]].concat(Object.entries(s.away||{}).map(([c,a])=>[c,a.stores])),CI={tokio:'🗼 Tokio',yokohama:'⚓ Yokohama'};
 let h=`<div class="fzh">Konzern</div><div class="fzg2"><div class="fzc"><small>💴 Kasse</small><b class="y">${fY(s.cash)}</b></div><div class="fzc"><small>🏦 Kredite</small><b class="${kr?'n':''}">${kr?fY(-kr):'¥0'}</b></div>
 <div class="fzc"><small>📈 Depotwert</small><b>${fY(dep)}</b></div><div class="fzc"><small>📅 Wochengewinn</small><b class="${T?cls(T.net):''}">${T?fY(T.net,1):'–'}</b></div></div>${pvKarte(s)}${BU.karte(s)}
 <div class="fzc fzline">Eigenkapital <b>${fY(ek)}</b> · Ø Cashflow 13 Wo. <b class="${cls(cf13(s))}">${fY(cf13(s))}</b></div>
 <div class="fzh">Filialen nach Stadt · ${H.ladenN(nStores(s))}</div>`;
 for(const [c,st] of cities){const ms=st.filter(x=>x.chain==='player');if(!ms.length)continue;const g=ms.reduce((a,x)=>a+(x.last?x.last.net:0),0);
  h+=`<div class="fzc fzcity"><div class="fzrow t"><b>▾ ${CI[c]||c}</b><b class="${cls(g)}">${fY(g,1)}</b></div><div class="fzrow hd"><span>Laden</span><span>Umsatz</span><span>Gewinn</span></div>${ms.map(x=>`<div class="fzrow"><span>${H.esc(S.storeLabel(x))}</span><span>${x.last?fY(x.last.rev):'–'}</span><span class="${x.last?cls(x.last.net):''}">${x.last?fY(x.last.net,1):'neu'}</span></div>`).join('')}</div>`;}
 h+=`<button class="fzc fzline" data-act="finklassisch">📋 <b>Bilanz, Hausbank &amp; Spielregeln</b><span class="grow"></span>›</button>`;
 return h;}
function firmRow(fz,f){const q=fz.kurse[f.id],n=fz.depot[f.id]||0,an=n/f.aktien,dv=DIV[f.name],rvb=f.rival&&fz.rv&&fz.rv[f.rival]&&fz.rv[f.rival].boerse;
 return `<button class="fzc fzfirm row5" data-act="fz" data-v="firma" data-x="${f.id}">${logo(f.logo,40)}<div><b>${f.name}</b><small>${f.branche} · ${fY(q.k*f.aktien)}</small></div><div class="k"><b>${fK(q.k)}</b><small class="${cls(q.ch)}">${q.ch>=0?'▲ +':'▼ −'}${de(Math.abs(q.ch)*100,1)} %</small></div><div class="dv"><b>${rvb?Math.round(C.IPO.dividende*100)+' %':dv&&dv.rendite_prozent>0?de(dv.rendite_prozent,2)+' %':'–'}</b><small>Div.</small></div><span class="fzpill ${an>0?'g':''}">${an>0?pc(an):'–'}</span></button>`;}
function pBoerse(s,fz){const rvl=rvChains(s).map(c=>rvFirma(s,c)).filter(Boolean).filter(f=>!fz.rv[f.rival].weg);const own=rvl.concat(FIRMEN.filter(f=>!f.rival)).sort((a,b)=>(fz.depot[b.id]||0)*fz.kurse[b.id].k-(fz.depot[a.id]||0)*fz.kurse[a.id].k);
 return `<div class="fzc fzline">📈 Depot <b>${fY(depotWert(fz))}</b><span class="grow"></span>Leitzins ${de(C.LEITZINS,2)} % · <button class="fzlink" data-act="fz" data-v="kredite">🏦 Kredite ›</button></div>
 <div class="fzh">Aktien · Kurs · Woche · Div. · unser Anteil</div><div class="fzlist">${own.map(f=>firmRow(fz,f)).join('')}</div>
 <div class="fzc fzline c">Firmenwert = Börsenwert im Spiel · ${own.length} Firmen</div>`;}
function spark(h){const mn=Math.min(...h),mx=Math.max(...h),W=200,Hh=40;return `<svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}"><polyline fill="none" stroke="${h[h.length-1]>=h[0]?'#5DBB73':'#F06A6A'}" stroke-width="2.5" points="${h.map((v,i)=>`${(i/(h.length-1)*W).toFixed(1)},${(Hh-3-(v-mn)/(mx-mn||1)*(Hh-6)).toFixed(1)}`).join(' ')}"/></svg>`;}
function pFirma(s,fz){const f=FM[V.id],q=fz.kurse[f.id],n=fz.depot[f.id]||0,an=n/f.aktien,wert=q.k*f.aktien,p=C.PRODUKT[f.branche];
 const st=C.ANTEIL_STUFEN.map((t,i)=>{const txt=i===4&&f.sonder?`Exklusiv: ${f.sonder.replace(/^.*?10 %:\s*/,'').replace(/\.$/,'')}`:i===3&&f.sonder&&/5 %:/.test(f.sonder)?t.t+' · '+f.sonder.match(/5 %:([^.]*?)(\.|$| 10 %)/)[1].trim():t.t;
  return `<div class="fzrow st"><span class="fzpill ${an>=t.p?'g':''}">${pc(t.p)}</span><div class="grow"><b>${fY(wert*t.p)}</b><small>${H.esc(f.bank?['−0,25 Punkte Kreditzins','−0,25 Punkte Kreditzins','−0,5 Punkte Kreditzins','−1,0 Punkte Zins, +25 % Kreditrahmen','−1,0 Punkte Zins, +25 % Kreditrahmen'][i]:txt)}</small></div><span>${an>=t.p?'✅':'🔒'}</span></div>`;}).join('');
 const amts=[1e6,5e6,1e7,5e7].filter(a=>V.kaufen==='v'||a<=s.cash*1.0001||a===1e6);
 return `<div class="fzc fzdet">${logo(f.logo,76)}<div class="grow"><button class="fzlink" data-act="fz" data-v="back">◀ Börse</button><b class="big">${f.name}</b><small>${H.esc(f.liefert||f.branche)}</small></div><div class="r"><b>${fK(q.k)}</b><small class="${cls(q.ch)}">${q.ch>=0?'▲ +':'▼ −'}${de(Math.abs(q.ch)*100,1)} %</small></div></div>
 <div class="fzg2"><div class="fzc"><small>Firmenwert</small><b>${fY(wert)}</b></div><div class="fzc"><small>Unser Anteil</small><b class="${an>0?'p':''}">${an>0?pc(an)+' · '+fY(n*q.k):'–'}</b></div></div>
 <div class="fzc fzline">30 Wochen<span class="grow"></span>${spark(q.h)}</div>${DIV[f.name]&&!(DIV[f.name].rendite_prozent>0)?`<div class="fzc fzline">💴 Dividende <b>–</b> · privat, keine Dividende</div>`:''}${DIV[f.name]&&DIV[f.name].rendite_prozent>0?`<div class="fzc fzline">💴 Dividende <b>${de(DIV[f.name].rendite_prozent,2)} %</b>/Jahr · ${DIV[f.name].ausschuettungen_pro_jahr}× (Stichtag ${DIV[f.name].stichtag_monate.join(', ')})</div>`:''}
 <div class="fzh">Vorteilsstufen</div><div class="fzc fzlist">${st}</div>
 ${p?`<div class="fzc fzline">Produkte: ${H.esc(p[0])} ¥${p[1]}</div>`:''}
 <div class="fzc fzinfo"><b>ⓘ Über ${f.name}</b><div>${H.esc(f.desc||'')}</div></div>
 ${V.kaufen?`<div class="fzc fzline">${V.kaufen==='k'?'Kaufen für':'Verkaufen für'}<span class="grow"></span>${amts.map(a=>`<button class="fzbtn s" data-act="fz" data-v="order" data-x="${a}">${fY(a)}</button>`).join('')}</div><div class="fzsm">1 % Gebühr${V.kaufen==='v'?' · Geld kommt 1 Woche später':''} · Aktien zählen nicht als Kasse</div>`:''}
 <div class="fzbtns"><button class="fzbtn" data-act="fz" data-v="kaufen">Kaufen</button><button class="fzbtn d" data-act="fz" data-v="verkaufen">Verkaufen</button></div>`;}
function pKredite(s,fz){const offers=C.BANKEN.map(b=>({b,o:bankOffer(s,fz,b)})),best=offers.filter(x=>x.o.ok).sort((a,b)=>a.o.zins-b.o.zins)[0],okN=offers.filter(x=>x.o.ok).length;
 return `<div class="fzc fzline col"><div><button class="fzlink" data-act="fz" data-v="back">◀ Börse</button> 🏦 <b>Banken</b> · <span class="${okN?'p':'n'}">${okN?`${okN===3?'alle 3 passen':okN+' passen'} zu deinem Cashflow ✅`:'noch keine Bank passt zu deinem Cashflow'}</span> · Leitzins BoJ ${de(C.LEITZINS,2)} %</div><div>Ø operativer Cashflow 13 Wo.: <b class="${cls(cf13(s))}">${fY(cf13(s))}/Wo.</b> · nötig ≥ ${de(C.CF_REGEL,1)} × Wochenrate</div></div>
 ${offers.map(({b,o})=>{const f=FM[b.id];return `<div class="fzc fzbank ${best&&best.b===b?'best':''}"><div class="fzrow t">${logo(f.logo,56)}<div class="grow"><b>${f.name}</b><small>Laufzeit ${b.jahre} Jahre</small></div>${best&&best.b===b?'<span class="fzpill y">günstigster Zins</span>':''}</div>
  <div class="fzrow"><span>Zins</span><b>${de(o.zins,2)} %</b></div><div class="fzrow"><span>bis zu</span><b class="y">${fY(o.bis)}</b></div><div class="fzrow"><span>Wochenrate (voll)</span><b>${fY(o.rate)}</b></div>
  <button class="fzbtn" data-act="fz" data-v="kredit" data-x="${b.id}" ${o.ok?'':'disabled'}>${o.ok?'Kredit beantragen':'Cashflow reicht noch nicht'}</button></div>`;}).join('')}
 ${fz.kredite.length?`<div class="fzh">Laufende Kredite</div><div class="fzc fzlist">${fz.kredite.map(k=>`<div class="fzrow"><span>${FM[k.bank].name}</span><span>${fY(k.rest)} offen</span><span>${fY(k.rate)}/Wo.</span></div>`).join('')}</div>`:''}`;}
function status(s,fz,id){const v=fz.vertraege[id],m=fz.messe[id];
 if(v)return '<span class="fzpill b">✅ Vertrag aktiv</span>';if(m&&m.holder!=='player')return `<span class="fzpill k">🔒 bei ${H.CHAINS[m.holder]?H.CHAINS[m.holder].name:m.holder}</span>`;
 if(fz.verh[id]===undefined&&!MM[id]&&FM[id]&&FM[id].branche==='Bier/Getränke')return '<span class="fzpill y">🤝 Verhandlung offen</span>';return '<span class="fzpill k">➕ Kein Vertrag</span>';}
function pProdukte(s,fz){const inl=FIRMEN.filter(f=>C.PRODUKT[f.branche]&&!f.rival),y=year(s),d=S.weekDate(s.week),apr=isApril(s);
 const tage=Math.round((new Date(d.getMonth()>3||(d.getMonth()===3&&d.getDate()>16)?d.getFullYear()+1:d.getFullYear(),3,14)-d)/864e5);
 const rows=inl.map(f=>{const p=C.PRODUKT[f.branche];return `<button class="fzc fzfirm" data-act="fz" data-v="marke" data-x="${f.id}">${logo(f.logo,44)}<div class="grow"><b>${f.name}</b><small>${H.esc(f.branche)} · ${H.esc(p[0])}</small></div>${status(s,fz,f.id)}<span class="fzchev">›</span></button>`;});
 const mrows=C.MESSE.marken.filter(m=>fz.vertraege[m.id]||fz.messe[m.id]).map(m=>`<button class="fzc fzfirm" data-act="fz" data-v="messe">${logo('grafik/logos/firmen/'+m.id+'.svg',44)}<div class="grow"><b>${m.name}</b><small>${m.prod} · ${m.land} · Messe-Marke</small></div>${status(s,fz,m.id)}<span class="fzchev">›</span></button>`);
 return `<div class="fzc fzline">🌸 <b>Marken-Messe</b>&nbsp;im April · 10 internationale Marken<span class="grow"></span><button class="fzlink y" data-act="fz" data-v="messe">${apr?'Jetzt geöffnet ›':'Einladung ›'}</button></div>
 <div class="fzh">Marken · ${inl.length+C.MESSE.marken.length} · tippen zum Verhandeln</div><div class="fzlist">${mrows.join('')}${rows.join('')}</div>${kobo('Tipp auf eine Marke, dann kannst du verhandeln!')}`;}
function tierBox(tp,si,einheit,n){return `<div class="fzsub">🏷️ Einkaufspreis nach Filialzahl <small>/ ${einheit}</small></div><div class="fztiers">${C.STUFEN.map((t,i)=>`<div class="${i===si?'on':''}"><small>${t.bis>1e8?t.von+'+':t.von+'–'+t.bis} Läden</small><b>¥${tp[i]}</b>${i===si?`<small>◀ wir: ${n}</small>`:''}</div>`).join('')}</div><div class="fzsm">Mehr Läden = günstiger · keine Mindestmenge</div>`;}
function ertrag(title,lines,netto,extra){return `<div class="fzc fzert ${netto<0?'neg':''}"><div class="fzsub ${netto<0?'n':'p'}">📊 ${title}</div>${lines.map(l=>`<div class="fzrow"><span>${l[0]}</span><b class="${l[2]||''}">${l[1]}</b></div>`).join('')}<div class="fzrow tot"><b>= Ergebnis</b><b class="${cls(netto)}">${fY(netto,1)} ${netto<0?'⚠️':'✅'}</b></div>${netto<0?'<div class="fzwarn">⚠️ Achtung: Verlust! Dieser Deal bringt weniger Mehrertrag, als er kostet.</div>':''}${extra||''}</div>`;}
function pVerhandeln(s,fz){const f=FM[V.id],o=inlandDeal(s,f),p=o.p,marge=Math.round(o.net-o.ek),v=fz.vertraege[f.id];
 const [nm,bild]=[['Frau Hayashi','sakura'],['Herr Tanaka','kenji'],['Frau Mori','emi'],['Herr Sato','hiroshi'],['Frau Ishida','aoi']][f.id.length%5];// gezeichnete Porträts (Yuki, grafik/filialleiter)
 return `<div class="fzc fzdet"><div class="fzav"><img src="grafik/filialleiter/${bild}.svg" alt="${nm}" width="76" height="76"></div><div class="grow"><button class="fzlink" data-act="fz" data-v="back">◀ Produkte</button><small>🤝 Treffen · Verkaufsleitung</small><b class="big">${nm}</b><small>${logo(f.logo,22)} ${f.name} · ${H.esc(p[0])}</small></div></div>
 <div class="fzquote">„Unser ${H.esc(p[0].replace(/ \d.*$/,''))} wäre ideal für Ihre Läden. Mit ${H.ladenN(o.n)} sind Sie in Stufe ${C.STUFEN[o.si].bis>1e8?C.STUFEN[o.si].von+'+':C.STUFEN[o.si].von+'–'+C.STUFEN[o.si].bis}: <b>¥${o.ek}</b> pro ${p[4]}.“</div>
 <div class="fzc fzsale"><div class="fzsub p">🏪 Verkauf im Laden · pro ${p[4]}</div><div class="fz3"><div><small>Einkauf</small><b>¥${o.ek}</b></div><div><small>Verkaufspreis (Vorschlag)</small><b class="y">¥${p[1]}</b></div><div><small>Marge</small><b class="p">¥${marge} · ${Math.round(marge/o.net*100)} %</b></div></div>
 <div class="fzsm c">≈ ${fY(o.u*marge)} Rohertrag/Woche (${H.ladenN(o.n)} × ≈${Math.round(o.u/o.n)} ${p[4]==='Dose'?'Dosen':'Stück'}) · Kaufquote ${de((C.KAUFQUOTE[p[3]]||0)*100,1)} % der Kunden</div></div>
 <div class="fzh">Bedingungen</div><div class="fzc">${tierBox(o.tp,o.si,p[4],o.n)}
 <div class="fzsub">📅 Laufzeit <b class="y r">${V.laufzeit} Monate</b></div><input type="range" class="fzrange" min="6" max="24" step="6" value="${V.laufzeit}" data-fzin="laufzeit"><div class="fzsm">länger = besserer Preis</div>
 <div class="fzsub">⭐ Exklusivität <small>(optional)</small><button class="fztog ${V.exkl?'on':''}" data-act="fz" data-v="exkl">${V.exkl?'An':'Aus'}</button></div><div class="fzsm">An: Eight &amp; Co. verlieren die Marke · Einkauf −${Math.round(C.EXKL.ekMinus*100)} %, Einmalzahlung ${fY(C.EXKL.zahlungJeLaden*o.n)}</div></div>
 ${ertrag(`Erwarteter Ertrag (${V.laufzeit} Monate, ${o.wk} Wo.)`,[[`Rohertrag ${o.wk} Wochen`,fY(o.fc.roh,1)],[`davon Mehrertrag ggü. Ersatzmarke (${Math.round(C.MEHRERTRAG*100)} %)`,fY(o.fc.mehr,1),'p'],['− Einmalzahlung',o.zahlung?fY(-o.zahlung):'¥0',o.zahlung?'n':'']],o.netto)}
 <div class="fzbtns"><button class="fzbtn" data-act="fz" data-v="angebot" ${v?'disabled':''}>${v?'✅ Vertrag aktiv':'🤝 Angebot machen'}</button><button class="fzbtn d" data-act="fz" data-v="ablehnen">Ablehnen</button></div>`;}
function pMesse(s,fz){const y=year(s),d=S.weekDate(s.week),apr=isApril(s),fy=d.getMonth()>3?d.getFullYear()+1:d.getFullYear();
 const tage=Math.max(0,Math.round((new Date(fy,3,14)-d)/864e5)),mine=C.MESSE.marken.find(m=>fz.messe[m.id]&&fz.messe[m.id].holder==='player');
 const tag=m=>{const h=fz.messe[m.id];if(h&&h.holder==='player')return '<span class="fzpill b">🔁 Verlängern</span>';if(h)return `<span class="fzpill k">🔒 ${H.CHAINS[h.holder].name}</span>`;return m.art==='bieten'?'<span class="fzpill y">🔨 Bieten</span>':'<span class="fzpill g">🤝 Direkt</span>';};
 return `<div class="fzmesse"><small>🌸 April · Jahr ${d.getMonth()>3?y+1:y}</small><b>Marken-Messe ${H.esc(H.cityName||'Tokio')}</b><small>10 internationale Marken · Getränke &amp; Snacks · 1× im Jahr</small></div>
 <div class="fzc fzline">📅 <b>${C.MESSE.tage}</b>&nbsp;· ${C.MESSE.ort}<span class="grow"></span>${apr?'<span class="p">jetzt geöffnet</span>':`noch ${tage} Tage`}<button class="fzlink" data-act="fz" data-v="back" style="margin-left:10px">◀ Produkte</button></div>
 <div class="fzh">Hallenplan · 10 Stände</div><div class="fzhall">${C.MESSE.marken.map(m=>`<button class="fzc fzstand ${fz.messe[m.id]&&fz.messe[m.id].holder==='player'?'mine':''}" data-act="fz" data-v="stand" data-x="${m.id}">${logo('grafik/logos/firmen/'+m.id+'.svg',46)}<div class="grow"><small>Stand ${m.stand} · ${m.land}</small><b>${m.name}</b>${tag(m)}</div></button>`).join('')}</div>
 <div class="fzc fzline col"><div><span class="fzpill g">🤝 Direkt</span> fester Preis <span class="fzpill y">🔨 Bieten</span> Konkurrenz bietet mit <span class="fzpill b">🔁 Verlängern</span> unser Vertrag</div><div class="fzsm">Alle Messe-Verträge laufen 1 oder 2 Jahre und enden am ${dl(endDate(fairYear(s),1))} Verlängern geht nur hier.</div></div>
 ${kobo(apr?'Nur ausländische Marken! Schau dir die Stände an.':mine?`Nur ausländische Marken! Unser ${mine.name}-Vertrag endet am ${dl(fz.messe[mine.id].ende)}`:'Nur ausländische Marken! Die Messe öffnet im April.')}`;}
function laufzeitBtns(fy){return `<div class="fzsub">📅 Laufzeit <small>· endet immer am ${dl(endDate(fy,1))}</small></div><div class="fzyrs">${[1,2].map(n=>`<button class="${V.jahre===n?'on':''}" data-act="fz" data-v="jahre" data-x="${n}"><b>${n} Jahr${n>1?'e':''}</b><small>bis ${dly(endDate(fy,n))}</small></button>`).join('')}</div>`;}
function pDeal(s,fz){const m=MM[V.id],o=messeDeal(s,m,V.jahre),h=fz.messe[m.id],ren=h&&h.holder==='player',marge=Math.round(o.net-o.ek),fy=fairYear(s),apr=isApril(s);
 return `<div class="fzc fzdet">${logo('grafik/logos/firmen/'+m.id+'.svg',76)}<div class="grow"><button class="fzlink" data-act="fz" data-v="back">◀ Messe · Stand ${m.stand}${ren?' · 🔁 Verlängern':m.art==='bieten'?' · 🔨 Bietverfahren':' · 🤝 Direkt'}</button><b class="big">${m.name}</b><small>${m.prod} · ${m.herkunft||m.land}</small></div></div>
 ${ren?`<div class="fzc fzblue"><b>📄 Unser Vertrag</b> läuft am <b class="y">${dly(h.ende)}</b> aus · exklusiv<div class="fzsm">Ohne Verlängerung dürfen Eight &amp; Co. die Marke danach führen.</div></div>`:''}
 ${!apr?'<div class="fzc fzwarn">📅 Die Messe ist nur im April geöffnet. Hier siehst du schon die Bedingungen.</div>':''}
 <div class="fzc fzsale"><div class="fzsub p">🏪 Verkauf im Laden · pro ${m.einheit}</div><div class="fz3"><div><small>Einkauf</small><b>¥${o.ek}</b></div><div><small>Verkaufspreis (Vorschlag)</small><b class="y">¥${m.vk}</b></div><div><small>Marge</small><b class="p">¥${marge} · ${Math.round(marge/o.net*100)} %</b></div></div>
 <div class="fzsm c">≈ ${fY(o.u*marge)} Rohertrag/Woche (${H.ladenN(o.n)} × ≈${Math.round(o.u/o.n)} ${m.einheit==='Flasche'?'Fl.':'Stk.'}) · Kaufquote ${de((C.KAUFQUOTE[m.typ]||0)*100,1)} %</div></div>
 <div class="fzh">Bedingungen${ren?' (Verlängerung)':''}</div><div class="fzc">${tierBox(o.tp,o.si,m.einheit,o.n)}${laufzeitBtns(fy)}
 <div class="fzrow"><span>⭐ Exklusivität</span><b class="p">✅ ja</b></div><div class="fzrow"><span>💰 Einmalzahlung</span><b class="y">${fY(o.zahlung)}</b></div></div>
 ${ertrag(`Erwarteter Ertrag (${V.jahre} Jahr${V.jahre>1?'e':''}, ${o.wk} Wo.)`,[[`Rohertrag ${o.wk} Wochen`,fY(o.fc.roh,1)],[`davon Mehrertrag ggü. Ersatzmarke (${Math.round(C.MEHRERTRAG*100)} %)`,fY(o.fc.mehr,1),'p'],['− Einmalzahlung',fY(-o.zahlung),'n']],o.netto,`<div class="fzsm">Gewinnschwelle ${fY(o.fc.mehr)} · ${V.jahre===2?`bei 1 Jahr: ${fY(o.netto1,1)}${o.netto1<0?' ⚠️':''}`:`bei 2 Jahren: ${fY(messeDeal(s,m,2).netto,1)}`}</div>`)}
 <div class="fzbtns"><button class="fzbtn" data-act="fz" data-v="deal" ${apr?'':'disabled'}>${ren?'🔁 Verlängern':'🤝 Vertrag schließen'}</button><button class="fzbtn d" data-act="fz" data-v="${ren?'auslaufen':'back'}">${ren?'Auslaufen':'Zurück'}</button></div>`;}
function pBieten(s,fz){const a=fz.auktion,m=MM[V.id];if(!a)return pDeal(s,fz);const o=messeDeal(s,m,a.jahre),marge=Math.round(o.net-o.ek),sec=Math.max(0,Math.ceil((a.ends-Date.now())/1000)),fy=fairYear(s);
 const bids=a.bids.slice().sort((x,y)=>y.v-x.v),netto=o.fc.mehr-V.gebot,prev=V.gebot+1e6;
 return `<div class="fzc fzdet">${logo('grafik/logos/firmen/'+m.id+'.svg',64)}<div class="grow"><button class="fzlink" data-act="fz" data-v="back">◀ Messe · Stand ${m.stand} · 🔨 Bietverfahren</button><b class="big">${m.name}</b><small>${m.prod} · exklusiv · ${a.jahre} Jahr${a.jahre>1?'e':''} bis ${dly(endDate(fy,a.jahre))}</small></div><div class="r"><small>⏱️ noch</small><b class="n big" id="fzclock">0:${String(sec).padStart(2,'0')}</b></div></div>
 <div class="fzh">Gebote live</div><div class="fzc fzlist">${bids.map((b,i)=>`<div class="fzrow t">${b.c==='player'?H.chainLogo('player',32):H.chainLogo(b.c,32)}<div class="grow"><b>${b.c==='player'?'Du':H.CHAINS[b.c].name}</b><small>vor ${Math.max(1,Math.round((Date.now()-b.t)/1000))} s</small></div><div class="r"><b class="${i===0?'y':''}">${fY(b.v)}</b>${i===0?'<small class="y">👑 Höchstgebot</small>':''}</div></div>`).join('')}</div>
 <div class="fzc">${tierBox(o.tp,o.si,m.einheit,o.n)}<div class="fzsm">VK ¥${m.vk} · Marge <b class="p">¥${marge} (${Math.round(marge/o.net*100)} %)</b></div>${laufzeitBtns(fy)}</div>
 ${ertrag(`Erwarteter Ertrag · bis ${dly(endDate(fy,a.jahre))}`,[[`${H.ladenN(o.n)} × ≈${o.fc.u} × ¥${marge} × ${o.wk} Wo. × ${Math.round(C.MEHRERTRAG*100)} % Mehrertrag`,fY(o.fc.mehr,1),'p'],['− Dein Gebot',fY(-V.gebot),'n']],netto,`<div class="fzrow"><span>Gewinnschwelle / max. sinnvolles Gebot</span><b class="y">${fY(o.fc.mehr)}</b></div>`)}
 <div class="fzbtns"><div class="fzc fzbid"><small>Dein Gebot</small><b>${fY(V.gebot)}</b><div><button data-act="fz" data-v="gebot" data-x="-1">−</button> ${fY(C.BIETEN.schritt,1)} <button data-act="fz" data-v="gebot" data-x="1">+</button></div></div><button class="fzbtn" data-act="fz" data-v="bieten">🔨 Bieten</button></div>`;}
function pKonkurrenz(s,fz){const news=(s.news||[]).find(n=>n.chain&&n.chain!=='player'),A=C.ANGEBOT.abLaeden;
 const known=C.KONKURRENZ.map(k=>k.c),liste=C.KONKURRENZ.filter(k=>H.CHAINS[k.c]&&!(NK.cfg(k.c)&&!NK.aktiv(s).includes(k.c))&&!(fz.rv&&fz.rv[k.c]&&fz.rv[k.c].weg)).map(k=>NK.cfg(k.c)?{...k,neu:1}:k).concat(NK.aktiv(s).filter(c=>!known.includes(c)).map(c=>({c,neu:1}))).concat(rvChains(s).filter(c=>!known.includes(c)&&!rvState(s,fz,c).weg).map(c=>({c})));
 const fremd=fz.ipo&&fz.fremd?Object.values(fz.fremd).reduce((a,x)=>a+x,0):0,nb=liste.filter(k=>!k.neu&&C.RIVAL_START[k.c]!=null&&rvState(s,fz,k.c).boerse).length;
 const rows=liste.map(k=>{const ch=H.CHAINS[k.c],rv=!k.neu&&C.RIVAL_START[k.c]!=null?rvState(s,fz,k.c):null,f=rv&&rv.boerse&&rvFirma(s,k.c),q=f&&fz.kurse[f.id],wert=k.neu?NK.wert(s,k.c):rv?rvWert(s,k.c):null,n=rvN(s,k.c),frei=n>=A;
  const sub=k.neu?`neu · ${NK.cfg(k.c).land} · <button class="fzlink y" data-act="fz" data-v="neukette" data-x="${k.c}">Eilmeldung ›</button>`:`${rv?`Start ${fY(C.RIVAL_START[k.c]).replace(',00 ',' ')} · `:''}Firmenwert ≈ ${fY(q?q.k*f.aktien:wert||0).replace(',00 ',' ')}`;
  const pill=q?'<span class="fzpill b">📈 börsennotiert</span>':rv?`<span class="fzpill ${frei&&C.KAUFANGEBOT?'g':'k'}">${frei&&C.KAUFANGEBOT?'🤝 Kaufangebot möglich':'🔒 privat'} · ${n>=A?H.ladenN(n):n+"/"+A+" Läden"}</span>`:'<span class="fzpill k">🔒 privat</span>';
  const btn=q?`<button class="fzpill y fzbtnpill" data-act="fz" data-v="rvaktie" data-x="${f.id}">📈 Aktie kaufen ›</button>`:rv&&C.KAUFANGEBOT?(frei?`<button class="fzpill y fzbtnpill" data-act="fz" data-v="kaufangebot" data-x="${k.c}">🤝 Kaufangebot machen ›</button>`:'<span class="fzpill k fzoff">🤝 Kaufangebot machen</span>'):'';
  return `<div class="fzkrow"><div class="fzrow t">${ch?H.chainLogo(k.c,40):''}<div class="grow"><b>${ch?ch.name:k.c}</b><small>${sub}</small></div></div>${rv&&!q?`<div class="fzbar"><i style="width:${Math.min(100,n/A*100)}%" class="${frei?'g':''}"></i></div>`:''}<div class="fzkbtn">${pill}${btn}</div></div>`;}).join('');
 return `<div class="fzh">Konkurrenz · ${liste.length} Ketten · ${nb?nb+' an der Börse':'keine an der Börse'}</div><div class="fzc fzlist">${rows}<div class="fzsm c">➕ weitere Ketten können später auftauchen</div></div>
 <div class="fzc"><b>🎯 Übernahme</b>${C.KAUFANGEBOT?`<div class="fzsm">🤝 ab <b class="y">${A} Läden</b>: Kaufangebot an den Besitzer</div>`:''}<div class="fzsm">📈 geht eine Kette an die Börse: <b class="y">${Math.round(C.UEBERNAHME_AB*100)} %</b> der Aktien kaufen</div></div>
 ${fz.ipo&&fremd>0?`<div class="fzc fzline ${fremd>=C.FREMD.warnung?'n':''}">⚠️ Konkurrenten halten zusammen ${pc(fremd)} unserer Aktien<span class="grow"></span>${C.RUECKKAUF?`<button class="fzbtn s" data-act="fz" data-v="rueckkauf">🛡️ ${pc(Math.min(C.FREMD.rueckkauf,fremd))} zurückkaufen</button>`:''}</div>`:''}
 ${news?`<div class="fzc fzline">🔔 ${news.text}<span class="grow"></span><small>KW ${news.week}</small></div>`:''}
 <button class="fzc fzline fzipo" data-act="fz" data-v="ipo">🔔 <b>Eigener Börsengang</b><span class="grow"></span>${fz.ipo?`<span class="p">✅ ${fz.ipo.streu} % an der Börse</span>`:'Bewertung &amp; Voraussetzungen ›'}</button>
 ${kobo(fremd>=C.FREMD.warnung?tx('warnung_fremdbesitz',{kette:'Die Konkurrenz',anteil:Math.round(fremd*100)}):C.KAUFANGEBOT?`Ab ${A} Läden kannst du ein Kaufangebot machen. Geht eine Kette an die Börse, übernimmst du sie mit ${Math.round(C.UEBERNAHME_AB*100)} %.`:`Geht eine Kette an die Börse, übernimmst du sie mit ${Math.round(C.UEBERNAHME_AB*100)} %.`)}`;}
// Eilmeldung neue Kette (Yuki Mockup k_neue_kette.png)
function pNeuKette(s,fz){const id=V.id,c=NK.cfg(id),st=((s.nk||{}).chains||{})[id];if(!c||!st)return pKonkurrenz(s,fz);const R=NK.K.REGELN,ch=H.CHAINS[id];
 const jahr=Math.floor((st.start-1)/52)+1,kw=st.start,later=NK.K.AUSLAND.filter(x=>x.id!==id&&!((s.nk.chains||{})[x.id])),pr=NK.K.BEISPIELE.map(b=>{const k=H.CATS.find(x=>x.id===b.cat);return k?{...b,wir:k.price,die:Math.round(k.price*(1-R.preisMinus))}:null;}).filter(Boolean);
 return `<div class="fzc fzneu c"><small class="n">🚨 EILMELDUNG · KW ${kw} · JAHR ${jahr}</small><div class="fzneulogo">${H.chainLogoFile(c.file,104)}</div><b class="big">${c.name} kommt nach Japan!</b><small>${c.land} · ${H.esc(c.text)} · startet in ${H.cityName}</small></div>
 <div class="fzg2"><div class="fzc"><small>💰 Startkapital</small><b class="n">${fY(st.start_kapital)}</b><small>${id==='zabu'?'':'60 % deines Firmenwerts'}${st.fw?` (${fY(st.fw)} → ${fY(st.fw*R.kapitalAnteil)})`:''} · Minimum ${fY(R.kapitalMin)} greift</small></div><div class="fzc"><small>🏪 Expansion Jahr 1</small><b class="n">1 Laden / Woche</b><small>≈ 52 Läden bis Jahresende, danach alle 2 Wochen</small></div></div>
 <div class="fzh">Preise: ${Math.round(R.preisMinus*100)} % unter deinen · 2 Jahre</div><div class="fzpr">${pr.map(p=>`<div class="fzc c"><span>${p.icon}</span><small>wir ¥${p.wir}</small><b class="n">¥${p.die}</b></div>`).join('')}</div>
 ${later.length?`<div class="fzc fzline">Später möglich: ${later.map(x=>`${H.chainLogoFile(x.file,30)} ${x.name} ${x.land.split(' ')[0]}`).join(' · ')}</div>`:''}
 <div class="fzbtns"><button class="fzbtn" data-act="fz" data-v="back">📊 Zur Konkurrenz</button><button class="fzbtn d" data-act="tab" data-t="map">OK</button></div>
 ${kobo('Die sind günstiger als wir – Treue-Aktionen helfen!')}`;}
function pIPO(s,fz){const r=ipoReq(s,fz),cap=r.wert*V.streu/100*(1-C.IPO.gebuehr),g0=Math.max(0,r.cv.gewinn)*V.div/100,divA=g0*V.streu/100,divM=g0*(1-V.streu/100)*(1-PV.CFG.STEUER_DIVIDENDE);
 return `<div class="fzc fzipohead"><button class="fzlink" data-act="fz" data-v="back">◀ Konkurrenz</button><small>🔔 Eigener Börsengang</small><b class="big">${H.esc(s.logo.name||'Hoshi Mart')} AG</b><small>Bewertung</small><b class="huge y">≈ ${fY(r.wert)}</b><small>Kasse + ½ × ${H.ladenN(allMine(s).length)} × ${fY(C.FIRMENWERT.ladenWert)} + ${C.FIRMENWERT.gewinnFaktor} × Jahresgewinn ${fY(r.cv.gewinn)} − Kredite</small></div>
 <div class="fzh">Voraussetzungen</div><div class="fzc fzlist">${r.r.map(x=>`<div class="fzrow"><span>${x[0]?'✅':'❌'} ${x[1]} ${x[2]?`<small>(${x[2]})</small>`:''}</span></div>`).join('')}</div>
 <div class="fzh">Anteil an die Börse</div><div class="fzc"><div class="fzrow t"><span>${C.IPO_STREU.min} %</span><b class="${V.streu>=C.IPO_STREU.rot?'n':'y'} big">${V.streu} %</b><span>${C.IPO_STREU.max} %</span></div><input type="range" class="fzrange" min="${C.IPO_STREU.min}" max="${C.IPO_STREU.max}" value="${V.streu}" data-fzin="streu"><div class="fzzone" style="--z:${(C.IPO_STREU.rot-C.IPO_STREU.min)/(C.IPO_STREU.max-C.IPO_STREU.min)*100}%"><i style="left:var(--z)"></i></div>
 ${V.streu>=C.IPO_STREU.rot?`<div class="fzwarn">🔴 <b>Ab ${C.IPO_STREU.rot} %: ${tx('ipo_streubesitz_rot')}</b><br>Rivalen müssen +${Math.round((UE.ON?UE.RIVALE_AUF_SPIELER.praemieMin/100:C.SPIELER_UEBERNAHME.aufschlag)*100)} % auf den ${C.SPIELER_UEBERNAHME.schnittWochen}-Wochen-Schnitt bieten</div>`:`<div class="fzsm">Bis ${C.IPO_STREU.rot-1} % hältst du ≥ 51 % und entscheidest allein · <span class="n">ab ${C.IPO_STREU.rot} %: ${tx('ipo_streubesitz_rot')}</span></div>`}
 <div class="fzrow"><span>Kapital (nach ${Math.round(C.IPO.gebuehr*100)} % Gebühr)</span><b class="p">${fY(cap,1)}</b></div><div class="fzrow t"><span>💴 Dividende <small>${PV.CFG.DIVIDENDE.min}–${PV.CFG.DIVIDENDE.max} % vom Gewinn</small></span><b class="y">${V.div} %</b></div><input type="range" class="fzrange" min="${PV.CFG.DIVIDENDE.min}" max="${PV.CFG.DIVIDENDE.max}" value="${V.div}" data-fzin="div"><div class="fzsm">${tx('ipo_dividende')}</div>
 <div class="fzrow"><span>An Aktionäre (${V.streu} %) · an dich (${100-V.streu} %)</span><b><span class="n">${fY(-divA)}</span> · <span class="p">${fY(divM,1)}</span><small>pro Jahr · deins nach ${Math.round(PV.CFG.STEUER_DIVIDENDE*100)} % Steuer</small></b></div><div class="fzrow"><span>Mindestens in neue Filialen</span><b>${Math.round(C.IPO.minFilialen*100)} %</b></div></div>
 ${C.RIVAL_UEBERNAHME?`<div class="fzc fzipowarn">⚠️ ${tx('ipo_warnung')}</div>`:''}
 <button class="fzbtn full" data-act="fz" data-v="ipostart" ${r.ok?'':'disabled'}>${fz.ipo?'✅ Schon an der Börse':r.ok?'🔔 Börsengang starten':'🔒 Voraussetzungen fehlen'}</button>`;}
export function render(){const s=S.state,fz=ensure(s);let b;if(V.zentrale&&BU.ON)return BU.render();
 if(V.tab==='filialen')b=V.view==='vermoegen'?pVermoegen(s,fz):pFilialen(s,fz);
 else if(V.tab==='boerse')b=V.view==='tender'&&FM[V.id]&&FM[V.id].rv?pTender(s,fz):V.view==='firma'?(FM[V.id]&&FM[V.id].rv?pRival(s,fz):pFirma(s,fz)):V.view==='kredite'?pKredite(s,fz):pBoerse(s,fz);
 else if(V.tab==='produkte')b=V.view==='verhandeln'?pVerhandeln(s,fz):V.view==='messe'?pMesse(s,fz):V.view==='deal'?pDeal(s,fz):V.view==='bieten'?pBieten(s,fz):pProdukte(s,fz);
 else b=V.view==='ipo'?pIPO(s,fz):V.view==='angebot'?pAngebot(s,fz):V.view==='neukette'?pNeuKette(s,fz):pKonkurrenz(s,fz);
 return head(s)+`<div class="fzbody">${b}</div>`;}
export function init(sim,helpers){S=sim;H=helpers;PV.init(sim,{texte:helpers.texte,firmenwert:s=>companyValue(s,ensure(s)).wert,depot:s=>depotWert(ensure(s))});
 const plans={};if(BU.ON)for(const k of ['000','001','010','011','100','101','110','111'])fetch(`grafik/buero/plan/plan_${k}.svg`).then(r=>r.ok?r.text():'').then(t=>plans[k]=t).catch(()=>{});
 BU.init(sim,{allMine,esc:helpers.esc,fY,toast:helpers.toast,ladenN:helpers.ladenN,dtype:id=>helpers.dtype?helpers.dtype(id):'standard',typName:t=>({office:'🏢 Büroviertel',station:'🚉 Bahnhof',tourist:'⛩️ Tourismus',nightlife:'🌃 Ausgehviertel',residential:'🏘️ Wohnviertel',uni:'🎓 Uni'})[t]||t,
  produktName:id=>(MM[id]||FM[id]||{name:id}).name,messeTermin:C.MESSE_TERMIN,planSvg:k=>plans[k]||'',zuFinanzen:tab=>{V.zentrale=false;V.tab=tab;V.view=tab==='boerse'?null:V.view;V.view=null;H.rerender();}});if(!ON)return;
 if(!document.getElementById('fzcss')){const l=document.createElement('link');l.id='fzcss';l.rel='stylesheet';l.href='css/finanzen.css';document.head.appendChild(l);}
 fetch('daten/DIVIDENDEN.json').then(r=>r.json()).then(j=>{for(const d of j.firmen)DIV[d.firma]=d;H.rerender();}).catch(()=>{});
 document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.fzin)onInput(e.target);});}
export const ui=V;// für Tests/Screens
export const firmenwert=s=>companyValue(s,ensure(s));
export function zeigeNeueKette(id){V.tab='konkurrenz';V.view='neukette';V.id=id;}
export const _t={startAuction:(s,id)=>{const fz=ensure(s);startAuction(s,fz,MM[id]);stopTimer();return fz.auktion;},rvBreakEven,inlandDeal:(s,id)=>inlandDeal(s,FM[id]),messeDeal:(s,id,j)=>messeDeal(s,MM[id],j),unitsWeek,forecast,bankOffer:(s,id)=>bankOffer(s,ensure(s),C.BANKEN.find(b=>b.id===id)),companyValue};
