// Paket 2 – Zentrale (Büro, Team, Entwicklung, Preise). Läuft im Finanzmenü-Overlay (#fz), eigene Tabs wie Yukis b1–b8.
import * as B from './buero_cfg.js';
let S=null,H=null;const V={tab:'buero',view:null,id:null,auftrag:'chiki'};
export const ON=B.ON;
const W=m=>m*12/52;// Monat → Woche
export function ensure(s){if(!s.buero)s.buero={office:null,kauf:false,seit:0,mieteBezahlt:0,staff:{},pb:{},cmo:false,erl:{}};return s.buero;}
const mine=s=>H.allMine(s);
export const verfuegbar=s=>ON&&mine(s).length>=B.AB_LAEDEN;
const OF=id=>B.BUEROS.find(o=>o.id===id);
const ST=id=>B.PERSONAL.find(p=>p.id===id);
const EM=id=>B.EIGENMARKEN.find(e=>e.id===id);
const netto=e=>e.vk/(1+e.steuer);
const pbMarge=e=>netto(e)-e.ek,frMarge=e=>netto(e)*e.fremd.marge;
const mehrWoche=(s,e)=>mine(s).length*e.stueck*(pbMarge(e)-frMarge(e));
const amort=(s,e)=>{const m=mehrWoche(s,e);return m>0?Math.ceil(e.kosten/m):null;};
export function kostenWoche(s){const b=ensure(s);let k=0;const o=OF(b.office);if(o)k+=b.kauf?W(B.KAUF.unterhalt):W(o.miete);for(const id in b.staff)k+=W(ST(id).gehalt);return k;}
const kaufPreis=(s,o)=>{const b=ensure(s);let p=o.kauf;if(b.office===o.id&&!b.kauf&&s.week-b.seit>=B.KAUF.anrechnungAbWochen)p-=b.mieteBezahlt*B.KAUF.anrechnung;return Math.max(0,p);};
export function weekHook(s,rep,T){if(!ON)return;const b=ensure(s);if(!b.office)return;
 const k=kostenWoche(s);if(!b.kauf)b.mieteBezahlt+=W(OF(b.office).miete);let plus=0;
 for(const [id,p] of Object.entries(b.pb)){const e=EM(id);if(!p.fertig&&s.week>=p.start+e.wochen){p.fertig=s.week;rep&&rep.news&&rep.news.push({chain:'player',text:`🧪 Eigenmarke <b>${e.name}</b> ist fertig und im Regal.`});}
  if(p.fertig)plus+=mehrWoche(s,e)*(s.week-p.fertig<B.NACHFRAGE_START.wochen?B.NACHFRAGE_START.faktor:1);}
 s.cash+=plus-k;if(T){T.net+=plus-k;}b.letzte={kosten:k,plus};
 if(b.cmo&&b.staff.cmo)cmoPreise(s);}
function cmoPreise(s){for(const st of mine(s)){const t=H.dtype(st.d);st.cfg.price=B.CMO_PREIS[t]??B.CMO_PREIS.standard;}}
/* ---------- CFO-Erinnerungen (b7) ---------- */
export function erinnerungen(s){const fz=s.fz||{},out=[],d=S.weekDate(s.week),wk=x=>Math.max(0,Math.round((x-d)/(7*864e5)));
 for(const [id,v] of Object.entries(fz.vertraege||{})){if(!v.ende)continue;const w=wk(new Date(v.ende));if(w<=B.CFO.vertragVorlauf)out.push({id:'v_'+id,icon:'📄',farbe:'#FFC93C',titel:`${H.produktName(id)}-Vertrag läuft aus`,text:`${v.messe?'Exklusiv-Vertrag':'Vertrag'} endet am ${new Date(v.ende).getDate()}.${new Date(v.ende).getMonth()+1}. – verlängern nur auf der Messe.`,wann:`noch ${w} Wo.`,btn:'Zur Messe',go:'produkte'});}
 const M=H.messeTermin,y=d.getMonth()+1>M.monat||(d.getMonth()+1===M.monat&&d.getDate()>M.bis)?d.getFullYear()+1:d.getFullYear(),md=new Date(y,M.monat-1,M.von),mw=wk(md);
 if(mw<=B.CFO.messeVorlauf)out.push({id:'m_'+y,icon:'🌸',farbe:'#F7A1B5',titel:'Marken-Messe Tokio',text:`${M.von}.–${M.bis}. April: Gebote vorbereiten.`,wann:`noch ${mw} Wo.`,btn:'Zur Messe',go:'messe'});
 const kr=(fz.kredite||[]).filter(k=>k.rest>0);if(kr.length){const rate=kr.reduce((a,k)=>a+k.rate,0),h=(s.hist||[]).slice(-13),cf=h.length?h.reduce((a,x)=>a+(x.net||0),0)/h.length:0;
  out.push({id:'k_'+s.week,icon:'🏦',farbe:'#3D7BD9',titel:'Kredite laufen',text:`Raten ${H.fY(rate)} / Woche · Rest ${H.fY(kr.reduce((a,k)=>a+k.rest,0))}`,wann:'jede Woche',btn:'Kredite ansehen',go:'boerse'});
  if(h.length&&cf<B.CFO.cashflowRegel*rate)out.push({id:'c',icon:'⚠️',farbe:'#FF6B6B',titel:'Cashflow-Regel knapp',text:`Ø Cashflow 13 Wo. = ${(cf/rate).toFixed(1).replace('.',',')} × Wochenrate (Minimum ${String(B.CFO.cashflowRegel).replace('.',',')})`,wann:'jetzt',btn:'Details',go:'boerse'});}
 const e=ensure(s).erl;return out.filter(x=>!(e[x.id]>s.week));}
