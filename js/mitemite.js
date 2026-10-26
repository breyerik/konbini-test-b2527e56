// MiteMite! (見て見て) – In-Game-Social-Feed im Washi-Stil (Yuki: screens/social/washi, Spec screens/social/spec.md)
// Rein kosmetisch: liest nur den Spielstand, Posts kommen aus echten Ereignissen (state.news, Läden, Kampagnen, Sortiment, Börse, Awards).
// Jedes Ereignis postet genau einmal (state.mm.seen), höchstens 30 Posts. Likes deterministisch: Basis je Typ × Bekanntheit × 0,8–1,2.
import * as S from './sim.js';
import * as D from './data.js';
import {CITY} from './plan.js';
import {ico} from './washi.js';
let H={chainLogo:()=>'',esc:s=>String(s),texte:()=>({}),rerender:()=>{},toast:()=>{}};
export function init(h){H={...H,...h};}
const MAX=30,G='grafik/social/washi/';
const V={open:false,tab:'alle',typ:'alle',nav:'feed',post:null,q:''};
// Fallbacks, falls texte.json (Ito) fehlt
const FB={post_neuer_laden:'Neu in {stadtteil}: {laden} hat eröffnet! Kommt vorbei!',post_aktion:'Diese Woche bei {laden}: unsere neue Aktion. Nicht verpassen!',post_neues_produkt:'Frisch im Regal: {produkt}. Schon probiert?',
 post_award:'{laden} hat {geister} BuuHuu-Geister bekommen. Danke an euch alle!',post_messe_deal:'Messe-Deal: {produkt} gibt es nur bei {laden}.',rivale_eroeffnung:'{rivale} eröffnet in {stadtteil}. Die Konkurrenz rückt näher!',
 rivale_boersengang:'{rivale} ist jetzt an der Börse.',rivale_uebernahme:'{rivale} hat eine andere Kette übernommen.',
 kommentare_positiv:['Endlich ein Konbini um die Ecke!','Super freundliche Leute an der Kasse.','Mein neuer Lieblingsladen'],kommentare_neutral:['Ganz okay, aber etwas teuer.','Mal schauen, ob die das Niveau halten.'],
 kommentare_negativ:['Schon wieder ausverkauft…','Die Schlange an der Kasse war viel zu lang.','Bei {rivale} ist es günstiger.'],kommentare_rivale:['Noch ein Konbini? Mal sehen, wer gewinnt.','Ich bleibe bei {laden}!','Oh, {rivale} ist jetzt auch hier.']};
const TX=k=>{const m=(H.texte()||{}).mitemite||{};const v=m[k];return (Array.isArray(FB[k])?(Array.isArray(v)&&v.length?v:FB[k]):(typeof v==='string'&&v?v:FB[k]));};
// Typen: Post-Icon, Tag, Filtergruppe, Like-Basis, Reaktions-Anteile (Herz, Lecker, Party, Staunen)
const TY={
 laden:{img:'post-neuer-laden',tag:'Neuer Laden',grp:'eroeffnung',base:300,rx:[.63,.23,.1,.04]},
 aktion:{img:'post-aktion',tag:'Aktion',grp:'aktion',base:250,rx:[.45,.35,.15,.05]},
 produkt:{img:'post-neues-produkt',tag:'Neues Produkt',grp:'produkt',base:220,rx:[.4,.45,.1,.05]},
 award:{img:'post-award',tag:'Award',grp:'award',base:800,rx:[.5,.08,.37,.05]},
 messe:{img:'post-messe-deal',tag:'Messe-Deal',grp:'aktion',base:400,rx:[.45,.3,.15,.1]},
 boerse:{img:'post-rivale-ipo',tag:'Börse',grp:'boerse',base:1500,rx:[.35,.05,.35,.25]},
 uebernahme:{img:'post-rivale-uebernahme',tag:'Übernahme',grp:'uebernahme',base:1200,rx:[.25,.05,.2,.5]},
 r_eroeffnung:{img:'post-rivale-eroeffnung',tag:'Rivale',grp:'eroeffnung',base:350,rx:[.35,.1,.15,.4]},
 r_boerse:{img:'post-rivale-ipo',tag:'Rivale',grp:'boerse',base:1500,rx:[.25,.05,.2,.5]},
 r_uebernahme:{img:'post-rivale-uebernahme',tag:'Übernahme',grp:'uebernahme',base:1200,rx:[.2,.05,.15,.6]},
 r_pleite:{img:'post-rivale-uebernahme',tag:'Pleite',grp:'uebernahme',base:900,rx:[.15,.05,.05,.75]},
 buero:{img:'post-neuer-laden',tag:'Zentrale',grp:'eroeffnung',base:260,rx:[.5,.1,.3,.1]},// V6 (Whitebeard 4816e73): Büro-Umzug als eigener Post (R41)
 r_aktion:{img:'post-aktion',tag:'Rivale',grp:'aktion',base:200,rx:[.4,.3,.15,.15]},
 r_markt:{img:'post-rivale-eroeffnung',tag:'Rivale',grp:'eroeffnung',base:600,rx:[.3,.05,.15,.5]}};
