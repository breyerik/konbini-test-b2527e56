// Konbini Empire v2 – Oberfläche
import * as D from './data.js';
import {CITY} from './plan.js';
import {NEUESTAEDTE} from './cities.js';
import {NEUE_STAEDTE} from './staedte_neu.js';
import * as S from './sim.js';
import * as FZ from './finanzen.js';
import * as BU from './buero.js';
import * as PV from './privat.js';
import * as SO from './sortiment.js';
import * as NK from './neueketten.js';
import * as BF from './bahnhof.js';
import {GFX,loadGfx,has,svgColored,svgURL} from './gfx.js';
import {logoURL} from './logo.js';
import * as SC from './screens.js';
import {ico,seasonIco,keepLast} from './washi.js';
import * as MM from './mitemite.js';
import {createWorld,storePreview,previewMode,chainLook} from './world.js';
 if(BU.ON){// Paket 2: Asayake Mart + Tsubame Eki (Erik bestätigt, ?paket2=0 aus)
  D.CHAINS.asayake=D.CHAINS.asayake||{name:'Asayake Mart',jp:'アサヤケ',color:'#F28C38',color2:'#FFE08A',brand:1.0,aggr:.09,file:'asayake-mart'};
  D.CHAINS.tsubame=D.CHAINS.tsubame||{name:'Tsubame Eki',jp:'ツバメ駅',color:'#1F7A4D',color2:'#FFC93C',brand:.98,aggr:.09,file:'tsubame-eki'};
  for(const c of ['asayake','tsubame'])if(!D.RIVALS.includes(c))D.RIVALS.push(c);S.rivalNur.tsubame=['station'];
  for(const [c,f] of [['asayake','asayake-mart'],['tsubame','tsubame-eki']])if(!GFX.svg['logo_'+c])fetch(`grafik/logos/${f}.svg`).then(r=>r.ok?r.text():'').then(x=>{if(x)GFX.svg['logo_'+c]=x;}).catch(()=>{});}
const {fmtY,fmtN,pct,sgn,sum}=S;
const $=s=>document.querySelector(s);
const st=()=>S.state;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let W=null;
const ui={tab:'map',storeTab:'service',storeId:null,cands:{},pending:null,draft:null,editLogo:null,editMode:'new',pgroup:'heiss'};
/* ---------- Bausteine ---------- */
const H_esc=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function chainLogo(c,size=28){
 if(c==='player')return `<img class="logo" src="${logoURL(st().logo,Math.min(256,size*3))}" width="${size}" height="${size}" alt="">`;
 const ch=D.CHAINS[c]||{name:c};if(ch.nachfolger||!ch.file){// Platzhalter bis Yuki liefert: Initiale auf Farbkreis; grafik/ketten/<logo>.png nur wenn LOGO_FREIGEGEBEN (neueketten_cfg.js)
  const ini=H_esc((ch.name||c).trim()[0]||'?');return `<span class="logo ph" style="position:relative;display:inline-grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;background:${ch.color||'#7a8a99'};color:#fff;font-weight:800;font-size:${Math.round(size*.5)}px;flex:none;overflow:hidden">${ini}${ch.logo?`<img src="grafik/ketten/${ch.logo}.png" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">`:''}</span>`;}
 const f=ch.file;return has('logo_'+c)?`<img class="logo" src="grafik/logos/${f}.svg" width="${size}" height="${size}" alt="${D.CHAINS[c].name}">`:`<img class="logo" src="${logoURL(c,size*3)}" width="${size}" height="${size}" alt="">`;
}
const cname=c=>c==='player'?st().logo.name:D.CHAINS[c].name;
const ccolor=c=>c==='player'?chainLook('player',st().logo,{facade:'brand'}).main:D.CHAINS[c].color;
function catIcon(k,size=46){return GFX.svg['icon_'+k.icon]?`<img src="grafik/icons/${k.icon}.svg" width="${size}" height="${size}" alt="">`:`<span class="em">${k.emoji}</span>`;}
function svcIcon(v,size=40){return `<img src="grafik/icons/services/${v.icon}.svg" width="${size}" height="${size}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${v.emoji}',style:'font-size:${size*.75}px'}))">`;}
function stars(v){const f=Math.floor(v),h=v-f>=.5;return `<span class="stars">${'★'.repeat(f)}${h?'<b class="half">★</b>':''}<i>${'★'.repeat(5-f-(h?1:0))}</i></span>`;}
function seg(act,id,k,arr,cur,fmt){return `<div class="seg">${arr.map((o,i)=>`<button class="${i===cur?'on':''}" data-act="${act}" data-id="${id}" data-k="${k}" data-v="${i}">${o.label}${fmt?`<small>${fmt(o,i)}</small>`:''}</button>`).join('')}</div>`}
let toastT;function toast(m,cls){const t=$('#toast');t.className=cls||'';t.innerHTML=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),3000);}
function showSheet(h){$('#sheet').innerHTML='<div class="grab"></div>'+h;$('#sheet').scrollTop=0;document.body.classList.add('sheet');}
// Städte: eine Firma, Wechsel = speichern + neu laden in die andere Stadt (Karte/Plan hängen am Seitenstart)
const TRAVEL=[{id:'tokio',name:'Tokio',jp:'東京',emoji:'🗼'},{id:'yokohama',name:'Yokohama',jp:'横浜',emoji:'🎡'}].concat(NEUESTAEDTE?Object.values(NEUE_STAEDTE).map(c=>({id:c.id,name:c.name,jp:c.jp,emoji:c.emoji})):[]);
const cityURL=(id,q)=>{const p=new URLSearchParams(location.search);p.delete('stadt');p.delete('weiter');const keep=p.toString();return location.pathname+'?'+[id==='tokio'?'':'stadt='+id,keep,q].filter(Boolean).join('&');};// Schalter (z. B. ?neuestaedte=1) bleiben beim Reisen erhalten
function travel(id){if(id===CITY.id){closeSheet();return;}S.save();location.href=cityURL(id,'weiter='+((S.state&&S.state.slot)||1));}
function cityCards(){const aw=S.state?S.awayStores(S.state):[];return TRAVEL.map(c=>{const on=c.id===CITY.id,a=aw.find(x=>x.city===c.id);
 const sub=on?`Aktiv · ${filN(S.mine().length)}`:a?`✈️ Reisen · ${filN(a.n)}`:(c.id==='tokio'?'✈️ Reisen':'✈️ Expandieren · freie Läden');
 return `<div class="city ${on?'on':''}" data-act="travel" data-v="${c.id}" style="cursor:pointer"><span class="jp">${c.jp}</span><b>${c.emoji} ${c.name}</b><small>${sub}</small></div>`;}).join('');}
// Bahnhof (Yuki): Stadtwahl + Zug-Ladescreen, dann wie travel()
function bahnhofOpen(){closeSheet();let el=$('#bf');if(!el){el=document.createElement('div');el.id='bf';document.body.appendChild(el);}el.innerHTML=BF.render(CITY.id);el.scrollTop=0;document.body.classList.add('bfopen');}
function abfahrt(id){S.save();document.body.classList.remove('bfopen');BF.ladescreen(id);setTimeout(()=>travel(id),BF.LADEZEIT);}
function travelSheet(){showSheet(`<div class="h">✈️ Städte</div><div class="cities">${cityCards()}</div><div style="color:var(--mut);font-size:12px;font-weight:700;margin-top:8px">Eine Firma, eine Kasse. Filialen in anderen Städten laufen weiter und werden jede Woche voll mitgerechnet.</div>`);}
const filN=n=>n===1?'1 Filiale':`${n} Filialen`,ladenN=n=>n===1?'1 Laden':`${n} Läden`;// Singular/Plural (Whitebeard)
function closeSheet(){closePick();document.body.classList.remove('sheet');ui.storeId=null;W&&W.select(null);}
const sheetOpen=()=>document.body.classList.contains('sheet');

const GH=(g,size=22)=>{let h='';for(let i=1;i<=5;i++){const k=g>=i?'voll':g>=i-.5?'halb':'leer';h+=`<img src="grafik/bewertung/geist-${k}.svg" width="${size}" height="${size}" alt="">`;}return `<span class="gh">${h}</span>`;};
const bar100=v=>`<div class="sk"><i style="width:${Math.round(v*20)}%"></i></div>`;
const groupOf={tee:'heiss',coffee:'heiss',oden:'heiss',drinks:'kalt',onigiri:'essen',bento:'essen',brot:'essen',saison:'essen',snacks:'sonst',alltag:'sonst'};
const GROUPS=[['heiss','🔥 Heiß'],['kalt','🧊 Kalt'],['essen','🍙 Essen'],['sonst','🛒 Sonstiges']];
const starsN=(n)=>`<span class="stars">${'★'.repeat(n)}<i>${'★'.repeat(5-n)}</i></span>`;
const si=(did,slot)=>S.siteInfo(did,slot);
const designOf=b=>S.designOf({b});

/* ---------- Tutorial (Kobo) ---------- */
const TUT_NEXT={start:'sortiment',sortiment:'personal',personal:'services',zweiter_laden:'karte'};
function tut(id,force,vars){
 const s=st(),X=GFX.texte||{},T=(X.tutorial||[]).find(x=>x.id===id)||(X.hinweise||[]).find(x=>x.id===id)||rescueText(id);
 const always=['warnung_kasse','warnung_minus','rettung_gerettet'].includes(id);// Kassen-Warnung auch bei ausgeblendetem Tutorial
 if(!T||!s||(s.tutOff&&!always)||(s.tut[id]&&!force))return;s.tut[id]=1;ui.tutId=id;
 const fig=({'kobo':'kobo','kobo-besorgt':'kobo-besorgt','kobo-jubelnd':'kobo-jubelnd'})[T.figur]||'kobo';
 let txt=T.text.replace(/\d+ Millionen Yen/,(D.START_CASH/1e6)+' Millionen Yen');for(const k in vars||{})txt=txt.split('{'+k+'}').join(vars[k]);
 $('#tutor').innerHTML=`<div class="tbub"><div class="tx">${esc(txt)}<div class="tbtn"><button data-act="tutnext" class="ok">${TUT_NEXT[id]?'Weiter':'Verstanden'}</button><button data-act="tutoff">Tutorial ausblenden</button></div></div><img src="grafik/maskottchen/${fig}.svg" alt="Kobo"></div>`;
 $('#tutor').classList.add('show');
}
function tutHide(){const e=$('#tutor');e.classList.remove('show');setTimeout(()=>{if(!e.classList.contains('show'))e.innerHTML='';},300);}

/* ---------- HUD & Leiste ---------- */
function renderHUD(){
 const s=st(),last=s.hist[s.hist.length-1];
 $('#hud').innerHTML=`<div class="hudcard"><button class="pill cashpill2" data-act="tab" data-t="market" aria-label="Markt">${chainLogo('player',48)}<div class="hc"><b>${fmtY(s.cash)}</b><small>${esc(s.logo.name)} · Kasse</small></div><div class="hw ${last?(last.net>=0?'pos':'neg'):''}"><b>${last?sgn(last.net):'–'}</b><small>pro Woche</small></div></button><i class="hsep"></i>
 <button class="pill datepill" data-act="tab" data-t="fin" aria-label="Finanzen"><div><b>KW ${S.kw(s.week)}</b><small>${S.dateLabel(S.weekDate(s.week))}</small></div></button></div>`;
 const ev=S.seasonInfo(s.week),sa=S.saisonFor(ev);
 {const key=ev.label+'|'+st().week;if(ui.chipKey!==key){ui.chipKey=key;ui.chipOpen=true;clearTimeout(ui.chipT);ui.chipT=setTimeout(()=>{ui.chipOpen=false;const c=document.querySelector('#seasonChip .schip');c&&c.classList.add('mini');},4000);}}
 $('#seasonChip').innerHTML=`<div class="schip${ui.chipOpen?'':' mini'}" data-act="chip" role="button" aria-expanded="${!!ui.chipOpen}" title="${esc(ev.label)}"><span class="e">${ico(seasonIco(ev),18)}</span><div>${ev.label}<small>${ev.desc} · ${esc(sa.name)}</small></div></div>`;
 W&&W.setSeason(ev.key==='hanami'?'hanami':(ev.base||ev.key));
}
const TABS=[['map','map','Karte'],['stores','shop','Filialen'],null,['fin','chart','Finanzen'],['market','trophy','Markt']];
// V6 (Whitebeard-Vorabtest, Vorlage m26): Stadt-Knopf mit Flagge statt Zug/Flugzeug, Ebenen-Knopf links
const FLAG_JP='<svg class="flag" viewBox="0 0 30 20" width="27" height="18" aria-hidden="true"><rect x=".5" y=".5" width="29" height="19" rx="3" fill="#fff" stroke="#D8D2C4"/><circle cx="15" cy="10" r="5.6" fill="#BC002D"/></svg>';
function renderBar(){
 $('#bar').innerHTML=TABS.map(t=>t?`<button class="tb ${ui.tab===t[0]?'on':''}" data-act="${t[0]==='map'?'tab':'tab'}" data-t="${t[0]}"><span>${ico(t[1],24)}</span>${t[2]}</button>`:`<button id="endWeek" data-act="endweek"><span class="ew">Woche beenden <i>▸</i></span><small>weiter zu KW ${S.kw(st().week+1)}</small></button>`).join('');
 $('#cityBar').innerHTML=`${MM.button()}<button class="cbtn" data-act="layers" title="Ebenen" aria-label="Kartenebenen">${ico('layers',22)}</button><div class="citypill"><button data-act="plane" data-ico="flag" title="Reisen" aria-label="Reisen">${FLAG_JP}</button><b>${CITY.name}</b></div><button class="cbtn" data-act="menu" title="Menü" aria-label="Menü">${ico('menu',22)}</button>`;
}
function renderAll(){NK.sync(st());renderHUD();renderBar();renderPanel();W&&W.syncStores(st().stores,st().logo,st().week);}