/* ---------- Ansichten ---------- */
const sel=(k,i,t)=>`<button class="${V.tab===k?'on':''}" data-act="fz" data-v="bu" data-x="tab:${k}">${i} ${t}</button>`;
function head(s){const T=s.lastReport&&s.lastReport.T;return `<div class="fzhead"><button class="fzx" data-act="fz" data-v="bu" data-x="zu" aria-label="Zurück">✕</button><span class="buicon">🏢</span><div class="grow"><b>${H.esc(s.logo.name||'Hoshi Mart')}</b><small>KW ${s.week} · Zentrale</small></div><div class="r"><b>${H.fY(s.cash)}</b><small class="${T&&T.net<0?'n':'p'}">${T?H.fY(T.net,1)+' / Woche':'–'}</small></div></div>
 <div class="fztabs">${sel('buero','🏢','Büro')}${sel('team','👥','Team')}${sel('entw','🧪','Entwicklung')}${sel('preise','📣','Preise')}</div>`;}
const btn=(x,t,cls='o')=>`<button class="fzbtn ${cls}" data-act="fz" data-v="bu" data-x="${x}">${t}</button>`;
const kobo=t=>`<div class="fzkobo"><img src="grafik/maskottchen/kobo.svg" alt=""><div>${t}</div></div>`;
function pListe(s){const b=ensure(s);let h=`<div class="fzc bul">🏢 <b>Zentrale gesucht</b> · <small>Ohne Büro kein Personal (Produktentwickler, CFO, CMO)</small></div>`;
 for(const o of B.BUEROS)h+=`<div class="fzc buof"><div class="buoh"><span class="buimg">🏢</span><div class="grow"><b>${o.name}</b><small>${o.stadt} · ${o.viertel} · ${o.m2} m² · ${o.plaetze} Arbeitsplätze</small>${b.office===o.id?'<span class="fzpill g">✅ dein Büro</span>':`<span class="fzpill k">${o.tag}</span>`}</div></div>
  <div class="fzg2"><div class="fzc"><small>Mieten</small><b class="y">${H.fY(o.miete)}</b><small>/ Monat</small></div><div class="fzc"><small>Kaufen</small><b>${H.fY(o.kauf)}</b><small>einmalig</small></div></div>
  <div class="fzg2">${btn('miete:'+o.id,'🔑 Mieten')}${btn('detail:'+o.id,'🏠 Kaufen','d')}</div></div>`;
 return h+kobo('Erst mieten, später kaufen geht auch!');}