const TYICO={laden:'shop',aktion:'megaphone',produkt:'box',award:'award',messe:'handshake',boerse:'trend',uebernahme:'handshake',r_eroeffnung:'pin',r_boerse:'trend',r_uebernahme:'handshake',r_pleite:'ghost',r_aktion:'megaphone',r_markt:'pin'};
const USERS=[['Haruka_23','haruka'],['salaryman_kenji','kenji'],['nyan_osaka','nyan'],['oma_tomoko','tomoko'],['onigiri_fan','haruka'],['taro_88','kenji'],['mika.chan','nyan'],['opa_hiro','tomoko']];
// deterministischer Zufall je Post
function hsh(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let x=hsh(seed)||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
const esc=s=>H.esc(String(s==null?'':s));
const fillB=(t,o)=>esc(t).replace(/\{([a-z_]+)\}/g,(m,k)=>o[k]!=null?`<b>${esc(o[k])}</b>`:m);
const chainN=c=>c==='player'?((S.state&&S.state.logo&&S.state.logo.name)||'Hoshi Mart'):((D.CHAINS[c]||{}).name||c);
export const handle=c=>'@'+chainN(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const dn=id=>(D.DMAP[id]||{name:id}).name;
const ladenN=x=>{const n=chainN('player')+' '+dn(x.d);return (x.no||1)>1?n+' #'+x.no:n;};// V6: gleiche Schreibweise wie Finanzen („Shinjuku #2“)
const rivalStores=(s,c)=>s.stores.filter(x=>x.chain===c).length+Object.values(s.away||{}).reduce((a,b)=>a+((b.stores||[]).filter(x=>x.chain===c).length)+(c==='player'?0:0),0);
function fame(s,c){if(c==='player'){const n=s.stores.filter(x=>x.chain==='player').length+Object.values(s.away||{}).reduce((a,b)=>a+(b.stores||[]).filter(x=>x.chain==='player').length,0);
  const camps=s.stores.filter(x=>x.chain==='player').reduce((a,x)=>a+Object.keys((x.cfg&&x.cfg.camps)||{}).length,0);return Math.min(6,1+n*.12+camps*.08+(s.rep||0)/250);}
 return Math.min(5,1+rivalStores(s,c)*.04);}
function mm(s){const m=s.mm=s.mm||{v:1,posts:[],seen:{},seq:0,read:0,cities:{},camp:{},ban:null,banW:0};m.seen=m.seen||{};m.cities=m.cities||{};m.camp=m.camp||{};m.posts=m.posts||[];return m;}
function add(s,m,p){if(m.seen[p.id])return null;m.seen[p.id]=s.week;
 // gleiche Meldung (Typ+Text) innerhalb von 8 Wochen nicht nochmal – kein Spam bei wiederkehrenden Rabattaktionen
 if(m.posts.some(q=>q.k===p.k&&q.t===p.t&&Math.abs((p.w||s.week)-q.w)<8))return null;const T=TY[p.k],r=rng(p.id);
 p.w=Math.min(p.w||s.week,s.week);p.seq=++m.seq;p.h=Math.floor(r()*1e6);p.likes=Math.max(3,Math.round(T.base*fame(s,p.who)*(.8+r()*.4)));p.cm=Math.max(1,Math.round(p.likes*.06*(.85+r()*.3)));
 m.posts.push(p);if(m.posts.length>MAX)m.posts=m.posts.slice(-MAX);
 const ks=Object.keys(m.seen);if(ks.length>600)for(const k of ks.slice(0,ks.length-600))delete m.seen[k];
 return p;}
const clean=t=>String(t||'').replace(/^\s*(?:\p{Extended_Pictographic}|\uFE0F|\s)+/u,'').replace(/^Kobo:\s*/,'').trim();
// News-Bus: welche Meldungen werden Posts (Rest bleibt Zeitung/Bericht)
function newsType(n){const t=n.text||'',pl=n.chain==='player';
 if(pl){if(/Zentrale ist umgezogen/.test(t))return 'buero';if(/Übernahme!|Zuschlag!|Übernahme von .*gelungen/.test(t))return 'uebernahme';if(/Eigenmarke/.test(t))return 'produkt';return null;}
 if(/Meldepflicht|Angebot|angebot|Ritter|Fremdbesitz|droht|Kaufangebot|Annahmefrist|Stimmen|Bietverfahren/.test(t))return null;
 if(/an die Börse/.test(t))return null;// kommt aus fz.rv (mit Kurs)
 if(/kommt nach Japan|eröffnet den erst|japanischen Markt/.test(t))return 'r_markt';
 if(/übernimmt|Übernahme/.test(t))return 'r_uebernahme';
 if(/pleite|Insolvenz|liquidiert|zieht sich/.test(t))return 'r_pleite';
 if(/Rabattaktion/.test(t))return 'r_aktion';
 return null;}
// Alle Quellen einsammeln; ruhig (ohne Posts) beim ersten Lauf bzw. beim ersten Besuch einer Stadt
export function collect(s){s=s||S.state;if(!s||!s.stores)return 0;const m=mm(s),first=!m.init,city=s.city||CITY.id,quietCity=!m.cities[city];let n=0;
 const P=p=>{if(first||(quietCity&&p.city===city&&p.k==='r_eroeffnung')){m.seen[p.id]=s.week;return;}if(add(s,m,p))n++;};
 const me=s.stores.filter(x=>x.chain==='player');
 // eigene Läden
 for(const x of me){if(x.build>0||(x.opened||0)>s.week)continue;
  P({id:'o:'+city+':'+x.id,k:'laden',who:'player',city,d:x.d,sid:x.id,t:fillB(TX('post_neuer_laden'),{stadtteil:CITY.name+' · '+dn(x.d),laden:ladenN(x)})});
  // Award: BuuHuu 4,5 bzw. 5 Geister erstmals erreicht
  const g=x.bh&&x.bh.overall||0;for(const lv of [4.5,5])if(g>=lv)P({id:'a:'+city+':'+x.id+':'+lv,k:'award',who:'player',city,d:x.d,sid:x.id,t:fillB(TX('post_award'),{laden:ladenN(x),geister:String(lv).replace('.',',')})});
  // Kampagnen: je Start ein Post
  for(const cid of Object.keys((x.cfg&&x.cfg.camps)||{})){const ck=x.id+':'+cid;m.camp[ck]=m.camp[ck]||s.week;const cp=(D.CAMPAIGNS||[]).find(c=>c.id===cid);
   P({id:'c:'+city+':'+ck+':'+m.camp[ck],k:'aktion',who:'player',city,d:x.d,sid:x.id,t:fillB(TX('post_aktion'),{laden:ladenN(x)})+(cp?` <b>${esc(cp.name)}</b>`:'')});}}
 {const act=new Set(me.flatMap(x=>Object.keys((x.cfg&&x.cfg.camps)||{}).map(c=>x.id+':'+c)));for(const k of Object.keys(m.camp))if(!act.has(k)&&me.some(x=>k.startsWith(x.id+':')))delete m.camp[k];}
 // neue Produkte im Sortiment
 const art=(s.sortiment&&s.sortiment.art)||{};if(!m.art)m.art=Object.keys(art);else{const kn=new Set(m.art);for(const [id,a] of Object.entries(art))if(!kn.has(id)){m.art.push(id);const x=me[0];
  P({id:'p:'+id,k:'produkt',who:'player',city,d:x&&x.d,sid:x&&x.id,t:fillB(TX('post_neues_produkt'),{produkt:a.name||id})});}}
 // Rivalen-Eröffnungen: erster Laden einer Kette in einem Viertel
 for(const x of s.stores){if(x.chain==='player'||!D.CHAINS[x.chain])continue;P({id:'r:'+city+':'+x.chain+':'+x.d,k:'r_eroeffnung',who:x.chain,city,d:x.d,t:fillB(TX('rivale_eroeffnung'),{rivale:chainN(x.chain),stadtteil:CITY.name+' · '+dn(x.d)})});}
 // Börse (Spieler + Rivalen) aus dem Finanzmenü
 const fz=s.fz;if(fz){if(fz.ipo)P({id:'ipo:player',k:'boerse',who:'player',city,t:`<b>${esc(chainN('player'))}</b> ist jetzt an der Börse! ${fz.ipo.streu} % Streubesitz – danke für euer Vertrauen.`});
  for(const [c,r] of Object.entries(fz.rv||{}))if(r&&r.boerse&&D.CHAINS[c])P({id:'ipo:'+c,k:'r_boerse',who:c,city,w:r.boerse.woche,t:fillB(TX('rivale_boersengang'),{rivale:chainN(c)})+` Erster Kurs <b>¥${Math.round(r.boerse.k).toLocaleString('de-DE')}</b>.`});}
 // Nachrichten (Übernahmen, Insolvenzen, Rabattaktionen, neue Ketten)
 for(const ns of (s.news||[]).slice().reverse()){const k=newsType(ns);if(!k)continue;const who=ns.chain==='player'?'player':ns.chain;if(who!=='player'&&!D.CHAINS[who])continue;
  P({id:'n:'+(ns.id||((ns.week||s.week)+':'+hsh(ns.text))),k,who,city,w:ns.week||s.week,t:clean(k==='buero'?String(ns.text).replace(/<[^>]+>/g,''):ns.text)});}
 // Konbini-Awards (Jahreswertung) – eigener Platz 1–3
 {const k=s.lastReport&&s.lastReport.kdj;if(k&&k.rang>=1&&k.rang<=3)P({id:'kdj:'+k.jahr,k:'award',who:'player',city,t:`<b>${esc(chainN('player'))}</b> ist Platz ${k.rang} bei den Konbini-Awards ${esc(k.jahr)}! ありがとう!`});}
 m.init=1;m.cities[city]=1;
 // Push-Banner: höchstens 1 je Woche, nur große Ereignisse
 if(n&&m.banW!==s.week){const big=m.posts.filter(p=>p.w>=s.week-1&&p.seq>m.seq-n&&(p.k==='r_boerse'||p.k==='r_uebernahme'||p.k==='award'||p.k==='uebernahme'||p.k==='r_markt'||(p.k==='r_eroeffnung'&&me.length&&me.some(x=>x.d===p.d))));
  if(big.length){m.ban=big[big.length-1].id;m.banW=s.week;}}
 return n;}
// Wochen-Hook (sim.endWeek → weekHooks); Konbini-Awards kommen erst danach in lastReport und werden beim nächsten collect() gepostet
export function weekHook(s){try{collect(s);}catch(e){console.warn('MiteMite',e);}}
export const unread=s=>{s=s||S.state;if(!s||!s.mm)return 0;return s.mm.posts.filter(p=>p.seq>(s.mm.read||0)).length;};
export function button(){try{collect();}catch(e){console.warn('MiteMite',e);}const n=unread();
 return `<button class="mmbtn" data-act="mm" data-v="open" aria-label="MiteMite! öffnen${n?` – ${n} neu`:''}"><img src="${G}mitemite-logo.svg" alt="" width="34" height="34">${n?`<i class="mmdot">${n>9?'9+':n}</i>`:''}</button>`;}
export function weekPosts(s){s=s||S.state;return s&&s.mm?s.mm.posts.filter(p=>p.w===s.week-1||p.w===s.week).length:0;}
// ---------- Darstellung ----------
function ago(p,s){const w=Math.min(p.w,s.week),a=Math.max(0,s.week-w-1);if(a<=0)return `vor ${1+p.h%22} Std.`;if(a===1)return 'vor 1 Woche';if(a<5)return `vor ${a} Wochen`;const d=S.weekDate(w);return `KW ${S.kw(w)}/${String(d.getFullYear()).slice(2)}`;}// V6: Spiel-KW, ältere Posts mit Jahr (KW 45/26), nie Zukunft
const fmt=n=>Math.round(n).toLocaleString('de-DE');
const own=p=>p.who==='player';
function card(p,s,det){const T=TY[p.k]||TY.r_markt;
 return `<article class="mmpost${own(p)?' own':''}" data-k="${p.k}"${det?'':` data-act="mm" data-v="post" data-x="${esc(p.id)}"`}>
 <header><span class="mmav">${H.chainLogo(p.who,40)}</span><div class="mmwho"><b>${esc(chainN(p.who))}</b><small>${esc(handle(p.who))} · ${ago(p,s)}</small></div><i class="mmtyp">${ico(TYICO[p.k]||'star',18)}</i></header>
 <p>${p.t}</p>${det?illu(p):''}
 <footer><span class="mmlk">${ico('heart',14)} ${fmt(p.likes)}</span><span>${ico('comment',14)} ${fmt(p.cm)}</span><span>${ico('share',14)} Teilen</span><em class="mmtag${own(p)?' own':''}">${esc(T.tag)}</em></footer></article>`;}
function illu(p){if(p.k==='laden')return `<div class="mmillu"><img src="${G}illu-neuer-laden.svg" alt=""></div>`;const T=TY[p.k]||TY.r_markt;return `<div class="mmillu sm"><img src="${G}${T.img}.svg" alt=""></div>`;}
function storeOf(s,p){return p.sid!=null?s.stores.find(x=>x.id===p.sid):null;}
// Tonlage aus BuuHuu-Bewertung, Kritik aus echter Schwachstelle
function mood(s,p){const x=storeOf(s,p);let g=x&&x.bh?x.bh.overall:null;
 if(g==null){const me=s.stores.filter(y=>y.chain==='player'&&y.bh);g=me.length?me.reduce((a,y)=>a+y.bh.overall,0)/me.length:3;}
 const pos=Math.max(.15,Math.min(.95,(g-1.2)/3.4+(own(p)?.05:-.1)));
 let weak=null;if(x&&x.bh){const c=[['auswahl',x.bh.auswahl],['service',x.bh.service],['sauber',x.bh.sauber]].sort((a,b)=>a[1]-b[1])[0];weak=c[0];
  const px=Object.values((x.cfg&&x.cfg.px)||{});const avg=px.length?px.reduce((a,b)=>a+b,0)/px.length:1;if(avg>1.08&&c[1]>=3)weak='preis';}
 else weak=['service','auswahl','preis'][p.h%3];
 return {pos,weak};}
const KRITIK={auswahl:['leere Regale','Sortiment erweitern'],service:['Schlange an der Kasse','mehr Personal einplanen'],sauber:['Sauberkeit','Reinigung verbessern'],preis:['Preise','Preise prüfen']};
function rivalNear(s,p){const c=s.stores.filter(x=>x.chain!=='player'&&D.CHAINS[x.chain]);const r=c.find(x=>x.d===p.d)||c[p.h%Math.max(1,c.length)];return r?chainN(r.chain):(D.RIVALS[0]?chainN(D.RIVALS[0]):'der Konkurrenz');}
function comments(s,p){const r=rng(p.id+':c'),n=3+Math.floor(r()*3),{pos,weak}=mood(s,p),x=storeOf(s,p);
 const o={stadtteil:p.d?dn(p.d):CITY.name,rivale:own(p)?rivalNear(s,p):chainN(p.who),laden:x?ladenN(x):chainN('player')};
 const P=TX('kommentare_positiv'),N=TX('kommentare_neutral'),NG=TX('kommentare_negativ'),R=TX('kommentare_rivale');
 const neg={auswahl:NG[0],service:NG[1],preis:NG[2]}[weak]||N[0];
 const used=new Set(),out=[];const us=USERS.slice().sort((a,b)=>hsh(p.id+a[0])-hsh(p.id+b[0]));
 for(let i=0;i<n;i++){const q=r();let pool=own(p)?(q<pos?P:q<pos+(1-pos)*.45?N:[neg]):(q<.6?R:N);let t=pool[Math.floor(r()*pool.length)];if(used.has(t)){t=(own(p)?P:R).find(z=>!used.has(z))||N.find(z=>!used.has(z));}if(!t)break;used.add(t);
  out.push({u:us[i%us.length],t:t.replace(/\{([a-z_]+)\}/g,(m,k)=>o[k]!=null?o[k]:m),h:Math.max(1,Math.round(p.likes*(.17-i*.03)*(.8+r()*.4))),a:i===0?`vor ${1+p.h%3} Std.`:`vor ${Math.max(5,60-i*12-Math.floor(r()*10))} Min.`});}
 return {list:out,pos,weak};}
function reactions(p){const T=TY[p.k]||TY.r_markt,n=['herz','lecker','party','staunen'];let rest=p.likes;
 return n.map((k,i)=>{const v=i<3?Math.round(p.likes*T.rx[i]):rest;rest-=v;return `<span class="mmrx"><img src="${G}reaktion-${k}.svg" alt="${k}" width="24" height="24">${fmt(Math.max(0,v))}</span>`;}).join('');}
function detail(s,p){const C=comments(s,p),K=KRITIK[C.weak]||KRITIK.service,pc=Math.round(C.pos*100);
 const tip=own(p)?(C.pos<.55?` · Kritik: ${esc(K[0])} → <b>Kobo-Tipp:</b> ${esc(K[1])}`:` · Kritik: ${esc(K[0])} → Tipp: ${esc(K[1])}`):` · <b>Kobo:</b> ${p.k==='r_eroeffnung'&&s.stores.some(x=>x.chain==='player'&&x.d===p.d)?'Behalte die Preise in '+esc(dn(p.d))+' im Blick.':'Gute Gelegenheit, unsere Stärken zu zeigen.'}`;
 return `<div class="mmhead det"><button class="mmback" data-act="mm" data-v="back" aria-label="Zurück">${ico('back',22)}</button><h2>Beitrag</h2><button class="mmcirc" data-act="mm" data-v="close" aria-label="Schließen">${ico('close',18)}</button></div>
 ${card(p,s,true)}<div class="mmrxs">${reactions(p)}</div>
 <div class="mmlbl">Kundenkommentare · ${fmt(p.cm)}</div>
 <div class="mmcm">${C.list.map(c=>`<div class="mmc"><img src="${G}avatar-${c.u[1]}.svg" alt="" width="40" height="40"><div><b>${esc(c.u[0])}</b><p>${esc(c.t)}</p><small>${c.a} · ${fmt(c.h)} Herzen · Antworten</small></div></div>`).join('')}</div>
 <div class="mmmood">Stimmung: <b class="${pc>=50?'pos':'neg'}">${pc} % positiv</b>${tip}</div>`;}
const TABS=[['wir','Wir'],['konk','Konkurrenz'],['alle','Alle']],TYPS=[['alle','Alle Typen',null],['eroeffnung','Eröffnung','pin'],['boerse','Börse','trend'],['uebernahme','Übernahme','handshake']];
function head(s){const m=mm(s),bell=m.posts.filter(p=>p.w>=s.week-1).length;
 return `<div class="mmhead"><img class="mmlogo" src="${G}mitemite-schriftzug.svg" alt="MiteMite! 見て見て · Konbini-News"><div class="mmhb">
 <button class="mmcirc" data-act="mm" data-v="nav" data-x="such" aria-label="Suchen">${ico('search',18)}</button>
 <button class="mmcirc" data-act="mm" data-v="nav" data-x="meld" aria-label="Meldungen">${ico('bell',18)}${bell?`<i class="mmdot">${bell>9?'9+':bell}</i>`:''}</button>
 <button class="mmcirc" data-act="mm" data-v="close" aria-label="Schließen">${ico('close',18)}</button></div></div>`;}
function list(s,L,empty){return L.length?L.map(p=>card(p,s)).join(''):`<div class="mmempty"><img src="${G}post-reaktion.svg" alt="" width="72" height="72"><p>${empty}</p></div>`;}
function feed(s){const m=mm(s);let L=m.posts.slice().reverse();
 if(V.tab==='wir')L=L.filter(own);else if(V.tab==='konk'){L=L.filter(p=>!own(p));if(V.typ!=='alle')L=L.filter(p=>(TY[p.k]||{}).grp===V.typ);}
 return `${head(s)}<div class="mmtabs">${TABS.map(([k,l])=>`<button class="${V.tab===k?'on':''}" data-act="mm" data-v="tab" data-x="${k}">${l}</button>`).join('')}</div>
 ${V.tab==='konk'?`<div class="mmchips">${TYPS.map(([k,l,i])=>`<button class="${V.typ===k?'on':''}" data-act="mm" data-v="typ" data-x="${k}">${i?ico(i,14):''}${l}</button>`).join('')}</div>`:''}
 <div class="mmlist">${list(s,L,V.tab==='wir'?'Noch keine Posts von uns. Eröffne einen Laden oder starte eine Aktion!':'Noch nichts los hier. Spiel ein paar Wochen weiter.')}</div>`;}
function such(s){const q=V.q.trim().toLowerCase();const L=mm(s).posts.slice().reverse().filter(p=>!q||(chainN(p.who)+' '+p.t.replace(/<[^>]+>/g,'')).toLowerCase().includes(q));
 return `${head(s)}<div class="mmsearch">${ico('search',18)}<input id="mmq" type="search" placeholder="Ketten, Viertel, Produkte …" value="${esc(V.q)}" data-mmq="1" aria-label="Suchen"></div><div class="mmlist">${list(s,L,'Kein Treffer.')}</div>`;}
function meld(s){const m=mm(s),L=m.posts.slice().reverse().filter(p=>p.w>=s.week-1);return `${head(s)}<div class="mmlbl">Diese Woche · KW ${S.kw(Math.max(1,s.week-1))}</div><div class="mmlist">${list(s,L,'Diese Woche keine neuen Posts.')}</div>`;}
function profil(s){const m=mm(s),L=m.posts.slice().reverse().filter(own),lk=L.reduce((a,p)=>a+p.likes,0),n=s.stores.filter(x=>x.chain==='player').length;
 return `${head(s)}<div class="mmprof">${H.chainLogo('player',64)}<div><b>${esc(chainN('player'))}</b><small>${esc(handle('player'))}</small><div class="mmstat"><span><b>${fmt(L.length)}</b> Posts</span><span><b>${fmt(lk)}</b> Herzen</span><span><b>${fmt(n)}</b> Läden</span></div></div></div><div class="mmlist">${list(s,L,'Noch keine Posts von uns.')}</div>`;}
const NAV=[['feed','Feed','home'],['such','Entdecken','search'],['meld','Meldungen','bell'],['profil','Mein Profil','shop']];
export function render(){const s=S.state;if(!s)return '';collect(s);const p=V.post&&mm(s).posts.find(x=>x.id===V.post);
 const body=p?detail(s,p):V.nav==='such'?such(s):V.nav==='meld'?meld(s):V.nav==='profil'?profil(s):feed(s);
 return `<div class="mmscroll">${body}</div>
 <nav class="mmnav">${NAV.map(([k,l,i])=>`<button class="${(V.nav===k&&!p)||(p&&k==='feed')?'on':''}" data-act="mm" data-v="nav" data-x="${k}">${ico(i,22)}<span>${l}</span></button>`).join('')}</nav>`;}
function el(){let e=document.getElementById('mm');if(!e){e=document.createElement('div');e.id='mm';e.setAttribute('role','dialog');e.setAttribute('aria-label','MiteMite!');document.body.appendChild(e);
 e.addEventListener('input',ev=>{if(ev.target&&ev.target.dataset.mmq){V.q=ev.target.value;const pos=ev.target.selectionStart;draw(false);const i=document.getElementById('mmq');if(i){i.focus();try{i.setSelectionRange(pos,pos);}catch(_){}}}});}return e;}
function draw(top=true){const e=el(),sc=e.querySelector('.mmscroll'),y=sc?sc.scrollTop:0;e.innerHTML=render();const n=e.querySelector('.mmscroll');if(n)n.scrollTop=top?0:y;}
export function open(o={}){close0ban();Object.assign(V,{open:true,post:null},o);const s=S.state;if(s){collect(s);const m=mm(s);m.read=m.seq;S.save();}document.body.classList.add('mmopen');draw();H.rerender();}
export function close(){V.open=false;V.post=null;const e=document.getElementById('mm');if(e)e.remove();document.body.classList.remove('mmopen');H.rerender();}
export const isOpen=()=>V.open;
export function act(b){const v=b.dataset.v,x=b.dataset.x;
 if(v==='open'){open({nav:'feed',post:null});return;}
 if(v==='week'){open({nav:'meld',post:null});return;}
 if(v==='close'){close();return;}
 if(v==='tab'){V.tab=x;V.typ='alle';V.nav='feed';}
 else if(v==='typ')V.typ=x;
 else if(v==='nav'){V.nav=x;V.post=null;}
 else if(v==='post')V.post=x;
 else if(v==='back')V.post=null;
 else if(v==='ban'){const id=x;close0ban();open({post:id});return;}
 draw(v!=='typ');}
// Push-Banner oben, 4 s, Tippen öffnet den Post
let banT=0;function close0ban(){const b=document.getElementById('mmban');if(b)b.remove();clearTimeout(banT);}
export function banner(){const s=S.state;if(!s||!s.mm||!s.mm.ban)return;const id=s.mm.ban;s.mm.ban=null;const p=s.mm.posts.find(q=>q.id===id);if(!p||V.open)return;close0ban();
 const b=document.createElement('button');b.id='mmban';b.dataset.act='mm';b.dataset.v='ban';b.dataset.x=id;
 b.innerHTML=`<img src="${G}mitemite-logo.svg" alt="" width="36" height="36"><span><b>MiteMite! · ${esc(chainN(p.who))}</b><small>${p.t.replace(/<[^>]+>/g,'').slice(0,90)}</small></span>`;
 document.body.appendChild(b);banT=setTimeout(close0ban,4000);}