/* ---------- Panels ---------- */
function renderFZ(){let el=$('#fz');if(!el){el=document.createElement('div');el.id='fz';document.body.appendChild(el);}const y=el.scrollTop;el.innerHTML=FZ.render();el.scrollTop=y;document.body.classList.add('fzopen');}
function renderPanel(){
 document.body.classList.toggle('fzopen',ui.tab==='fin'&&FZ.ON&&!ui.finK);
 const open=ui.tab!=='map';document.body.classList.toggle('panel',open);if(!open)return;
 const b=$('#panelBody');
 if(ui.tab==='stores')b.innerHTML=tabStores();
 else if(ui.tab==='fin'&&FZ.ON&&!ui.finK){document.body.classList.remove('panel');renderFZ();return;}
 else if(ui.tab==='fin'){b.innerHTML=tabFin();requestAnimationFrame(drawFinChart);}
 else if(ui.tab==='market'){b.innerHTML=tabMarket();requestAnimationFrame(drawDonut);}
}
function tabStores(){
 const ms=S.mine();let h=`<div class="h1">Deine Filialen</div><div style="color:var(--mut);font-weight:700;font-size:13px;margin:0 2px 8px">${ladenN(ms.length)} in ${CITY.name}</div>`;
 if(!ms.length)return h+`<div class="card empty"><div style="font-size:52px">🏪</div><h3 style="margin:8px 0 6px">Noch keine Konbini</h3><p style="color:var(--mut);margin:0 0 14px;line-height:1.5;font-weight:600">Tippe auf der Karte auf einen <b>空き</b>-Pin „Zu vermieten“.</p><button class="btn primary" data-act="tab" data-t="map">Zur Karte</button></div>`;
 for(const s of ms){const l=s.last,m=s.mgr,t=D.TIERS[s.tier];
  h+=`<button class="card storecard" data-act="store" data-id="${s.id}"><div class="row">${chainLogo('player',40)}<div class="grow"><b style="font-size:16px">${S.storeLabel(s)}</b><div class="chips" style="margin-top:4px"><span class="chip"><img src="grafik/karte/${t.badge}.svg" width="14" height="16" alt=""> ${t.label}</span>${s.build?'<span class="chip">🚧 Bald eröffnet</span>':GH(s.bh.overall,14)}${!s.mgr&&s.quit?'<span class="chip badge-fehlt">⚠️ Filialleitung fehlt</span>':''}${s.mgr&&s.mgr.kuendigt?`<span class="chip badge-fehlt">⚠️ Gekündigt · KW ${S.kw(s.mgr.kuendigt.zum-1)}</span>`:''}${l&&!l.building&&l.op<0?'<span class="chip badge-fehlt minuswarn" title="Umsatz ist da, aber die Kosten sind höher (R44)">🔻 Rote Zahlen</span>':''}${s.von?`<span class="chip">🤝 ex ${esc((D.CHAINS[s.von]||{name:s.von}).name)}</span>`:''}</div></div><span style="color:var(--mut);font-size:24px">›</span></div>
  <div class="row" style="margin-top:9px;font-size:12.5px;font-weight:700;color:var(--mut)"><span style="font-size:20px">${m?m.avatar:'🧑'}</span><span class="grow">${m?esc(m.name):'Kein Filialleiter'}</span></div>
  <div class="stats3"><div>Kunden/Tag<b>${l&&!l.building?fmtN(l.cust/7):'–'}</b></div><div>Umsatz<b>${l&&!l.building?fmtY(l.rev):'–'}</b></div><div>Gewinn<b class="${l?(l.net>=0?'pos':'neg'):''}">${l?sgn(l.net):'neu'}</b></div></div></button>`;}
 const aw=S.awayStores(st()).filter(a=>a.n>0);// V7 (R47): Läden in anderen Städten / übernommene ohne Kartenplatz sichtbar
 if(aw.length)h+=`<div class="lbl">Andere Städte</div><div class="card awaycard" style="padding:4px 14px">${aw.map(a=>{const nm=(TRAVEL.find(c=>c.id===a.city)||{name:a.city===S.WEITERE?'Weitere Städte (übernommen)':a.city}).name;return `<div class="srow"><div class="grow"><b>📍 ${esc(nm)}</b><div style="color:var(--mut);font-size:11px;font-weight:600">${ladenN(a.n)}</div></div><b class="${a.op>=0?'pos':'neg'}" style="font-size:13px">${sgn(a.op)}</b></div>`}).join('')}</div>`;
 return h+`<button class="btn full" data-act="tab" data-t="map">＋ Neuen Standort auf der Karte wählen</button>`;
}
function tabFin(){
 const s=st(),r=s.lastReport,T=r&&r.T,book=sum(S.mine().map(S.bookValue)),dep=sum(S.mine().map(x=>x.deposit||0));
 let h=`${FZ.ON?'<button class="btn ghost" data-act="finmenu" style="margin-bottom:8px">◀ Finanzmenü</button>':''}<div class="h1">Finanzen</div><div class="kpis" style="margin-top:10px">
 <div class="kpi"><small>Kasse</small><b>${fmtY(s.cash)}</b></div><div class="kpi"><small>Nettoeinkommen letzte Woche</small><b class="${T?(T.net>=0?'pos':'neg'):''}">${T?sgn(T.net):'–'}</b></div>
 <div class="kpi"><small>Umsatz gesamt</small><b>${fmtY(s.cum.rev)}</b></div><div class="kpi"><small>Bankkredit</small><b>${fmtY(S.loanSum())}</b></div></div>
 <div class="h">Umsatz & Nettoeinkommen pro Woche</div><div class="card"><canvas id="finChart" style="height:180px"></canvas></div>
 <div class="h">Spielregeln</div><div class="card"><div class="row"><div class="grow"><b>Lebensmittelsteuer 1 % (04/2027–03/2029)</b><div style="font-size:12px;color:var(--mut);font-weight:600;line-height:1.4">Annahme, nicht real beschlossen. Ein: 1 % statt 8 % auf Lebensmittel in diesem Zeitraum.</div></div><button class="tgl ${s.taxCut!==false?'on':''}" data-act="taxcut" aria-label="Steuersenkung ein/aus"><i></i></button></div></div>`;
 if(T)h+=`<div class="h">Gewinn- und Verlustrechnung · KW ${S.kw(r.week)}</div><div class="card"><table class="fin">
 <tr><td>Heiße Getränke & Speisen</td><td>${fmtY(T.heiss)}</td></tr><tr><td>Kalte Getränke</td><td>${fmtY(T.kalt)}</td></tr><tr><td>Essen</td><td>${fmtY(T.essen)}</td></tr><tr><td>Sonstiges</td><td>${fmtY(T.sonst)}</td></tr><tr><td>Services (Provisionen)</td><td>${fmtY(T.fees)}</td></tr>
 <tr class="sum"><td>Umsatz</td><td>${fmtY(T.rev+T.fees)}</td></tr>
 <tr class="sub"><td>Wareneinsatz</td><td>${fmtY(-T.cogs)}</td></tr>
 <tr class="sub"><td>Miete</td><td>${fmtY(-T.rent)}</td></tr><tr class="sub"><td>Ladenteam (plant die Filialleitung)</td><td>${fmtY(-T.wages)}</td></tr><tr class="sub"><td>Filialleiter</td><td>${fmtY(-T.salary)}</td></tr><tr class="sub"><td>Strom</td><td>${fmtY(-T.power)}</td></tr><tr class="sub"><td>Marketing</td><td>${fmtY(-T.mkt)}</td></tr><tr class="sub"><td>Verwaltung & Verträge</td><td>${fmtY(-T.admin-T.svcFixed)}</td></tr><tr class="sub"><td>Abschreibung Anlagen</td><td>${fmtY(-T.dep)}</td></tr><tr class="sub"><td>Anlagensteuer</td><td>${fmtY(-T.assetTax)}</td></tr>
 <tr><td>Betriebsergebnis</td><td>${sgn(T.ebit)}</td></tr><tr class="sub"><td>Zinsen (4,5 %)</td><td>${fmtY(-T.interest)}</td></tr><tr class="sub"><td>Körperschaftsteuer</td><td>${fmtY(-T.tax)}</td></tr>
 <tr class="sum"><td>Nettoeinkommen</td><td class="${T.net>=0?'pos':'neg'}">${sgn(T.net)}</td></tr></table></div>
 <div class="h">Cashflow · KW ${S.kw(r.week)}</div><div class="card"><table class="fin"><tr><td>Aus Geschäftstätigkeit</td><td>${sgn(T.cf.op)}</td></tr><tr><td>Aus Investition</td><td>${sgn(T.cf.inv)}</td></tr><tr><td>Aus Finanzierung</td><td>${sgn(T.cf.fin)}</td></tr></table></div>`;
 h+=`<div class="h">Bilanz</div><div class="card"><table class="fin"><tr><td>Kasse</td><td>${fmtY(s.cash)}</td></tr><tr><td>Kautionen</td><td>${fmtY(dep)}</td></tr><tr><td>Anlagen (Buchwert)</td><td>${fmtY(book)}</td></tr><tr><td>Kredite</td><td>${fmtY(-S.loanSum())}</td></tr><tr class="sum"><td>Eigenkapital</td><td>${fmtY(S.equity())}</td></tr></table></div>
 <div class="h">Bankkredit</div><div class="card"><div class="bar"><i style="width:${Math.min(100,S.loanSum()/D.LOAN.max*100)}%"></i></div>
 <p style="color:var(--mut);font-size:12.5px;margin:9px 2px;font-weight:600;line-height:1.5">4,5 % Zinsen, 10 Jahre Laufzeit, Annuität ${fmtY(S.loanPayW())}/Woche. Rahmen bis ¥48 Mio. ${S.loanAvailable()?'Sondertilgung jederzeit gebührenfrei.':`Die Bank will 6 Monate Zahlen sehen: Kredit ab KW ${S.kw(D.LOAN.fromWeek)}.`}</p>
 <div class="row" style="gap:8px"><button class="btn grow sm" data-act="loan" data-v="5">＋ ¥5 Mio</button><button class="btn grow sm" data-act="loan" data-v="10">＋ ¥10 Mio</button><button class="btn grow sm" data-act="loan" data-v="-5" ${s.loan<=0?'disabled':''}>Tilgen ¥5 Mio</button></div></div>`;
 return h;
}
// Whitebeard 8efc3e2: Marktanteil von Anfang an – ohne Umsatzwoche in dieser Stadt (KW 1, nach Stadtwechsel) oder wenn eine Kette mit offenen Läden
// im letzten Bericht noch fehlt, zählen die offenen Läden; ganz ohne Läden: kein Markt (neutraler Ring statt bunter Platzhalter)
function marktAnteile(s){const r=s.lastReport,ch=['player',...D.RIVALS],offen=c=>s.stores.filter(x=>x.chain===c&&!x.building&&!(x.build>0)).length,n=ch.reduce((a,c)=>a+offen(c),0);
 if(!n)return null;
 if(r&&r.share&&ch.every(c=>!offen(c)||(r.share[c]||0)>0))return {art:'umsatz',v:Object.fromEntries(ch.map(c=>[c,r.share[c]||0]))};
 return {art:'laeden',v:Object.fromEntries(ch.map(c=>[c,offen(c)/n]))};}