function chart(o){const J=20,mx=Math.max(o.miete*12*J,o.kauf+B.KAUF.unterhalt*12*J),X=j=>20+j/J*300,Y=v=>170-v/mx*150;let m='',k='';for(let j=0;j<=J;j++){m+=`${j?'L':'M'}${X(j).toFixed(0)} ${Y(o.miete*12*j).toFixed(0)}`;k+=`${j?'L':'M'}${X(j).toFixed(0)} ${Y(o.kauf+B.KAUF.unterhalt*12*j).toFixed(0)}`;}
 const be=o.kauf/((o.miete-B.KAUF.unterhalt)*12);const bx=X(Math.min(J,be));
 return `<svg viewBox="0 0 330 200" class="buchart"><path d="M20 20V170H320" stroke="#4A4F7A" fill="none"/>${[0,5,10,15,20].map(j=>`<text x="${X(j)}" y="186" font-size="10" fill="#9C98C8" text-anchor="middle">${j} J.</text>`).join('')}<line x1="${bx}" y1="20" x2="${bx}" y2="170" stroke="#fff" stroke-dasharray="3 3" opacity=".6"/><text x="${bx+4}" y="30" font-size="10" fill="#fff">Kauf lohnt ab ≈ ${be.toFixed(1).replace('.',',')} J.</text><path d="${m}" stroke="#FFC93C" stroke-width="3" fill="none"/><path d="${k}" stroke="#5DBB73" stroke-width="3" fill="none"/></svg><small><span class="y">━ Miete</span> · <span class="p">━ Kauf + Unterhalt</span></small>`;}
function pDetail(s){const o=OF(V.id),b=ensure(s),kp=kaufPreis(s,o),anr=b.office===o.id&&!b.kauf?b.mieteBezahlt*B.KAUF.anrechnung:0;
 return `<div class="fzc fzdet"><span class="buimg big">🏢</span><div class="grow"><button class="fzlink" data-act="fz" data-v="bu" data-x="liste">◀ Büros</button><small>${o.stadt} · ${o.viertel} · ${o.m2} m² · ${o.plaetze} Plätze</small><b class="big">${o.name}</b></div></div>
 <div class="fzg2"><div class="fzc buy"><small>🔑 Mieten</small><b class="y">${H.fY(o.miete)}</b><small>pro Monat · ≈ ${H.fY(o.miete*12)} / Jahr · sofort einziehen · kündbar ${B.KAUF.kuendigungMonate} Mon.</small></div><div class="fzc bug"><small>🏠 Kaufen</small><b class="p">${H.fY(kp)}</b><small>einmalig + ${H.fY(B.KAUF.unterhalt)}/Monat Unterhalt · Wert bleibt (Wiederverkauf ≈ ${Math.round(B.KAUF.wiederverkauf*100)} %)</small></div></div>
 <div class="fzh">Gesamtkosten über die Jahre</div><div class="fzc">${chart(o)}</div>
 <div class="fzc buhint">🏦 <b>Später kaufen aus der Miete</b><br><small>Nach ${B.KAUF.anrechnungAbWochen/52} Jahren Miete kannst du das Büro kaufen. ${Math.round(B.KAUF.anrechnung*100)} % der gezahlten Miete werden angerechnet.${anr?` Bisher: ${H.fY(anr)} → Kaufpreis ${H.fY(kp)}`:''}</small></div>
 <div class="fzg2">${b.office===o.id&&!b.kauf?'<span></span>':btn('miete:'+o.id,'🔑 Mieten · '+H.fY(o.miete))}${b.office===o.id&&b.kauf?'<span></span>':btn('kauf:'+o.id,'🏠 Kaufen · '+H.fY(kp),'d')}</div>`;}
function pPlan(s){const b=ensure(s),o=OF(b.office),n=Object.keys(b.staff).length,key=['cfo','cmo','pe'].map(k=>b.staff[k]?1:0).join('');
 return `<div class="fzc bul">🏢 <b>Büro ${o.viertel}</b><small>${b.kauf?'gekauft':'gemietet'}</small><span class="grow"></span><small class="y">${n}/${B.PERSONAL.length} besetzt</small></div>
 <div class="fzc buplan" data-act="fz" data-v="bu" data-x="tab:team">${H.planSvg(key)}</div>
 <div class="fzg2"><div class="fzc"><small>Besetzt</small><b>${n?Object.keys(b.staff).map(k=>ST(k).rolle.split(' ')[0]+' '+ST(k).name.split(' ')[1]).join(', '):'–'}</b></div><div class="fzc"><small>Frei</small><b class="y">${o.plaetze-n} Plätze</b></div></div>
 <div class="fzc bul">👆 <small>Tippe auf einen freien Platz (+), um weiteres Personal einzustellen.</small></div>
 <div class="fzc bul"><small>Kosten Zentrale</small><span class="grow"></span><b class="n">${H.fY(-kostenWoche(s))} / Woche</b></div>
 <div class="fzg2">${btn('detail:'+o.id,b.kauf?'🏠 Büro-Details':'🏠 Kaufen?','d')}${btn('auszug','🚪 Ausziehen','d')}</div>`;}
