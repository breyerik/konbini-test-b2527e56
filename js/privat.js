// Spieler als Privatperson: Name, Privatkasse, CEO-Gehalt, Dividenden (freiwillig nach IPO), Einlagen (Darlehen/Eigenkapital) – Franky nach Yukis b_mein_vermoegen
import * as P from './privat_cfg.js';
let S=null,H=null;
export function ensure(s){if(!s.privat)s.privat={name:null,kasse:P.START_PRIVAT,darlehen:0,eigen:0,hist:[],jahr:{},frageSperre:0};return s.privat;}
const jahr=s=>Math.floor((s.week-1)/52)+1;
function buch(s,k,v){const p=ensure(s),j=jahr(s);p.jahr[j]=p.jahr[j]||{gehalt:0,div:0,zins:0,divBrutto:0};p.jahr[j][k]+=v;}
export function tx(id,o={}){const T=((H.texte&&H.texte())||{}).vermoegen||{};const D={titel:'Mein Vermögen',dividende_erhalten:'💴 {betrag} Dividende sind in dein Privatvermögen geflossen.',einlage_frage:'Die Firmenkasse ist knapp. Möchtest du {betrag} aus deinem Privatvermögen einzahlen?',einlage_erfolgt:'Kobo: Danke, {name}! {betrag} aus deinem Privatvermögen sind jetzt in der Firmenkasse.'};
 return String(T[id]||D[id]||'').replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:m);}
export const nameText=()=>{const t=((H.texte&&H.texte())||{}).startbildschirm||{};return t.name_eingabe||'Wie heißt du? Unter diesem Namen führst du Omas Laden weiter.';};
// Wochen-Hook: läuft nach FZ.weekHook (Dividende), T = Wochen-GuV
export function weekHook(s,rep,T){const p=ensure(s),fz=s.fz||{};
 const g=P.GEHALT_MONAT*12/52;s.cash-=g;p.kasse+=g;buch(s,'gehalt',g);if(T)T.net-=g;
 if(p.darlehen>0){const z=p.darlehen*P.DARLEHEN_ZINS/52;s.cash-=z;p.kasse+=z;buch(s,'zins',z);
  if(T&&T.net>0){const t=Math.min(p.darlehen,T.net*P.DARLEHEN_TILGUNG,Math.max(0,s.cash));s.cash-=t;p.kasse+=t;p.darlehen-=t;}}
 p.hist.push(Math.round(vermoegen(s)));if(p.hist.length>520)p.hist.shift();
 if(s.cash<P.KNAPP.kasse&&p.kasse>=P.EINLAGE.schritt&&s.week>=p.frageSperre){p.frage=Math.min(p.kasse,Math.max(P.EINLAGE.schritt,Math.ceil((P.KNAPP.kasse-s.cash)/P.EINLAGE.schritt)*P.EINLAGE.schritt));p.frageSperre=s.week+P.KNAPP.sperreWochen;}}
// Dividende nach eigenem IPO: vom FZ-Hook aufgerufen; gibt den Betrag zurück, der die Firma verlässt
export function dividende(s,net){const fz=s.fz||{},p=ensure(s);if(!fz.ipo||net<=0)return 0;if(p.darlehen>0)return 0;// Darlehen zuerst zurück
 const q=(fz.ipo.dividende??P.DIVIDENDE.standard)/100,tot=net*q,eigen=1-(fz.ipo.streu+(fz.fremdAnteil||0))/100,mein=Math.max(0,1-fz.ipo.streu/100)*tot;
 const netto=mein*(1-P.STEUER_DIVIDENDE);p.kasse+=netto;buch(s,'div',netto);buch(s,'divBrutto',mein);return tot;}
export function firmenAnteil(s){const fz=s.fz||{};return fz.ipo?1-fz.ipo.streu/100:1;}
export function vermoegen(s){const p=ensure(s),fw=H.firmenwert?H.firmenwert(s):0;return p.kasse+p.darlehen+firmenAnteil(s)*fw+(H.depot?H.depot(s):0);}
export function einlegen(s,betrag,art){const p=ensure(s),fz=s.fz||{};betrag=Math.min(betrag,p.kasse);if(betrag<=0)return false;p.kasse-=betrag;s.cash+=betrag;p.frage=null;
 if(art==='darlehen')p.darlehen+=betrag;else{p.eigen+=betrag;if(fz.ipo){const w=Math.max(1,H.firmenwert(s));fz.ipo.streu=fz.ipo.streu*w/(w+betrag);}}// neue Aktien zum Kurs: unser Anteil steigt
 return true;}
export function init(sim,helpers){S=sim;H=helpers;}
export const CFG=P;