function tabMarket(){
 const s=st(),M=marktAnteile(s),cnt=c=>s.stores.filter(x=>x.chain===c).length;
 let h=`<div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" data-act="savegame">💾 Speichern · Slot ${s.slot||1}</button><button class="btn" data-act="newgame" style="margin-left:8px">Hauptmenü</button></div>${BU.menuKnopf(s)}<div class="h1">Markt & Marke</div><div class="card" style="margin-top:10px"><div class="row" style="align-items:center"><canvas id="donut" style="width:138px;height:138px;flex:none"></canvas><div class="grow">`;
 for(const c of ['player',...D.RIVALS])h+=`<div class="row" style="padding:4px 0;gap:9px">${chainLogo(c,28)}<div class="grow" style="font-size:13px;font-weight:800">${esc(cname(c))}<div style="color:var(--mut);font-size:11px;font-weight:700">${filN(cnt(c))}</div></div><b>${M?pct(M.v[c]||0):'–'}</b></div>`;
 h+=M?(M.art==='laeden'?'<div class="mkhint" style="color:var(--mut);font-size:11px;font-weight:700;margin-top:4px">Anteil nach offenen Läden – nach der ersten Woche zählt der Umsatz</div>':''):'<div class="mkhint" style="color:var(--mut);font-size:11px;font-weight:700;margin-top:4px">Noch kein Markt – hier hat noch keine Kette einen Laden</div>';
 h+=`</div></div></div><div class="h">Deine Marke</div><div class="card"><div class="row">${chainLogo('player',64)}<div class="grow"><b style="font-size:17px">${esc(s.logo.name)}</b><div style="margin:8px 0 4px;font-size:12px;color:var(--mut);font-weight:700">Ruf ${Math.round(s.rep)}/100</div><div class="bar g"><i style="width:${s.rep}%"></i></div></div></div>
 <button class="btn full sm" style="margin-top:12px" data-act="editlogo">🎨 Logo & Namen bearbeiten</button></div>
 <div class="h">Konkurrenz-News</div><div class="card">${s.news.length?s.news.slice(0,6).map(n=>`<div class="news">${chainLogo(n.chain,28)}<div class="grow">${n.text}<div style="color:var(--mut);font-size:11px">KW ${S.kw(n.week)}</div></div></div>`).join(''):'<div style="color:var(--mut);font-weight:700;font-size:13px">Noch keine Meldungen.</div>'}</div>

 <div class="h">Städte</div><div class="cities">${cityCards()}
 <div class="city"><span class="jp">大阪</span><b>🏯 Osaka</b><small>🚄 Hbf Tokio: kommt bald</small></div>
 <div class="city"><span class="jp">京都</span><b>⛩️ Kyōto</b><small>✈️ Haneda: kommt bald</small></div></div>
 <div style="text-align:center;margin:20px 0 0"><button class="btn ghost" data-act="newgame">Neues Spiel starten</button></div>`;
 return h;
}
/* ---------- Immobilie & Shop bauen ---------- */
let pvMode='outside';
function mountPreview(b){const pv=$('#pv');if(!pv)return;requestAnimationFrame(()=>{previewMode(pvMode);storePreview(pv,'player',st().logo,designOf(b));pv.appendChild(pv.querySelector('.pvt'));});}
const pvToggle=`<div class="pvt"><button class="PVI" data-act="pvmode" data-v="inside">Innen</button><button class="PVO" data-act="pvmode" data-v="outside">Außen</button></div>`;
function propertySheet(did,slot){
 const s=st(),d=D.DMAP[did];if(slot==null)slot=S.freeSlots(did)[0];if(slot==null||!D.slotOpen(did,slot,s.week))return;if(((s.fz&&s.fz.sperre)||[]).some(x=>x.d===did&&x.slot===slot&&x.bis>s.week)){toast('Standort nach Liquidation noch gesperrt 🚧');return;}
 const info=si(did,slot);ui.draft={did,slot,b:D.defaultBuild()};
 const p=W.slotPos(did,slot);W.select(p.x,p.z);W.flyTo(p.x,p.z,72);
 const riv={};S.inD(did).filter(x=>x.chain!=='player').forEach(x=>riv[x.chain]=(riv[x.chain]||0)+1);
 showSheet(`<div class="sh-title"><span class="lbadge"><img src="grafik/karte/${info.tier.badge}.svg" alt=""></span><div class="grow"><b>IMMOBILIE ZU VERMIETEN</b><small>${esc(info.address)}</small></div><button class="x" style="position:static" data-act="close">✕</button></div>
 <div class="preview" id="pv">${pvToggle}</div>
 <div class="chips" style="margin:8px 0"><span class="chip">空き店舗 · Zu vermieten</span><span class="chip" style="background:${info.tier.color}33"><img src="grafik/karte/${info.tier.badge}.svg" width="14" height="16" alt=""> ${info.tier.label}</span><span class="chip">${D.TYPES[d.type].icon} ${d.name} ${d.jp}</span></div>
 <div class="stats3"><div>Wöchentliche Miete<b>${fmtY(info.rentW)}</b><small>pro Woche</small></div><div>Kaution<b>${fmtY(info.deposit)}</b><small>im Voraus</small></div><div>Fußgänger<b>${fmtN(info.pass)}</b><small>pro Woche</small></div></div>
 <div class="lbl">Konkurrenz vor Ort</div><div class="chips">${Object.keys(riv).length?Object.entries(riv).map(([c,n])=>`<span class="chip" style="padding:3px 10px 3px 3px">${chainLogo(c,24)} ${D.CHAINS[c].name}${n>1?' ×'+n:''}</span>`).join(''):'<span style="color:var(--mut);font-size:13px;font-weight:700">Keine. Freie Bahn!</span>'}</div>
 <div style="margin-top:14px"><button class="btn primary full" data-act="tobuild">Shop bauen</button><div style="height:8px"></div><button class="btn full" data-act="region">Karte der Region</button></div>`);
 mountPreview(ui.draft.b);syncPv();tut('miete');
}
function syncPv(){document.querySelectorAll('.pvt button').forEach(b=>b.classList.toggle('on',(b.classList.contains('PVI')?'inside':'outside')===pvMode));}
function optImg(k,i,b,big){
 const O=D.BUILD[k].opts[i],look=chainLook('player',st().logo,{facade:'brand'});
 if(O&&O.gfx&&GFX.svg[O.gfx]&&(k==='fac'||k==='inn')){return `<img src="${svgURL(svgColored(O.gfx,{main:look.main,second:look.second,name:look.name}))}" alt="">`;}
 const g=D.BUILD[k].gfx;return g?`<img src="grafik/geraete/${g}.svg" alt="" onerror="this.style.display='none'">`:'';
}
const EQ_LABEL=k=>D.BUILD[k].label;
function summaryRows(b){
 const B=D.BUILD,rows=[];for(const k of ['fac','inn',...D.EQUIP_KEYS]){const i=b[k];if(i==null||i<0)continue;const o=B[k].opts[i],n=o.n||1;rows.push([`${B[k].label}: ${o.name}${n>1?' ×'+n:''}`,D.optPrice(k,i)]);}
 return rows;
}
function builderSheet(){
 const dr=ui.draft,b=dr.b,info=si(dr.did,dr.slot),parts=S.openCostParts(dr.did,dr.slot,b),total=parts.bau+parts.deposit+parts.ware,cash=st().cash;
 const ext=D.optPrice('fac',b.fac),inn=D.optPrice('inn',b.inn);
 const eq=D.EQUIP_KEYS.map(k=>{const i=b[k],o=i>=0?D.BUILD[k].opts[i]:null;return `<button class="eqb ${o?'on':''}" data-act="pick" data-k="${k}"><div class="eqi">${optImg(k,Math.max(0,i),b)}</div><b>${EQ_LABEL(k)}${D.BUILD[k].must?' *':''}</b><small>${o?esc(o.name):'nicht eingebaut'}</small><span class="pr">${o?fmtY(D.optPrice(k,i)):'–'}</span></button>`}).join('');
 showSheet(`<div class="sh-title"><div class="grow"><b>SHOP BAUEN</b><small>${esc(info.address)}</small></div><button class="x" style="position:static" data-act="back">‹</button></div>
 <div class="preview" id="pv">${pvToggle}</div>
 <div class="two"><button class="bcard" data-act="pick" data-k="fac"><small>AUSSENBEREICH</small><div class="bi">${optImg('fac',b.fac,b)}</div><b>${D.BUILD.fac.opts[b.fac].name}</b><span class="pr">${fmtY(ext)}</span></button>
 <button class="bcard" data-act="pick" data-k="inn"><small>INNENBEREICH</small><div class="bi">${optImg('inn',b.inn,b)}</div><b>${D.BUILD.inn.opts[b.inn].name}</b><span class="pr">${fmtY(inn)}</span></button></div>
 <div class="lbl">Ausstattung <em>* Pflicht</em></div><div class="eqg">${eq}</div>
 <div class="lbl">Kostenzusammenfassung</div><div class="card"><table class="fin">${summaryRows(b).map(([a,v])=>`<tr class="sub"><td>${esc(a)}</td><td>${fmtY(v)}</td></tr>`).join('')}
 <tr><td>Kaution (${info.tier.depM} Monatsmieten, kommt zurück)</td><td>${fmtY(parts.deposit)}</td></tr><tr><td>Erstbestückung Ware</td><td>${fmtY(parts.ware)}</td></tr>
 <tr class="sum"><td>Gesamt</td><td>${fmtY(total)}</td></tr><tr class="sub"><td>Verfügbar</td><td class="${cash>=total?'pos':'neg'}">${fmtY(cash)}</td></tr></table></div>
 <div style="margin-top:12px"><button class="btn primary full" data-act="dobuild" ${cash<total?'disabled':''}>Bau beginnen</button>${cash<total?`<p style="color:var(--mut);font-size:12.5px;text-align:center;margin:8px 0 0;font-weight:700">Dir fehlen ${fmtY(total-cash)}. Wähle günstigere Modelle${S.loanAvailable()?' oder nimm einen Kredit (Finanzen).':'.'}</p>`:''}</div>`);
 mountPreview(b);syncPv();tut('bauen');
}
function pickSheet(k,target){
 ui.pickTarget=target;const B=D.BUILD[k],cur=target==='draft'?ui.draft.b[k]:st().stores.find(x=>x.id===target).b[k];
 const opts=B.opts.map((o,i)=>[o,i]);if(!B.must&&k!=='fac'&&k!=='inn')opts.unshift([{name:'Nicht einbauen',desc:'Spart Geld, bringt aber nichts.',price:0,n:1,q:0,prod:0},-1]);
 const cards=opts.map(([o,i])=>{const pr=i<0?0:o.price*(o.n||1);const sel=cur===i;
  return `<div class="pcard ${sel?'sel':''}"><div class="pi">${i<0?'<span style="font-size:60px">🚫</span>':optImg(k,i)}</div><b>${esc(o.name)}</b><div class="pd">${esc(o.desc||'')}</div>
  ${i>=0?`<div class="ps"><span>Qualität</span>${starsN(Math.round(o.q||3))}</div>${o.prod!=null?`<div class="ps"><span>Produktivität</span>${starsN(Math.round(o.prod))}</div>`:''}`:''}
  <div class="pp"><b>${i<0?'¥0':fmtY(pr)}</b>${(o.n||1)>1?`<small>${o.n} × ${fmtY(o.price)}</small>`:''}</div>
  <button class="btn ${sel?'':'primary'} full sm" data-act="pickopt" data-k="${k}" data-v="${i}">${sel?'✓ Gewählt':'Auswählen'}</button></div>`}).join('');
 $('#pick').innerHTML=`<div class="pbox"><div class="row" style="padding:6px 4px 10px"><b class="grow" style="font-size:16px;letter-spacing:.5px">${B.label.toUpperCase()}</b><button class="x" style="position:static" data-act="pickclose">✕</button></div>
 <div class="track" id="trk">${cards}</div><div class="dots" id="dots">${opts.map((_,j)=>`<i class="${j===0?'on':''}"></i>`).join('')}</div></div>`;
 $('#pick').classList.add('show');
 const trk=$('#trk');const idx=Math.max(0,opts.findIndex(([o,i])=>i===cur));
 requestAnimationFrame(()=>{const c=trk.children[idx];if(c)trk.scrollLeft=c.offsetLeft-(trk.clientWidth-c.clientWidth)/2;});
 trk.addEventListener('scroll',()=>{const mid=trk.scrollLeft+trk.clientWidth/2;let best=0,bd=1e9;[...trk.children].forEach((c,j)=>{const dd=Math.abs(c.offsetLeft+c.clientWidth/2-mid);if(dd<bd){bd=dd;best=j}});[...$('#dots').children].forEach((d,j)=>d.classList.toggle('on',j===best));},{passive:true});
}
function closePick(){$('#pick').classList.remove('show');}
function doBuild(){
 const dr=ui.draft,r=S.buildNew(dr.did,dr.slot,dr.b);if(r.err){toast(r.err);return}
 ui.draft=null;W.syncStores(st().stores,st().logo,st().week);renderAll();toast(`🚧 Bau gestartet: ${esc(st().logo.name)} ${D.DMAP[r.store.d].name}`);
 ui.storeTab='service';openStoreSheet(r.store.id);tut('bauphase');
}