function pBuero(s){const b=ensure(s);if(V.view==='detail')return pDetail(s);return b.office?pPlan(s):pListe(s);}
function pTeam(s){const b=ensure(s);if(!b.office)return `<div class="fzc">🏢 Erst ein Büro mieten oder kaufen – dann kannst du Personal einstellen.</div>`+btn('tab:buero','🏢 Büro suchen');
 const o=OF(b.office),frei=o.plaetze-Object.keys(b.staff).length;let h=`<div class="fzc bul">👥 <b>Personal für die Zentrale</b><span class="grow"></span><small class="y">${Object.keys(b.staff).length}/${B.PERSONAL.length} besetzt</small></div>`;
 for(const p of B.PERSONAL){const on=!!b.staff[p.id];h+=`<div class="fzc buper ${on?'on':''}"><img class="fzav" src="grafik/buero/personal/${p.file}.svg" alt=""><div class="grow"><small>${p.icon} ${p.rolle}</small><b>${p.name}</b><small>${p.text}</small><small class="y">${p.sterne}</small></div><div class="r"><small>Gehalt / Monat</small><b class="y">${H.fY(p.gehalt)}</b>${on?btn('entl:'+p.id,'✅ eingestellt','gr'):frei>0?btn('einst:'+p.id,'Einstellen'):'<small>kein Platz</small>'}</div></div>`;}
 const pk=Object.keys(b.staff).reduce((a,k)=>a+ST(k).gehalt,0);
 h+=`<div class="fzc bul"><small>Personalkosten Zentrale</small><span class="grow"></span><b>${H.fY(pk)} / Monat</b></div>`;
 if(!b.staff.cfo)h+=`<div class="fzc fzwarn">⚠️ Ohne CFO bekommst du <b>keine Erinnerungen</b> an auslaufende Verträge, Kredite und Messe-Fristen.</div>`;
 else h+=pCFO(s);return h;}
function pCFO(s){const r=erinnerungen(s),p=ST('cfo');let h=`<div class="fzh">Erinnerungen vom CFO</div><div class="fzc buhead"><img class="fzav" src="grafik/buero/personal/${p.file}.svg" alt=""><div class="grow"><b>${p.name} · CFO</b><small>„Diese Woche im Blick:“</small></div>${r.length?`<span class="fzpill n">${r.length} neu</span>`:''}</div>`;
 if(!r.length)h+=`<div class="fzc"><small>✅ Alles im grünen Bereich – keine Fristen in Sicht.</small></div>`;
 for(const x of r)h+=`<div class="fzc buerin" style="border-left:5px solid ${x.farbe}"><div class="fzline">${x.icon} <b>${x.titel}</b><span class="grow"></span><small class="y">${x.wann}</small></div><small>${x.text}</small><div class="fzg2"><button class="fzbtn o" data-act="fz" data-v="bu" data-x="go:${x.go}">${x.btn}</button>${btn('spaeter:'+x.id,'Später','d')}</div></div>`;
 return h;}