/* ---------- Filiale (Service · Produkt · Marketing · Finanzen) ---------- */
function openStoreSheet(id){
 const s=st().stores.find(x=>x.id===id);if(!s)return;ui.storeId=id;
 const p=W.slotPos(s.d,s.slot);W.select(p.x,p.z);
 const T=ui.storeTab,info=si(s.d,s.slot);
 const tabs=[['service','👥','Service'],['product','🥤','Produkt'],['mkt','📣','Marketing'],['fin','💹','Finanzen']];
 let body=T==='service'?storeService(s):T==='product'?storeProduct(s):T==='mkt'?storeMarketing(s):storeFin(s);
 const keep=$('#sheet').scrollTop,same=$('#sheet').dataset.sid==id&&sheetOpen()&&$('#sheet').dataset.tab===T;
 const open=s.opened-st().week;
 showSheet(`<div class="sh-title">${chainLogo('player',44)}<div class="grow"><b>${S.storeLabel(s)}</b><small>${esc(info.address)}</small></div><button class="x" style="position:static" data-act="close">✕</button></div>
 ${s.build?`<div class="soon"><img src="${GFX.svg.ban_soon?svgURL(GFX.svg.ban_soon):''}" alt=""><div><b>Eröffnungstag: KW ${S.kw(s.opened)} · ${S.dateLabel(S.weekDate(s.opened))}</b><small>In ein paar Wochen fertig (noch ${s.build} ${s.build>1?'Wochen':'Woche'}).</small></div></div>`:''}
 ${s.last&&!s.last.building&&s.last.op<0?`<div class="tip bad minuswarn">🔻 <span><b>Rote Zahlen:</b> ${fmtY(s.last.rev)} Umsatz, aber ${sgn(s.last.op)} Ergebnis letzte Woche. Miete, Personal oder ein eigener/fremder Laden in der Nähe drücken den Gewinn.</span></div>`:''}
 <div class="preview short" id="pv">${pvToggle}</div>
 <div class="tabs4">${tabs.map(([k,e,l])=>`<button class="${T===k?'on':''}" data-act="stab" data-v="${k}"><span>${e}</span>${l}</button>`).join('')}</div>${body}`);
 $('#sheet').dataset.sid=id;$('#sheet').dataset.tab=T;if(same)$('#sheet').scrollTop=keep;
 syncPv();
 const pv=$('#pv');requestAnimationFrame(()=>{previewMode(pvMode);storePreview(pv,'player',st().logo,S.designOf(s));pv.appendChild(pv.querySelector('.pvt'));});
 if(T==='service')tut(!st().tut.personal?'personal':(!s.build?'buuhuu':'personal'));else if(T==='product')tut('sortiment');else if(T==='mkt')tut('marketing');
}
function storeService(s){
 const bh=s.bh,m=s.mgr,l=s.last;
 let h=`<div class="card bhc"><div class="row" style="gap:10px"><img src="grafik/bewertung/buuhuu-logo.svg" width="36" height="36" alt=""><div class="grow"><b style="font-size:16px">BuuHuu! Bewertungen</b><small style="display:block;color:var(--mut);font-weight:700;font-size:11.5px">Mehr Geister = mehr Laufkundschaft (±15 % je Geist)</small></div></div>`;
 if(s.build)h+=`<p style="color:var(--mut);font-weight:700;font-size:13px">Noch keine Bewertungen: Der Laden ist noch nicht eröffnet.</p></div>`;
 else{h+=`<div class="bhall">${GH(bh.overall,30)}<b>${bh.overall.toLocaleString('de-DE',{minimumFractionDigits:1})}</b></div>
  ${D.BH_CATS.map(c=>`<div class="bhr"><span>${c.label}</span>${GH(bh[c.id],18)}</div>`).join('')}
  <div class="quote">„${esc(S.quote(s)||'Noch keine Stimmen.')}“<small>– anonymer BuuHuu-Nutzer</small></div></div>`;}
 h+=`<div class="h">Filialleiter</div>`;
 if(m&&m.vertretung&&s.quit)h+=`<div class="card quitcard"><b>⚠️ Filialleitung fehlt</b><div style="font-size:13px;font-weight:700">${esc(s.quit.name)} hat in KW ${S.kw(s.quit.week)} gekündigt${s.quit.grund?` (${esc(s.quit.grund)})`:''}.</div><button class="btn primary full sm" style="margin-top:8px" data-act="hirelist" data-id="${s.id}">👔 Neue Filialleitung einstellen</button></div>`;
 if(!m){h+=`<div class="card"><div class="row"><div class="ava">🧑</div><div class="grow"><b>Keine Filialleitung</b><small style="display:block;color:var(--mut);font-weight:700;font-size:12px">Jede Filiale braucht eine Filialleitung.</small></div></div><button class="btn blue full" style="margin-top:10px" data-act="hirelist" data-id="${s.id}">Filialleiter einstellen</button></div>`;}
 else{const pc=Math.round((m.salary/m.expect-1)*100);
  h+=`<div class="card"><div class="mgr"><div class="ava big">${mgrAva(m)}</div><div class="grow"><b style="font-size:17px">${esc(m.name)}</b><div style="font-size:12px;color:var(--mut);font-weight:700">${m.age} Jahre · seit KW ${S.kw(s.opened)} · ${m.stufe}</div><div style="font-size:12px;color:var(--mut);font-weight:700">Mitarbeiter-Erfahrung ${m.empM} Mon. · Manager-Erfahrung ${m.mgrM} Mon.</div></div></div>
  <div class="skbars">${D.SKILLS.map(k=>`<div><span>${skillIco(k)}${k.label}</span>${bar100(m.skills[k.id])}<em>${Math.round(m.skills[k.id]*20)}</em></div>`).join('')}</div>
  <div class="chips" style="margin-top:8px">${m.traits.map(t=>`<span class="trait ${D.TRAITS[t].good?'':'bad'}" title="${D.TRAITS[t].desc}">${traitIco(t)} ${D.TRAITS[t].label}</span>`).join('')}</div>
  ${m.vertretung?'':`<div class="lbl">Jahresgehalt</div><div class="step"><button data-act="salary" data-id="${s.id}" data-v="-1">−</button><div><b>${fmtN(m.salary)} ¥</b><small>${pc>=0?'+':''}${pc} % vom Marktgehalt · Zufriedenheit ${Math.round(m.morale)} %</small></div><button data-act="salary" data-id="${s.id}" data-v="1">＋</button></div>`}
  ${m.vertretung?`<div class="tip bad">👔 Nur eine Vertretung (Grundwerte). Stell eine feste Filialleitung ein.</div>`:`<div style="font-size:12px;color:var(--mut);font-weight:700;margin-top:8px">${esc(m.name)} führt Team, Gehälter, Preise, Marketing und Zwischenfälle – die Werte oben zählen voll.</div>`}
  <div style="text-align:center;margin-top:12px"><button class="btn ${m.vertretung?'primary':'danger'} sm" data-act="hirelist" data-id="${s.id}">${m.vertretung?'👔 Filialleitung einstellen':'Filialleitung ersetzen'}</button>${m.vertretung?'':`<small style="display:block;color:var(--mut);font-weight:700;font-size:11px;margin-top:4px">Entlassen nur mit Nachfolge · Abfindung ${fmtY(m.salary/52*2)}</small>`}</div></div>`;}
 h+=storeServices(s,D.DMAP[s.d]);
 h+=`<div class="h">Ausstattung umbauen</div><div class="eqg">${['fac','inn',...D.EQUIP_KEYS].map(k=>{const i=s.b[k],o=i>=0?D.BUILD[k].opts[i]:null;return `<button class="eqb ${o?'on':''}" data-act="pickst" data-k="${k}" data-id="${s.id}"><div class="eqi">${optImg(k,Math.max(0,i),s.b)}</div><b>${EQ_LABEL(k)}</b><small>${o?esc(o.name):'nicht eingebaut'}</small></button>`}).join('')}</div>

 <div style="text-align:center;margin-top:10px"><button class="btn ghost sm" data-act="closestore" data-id="${s.id}">${ui.confirmClose===s.id?`Wirklich schließen? Du bekommst ${fmtY(S.bookValue(s)*.3+(s.deposit||0))} zurück`:'Filiale schließen'}</button></div>`;
 return h;
}
function hireSheet(id){
 const s=st().stores.find(x=>x.id===id);if(!ui.cands[id])ui.cands[id]=S.genCandidates(4);ui.offer=ui.offer||{};
 const cards=ui.cands[id].map(m=>{const pc=ui.offer[m.id]||0,sal=Math.round(m.expect*(1+pc/100)/10000)*10000;
  return `<div class="pcard"><div class="pi"><span style="font-size:70px">${mgrAva(m)}</span></div><b>${esc(m.name)}</b><div class="pd">${m.age} Jahre · ${m.stufe}<br>Mitarbeiter-Erfahrung ${m.empM} Mon. · Manager-Erfahrung ${m.mgrM} Mon.</div>
  <div class="skbars">${D.SKILLS.map(k=>`<div><span>${skillIco(k)}${k.label}</span>${bar100(m.skills[k.id])}<em>${Math.round(m.skills[k.id]*20)}</em></div>`).join('')}</div>
  <div class="chips">${m.traits.map(t=>`<span class="trait ${D.TRAITS[t].good?'':'bad'}">${traitIco(t)} ${D.TRAITS[t].label}</span>`).join('')}</div>
  <div class="lbl" style="margin-top:8px">Gehaltsangebot (Jahr)</div><div class="step"><button data-act="offstep" data-id="${id}" data-m="${m.id}" data-v="-1">−</button><div><b>${fmtN(sal)} ¥</b><small>${pc>=0?'+':''}${pc} %</small></div><button data-act="offstep" data-id="${id}" data-m="${m.id}" data-v="1">＋</button></div>
  <button class="btn primary full sm" style="margin-top:8px" data-act="offer" data-id="${id}" data-m="${m.id}">Angebot machen</button></div>`}).join('');
 $('#pick').innerHTML=`<div class="pbox"><div class="row" style="padding:6px 4px 10px"><b class="grow" style="font-size:16px">FILIALLEITER EINSTELLEN</b><button class="x" style="position:static" data-act="pickclose">✕</button></div><div class="track" id="trk">${cards}</div><div class="dots" id="dots">${ui.cands[id].map((_,j)=>`<i class="${j===0?'on':''}"></i>`).join('')}</div>
 <p style="text-align:center;color:var(--mut);font-size:12px;font-weight:600;margin:6px 0 0">Wer unter Marktgehalt bleibt, lehnt eventuell ab.</p></div>`;
 const keep=ui.hireScroll||0;$('#pick').classList.add('show');$('#trk').scrollLeft=keep;
 const trk=$('#trk');trk.addEventListener('scroll',()=>{ui.hireScroll=trk.scrollLeft;const mid=trk.scrollLeft+trk.clientWidth/2;let best=0,bd=1e9;[...trk.children].forEach((c,j)=>{const dd=Math.abs(c.offsetLeft+c.clientWidth/2-mid);if(dd<bd){bd=dd;best=j}});[...$('#dots').children].forEach((d,j)=>d.classList.toggle('on',j===best));},{passive:true});
}
function storeServices(s,d){
 const served=s.last&&!s.last.building?s.last.cust:D.BASE_CUST*.8,sv=S.svcStats({...s,cfg:{...s.cfg,svc:Object.fromEntries(D.SVC_KEYS.map(k=>[k,true]))}},served);
 return `<div class="h">Partnerverträge</div>`+D.SVC_KEYS.map(k=>{const v=D.SERVICES[k],on=!!s.cfg.svc[k],x=sv.per[k],labor=x.hours*D.COST.wage*(1+D.COST.lnk),net=x.fee-labor-v.monthly*12/52,since=(s.cfg.svcSince||{})[k]||0,left=v.min-(st().week-since);
  return `<div class="svc ${on?'on':''}"><div class="row">${svcIcon(v,44)}<div class="grow"><b style="font-size:15px">${v.label}</b><div class="row" style="gap:6px;margin-top:2px;font-size:12px;font-weight:700;color:var(--mut)">${v.plogo&&(v.plogo!=='shironeko'||has('partner_shironeko'))?`<img src="${{shironeko:'grafik/logos/shironeko-express.svg',futatsuboshi:'grafik/logos/firmen/futatsuboshi-bank.svg'}[v.plogo]}" width="20" height="20" style="border-radius:6px" alt="" onerror="this.remove()">`:''}${v.partner}</div></div>${on?'<span class="chip" style="background:#DDF3E3;color:#2E7D46">✓ aktiv</span>':''}</div>
  <div class="terms"><div>Provision<b>¥${v.commission}/Vorgang</b></div><div>Vorgänge<b>~${fmtN(x.tx)}/Wo.</b></div><div>Kundenbonus<b>+${Math.round(v.bonus*100)} %</b></div><div>Saldo/Woche<b class="${net>=0?'pos':'neg'}">${sgn(net)}</b></div></div>
  <div style="font-size:12px;color:var(--mut);font-weight:600;line-height:1.4;margin-bottom:9px">${v.pitch} ${[v.sign?`Freischaltung ${fmtY(v.sign)}`:'',v.monthly?`${fmtY(v.monthly)}/Monat`:'',`Mindestlaufzeit ${v.min} Wochen`].filter(Boolean).join(', ')}.</div>
  ${on?(ui.svcAsk===s.id+':'+k&&left>0?`<div class="tip bad svcask">Vorzeitig kündigen? Mindestlaufzeit noch ${left} Wo. – Vertragsstrafe <b>${fmtY(S.SVC_STRAFE)}</b>.</div><div class="row" style="gap:8px"><button class="btn sm grow" data-act="svcno" data-id="${s.id}">Abbrechen</button><button class="btn danger sm grow" data-act="svc" data-id="${s.id}" data-k="${k}" data-v="0" data-ok="1">Kündigen (−${fmtY(S.SVC_STRAFE)})</button></div>`:`<button class="btn sm full" data-act="svc" data-id="${s.id}" data-k="${k}" data-v="0">Kündigen${left>0?` (Strafe ${fmtY(S.SVC_STRAFE)})`:''}</button>`):`<button class="btn blue sm full" data-act="svc" data-id="${s.id}" data-k="${k}" data-v="1" ${st().cash<v.sign?'disabled':''}>Vertrag mit ${v.partner}${v.sign?` · ${fmtY(v.sign)}`:''}</button>`}</div>`}).join('');
}
function storeProduct(s){
 const g=ui.pgroup||'heiss',ev=S.seasonInfo(st().week),sa=S.saisonFor(ev),l=s.last,PR=SO.K.ON?SO.produkte(st()).filter(p=>groupOf[p.cat]===g):[],cats=D.CATS.filter(k=>groupOf[k.id]===g&&!(!SO.offen(st(),k.id)&&PR.some(p=>p.cat===k.id)));
 // V6 Einzelprodukte: jedes Vertrags-/Eigen-/Messe-/Geräteprodukt als eigene Karte, ohne Gerät grau „wartet auf Gerät“
 const QL={vertrag:'Markenvertrag',messe:'Messe-Exklusiv',eigen:'Eigenmarke',geraet:'Geräteware',rivale:'Übernommen'};
 const pcards=PR.map(p=>{const ok=SO.devOk(s,p.dev),x=l&&l.prod&&l.prod[p.id],mg=p.vk?Math.max(0,1-p.ek/p.vk):0,v=(st().fz&&st().fz.vertraege||{})[p.vertrag],end=v&&v.ende?new Date(v.ende):null;
  return `<div class="prod einzel ${ok?'':'off wartet'}" data-pid="${esc(p.id)}"><div class="pimg">${catIcon(D.CATS.find(k=>k.id===p.cat)||D.CATS[0],84)}</div><b class="pn">${esc(p.name)}</b><small class="ps2">${ok?esc(QL[p.quelle]||'')+(p.exkl?' · exklusiv':'')+(end?` · bis ${end.getDate()}.${end.getMonth()+1}.${end.getFullYear()}`:''):`⏳ wartet auf Gerät: ${esc(SO.devText(SO.devFehlt(s,p.dev)))}`}</small>
  <div class="prow"><span>${ok?'Im Regal':'Verkauft nichts'}</span><div class="lw"><small>Umsatz letzte Woche</small><b>${x&&x.rev?fmtY(x.rev):'0'}</b></div></div>
  <div class="prow"><div class="donut" style="--p:${Math.round(mg*100)}"><b>Marge<br>${Math.round(mg*100)} %</b></div><div class="grow"><small class="cost">Einkauf ${Math.round(p.ek)} ¥</small><div><b>${Math.round(p.vk)} ¥</b></div></div></div></div>`;}).join('');
 const cards=cats.map(k=>{
  const lock=!SO.offen(st(),k.id),na=lock||S.seasonFactor(k,ev)<=0||(k.id==='coffee'&&s.b.coffee<0)||(k.id==='oden'&&s.b.oden<0),on=s.cfg.cats[k.id]&&!na;
  const so=SO.ensure(st()),an=so.alle?null:SO.arts(st(),k.id).map(a=>a.name),artTxt=an?(an.length>2?an.slice(0,2).join(', ')+' +'+(an.length-2):an.join(', ')):null;
  const pxm=(s.cfg.px&&s.cfg.px[k.id])||1,pp=SO.preis(st(),k),base=k.id==='saison'?sa.price:pp?pp.price:k.price,cr=k.id==='saison'?sa.cost:pp?pp.cost:k.cost,price=Math.round(base*pxm),unit=Math.round(base*cr),mg=Math.max(0,1-unit/price);
  const sub=lock?'🔒 per Markenverhandlung freischalten':na?(k.id==='coffee'?'Keine Kaffeemaschine':k.id==='oden'?'Kein Oden-Topf':'Jetzt nicht im Angebot'):(k.id==='saison'?esc(sa.name):artTxt!=null?esc(artTxt):(k.items?k.items.length+' Artikel':''));
  return `<div class="prod ${on?'':'off'}"><div class="pimg">${catIcon(k,84)}</div><b class="pn">${an&&an.length===1&&k.id==="drinks"?esc(an[0]):k.name}</b><small class="ps2">${sub}</small>
  <div class="prow"><button class="tgl ${on?'on':''}" data-act="cat" data-id="${s.id}" data-k="${k.id}" ${na?'disabled':''}><i></i></button><span>Im Menü</span><div class="lw"><small>Umsatz letzte Woche</small><b>${l&&l.cats&&l.cats[k.id]?fmtY(l.cats[k.id]):'0'}</b></div></div>
  <div class="prow"><div class="donut" style="--p:${Math.round(mg*100)}"><b>Marge<br>${Math.round(mg*100)} %</b></div><div class="grow"><small class="cost">Stückkosten ${unit} ¥</small><div class="step sm"><button data-act="px" data-id="${s.id}" data-k="${k.id}" data-v="-1">−</button><div><b>${price} ¥</b></div><button data-act="px" data-id="${s.id}" data-k="${k.id}" data-v="1">＋</button></div></div></div></div>`}).join('');
 const dg=s.mgr&&!s.mgr.vertretung;
 return `<div class="gtabs">${GROUPS.map(([k,l])=>`<button class="${g===k?'on':''}" data-act="pgroup" data-v="${k}">${l}</button>`).join('')}</div>
 ${dg?`<div class="tip ok">👔 ${esc(s.mgr.name)} kümmert sich um Sortiment und Preise. Du kannst trotzdem eingreifen.</div>`:''}
 <div class="ptrack">${cards}${pcards}</div>`;
}
function storeMarketing(s){
 const ev=S.seasonInfo(st().week);
 return `<p style="color:var(--mut);font-size:13px;line-height:1.5;margin:8px 2px;font-weight:600">Tippe auf eine Kampagne, um sie zu starten oder zu beenden. Kosten laufen pro Woche oder einmalig.</p>
 <div class="mgrid">${D.CAMPAIGNS.filter(c=>!c.hidden).map(c=>{const on=!!s.cfg.camps[c.id];const cost=c.weekly?`${fmtY(c.weekly)} / Woche`:c.revPct?`${(c.revPct*100).toLocaleString('de-DE')} % vom Umsatz`:`${fmtY(c.once)} einmalig`;
  return `<button class="mc ${on?'on':''}" data-act="camp" data-id="${s.id}" data-k="${c.id}"><div class="mi"><img src="grafik/icons/marketing/${c.icon}.svg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'📣',style:'font-size:46px'}))"></div><b>${c.name}</b><span class="ms2">${on?'● Läuft'+(c.dur?` (noch ${s.cfg.camps[c.id].left} Wo.)`:''):'Aus'}</span><small>${cost}</small><small class="eff">${c.cust?'+'+Math.round(c.cust*100)+' % Kunden':''}${c.desc?' · '+esc(c.desc):''}</small></button>`}).join('')}</div>`;
}
function storeFin(s){
 const a=s.last,b=s.prev;
 if(!a||a.building)return `<div class="tip">Die Gewinn- und Verlustrechnung erscheint nach der ersten vollen Woche. In der Bauphase fallen nur Miete und Verwaltung an.</div>${a?`<div class="card"><table class="fin"><tr><td>Miete (Bauphase)</td><td>${fmtY(-a.rent)}</td></tr><tr><td>Verwaltung</td><td>${fmtY(-a.admin)}</td></tr></table></div>`:''}`;
 const grp=(r,g)=>r?sum(Object.keys(r.cats||{}).filter(k=>groupOf[k]===g).map(k=>r.cats[k])):0;
 const row=(t,f,cl)=>`<tr class="${cl||''}"><td>${t}</td><td>${fmtY(f(a))}</td><td>${b?fmtY(f(b)):'–'}</td></tr>`;
 return `<div class="card"><table class="fin"><tr class="hd"><td></td><td>Diese Wo.</td><td>Vorwoche</td></tr>
 ${row('Heiße Getränke & Speisen',r=>grp(r,'heiss'))}${row('Kalte Getränke',r=>grp(r,'kalt'))}${row('Essen',r=>grp(r,'essen'))}${row('Sonstiges',r=>grp(r,'sonst'))}${row('Services (Provision)',r=>r.fees)}
 ${row('Umsatz',r=>r.rev+r.fees,'sum')}${row('Wareneinsatz',r=>-r.cogs,'sub')}${row('Miete',r=>-r.rent,'sub')}${row('Ladenteam',r=>-r.wages,'sub')}${row('Filialleiter',r=>-r.salary,'sub')}${row('Strom',r=>-r.power,'sub')}${row('Marketing',r=>-r.mkt,'sub')}${row('Verwaltung & Verträge',r=>-r.admin-r.svcFixed,'sub')}${row('Abschreibung & Anlagensteuer',r=>-r.dep-r.assetTax,'sub')}
 ${row('Betriebsergebnis',r=>r.op,'sum')}</table></div>`;
}
/* ---------- Wochenergebnis & Zeitung ---------- */
const fmtU=v=>v>=1e9?'¥'+(v/1e9).toLocaleString('de-DE',{maximumFractionDigits:1})+' Mrd':fmtY(v);
function reportSheet(r){
 const T=r.T;
 showSheet(`<button class="x" data-act="close" aria-label="Schließen">✕</button><div style="text-align:center;color:var(--mut);font-size:12px;font-weight:900;letter-spacing:1.4px">WOCHENERGEBNIS · KW ${S.kw(r.week)}</div>
 ${(r.quits||[]).map(q=>`<div class="card quitcard"><div class="row"><img src="grafik/maskottchen/kobo-besorgt.svg" alt="" width="54" height="54" onerror="this.remove()"><div class="grow"><b style="font-size:16px">😢 Filialleitung hat gekündigt</b><div style="font-size:13px;font-weight:700;margin-top:3px"><b>${esc(q.name)}</b> hat <b>${esc(q.laden)}</b> verlassen.${q.grund?`<br>Grund: ${esc(q.grund)}`:''}</div><div style="font-size:12px;color:var(--mut);font-weight:700;margin-top:3px">Bis du jemanden einstellst, führt eine Vertretung den Laden mit Grundwerten. Preise und Sortiment kannst du selbst anpassen.</div></div></div><button class="btn primary full sm" style="margin-top:10px" data-act="hirelist" data-id="${q.sid}">👔 Neue Filialleitung einstellen</button></div>`).join('')}
 ${r.kdj?`<div class="card kdjcard"><b style="font-size:17px">🏆 Konbini-Awards ${r.kdj.jahr}</b><div style="font-weight:900;margin-top:8px">Konbini des Jahres</div><div style="font-size:12px;color:var(--mut);font-weight:700">Ø BuuHuu-Bewertung aller Läden über das Geschäftsjahr</div>${r.kdj.top.map((x,i)=>`<div class="row" style="margin-top:6px;${x.chain==='player'?'font-weight:900':''}"><span style="width:26px">${['🥇','🥈','🥉'][i]}</span>${chainLogo(x.chain,26)}<span class="grow" style="margin-left:6px">${esc(x.name)}</span>${GH(x.avg,14)}<b style="margin-left:6px">${x.avg.toFixed(2).replace('.',',')}</b></div>`).join('')}${r.kdj.rang>3?`<div style="font-size:12px;margin-top:6px;font-weight:700">Du: Platz ${r.kdj.rang} von ${r.kdj.n}</div>`:''}<div style="font-weight:900;margin-top:12px">Am schnellsten wachsender Konbini</div><div style="font-size:12px;color:var(--mut);font-weight:700">Umsatzwachstum gegenüber dem Vorjahr (52 Wochen)</div>${!(r.kdj.wachs||[]).length?'<div style="font-size:13px;font-weight:800;margin-top:6px">In diesem Jahr nicht vergeben – kein Umsatzwachstum.</div>':''}${(r.kdj.wachs||[]).filter(x=>x.pct>0).map((x,i)=>`<div class="row" style="margin-top:6px;${x.chain==='player'?'font-weight:900':''}"><span style="width:26px">${['🥇','🥈','🥉'][i]}</span>${chainLogo(x.chain,26)}<span class="grow" style="margin-left:6px">${esc(x.name)}<small style="display:block;font-size:11.5px;color:var(--mut);font-weight:700">${fmtU(x.von)} → ${fmtU(x.bis)}</small></span><b>+${x.pct.toFixed(1).replace('.',',')} %</b></div>`).join('')}${r.kdj.wrang>3?`<div style="font-size:12px;margin-top:6px;font-weight:700">Du: Platz ${r.kdj.wrang}</div>`:''}</div>`:''}
 ${(r.quitWarn||[]).map(q=>`<div class="card quitcard warn"><b style="font-size:15px">⚠️ Kündigung eingegangen</b><div style="font-size:13px;font-weight:700;margin-top:3px"><b>${esc(q.name)}</b> (${esc(q.laden)}) hört nach KW ${S.kw(q.zum-1)} auf. Grund: ${esc(q.grund)}.<br>Mehr Gehalt oder bessere Zahlen können sie noch halten.</div><button class="btn sm full" style="margin-top:8px" data-act="store" data-id="${q.sid}">Zum Laden ›</button></div>`).join('')}
 <div class="hero"><small>${r.ev.emoji} ${r.ev.label} · ab ${r.date}</small><div class="num ${T.net>=0?'pos':'neg'}" id="countup">${sgn(0)}</div><small>Nettoeinkommen</small></div>
 <div class="stats3"><div>Umsatz<b>${fmtY(T.rev+T.fees)}</b></div><div>Kunden/Tag<b>${fmtN(T.cust/7)}</b></div><div>Kasse<b>${fmtY(st().cash)}</b></div></div>
 <div class="lbl">Cashflow</div><div class="card" style="padding:6px 14px"><table class="fin"><tr><td>Geschäft</td><td class="${T.cf.op>=0?'pos':'neg'}">${sgn(T.cf.op)}</td></tr><tr><td>Investition</td><td class="${T.cf.inv>=0?'pos':'neg'}">${sgn(T.cf.inv)}</td></tr><tr><td>Finanzierung</td><td class="${T.cf.fin>=0?'pos':'neg'}">${sgn(T.cf.fin)}</td></tr></table></div>
 ${r.uebernahme?`<div class="tip ok uecard">🏆 <span><b>Übernahme ${esc(r.uebernahme.name||'')}</b>: ${r.uebernahme.n} Läden sind jetzt deine – ${r.uebernahme.aufKarte||0} auf der Karte (${r.uebernahme.karte.length} davon neu platziert), ${r.uebernahme.weitere} in weiteren Städten. Ihr Umsatz zählt schon in dieser Woche.</span></div>`:''}
 ${(()=>{const m=r.stores.filter(x=>!x.building&&x.op<0).length;return m?`<div class="tip bad minuswarn">🔻 ${m===1?'Ein Laden schreibt':m+' Läden schreiben'} diese Woche rote Zahlen (Umsatz da, Kosten höher).</div>`:''})()}
 ${r.stores.length?`<div class="lbl">Filialen</div><div class="card" style="padding:4px 14px">${r.stores.map(x=>{const s=st().stores.find(y=>y.id===x.id);return `<div class="srow">${chainLogo('player',28)}<div class="grow"><b>${s?S.storeLabel(s):''}</b><div style="color:var(--mut);font-size:11px;font-weight:600">${x.building?'🚧 im Bau':fmtN(x.cust/7)+' Kunden/Tag · '+GH(x.ghosts||3,12).replace(/<\/?span[^>]*>/g,'')+''}</div></div><div class="v"><b class="${x.net>=0?'pos':'neg'}">${!x.building&&x.op<0?'🔻 ':''}${sgn(x.net)}</b><small>${fmtY(x.rev)}</small></div></div>`}).join('')}</div>`:`<div class="tip">🏪 Noch keine Filiale. Tippe auf der Karte auf einen 空き-Pin.</div>`}
 ${(r.cities||[]).length>1?`<div class="lbl">Städte</div><div class="card cities" style="padding:4px 14px">${r.cities.map(c=>`<div class="srow"><div class="grow"><b>${esc(c.name)}</b>${c.aktuell?' <small style="color:var(--mut)">(hier)</small>':''}<div style="color:var(--mut);font-size:11px;font-weight:600">${c.n} ${c.n===1?'Laden':'Läden'} · Umsatz ${fmtY(c.rev||0)}${(c.opened||[]).length?` · 🎉 ${c.opened.length} neu eröffnet`:''}</div></div><b class="${(c.op||0)>=0?'pos':'neg'}" style="font-size:13px">${sgn(c.op||0)}</b></div>`).join('')}</div>`:''}
 ${(r.vertraege||[]).length?`<div class="lbl">Verträge laufen aus</div>${r.vertraege.map(v=>`<div class="tip bad vende"><span>📄 <b>${esc(v.name)}</b>: noch ${v.left} ${v.left===1?'Woche':'Wochen'}, danach nicht mehr im Regal.</span><button class="btn sm" data-act="fzverl" data-x="${esc(v.id)}">🔁 Verlängern</button></div>`).join('')}`:''}
 ${(()=>{const b=st().buero,v=b&&b.verlegt;if(v&&!v.imBericht){v.imBericht=true;const n=(st().news||[]).find(x=>x.chain==='player'&&/Zentrale ist umgezogen/.test(x.text||''));r.umzug=n?n.text:`🏢 Deine Zentrale ist nach Tokio (Shibuya) umgezogen.`;}return r.umzug?`<div class="lbl">Deine Firma</div><div class="tip umzug"><span>${r.umzug}</span></div>`:''})()}<!-- V6 (Whitebeard 4816e73): Büro-Umzug auch im Wochenbericht (R41) -->
 ${r.news.filter(n=>n.chain&&n.chain!=='player').length?`<div class="lbl">Konkurrenz</div><div class="card" style="padding:4px 14px">${r.news.filter(n=>n.chain&&n.chain!=='player').map(n=>`<div class="srow">${chainLogo(n.chain,28)}<div class="grow" style="font-size:13px;font-weight:700">${n.text}</div>${n.near?'<b class="neg" style="font-size:12px">nah!</b>':''}</div>`).join('')}</div>`:''}
 ${r.events.map(t=>`<div class="tip ${/^(😢|⚠️)/.test(t)?'bad':'ok'}">${t}</div>`).join('')}
 ${MM.weekPosts()?`<button class="mmlink" data-act="mm" data-v="week"><img src="grafik/social/washi/mitemite-logo.svg" alt="" width="30" height="30"><span><b>Diese Woche auf MiteMite!</b><small>${MM.weekPosts()} neue Posts</small></span><i>▸</i></button>`:''}
 ${r.tips.length?`<div class="lbl">Tipps</div>${r.tips.map(t=>`<div class="tip"><span>${t}</span></div>`).join('')}`:''}
 <button class="btn primary full" data-act="paper" style="margin-top:14px">📰 Konbini Shimbun lesen</button>`);
 const el=$('#countup'),t0=performance.now();(function step(t){const p=Math.min(1,(t-t0)/900),e=1-Math.pow(1-p,3);if(el&&el.isConnected){el.textContent=sgn(T.net*e);if(p<1)requestAnimationFrame(step)}})(t0);
}
function paperSheet(tab){
 tab=tab||'top';const P=st().paper||[],tabs=[['top','Top'],['einzel','Einzelhandel'],['wirt','Wirtschaft'],['markt','Markt']];
 const head=GFX.svg.shimbun?`<img class="mast" src="${svgURL(svgColored('shimbun',{datum:S.dateLabel(S.weekDate(st().week-1))}))}" alt="Konbini Shimbun">`:`<div class="mast fb">KONBINI SHIMBUN</div>`;
 const items=P.filter(p=>p.tab===tab);
 showSheet(`<button class="x" data-act="close" aria-label="Schließen" style="z-index:3">✕</button>${head}<div class="gtabs paper">${tabs.map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="ptab" data-v="${k}">${l}</button>`).join('')}</div>
 <div class="card news2">${items.length?items.map((p,i)=>`<article class="${i===0?'lead':''}"><b>${esc(p.text)}</b></article>`).join(''):'<div style="color:var(--mut);font-weight:700">Heute keine Meldungen.</div>'}</div>
 ${S.eventView()&&!S.eventView().done?`<button class="btn primary full" data-act="evcard" id="reportOk" style="margin-top:14px">Entscheidung der Woche ▶</button>`:`<button class="btn primary full" data-act="close" id="reportOk" style="margin-top:14px">Weiter zu KW ${S.kw(st().week)} ▶</button>`}`);
}
function eventSheet(){const v=S.eventView();if(!v||v.done){closeSheet();return;}
 showSheet(`<div style="text-align:center;color:var(--mut);font-size:12px;font-weight:900;letter-spacing:1.4px">ENTSCHEIDUNG · KW ${S.kw(st().week)}</div>
 <div class="story evcard"><img src="grafik/maskottchen/${esc(v.figur)}.svg" alt="Kobo"><p>${esc(v.text)}</p><small style="color:var(--mut);font-weight:700">${v.ziel==='alle'?'Betrifft alle Filialen':v.ziel==='stadtteil'?'Betrifft Filialen im Stadtteil':'Betrifft '+esc(v.laden)}</small></div>
 <button class="btn primary full evopt" data-act="evpick" data-v="a" style="margin-top:12px"><b>${esc(v.a)}</b><small>${esc(v.effA)}</small></button>
 <button class="btn full evopt" data-act="evpick" data-v="b" style="margin-top:8px"><b>${esc(v.b)}</b><small>${esc(v.effB)}</small></button>${v.hint?`<div class="evhint">${esc(v.hint)}</div>`:''}`);}
function cheapestStore(){let m=Infinity;for(const d of D.DISTRICTS)for(const i of S.freeSlots(d.id))m=Math.min(m,S.openCost(d.id,i,D.defaultBuild()));return m;}
/* ---------- Story (Ito: texte.json → story) ---------- */
function storyCard(i){
 const C=(GFX.texte&&Array.isArray(GFX.texte.story)&&GFX.texte.story.length)?GFX.texte.story:null;
 if(!C||i>=C.length){closeSheet();setTimeout(()=>tut('start'),400);return;}
 const c=C[i],fig=({'kobo':'kobo','kobo-besorgt':'kobo-besorgt','kobo-jubelnd':'kobo-jubelnd'})[c.figur]||'kobo';
 showSheet(`<div class="story"><img src="grafik/maskottchen/${fig}.svg" alt="Kobo"><p>${esc(c.text)}</p>
 <div class="dots">${C.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div>
 <button class="btn primary full" data-act="story" data-v="${i+1}" style="margin-top:14px">${i+1<C.length?'Weiter':'Los geht’s!'}</button>
 ${i+1<C.length?`<button class="btn full" data-act="story" data-v="${C.length}" style="margin-top:8px">Überspringen</button>`:''}</div>`);
}
function doEndWeek(){
 if(sheetOpen())return null;const c0=st().cash;const r=S.endWeek();renderAll();reportSheet(r);setTimeout(MM.banner,700);
 {const fz=st().fz;if(fz&&fz.insZeigen&&FZ.ON&&FZ.zeigeInsolvenz){fz.insZeigen=false;S.save();FZ.zeigeInsolvenz();ui.finK=false;ui.tab='fin';renderBar();renderPanel();}}
 {const nk=st().nk;if(nk&&nk.zeigen){const id=nk.zeigen;nk.zeigen=null;S.save();if(FZ.ON){FZ.zeigeNeueKette(id);ui.finK=false;ui.tab='fin';renderBar();renderPanel();}}}
 {const s=st();s.cashDown=s.cash<c0?(s.cashDown||0)+1:0;
  // Erik: 4 Wochen in Folge im Minus = Spiel verloren; Warnung mit Restwochen nach jeder Minus-Woche
  const wasNeg=(s.negWeeks||0)>0;s.negWeeks=s.cash<0?(s.negWeeks||0)+1:0;S.save();
  if(wasNeg&&!s.negWeeks)setTimeout(()=>tut('rettung_gerettet',true),1200);
  minusBanner();
  if(s.negWeeks>=NEG_LIMIT){setTimeout(gameOver,600);return r;}
  if(s.negWeeks>0){const n=s.negWeeks,left=NEG_LIMIT-n;setTimeout(()=>{showMinus(left);toast(`⚠️ Woche ${n}/${NEG_LIMIT} im Minus`);},1200);}
  else if(s.cashDown>=4){s.cashDown=0;setTimeout(()=>tut('warnung_kasse',true),1200);}}
 if(r.unlocked)setTimeout(()=>toast(`🗺️ Neue Standorte verfügbar: ${r.unlocked}`),900);
 if(r.ready.length&&S.mine().length>1)tut('ende');// V6: zweite Filiale eröffnet → Abschluss (statt „Omas Laden“-Text)
 else if(st().week===2)tut('eroeffnung');
 else if(r.T.net<0&&S.mine().some(s=>!s.build&&s.last&&!s.last.building&&state_age(s)>1))tut('verlust');
 else if(S.mine().length===1&&st().cash+(S.loanAvailable()?S.loanRoom():0)>=cheapestStore()){st().tut.zweiter_laden=1;tut('karte');}// V6: 2. Filiale nur einmal ankündigen (karte enthält den Hinweis)
 return r;
}
// V4: Yukis Toast „Spiel gespeichert“ (toast-gespeichert.svg)
function toastSaved(){if(!SC.SCREENS_OK)return toast(`💾 ${SB().gespeichert} (Slot ${st().slot||1})`);
 toast(SC.screen({name:'toast-gespeichert',mutate:r=>{const tx=r.querySelector('text');if(tx)tx.textContent=SB().gespeichert;}})+`<span class="sr">Slot ${st().slot||1}</span>`,'svgtoast');}
// V4: Minus-Warnung als Banner (minus-warnung-1/2/3.svg), bleibt sichtbar bis die Kasse wieder im Plus ist
function minusBanner(){let el=$('#minusBanner');if(!el){el=document.createElement('div');el.id='minusBanner';el.dataset.act='minusclose';document.body.appendChild(el);}
 const s=st(),n=s&&!s.lost?Math.min(3,s.negWeeks||0):0;if(!n||!SC.SCREENS_OK){el.classList.remove('show');el.innerHTML='';return;}
 el.innerHTML=SC.screen({name:'minus-warnung-'+n,vals:{wochen:`Woche ${n}/${NEG_LIMIT} im Minus`}});el.setAttribute('role','status');el.setAttribute('aria-label',`Konto im Minus: Woche ${n}/${NEG_LIMIT}`);el.classList.add('show');}
const state_age=s=>st().week-s.opened;
const NEG_LIMIT=4;
const SKILL_FILE={service:'menschen',einkauf:'produkt',verkauf:'marketing',effizienz:'ethik'};
function skillIco(k){return D.MGR_ART?`<img src="grafik/filialleiter/icons/skill-${SKILL_FILE[k.id]}.svg" width="16" height="16" alt="" style="vertical-align:-3px;margin-right:4px">`:'';}
function traitIco(t){return D.MGR_ART?`<img src="grafik/filialleiter/icons/trait-${t}.svg" width="16" height="16" alt="" style="vertical-align:-3px">`:D.TRAITS[t].icon;}
// Filialleiter-Avatar: Emoji (Standard) oder Yukis Porträt + Stufen-Rahmen, wenn D.MGR_ART an ist
function mgrAva(m){if(!D.MGR_ART)return m.avatar;let h=0;for(const c of String(m.name))h=(h*31+c.charCodeAt(0))>>>0;const p=D.MGR_PORTRAITS[h%D.MGR_PORTRAITS.length],fr={Junior:'junior',Standard:'standard',Profi:'profi',Star:'star'}[m.stufe]||'standard';
 return `<span class="mgrart" style="position:relative;display:inline-block;width:1.6em;height:1.6em"><img src="grafik/filialleiter/${p}.svg" alt="" style="width:100%;height:100%;border-radius:50%"><img src="grafik/filialleiter/rahmen-${fr}.svg" alt="" style="position:absolute;inset:0;width:100%;height:100%"></span>`;}
// Rettungstipps ohne Kredit: nur Hebel, die es im Spiel gibt (Preise, Sortiment, Kampagnen, Bauen). Texte: hinweise.rettung_* → rettungstipps.tipp_* → Bobs Fallback
const RESCUE_FALLBACK={
 preise:'Deine Preise liegen über dem Standard. Senk sie wieder, dann kommen mehr Kunden.',
 sortiment:'Dir fehlen Waren mit guter Marge wie Oden, Bentō oder Saisonware. Nimm sie wieder ins Sortiment.',
 lager:'Das Geld wird knapp. Kündige Services und Verträge, die sich nicht lohnen. Das kostet einmalig ¥50.000, spart dir aber jede Woche Geld. Wenn es eng bleibt, hilft ein Kredit bei der Bank.',// V6: Schlüssel bleibt „lager“ (texte.json rettung_lager, Ito), Inhalt = Services/Verträge kündigen
 kampagnen:'Du hast noch Werbekampagnen laufen. Stopp sie, bis die Kasse wieder im Plus ist.',
 reserve:'Du hast gerade gebaut. Bau erst wieder, wenn du ein Polster auf dem Konto hast.',
 gerettet:'Geschafft, die Kasse ist wieder im Plus! Gut gemacht.'};
function rescueText(id){const m=/^rettung_(\w+)$/.exec(id);if(!m)return null;const k=m[1],X=GFX.texte||{};
 const h=(X.hinweise||[]).find(x=>x.id===id);if(h)return h;
 const r=X.rettungstipps,alt=r&&(Array.isArray(r)?r.find(x=>x.id==='tipp_'+k):r['tipp_'+k]);
 if(alt)return typeof alt==='string'?{id,figur:k==='gerettet'?'kobo-jubelnd':'kobo-besorgt',text:alt}:{figur:k==='gerettet'?'kobo-jubelnd':'kobo-besorgt',...alt,id};
 return RESCUE_FALLBACK[k]?{id,figur:k==='gerettet'?'kobo-jubelnd':'kobo-besorgt',text:RESCUE_FALLBACK[k]}:null;}
// Erik 21.10. 13:43: Kobos Preis-Rettungstipp ab der 2. Minus-Woche in Folge (dann immer zuerst), vorher nicht
export const PRICE_TIP_WEEK=2;
function rescueTips(){const s=st(),mine=S.mine(),out=[];
 if((s.negWeeks||0)>=PRICE_TIP_WEEK&&mine.some(x=>!x.build&&Object.values(x.cfg.px||{}).some(v=>v>1.001)))out.push('preise');
 if(mine.some(x=>Object.keys(x.cfg.camps||{}).length))out.push('kampagnen');
 if(mine.some(x=>!x.build&&['oden','bento','saison'].some(k=>x.cfg.cats&&x.cfg.cats[k]===false)))out.push('sortiment');
 if(mine.some(x=>!x.oma&&(x.build>0||s.week-x.opened<8)))out.push('reserve');
 // V6: kein Lager-Mechanismus – „lager“ rät jetzt zum Kündigen laufender Services (Ito 25.10.)
 if(mine.some(x=>!x.build&&Object.values(x.cfg.svc||{}).some(Boolean)))out.push('lager');
 return out.slice(0,2).map(k=>rescueText('rettung_'+k)).filter(Boolean);}
function showMinus(left){tut('warnung_minus',true,{wochen:left});const tips=rescueTips(),tx=$('#tutor .tx');if(!tips.length||!tx)return;
 const box=document.createElement('div');box.className='rescue';box.innerHTML=tips.map(t=>`<p data-tip="${esc(t.id)}">💡 ${esc(t.text)}</p>`).join('');tx.insertBefore(box,tx.querySelector('.tbtn'));}
function gameOver(){const s=st();s.lost=true;s.lostAt=Date.now();S.save();tutHide();minusBanner();const T=((GFX.texte||{}).hinweise||[]).find(x=>x.id==='spiel_verloren');
 const text=T?T.text:'Das Konto war 4 Wochen lang im Minus. Die Kette muss schließen.';
 if(!SC.SCREENS_OK){showSheet(`<div class="hero gameover"><img src="grafik/maskottchen/kobo-besorgt.svg" width="96" height="96" alt="Kobo"><div class="num neg" style="font-size:30px">Spiel verloren</div><p style="margin:10px 0 0">${esc(text)}</p><small>KW ${S.kw(s.week)} · Kasse ${fmtY(s.cash)}</small></div><button class="btn primary full" data-act="newgame" style="margin-top:18px">Neues Spiel</button>`);return;}
 closeSheet();
 // Yukis pleite.svg: Titel + Itos Text (spiel_verloren), Knopf „Neues Spiel starten“
 introShow(SC.screen({name:'pleite',cls:'pleite',vals:{titel:(T&&T.titel)||'Pleite!'},texts:{text},
  buttons:[{x:190,y:1780,w:700,h:110,act:'newgame',label:SB().neues_spiel}],extra:`<div class="scrstat">KW ${S.kw(s.week)} · Kasse ${esc(fmtY(s.cash))}</div>`}),'linear-gradient(180deg,#E7E3EE 50%,#C9C4D3 50%)');}
/* Charts */
function setupCanvas(cv){const r=cv.getBoundingClientRect();if(!r.width)return null;const dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);return [x,r.width,r.height];}
function drawFinChart(){
 const cv=$('#finChart');if(!cv)return;const s=setupCanvas(cv);if(!s)return;const [x,Wd,H]=s,h=st().hist.slice(-26);x.font='700 10px system-ui';
 if(!h.length){x.fillStyle='#6B6F80';x.textAlign='center';x.fillText('Beende deine erste Woche, um Daten zu sehen.',Wd/2,H/2);return}
 const vals=h.flatMap(p=>[p.rev,p.net,0]),mx=Math.max(...vals),mn=Math.min(...vals),pad={l:46,r:8,t:10,b:20};
 const X=i=>pad.l+(h.length===1?(Wd-pad.l-pad.r)/2:i*(Wd-pad.l-pad.r)/(h.length-1)),Y=v=>pad.t+(mx-v)/((mx-mn)||1)*(H-pad.t-pad.b);
 x.strokeStyle='#EFE8DD';x.fillStyle='#8A8D9E';x.textAlign='right';
 for(let i=0;i<=4;i++){const v=mn+(mx-mn)*i/4,y=Y(v);x.beginPath();x.moveTo(pad.l,y);x.lineTo(Wd-pad.r,y);x.stroke();x.fillText(fmtY(v).replace(' Mio','M'),pad.l-6,y+3);}
 const bw=Math.max(3,Math.min(14,(Wd-pad.l-pad.r)/h.length*.55));
 h.forEach((p,i)=>{x.fillStyle=p.net>=0?'#E94F4F':'#F7A1B5';const y0=Y(0),y1=Y(p.net);x.beginPath();(x.roundRect?x.roundRect.bind(x):x.rect.bind(x))(X(i)-bw/2,Math.min(y0,y1),bw,Math.abs(y1-y0)||1,3);x.fill();});
 const gr=x.createLinearGradient(0,pad.t,0,H);gr.addColorStop(0,'rgba(61,123,217,.28)');gr.addColorStop(1,'rgba(61,123,217,0)');
 x.beginPath();h.forEach((p,i)=>i?x.lineTo(X(i),Y(p.rev)):x.moveTo(X(i),Y(p.rev)));x.lineTo(X(h.length-1),Y(Math.max(0,mn)));x.lineTo(X(0),Y(Math.max(0,mn)));x.closePath();x.fillStyle=gr;x.fill();
 x.beginPath();h.forEach((p,i)=>i?x.lineTo(X(i),Y(p.rev)):x.moveTo(X(i),Y(p.rev)));x.strokeStyle='#3D7BD9';x.lineWidth=2.6;x.lineJoin='round';x.stroke();
 x.fillStyle='#8A8D9E';x.textAlign='center';h.forEach((p,i)=>{if(h.length<=8||i%Math.ceil(h.length/6)===0)x.fillText('KW'+p.week,X(i),H-5)});
}
function drawDonut(){
 const cv=$('#donut');if(!cv)return;const s=setupCanvas(cv);if(!s)return;const [x,Wd,H]=s,M=marktAnteile(st());const cx=Wd/2,cy=H/2,R=Wd/2-8;let a=-Math.PI/2;
 const data=M?['player',...D.RIVALS].map(c=>[c,M.v[c]||0]):[];x.lineWidth=15;
 if(!M){x.beginPath();x.strokeStyle='#E4E1EA';x.arc(cx,cy,R-6,0,Math.PI*2);x.stroke();}
 for(const [c,v] of data){if(v<=0)continue;x.beginPath();x.strokeStyle=ccolor(c);x.arc(cx,cy,R-6,a+.03,a+v*Math.PI*2-.03);x.stroke();a+=v*Math.PI*2;}
 x.fillStyle='#2B2D42';x.textAlign='center';x.font='900 22px system-ui';x.fillText(M?pct(M.v.player||0):'–',cx,cy+5);x.fillStyle='#6B6F80';x.font='800 9.5px system-ui';x.fillText(M?'DEIN ANTEIL':'NOCH KEIN MARKT',cx,cy+20);
}

const SB=()=>Object.assign({untertitel:'Von Omas Laden zur großen Kette',neues_spiel:'Neues Spiel starten',laden:'Spielstand laden',weiter:'Weiterspielen',kein_spielstand:'Noch kein Spielstand vorhanden.',spielstand_karte:'{datum} · Kasse {kasse} ¥ · {laeden} Läden',ueberschreiben:'Ein neues Spiel ersetzt deinen gespeicherten Spielstand. Wirklich neu anfangen?',gespeichert:'Spiel gespeichert ✓',slot_verloren:'💀 Verloren · {datum} · Neues Spiel starten?'},(GFX.texte||{}).startbildschirm||{});
const fill=(t,v)=>Object.keys(v).reduce((a,k)=>a.split('{'+k+'}').join(v[k]),t);
function slotLabel(i){const fmtD=t=>t?new Date(t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'–';
 return i?`<b>Slot ${i.slot}${i.name?' · '+esc(i.name):''}</b><small>${esc(fill(SB().spielstand_karte,{datum:fmtD(i.savedAt)+' · KW '+i.week,kasse:Math.round(i.cash).toLocaleString('de-DE'),laeden:i.stores}).replace(/\b1 Läden\b/,'1 Laden'))}</small>`:`<b>Leer</b><small>${esc(SB().kein_spielstand)}</small>`;}
// V4: verlorene Spielstände (Pleite) sind nicht fortsetzbar – „Weiterspielen“ nur für laufende Spiele
function latestSlot(){return S.listSlots().filter(i=>i&&!i.lost).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0))[0];}
const fmtDate=t=>t?new Date(t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'–';
const fmtDay=t=>t?new Date(t).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}):'–';
const yen=v=>'¥ '+(v<0?'−':'')+Math.abs(Math.round(v)).toLocaleString('de-DE');
function slotLostText(i){return fill(SB().slot_verloren,{datum:fmtDay(i.savedAt)});}
// Slot-Auswahl (Laden bzw. neues Spiel) auf Yukis spielstand-auswahl.svg, Karten: spielstand-karte(-leer|-verloren).svg
function slotScreen(mode){const T=SB(),L=S.listSlots(),Y=[380,700,1020];
 return SC.screen({name:'spielstand-auswahl',cls:'slots',mutate:root=>{
  const title=root.querySelector('text');if(title)title.textContent=mode==='load'?T.laden:'Slot wählen';
  for(const g of [...root.children].filter(g=>g.tagName==='g'&&/translate\(60 /.test(g.getAttribute('transform')||'')))g.remove();
  L.forEach((i,k)=>{const n=k+1;let kind='leer',o={slot:n,verlorenAlt:T.kein_spielstand.replace(/\.$/,'')};
   if(i&&i.lost&&D.LOST_CARD_ART){kind='verloren';o={slot:n,name:i.name,datum:fmtDate(i.savedAt),verlorenAlt:`Woche ${i.week} · ${yen(i.cash)}`,verlorenText:slotLostText(i)};}
   else if(i&&i.lost){kind='normal';o={slot:n,name:i.name,datum:fmtDate(i.savedAt),spielwoche:'Woche '+i.week,kasse:yen(i.cash),laeden:i.stores,lostText:slotLostText(i)};}
   else if(i){kind='normal';o={slot:n,name:i.name,datum:fmtDate(i.savedAt),spielwoche:'Woche '+i.week,kasse:yen(i.cash),laeden:i.stores,neg:i.cash<0};}
   root.appendChild(SC.cardSvg(kind,60,Y[k],o));});},
  buttons:[{x:240,y:1700,w:600,h:110,act:'title',label:'Zurück'}]});}
function slotScreenFull(mode){const b=[];
 const L=S.listSlots(),Y=[380,700,1020];
 L.forEach((i,k)=>{const n=k+1,y=Y[k],base={x:66,y:y+6,w:948,h:248,v:n};
  if(i&&i.lost)b.push({...base,act:'lostslot',cls:'lost',label:`Slot ${n}: ${slotLostText(i)}`});
  else if(mode==='load')b.push({...base,act:'loadslot',label:i?`Slot ${n} laden: `+slotLabel(i).replace(/<[^>]+>/g,' '):`Slot ${n}: ${SB().kein_spielstand}`,disabled:!i});
  else b.push({...base,act:'newslot',label:`Slot ${n}: neues Spiel`});});
 return b;}
function introShow(html,bg){const el=$('#intro');el.innerHTML=`<div class="scrwrap" style="background:${bg}">${html}</div>`;el.classList.add('show','scrmode');}
function showIntro(view){
 const has=S.anySave(),T=SB();
 if(!SC.SCREENS_OK)return showIntroPlain(view);
 if(view==='load'||view==='new'){introShow(slotScreen(view),'#FFF8EE');fixSlotButtons(view);return;}
 if(view&&view.confirm){const n=view.confirm;
  const modal=SC.screen({name:'ueberschreiben',cls:'dlg',texts:{text:T.ueberschreiben},mutate:root=>{const t=[...root.querySelectorAll('text')].find(x=>/Überschreiben\?/.test(x.textContent));if(t)t.textContent=`Slot ${n} überschreiben?`;},
   buttons:[{x:60,y:400,w:370,h:110,act:'newgame',label:'Abbrechen'},{x:470,y:400,w:370,h:110,act:'newslotok',v:n,label:'Überschreiben'}]});
  introShow(slotScreen('new')+`<div class="scrmodal" role="dialog" aria-modal="true">${modal}</div>`,'#FFF8EE');fixSlotButtons('new');return;}
 const lt=latestSlot();
 const html=SC.screen({name:'start',cls:'start',mutate:root=>{if(!lt)for(const g of root.querySelectorAll('[data-nur-mit-spielstand="true"]'))g.remove();},
  buttons:[...(lt?[{x:170,y:1430,w:740,h:140,act:'loadslot',v:lt.slot,label:'▶ '+T.weiter}]:[]),{x:170,y:1610,w:740,h:120,act:'newgame',label:T.neues_spiel},{x:170,y:1780,w:740,h:110,act:'loadmenu',label:T.laden,disabled:!has,cls:has?'':'dim'}],
  extra:`<div class="scrfoot">${has?'':esc(T.kein_spielstand)+'<br>'}Prototyp V6 · alle Marken sind fiktive Parodien</div>`});
 introShow(html,'linear-gradient(180deg,#5B4B8A 50%,#6B6F80 50%)');
}
// Klickflächen der Slot-Karten
function fixSlotButtons(mode){const scr=document.querySelector('#intro .scr.slots');if(!scr)return;scr.querySelectorAll('.scrhot:not([data-act=title])').forEach(b=>b.remove());
 const box={w:1080,h:1920};scr.insertAdjacentHTML('beforeend',slotScreenFull(mode).map(b=>SC.hot(b,box)).join(''));}
function showIntroPlain(view){
 const has=S.anySave(),L=S.listSlots(),T=SB();let body;
 const lbl=i=>i&&i.lost?`<b>Slot ${i.slot}${i.name?' · '+esc(i.name):''}</b><small>${esc(slotLostText(i))}</small>`:slotLabel(i);
 if(view==='load')body=`<div class="h1">${esc(T.laden)}</div>${L.map((i,k)=>`<button class="btn full slotbtn" data-act="${i&&i.lost?'lostslot':'loadslot'}" data-v="${k+1}" ${i?'':'disabled'}>${lbl(i)}</button>`).join('')}<button class="btn full" data-act="title">Zurück</button>`;
 else if(view==='new')body=`<div class="h1">${esc(T.neues_spiel)} · Slot wählen</div>${L.map((i,k)=>`<button class="btn full slotbtn" data-act="${i&&i.lost?'lostslot':'newslot'}" data-v="${k+1}">${lbl(i)}</button>`).join('')}<button class="btn full" data-act="title">Zurück</button>`;
 else if(view&&view.confirm)body=`<div class="h1">Slot ${view.confirm} überschreiben?</div><p>${esc(T.ueberschreiben)}</p><button class="btn primary full" data-act="newslotok" data-v="${view.confirm}">Ja, überschreiben</button><button class="btn full" data-act="newgame">Abbrechen</button>`;
 else{const lt=latestSlot();body=`<p>${esc(T.untertitel)}</p>
 ${lt?`<button class="btn primary full" data-act="loadslot" data-v="${lt.slot}">▶ ${esc(T.weiter)}</button><small style="display:block;margin:4px 0 10px;color:var(--mut)">${slotLabel(lt).replace(/<[^>]+>/g,' ')}</small>`:''}
 <button class="btn ${lt?'':'primary'} full" data-act="newgame">${esc(T.neues_spiel)}</button><div style="height:10px"></div>
 <button class="btn full" data-act="loadmenu" ${has?'':'disabled'} aria-disabled="${!has}">${esc(T.laden)}</button>${has?'':`<small style="display:block;margin-top:6px;color:var(--mut)">${esc(T.kein_spielstand)}</small>`}`;}
 $('#intro').classList.remove('scrmode');
 $('#intro').innerHTML=`<div class="introcard"><div class="brandmark">コンビニ</div><div class="title">KONBINI EMPIRE</div>${body}
 <div style="color:var(--mut);font-size:11px;margin-top:14px;font-weight:700">Prototyp V6 · alle Marken sind fiktive Parodien</div></div>`;
 $('#intro').classList.add('show');
}
function logoEditor(mode){
 ui.editMode=mode;ui.editLogo=ui.editLogo||{...(mode==='edit'?st().logo:D.defaultLogo())};
 const L=ui.editLogo;
 const sign=GFX.svg.sign0?svgURL(svgColored('sign0',{main:L.bg.toLowerCase()==='#ffffff'?L.fg:L.bg,second:L.bg.toLowerCase()==='#ffffff'?'#ffffff':L.fg,name:L.name||' '})):'';
 const html=`<div class="editor"><div class="h1" style="text-align:center">${mode==='edit'?'Marke bearbeiten':'Deine Kette'}</div>
 <div class="pvbox"><img src="${logoURL(L,240)}" width="96" height="96" style="border-radius:24%;filter:drop-shadow(0 6px 14px rgba(43,45,66,.18))"><div class="grow">${sign?`<img src="${sign}" style="width:100%;display:block">`:''}<div style="font-size:11px;color:var(--mut);font-weight:700;margin-top:6px">So erscheint dein Logo auf Schildern, Läden und überall im Spiel.</div></div></div>
 <div class="lbl">Name der Kette</div><input id="lgName" maxlength="18" value="${esc(L.name)}" autocomplete="off">
 ${D.EDITOR_LOGOS_V2&&String(L.symbol).startsWith('v2-')?'':`<div class="lbl">Form</div><div class="symgrid">${D.LOGO_SHAPES.map(o=>`<button class="${L.shape===o.id?'on':''}" data-act="lg" data-k="shape" data-v="${o.id}" title="${o.label}"><img src="${logoURL({...L,shape:o.id},90)}"></button>`).join('')}</div>`}
 <div class="lbl">Symbol</div><div class="symgrid">${(D.EDITOR_LOGOS_V2?D.LOGO_SYMBOLS_V2:D.LOGO_SYMBOLS).map(o=>`<button class="${L.symbol===o.id?'on':''}" data-act="lg" data-k="symbol" data-v="${o.id}" title="${o.label}"><img src="${logoURL({...L,symbol:o.id},90)}"></button>`).join('')}</div>
 ${L.symbol==='kanji'?`<div class="lbl">Kanji</div><div class="symgrid">${D.KANJI.map(k=>`<button class="${L.kanji===k?'on':''}" data-act="lg" data-k="kanji" data-v="${k}"><img src="${logoURL({...L,kanji:k},90)}"></button>`).join('')}</div>`:''}
 <div class="lbl">Ladenfarbe · ${esc(D.colorName(L.bg))}</div><div class="swatches">${D.LOGO_BG.map(c=>`<button class="sw ${String(L.bg).toLowerCase()===c.toLowerCase()?'on':''}" style="background:${c}" title="${esc(D.colorName(c))}" aria-label="${esc(D.colorName(c))}" data-act="lg" data-k="bg" data-v="${c}"></button>`).join('')}</div>
 <div class="lbl">Zweitfarbe · ${esc(D.colorName(L.fg))}</div><div class="swatches">${D.LOGO_FG.map(c=>`<button class="sw ${String(L.fg).toLowerCase()===c.toLowerCase()?'on':''}" style="background:${c}" title="${esc(D.colorName(c))}" aria-label="${esc(D.colorName(c))}" data-act="lg" data-k="fg" data-v="${c}"></button>`).join('')}</div>
 ${D.EDITOR_LOGOS_V2&&String(L.symbol).startsWith('v2-')?'':`<button class="switch ${L.ring?'on':''}" data-act="lg" data-k="ring" data-v="${L.ring?'':'1'}"><div class="grow"><b>Zierrand</b><small>Feine Linie innen</small></div><div class="tg"></div></button>`}
 <div style="height:14px"></div>
 ${mode==='edit'?`<button class="btn primary full" data-act="savelogo">Speichern${S.state.week>1?' · Rebranding ¥1 Mio':''}</button><div style="height:8px"></div><button class="btn full" data-act="closeeditor">Abbrechen</button>`:`<button class="btn primary full" data-act="startgame">Kette gründen · ${D.START_CASH/1e6} Mio. ¥ Startkapital ✦</button><div style="height:8px"></div><button class="btn full" data-act="introback">Zurück</button>`}</div>`;
 if(mode==='edit')showSheet(html);else{$('#intro').classList.remove('scrmode');$('#intro').innerHTML=`<div class="introcard">${html}</div>`;$('#intro').classList.add('show');}
 const inp=$('#lgName');inp&&inp.addEventListener('input',()=>{ui.editLogo.name=inp.value;clearTimeout(ui.nt);ui.nt=setTimeout(()=>{const pos=inp.selectionStart;const sc=(mode==='edit'?$('#sheet'):$('#intro .introcard')).scrollTop;logoEditor(mode);const n=$('#lgName');n.focus();n.setSelectionRange(pos,pos);(mode==='edit'?$('#sheet'):$('#intro .introcard')).scrollTop=sc;},450);});
}
function rerenderEditor(){const box=ui.editMode==='edit'?$('#sheet'):$('#intro .introcard');const sc=box?box.scrollTop:0;logoEditor(ui.editMode);const b2=ui.editMode==='edit'?$('#sheet'):$('#intro .introcard');if(b2)b2.scrollTop=sc;}
function startGame(s){S.setState(s);if(!PV.ensure(s).name)setTimeout(()=>nameScreen('alt'),300);// alte Spielstände ohne Namen: einmal fragen
S.setTexte(GFX.texte);$('#intro').classList.remove('show','scrmode');setTimeout(minusBanner,0);ui.tab='map';renderAll();if(s.week===1&&!s.tut.start)setTimeout(()=>storyCard(0),500);}


// Namenseingabe (Yuki a_name_eingabe, Text Ito startbildschirm.name_eingabe)
function nameScreen(mode){ui.nameMode=mode;$('#pvname')?.remove();const el=document.createElement('div');el.id='pvname';const firm=mode==='neu'?D.defaultLogo().name:(st().logo.name||'');
 el.innerHTML=`<div class="pvn-in"><div class="pvn-star">⭐</div><h1>Konbini Empire</h1><small>${mode==='neu'?'Neues Spiel':'Spielstand fortsetzen'}</small>
 <label>👤 Dein Name</label><input id="pvn" maxlength="24" autocomplete="off" placeholder="Dein Name"><p class="pvn-hint">${esc(PV.nameText())}</p>
 ${mode==='neu'?`<label>🏪 Firmenname <small>(optional)</small></label><input id="pvf" class="dark" maxlength="18" placeholder="${esc(firm)}">`:''}
 <button class="btn primary full" data-act="nameok">Los geht's 🚀</button><div class="pvn-kobo"><img src="grafik/maskottchen/kobo.svg" alt=""><div id="pvkobo">Irasshaimase! Ich bin Kobo. Zusammen bauen wir das größte Konbini-Imperium Japans!</div></div></div>`;
 document.body.appendChild(el);const i=el.querySelector('#pvn');i.addEventListener('input',()=>{const v=i.value.trim();el.querySelector('#pvkobo').innerHTML=v?`Irasshaimase, <b>${esc(v)}</b>! Ich bin Kobo. Zusammen bauen wir das größte Konbini-Imperium Japans!`:'Irasshaimase! Ich bin Kobo. Zusammen bauen wir das größte Konbini-Imperium Japans!';});setTimeout(()=>i.focus(),50);}
/* ---------- Events ---------- */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
 const a=b.dataset.act,id=+b.dataset.id||null,s=id&&st()?st().stores.find(x=>x.id===id):null;
 switch(a){
  case 'neweditor':ui.editLogo=null;logoEditor('new');break;
  case 'introback':showIntro();break;
  case 'lg':{const k=b.dataset.k;ui.editLogo[k]=k==='ring'?!!b.dataset.v:b.dataset.v;rerenderEditor();break}
  case 'startgame':{if(CITY.id!=='tokio'){location.href=cityURL('tokio','neu=1');break;}const L={...ui.editLogo,name:(ui.editLogo.name||'').trim()||'Hoshi Mart'};const ns=S.newState(L);ns.slot=ui.slot||1;PV.ensure(ns).name=ui.pname||PV.CFG.NAME_STANDARD;startGame(ns);S.save();break}
  case 'continue':startGame(S.load());break;
  case 'chip':{ui.chipOpen=!b.classList.contains('mini')?false:true;b.classList.toggle('mini',!ui.chipOpen);b.setAttribute('aria-expanded',ui.chipOpen);clearTimeout(ui.chipT);if(ui.chipOpen)ui.chipT=setTimeout(()=>{ui.chipOpen=false;b.classList.add('mini');},4000);break;}
  case 'minusclose':{const el=$('#minusBanner');el&&el.classList.remove('show');break;}
  case 'newgame':if(CITY.id!=='tokio'){location.href=cityURL('tokio','neu=1');break;}closeSheet();document.body.classList.remove('panel');showIntro('new');break;
  case 'title':showIntro();break;
  case 'loadmenu':showIntro('load');break;
  case 'loadslot':{const sv=S.load(+b.dataset.v);if(sv&&sv.lost){ui.slot=+b.dataset.v;ui.editLogo=null;logoEditor('new');break;}if(sv)startGame(sv);break;}
  case 'lostslot':ui.slot=+b.dataset.v;ui.editLogo=null;logoEditor('new');break;// V4: verlorener Slot startet direkt ein neues Spiel
  case 'newslot':{if(CITY.id!=='tokio'){location.href=cityURL('tokio','neu=1');break;}const n=+b.dataset.v;if(S.slotInfo(n))showIntro({confirm:n});else{ui.slot=n;ui.editLogo=null;nameScreen('neu');}break;}
  case 'newslotok':ui.slot=+b.dataset.v;ui.editLogo=null;nameScreen('neu');break;
  case 'nameok':{const n=($('#pvn')?.value||'').trim()||PV.CFG.NAME_STANDARD,f=($('#pvf')?.value||'').trim();$('#pvname')?.remove();if(ui.nameMode==='neu'){ui.pname=n;ui.editLogo={...D.defaultLogo(),...(f?{name:f}:{})};logoEditor('new');}else{PV.ensure(st()).name=n;S.save();renderAll();}break;}
  case 'savegame':S.save();toastSaved();break;
  case 'editlogo':ui.editLogo=null;logoEditor('edit');break;
  case 'savelogo':{const L={...ui.editLogo,name:(ui.editLogo.name||'').trim()||st().logo.name};if(st().week>1){if(st().cash<1e6){toast('Nicht genug Geld');break}st().cash-=1e6;}st().logo=L;S.save();closeSheet();renderAll();toast('🎨 Neues Logo ist auf allen Läden');break}
  case 'closeeditor':closeSheet();break;
  case 'tab':{const t=b.dataset.t;ui.finK=false;ui.tab=(ui.tab===t&&t!=='map')?'map':t;closeSheet();renderBar();renderPanel();$('#panelBody').scrollTop=0;break}
  case 'closepanel':ui.tab='map';renderBar();renderPanel();break;
  case 'tutnext':{const n=TUT_NEXT[ui.tutId];tutHide();if(n)setTimeout(()=>tut(n),250);break}
  case 'tutoff':tutHide();st().tutOff=true;S.save();break;
  case 'plane':if(BF.ON)bahnhofOpen();else travelSheet();break;
  case 'bfzu':document.body.classList.remove('bfopen');break;
  case 'abfahrt':abfahrt(b.dataset.v);break;
  case 'fz':FZ.act(b);break;
  case 'fzbuero':ui.finK=false;ui.tab='fin';closeSheet();renderBar();renderPanel();FZ.act({dataset:{v:'zentrale'}});break;
  case 'fzkarte':FZ.schliessen();ui.finK=false;ui.tab='map';closeSheet();renderBar();renderPanel();break;
  case 'fzverl':closeSheet();ui.finK=false;ui.tab='fin';renderBar();renderPanel();FZ.act({dataset:{v:'verlaengern',x:b.dataset.x}});break;
  case 'mm':MM.act(b);break;
  case 'finklassisch':ui.finK=true;renderPanel();$('#panelBody').scrollTop=0;break;
  case 'finmenu':ui.finK=false;renderPanel();break;
  case 'travel':if(BF.ON&&b.dataset.v!==CITY.id)abfahrt(b.dataset.v);else travel(b.dataset.v);break;
  case 'layers':{const all=W&&W.pinLayer?W.pinLayer():false;toast(all?'🗺️ Ebene: alle freien Grundstücke':'🗺️ Ebene: die besten freien Grundstücke');break;}
  case 'menu':ui.tab=ui.tab==='market'?'map':'market';closeSheet();renderBar();renderPanel();break;
  case 'region':closeSheet();W.flyTo(10,5,190);break;
  case 'tobuild':builderSheet();break;
  case 'back':propertySheet(ui.draft.did,ui.draft.slot);break;
  case 'pick':pickSheet(b.dataset.k,'draft');break;
  case 'pickst':pickSheet(b.dataset.k,id);break;
  case 'pickclose':closePick();break;
  case 'pickopt':{const k=b.dataset.k,v=+b.dataset.v;
   if(ui.pickTarget==='draft'){ui.draft.b[k]=v;closePick();builderSheet();}
   else{const ss=st().stores.find(x=>x.id===ui.pickTarget);
    // V6: Gerät ausbauen → Warnung, welche Produkte dann nichts mehr verkaufen (Erik 25.10.)
    if(v<0&&ss.b[k]>=0&&!b.dataset.ok&&SO.K.ON){const L=SO.betroffen(st(),ss,k);if(L.length){const box=$('#pick .pbox');box.querySelector('.devrm')&&box.querySelector('.devrm').remove();box.children[0].insertAdjacentHTML('afterend',`<div class="tip bad devrm">⚠️ Ohne ${esc(SO.devText([k]))} verkauft dieser Laden nichts mehr von: <b>${L.map(p=>esc(p.name)).join(', ')}</b>.<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm grow" data-act="pickclose">Abbrechen</button><button class="btn danger sm grow" data-act="pickopt" data-k="${k}" data-v="-1" data-ok="1">Trotzdem ausbauen</button></div></div>`);break;}}
    const r=S.upgrade(ss,k,v);if(r.err){toast(r.err);break}if(r.paid)toast(`🛠️ Umgebaut für ${fmtY(r.paid)}`);closePick();W.syncStores(st().stores,st().logo,st().week);renderHUD();openStoreSheet(ss.id);}
   break}
  case 'dobuild':doBuild();break;
  case 'pvmode':pvMode=b.dataset.v;if(ui.storeId&&sheetOpen())openStoreSheet(ui.storeId);else if(ui.draft){previewMode(pvMode);syncPv();}break;
  case 'store':ui.storeTab='service';ui.confirmClose=null;openStoreSheet(id);break;
  case 'stab':ui.storeTab=b.dataset.v;openStoreSheet(ui.storeId);$('#sheet').scrollTop=0;break;
  case 'pgroup':ui.pgroup=b.dataset.v;openStoreSheet(ui.storeId);break;
  case 'close':closeSheet();break;
  case 'evcard':eventSheet();break;
  case 'evpick':{const r=S.chooseEvent(b.dataset.v);closeSheet();renderAll();if(r)toast(r.cost?`Entschieden · ${S.fmtY(-r.cost)}`:'Entschieden – die Folgen siehst du nächste Woche');break;}
  case 'cat':{const k=b.dataset.k;s.cfg.cats[k]=!s.cfg.cats[k];S.save();openStoreSheet(id);break}
  case 'px':{const k=b.dataset.k,cur=(s.cfg.px&&s.cfg.px[k])||1;s.cfg.px=s.cfg.px||{};s.cfg.px[k]=Math.max(.7,Math.min(1.4,Math.round((cur+(+b.dataset.v)*.05)*100)/100));S.save();openStoreSheet(id);break}
  case 'camp':{const r=S.toggleCamp(s,b.dataset.k);if(r.err)toast(r.err);else toast(r.on?'📣 Kampagne gestartet':'Kampagne beendet');renderHUD();openStoreSheet(id);break}
  case 'svcno':ui.svcAsk=null;openStoreSheet(id);break;
  case 'svc':{if(b.dataset.v==='0'&&!b.dataset.ok){const v=D.SERVICES[b.dataset.k],left=v.min-(st().week-((s.cfg.svcSince||{})[b.dataset.k]||0));if(left>0){ui.svcAsk=s.id+':'+b.dataset.k;openStoreSheet(id);break;}}ui.svcAsk=null;const r=S.signService(s,b.dataset.k,b.dataset.v==='1');if(r.err)toast(r.err);else if(r.paid!=null)toast(`✍️ Vertrag mit ${D.SERVICES[b.dataset.k].partner} unterschrieben`);else toast(r.penalty?`Gekündigt, Vertragsstrafe ${fmtY(r.penalty)}`:'Vertrag gekündigt');renderHUD();openStoreSheet(id);break}
  case 'closestore':if(ui.confirmClose!==id){ui.confirmClose=id;openStoreSheet(id);break}S.closeStore(id);ui.confirmClose=null;closeSheet();renderAll();toast('Filiale geschlossen');break;
  case 'hirelist':ui.hireScroll=0;hireSheet(id);break;
  case 'offstep':{ui.offer=ui.offer||{};const m=b.dataset.m;ui.offer[m]=Math.max(-20,Math.min(30,(ui.offer[m]||0)+(+b.dataset.v)*2));hireSheet(id);break}
  case 'offer':{const m=ui.cands[id].find(x=>x.id===b.dataset.m),pc=(ui.offer&&ui.offer[m.id])||0,sal=Math.round(m.expect*(1+pc/100)/10000)*10000;
   if(S.offerResult(m,sal)){const alt=s.mgr&&!s.mgr.vertretung?s.mgr.name:null,ab=S.hire(s,m,sal);delete ui.cands[id];closePick();toast(`👔 ${esc(m.name)} nimmt an und leitet jetzt ${S.storeLabel(s)}`+(alt?` · ${esc(alt)} entlassen (Abfindung ${fmtY(ab)})`:''));renderHUD();openStoreSheet(id);}
   else{toast(`${esc(m.name)} lehnt ab. Das Angebot ist zu niedrig.`);}break}
  case 'salary':{const m=s.mgr,v=+b.dataset.v;m.salary=Math.max(2e6,Math.round(m.salary*(1+v*.05)/10000)*10000);m.morale=Math.max(0,Math.min(100,m.morale+(v>0?6:-9)));S.save();openStoreSheet(id);break}
  case 'fire':ui.hireScroll=0;hireSheet(id);break;// V6: Entlassen = Austausch
  case 'loan':{const v=+b.dataset.v*1e6;const r=v>0?S.takeLoan(v):S.repayLoan(-v);if(r.err){toast(r.err);break}renderHUD();renderPanel();toast(v>0?`🏦 Kredit über ${fmtY(v)}`:'Kredit getilgt');break}
  case 'taxcut':st().taxCut=st().taxCut===false;S.save();renderPanel();toast(st().taxCut?'Steuersenkung (Annahme) ist an':'Steuersenkung ist aus: 8 % auf Lebensmittel');break;
  case 'story':storyCard(+b.dataset.v);break;
  case 'paper':paperSheet('top');break;
  case 'ptab':paperSheet(b.dataset.v);break;
  case 'endweek':doEndWeek();break;
 }
});