function pEntw(s){const b=ensure(s);if(!b.staff.pe)return `<div class="fzc">🧪 Für Eigenmarken brauchst du einen <b>Produktentwickler</b> in der Zentrale.</div>`+btn('tab:team','👥 Zum Team');
 if(V.view==='marken')return pMarken(s);const p=ST('pe'),e=EM(V.auftrag),am=amort(s,e),n=mine(s).length,lauf=b.pb[e.id];
 let h=`<div class="fzc buhead"><img class="fzav" src="grafik/buero/personal/${p.file}.svg" alt=""><div class="grow"><b>${p.name} · Produktentwickler</b><small>„Was soll ich für unsere Eigenmarke entwickeln?“</small></div></div><div class="fzh">Auftrag wählen</div><div class="buauf">`;
 for(const x of B.EIGENMARKEN)h+=`<button class="fzc ${V.auftrag===x.id?'on':''}" data-act="fz" data-v="bu" data-x="auftrag:${x.id}"><span>${x.emoji}</span><b>${x.kurz}</b><small>${b.pb[x.id]?(b.pb[x.id].fertig?'✅ im Regal':'⏳ läuft'):x.sub}</small></button>`;
 h+=`</div><div class="fzc"><div class="fzline">${e.emoji} <b>${e.name}</b></div><div class="fzg2"><div class="fzc"><small>💴 Entwicklung</small><b>${H.fY(e.kosten)}</b></div><div class="fzc"><small>⏱️ Dauer</small><b>${e.wochen} Wochen</b></div></div></div>
 <div class="fzh">Marge: Eigenmarke vs. gekaufte Marke</div><div class="fzc"><div class="fzline"><small>${e.emoji} ${e.kurz} (Eigenmarke) · EK ¥${e.ek} · VK ¥${e.vk}</small><span class="grow"></span><b class="p">¥${Math.round(pbMarge(e))} · ${Math.round(pbMarge(e)/netto(e)*100)} %</b></div><div class="fzbar"><i style="width:${Math.round(pbMarge(e)/netto(e)*100)}%;background:#5DBB73"></i></div>
 <div class="fzline"><small>${e.fremd.name} · VK ¥${e.vk}</small><span class="grow"></span><b>¥${Math.round(frMarge(e))} · ${Math.round(e.fremd.marge*100)} %</b></div><div class="fzbar"><i style="width:${Math.round(e.fremd.marge*100)}%"></i></div>
 <small>= <b class="p">+${H.fY(mehrWoche(s,e))} / Woche</b> mehr Rohertrag (${H.ladenN(n)} × ${e.stueck} Stück × ¥${Math.round(pbMarge(e)-frMarge(e))}) · Amortisation <b>${am?am+' Wochen':'–'}</b></small></div>
 <div class="fzc bul">📈 <small>Erwartete Nachfrage: wie Marke −${Math.round((1-B.NACHFRAGE_START.faktor)*100)} % (unbekannte Marke), nach ${Math.round(B.NACHFRAGE_START.wochen/4.33)} Monaten gleich auf.</small></div>
 ${lauf?`<div class="fzc bul">${lauf.fertig?'✅ Schon im Regal':'⏳ In Entwicklung – noch '+Math.max(0,lauf.start+e.wochen-s.week)+' Wo.'}</div>`:btn('entw:'+e.id,'🧪 Entwicklung starten · '+H.fY(e.kosten))}
 ${btn('marken','🏷️ Unsere Eigenmarken','d')}`;return h+kobo('Eigenmarken = mehr Marge, aber erst bekannt machen!');}
function pMarken(s){const b=ensure(s),L=B.EIGENMARKEN.filter(e=>b.pb[e.id]);let h=`<button class="fzlink" data-act="fz" data-v="bu" data-x="auftraege">◀ Aufträge</button><div class="fzh">Eigenmarke „Kobo“ · ${L.length} ${L.length===1?'Produkt':'Produkte'}</div>`;
 if(!L.length)h+=`<div class="fzc"><small>Noch keine Eigenmarke – starte einen Auftrag.</small></div>`;
 for(const e of L){const p=b.pb[e.id];h+=`<div class="fzc bumarke"><span class="bupk">${e.emoji}</span><div class="grow"><b>${e.name}</b>${p.fertig?'<span class="fzpill g">✅ im Regal</span>':`<span class="fzpill y">⏳ in Entwicklung · noch ${Math.max(0,p.start+e.wochen-s.week)} Wo.</span>`}<small>EK ¥${e.ek} · VK ¥${e.vk}</small><small class="p">Marge ¥${Math.round(pbMarge(e))} · ${Math.round(pbMarge(e)/netto(e)*100)} %</small><small>statt ${e.fremd.name}: ¥${Math.round(frMarge(e))} · ${Math.round(e.fremd.marge*100)} %</small></div></div>`;}
 return h;}