/* ---------- Start ---------- */
(async function boot(){
 await loadGfx();S.setTexte(GFX.texte);
 try{W=createWorld($('#world'),{
  onSlot:(d,i)=>{if(!st()||sheetOpen())return;ui.tab='map';renderPanel();propertySheet(d,i);},
  onStore:id=>{if(!st()||sheetOpen())return;const s=st().stores.find(x=>x.id===id);if(!s)return;if(s.chain==='player'){ui.storeTab='service';openStoreSheet(id);}else toast(`${D.CHAINS[s.chain].name} · ${S.siteInfo(s.d,s.slot).tier.label}`);},
  onHub:id=>{const h=D.HUBS.find(x=>x.id===id||(id==='station'&&x.id==='tokyo-st'));if(h&&st()){if(BF.ON)bahnhofOpen();else travelSheet();return;}toast(h?`${h.icon} ${h.name}`:({borse:'📈 Börse: kommt bald',immo:'🏢 Immobilienbüro: kommt bald',hq:'🏠 Hauptquartier: kommt bald'})[id]||'kommt bald');},
  onEmpty:()=>{}});}
 catch(err){console.error(err);$('#world').innerHTML='<div style="padding:120px 30px;text-align:center;font-weight:800">3D-Karte konnte nicht starten (WebGL fehlt?).</div>';}
 $('#boot').classList.add('hide');setTimeout(()=>$('#boot').remove(),600);
 MM.init({chainLogo,esc,toast,texte:()=>GFX.texte,rerender:()=>{if(S.state&&$('#cityBar'))renderBar();}});keepLast();
 {const q=new URLSearchParams(location.search),wn=+q.get('weiter');const sv=wn?S.load(wn):null;
  if(sv&&!sv.lost)startGame(sv);else if(q.get('neu'))showIntro('new');else showIntro();}
 window.addEventListener('logo-ready',()=>{clearTimeout(ui.lr);ui.lr=setTimeout(()=>{if(ui.editMode&&(document.querySelector('#intro.show .editor')||document.querySelector('#sheet .editor')))rerenderEditor();if(S.state)renderAll();},120);});
 BF.load();
 FZ.init(S,{chainLogo,esc,toast,ladenN,CHAINS:D.CHAINS,RIVALS:D.RIVALS,dname:id=>(D.DMAP[id]||{name:id}).name,dtype:id=>(D.DMAP[id]||{}).type||'standard',CATS:D.CATS,texte:()=>GFX.texte,gameOver:()=>gameOver(),chainLogoFile:(f,sz)=>`<img class="fzlogo" src="grafik/logos/${f}.svg" width="${sz}" height="${sz}" alt="">`,cityName:CITY.name,rerender:()=>{if(ui.tab==='fin'&&FZ.ON)renderFZ();renderHUD();}});if(FZ.ON){S.preTaxHooks.push(FZ.preTax,BU.preTax,PV.preTax);S.weekHooks.push(FZ.weekHook);S.preWeekHooks.push(FZ.preWeek);S.rivalFinanz.on=true;if(BU.ON)S.weekHooks.push(BU.weekHook);S.weekHooks.push(PV.weekHook);}
 NK.init(S,{CHAINS:D.CHAINS,RIVALS:D.RIVALS,GFX,firmenwert:FZ.firmenwert,fY:fmtY,dname:id=>(D.DMAP[id]||{name:id}).name});S.weekHooks.unshift(NK.weekHook);S.weekHooks.push(MM.weekHook);
 window.__game={get state(){return S.state},S,D,W,ui,marktAnteile,FZ,NK,BF,BU,PV,endWeek:doEndWeek,openStoreSheet,propertySheet,builderSheet,GFX};
 if('serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW',e));
})();