function pPreise(s){const b=ensure(s);if(!b.staff.cmo)return `<div class="fzc">📣 Preise und neue Filialleiter übernimmt eine <b>CMO</b> in der Zentrale.</div>`+btn('tab:team','👥 Zum Team');
 const p=ST('cmo'),n=mine(s).length;let h=`<div class="fzc buhead"><img class="fzav" src="grafik/buero/personal/${p.file}.svg" alt=""><div class="grow"><b>${p.name} · CMO</b><small>Preise für alle ${H.ladenN(n)}</small></div><button class="butog ${b.cmo?'on':''}" data-act="fz" data-v="bu" data-x="cmo"><i></i></button><small>CMO setzt</small></div><div class="fzh">Preisfaktor je Viertel</div>`;
 const typen=[...new Set(mine(s).map(x=>H.dtype(x.d)))];
 for(const t of typen){const f=B.CMO_PREIS[t]??B.CMO_PREIS.standard,L=mine(s).filter(x=>H.dtype(x.d)===t),akt=L.reduce((a,x)=>a+(x.cfg.price||1),0)/L.length;
  h+=`<div class="fzc"><div class="fzline"><b>${H.typName(t)}</b> <small>· ${H.ladenN(L.length)}</small><span class="grow"></span><b class="y">${Math.round(akt*100)} %</b></div><div class="fzbar"><i style="width:${Math.min(100,akt/1.2*100)}%"></i></div><small>CMO-Vorschlag ${Math.round(f*100)} %${t==='office'?' · Premium geht':t==='uni'?' · günstig ist Pflicht':''}</small></div>`;}
 h+=`<div class="fzh">Neue Filiale</div><div class="fzc bul">🧑‍💼 <small>${b.cmo?'Kato stellt für neue Läden automatisch eine passende Filialleitung ein.':'Schalte „CMO setzt“ ein, dann übernimmt Kato Preise und Filialleitungen.'}</small></div>`;
 return h;}
export function render(){const s=S.state;let b;if(V.tab==='team')b=pTeam(s);else if(V.tab==='entw')b=pEntw(s);else if(V.tab==='preise')b=pPreise(s);else b=pBuero(s);return head(s)+`<div class="fzbody">${b}</div>`;}
export function act(x){const s=S.state,b=ensure(s),[k,v]=x.split(':');
 switch(k){case 'tab':V.tab=v;V.view=null;break;case 'liste':V.view=null;break;case 'detail':V.view='detail';V.id=v;break;
  case 'miete':{if(b.office&&b.office!==v){H.toast('Erst aus dem alten Büro ausziehen');break;}b.office=v;b.kauf=false;b.seit=s.week;b.mieteBezahlt=b.mieteBezahlt||0;V.view=null;H.toast('🔑 '+OF(v).name+' gemietet');break;}
  case 'kauf':{const o=OF(v),p=kaufPreis(s,o);if(s.cash<p){H.toast('Nicht genug Geld');break;}if(b.office&&b.office!==v){H.toast('Erst aus dem alten Büro ausziehen');break;}s.cash-=p;b.office=v;b.kauf=true;b.wert=o.kauf;b.seit=s.week;V.view=null;H.toast('🏠 '+o.name+' gekauft');break;}
  case 'auszug':if(b.kauf)s.cash+=b.wert*B.KAUF.wiederverkauf;Object.assign(b,{office:null,kauf:false,staff:{},cmo:false,mieteBezahlt:0});H.toast('🚪 Ausgezogen – Personal entlassen');break;
  case 'einst':b.staff[v]=s.week;H.toast('✅ '+ST(v).name+' eingestellt');break;
  case 'entl':delete b.staff[v];if(v==='cmo')b.cmo=false;break;
  case 'auftrag':V.auftrag=v;break;case 'marken':V.view='marken';break;case 'auftraege':V.view=null;break;
  case 'entw':{const e=EM(v);if(s.cash<e.kosten){H.toast('Nicht genug Geld');break;}s.cash-=e.kosten;b.pb[v]={start:s.week,fertig:null};H.toast('🧪 Entwicklung gestartet');break;}
  case 'cmo':b.cmo=!b.cmo;if(b.cmo)cmoPreise(s);break;
  case 'spaeter':b.erl[v]=s.week+4;break;
  case 'go':H.zuFinanzen(v);return;
  case 'zu':H.zuFinanzen('filialen');return;}
 S.save();}
export function karte(s){if(!ON)return '';const n=mine(s).length,b=ensure(s);
 if(n<B.AB_LAEDEN)return `<div class="fzc bul">🏢 <small>Zentrale ab ${B.AB_LAEDEN} Läden (${n}/${B.AB_LAEDEN})</small></div>`;
 return `<button class="fzc bul" data-act="fz" data-v="zentrale">🏢 <b>Zentrale</b><span class="grow"></span><small>${b.office?OF(b.office).viertel+' · '+Object.keys(b.staff).length+' Personal':'Büro suchen ›'}</small></button>`;}
export const _t={erinnerungen,kostenWoche,mehrWoche:(s,id)=>mehrWoche(s,EM(id)),amort:(s,id)=>amort(s,EM(id)),V};
export function init(sim,helpers){S=sim;H=helpers;}
