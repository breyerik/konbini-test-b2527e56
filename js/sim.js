// Konbini Empire v2 – Wirtschaftssimulation
import {SLOT_MIGRATION,PLAN_REV,lotSlot,OMA_SHOP,starterBuild,slotOpen,unlockedCount,PLAN_SLOTS,SAVE_KEY,START,MONTHS,CATS,DISTRICTS,DMAP,INIT_RIVALS,BASE_CUST,COST,PRICE,SERVICES,SVC_KEYS,SVC_TYPE_MUL,CHAINS,RIVALS,TRAITS,FAMILY,GIVEN_F,GIVEN_M,defaultLogo,START_CASH,BUILD_WEEKS,BUILD,EQUIP_KEYS,defaultBuild,buildCost,optPrice,MGR_TIERS,CAMPAIGNS,TIERS,tierOf,TAX,LOAN,CONV,STOCK_INIT,WARDS,AREAS,RIVAL_START,MGR_STD_SALARY} from './data.js';
import {GFX} from './gfx.js';
import {EVENTS,EVENT_RULES,RIVAL_RULES} from './events_data.js';
import {F as FELD,CITY} from './plan.js';
export const rnd=(a,b)=>a+Math.random()*(b-a);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const sum=a=>a.reduce((x,y)=>x+y,0);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
export function weekDate(w){const d=new Date(START);d.setDate(d.getDate()+(w-1)*7);return d;}
export function dateLabel(d){return d.getDate()+'. '+MONTHS[d.getMonth()]+' '+d.getFullYear();}
export const fmtY=n=>{const s=n<0?'−':'';n=Math.abs(n);if(n>=1e6)return s+'¥'+(n/1e6).toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})+' Mio';return s+'¥'+Math.round(n).toLocaleString('de-DE');};
export const fmtN=n=>Math.round(n).toLocaleString('de-DE');
export const pct=n=>(n*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %';
export const sgn=n=>(n>=0?'+':'')+fmtY(n);

/* ---------- Saisons ---------- */
export function seasonInfo(w){
 const d0=weekDate(w),m=d0.getMonth()+1;let s;
 if(m>=3&&m<=5)s={key:'spring',label:'Frühling',emoji:'🌸',desc:'Angenehmes Wetter, normale Nachfrage.',tm:{},cm:{},item:{name:'Sakura-Mochi',emoji:'🌸'}};
 else if(m===6)s={key:'rain',label:'Regenzeit (Tsuyu)',emoji:'☔',desc:'Etwas weniger Kunden, Schirme laufen (Alltagsartikel +30 %).',tm:{all:.96},cm:{alltag:1.3},item:{name:'Ajisai-Gelee',emoji:'🍮'}};
 else if(m===7||m===8)s={key:'summer',label:'Sommer',emoji:'☀️',desc:'Hitze! Getränke ×1,6, Oden gibt es nicht.',tm:{},cm:{},item:{name:'Hiyashi Chūka',emoji:'🍜'},ev:'Sommer'};
 else if(m===9)s={key:'summer',label:'Tsukimi',emoji:'🌕',desc:'Mondfest: Tsukimi-Burger als Saisonware.',tm:{},cm:{saison:1.4},item:{name:'Tsukimi-Burger',emoji:'🍔'}};
 else if(m===10||m===11)s={key:'autumn',label:'Herbst',emoji:'🍁',desc:'Oden-Saison (×1,4), heißer Kaffee ×1,3.',tm:{},cm:{},item:{name:'Maronen-Mont-Blanc',emoji:'🌰'}};
 else s={key:'winter',label:'Winter',emoji:'❄️',desc:'Kalt: Oden ×2, heißer Kaffee ×1,6.',tm:{},cm:{},item:{name:'Nikuman',emoji:'🥟'}};
 const SP=[
  {f:[325,412],key:'hanami',ev:'Hanami',label:'Hanami',emoji:'🌸',desc:'Kirschblüte! Onigiri, Bentō, Getränke +25 %, Touristen +30 %.',tm:{tourist:1.3,residential:1.05},cm:{onigiri:1.25,bento:1.25,drinks:1.2,saison:1.6}},
  {f:[429,506],ev:'Golden Week',label:'Golden Week',emoji:'🎏',desc:'Feiertage: Büroviertel −45 %, Uni −30 %, Touristen +35 %.',tm:{tourist:1.35,office:.55,residential:1.08,uni:.7,nightlife:1.1}},
  {f:[811,817],ev:'Obon',label:'Obon',emoji:'🏮',desc:'Viele fahren heim: Büro & Uni leer, Tourismus voll.',tm:{office:.6,uni:.6,tourist:1.2,residential:.9}},
  {f:[1218,1225],ev:'Weihnachten',label:'Weihnachten',emoji:'🎄',desc:'Weihnachtstorten auf Vorbestellung! Saisonware ×3, ohne Abschrift.',cm:{saison:3},tm:{nightlife:1.2},item:{name:'Weihnachtskuchen',emoji:'🎂'}},
  {f:[1228,1231],label:'Neujahr',emoji:'🎍',desc:'Büros zu, Hatsumōde: Tourismus +40 %.',tm:{office:.35,uni:.5,residential:1.15,tourist:1.4},cm:{saison:1.5}},
  {f:[101,104],label:'Neujahr',emoji:'🎍',desc:'Büros zu, Hatsumōde: Tourismus +40 %.',tm:{office:.35,uni:.5,residential:1.15,tourist:1.4},cm:{saison:1.5}},
  {f:[128,203],ev:'Setsubun',label:'Setsubun',emoji:'👹',desc:'Ehōmaki-Rollen! Saisonware ×2,6.',cm:{saison:2.6},item:{name:'Ehōmaki',emoji:'🍣'}},
  {f:[207,214],label:'Valentinstag',emoji:'🍫',desc:'Schokolade gefragt: Saisonware ×1,8.',cm:{saison:1.8},item:{name:'Giri-Choco',emoji:'🍫'}},
 ];
 for(let i=0;i<7;i++){const d=new Date(d0);d.setDate(d.getDate()+i);const md=(d.getMonth()+1)*100+d.getDate();
  const sp=SP.find(x=>md>=x.f[0]&&md<=x.f[1]);
  if(sp){const tm={...s.tm},cm={...s.cm};for(const k in sp.tm||{})tm[k]=(tm[k]||1)*sp.tm[k];for(const k in sp.cm||{})cm[k]=(cm[k]||1)*sp.cm[k];return {key:sp.key||s.key,base:s.key,evName:sp.ev||s.ev,label:sp.label,emoji:sp.emoji,desc:sp.desc,tm,cm,item:sp.item||s.item,special:true};}
 }
 s.base=s.key==='rain'?'rain':s.key;s.evName=s.ev;return s;
}
export function seasonFactor(k,ev){const b=ev.base||ev.key;if(b==='rain')return (k.sf.spring+k.sf.summer)/2;return k.sf[b==='hanami'?'spring':b]??1;}
// Saisonware: Artikel aus Bobs preise.csv passend zum Event, sonst Platzhalter
export function saisonFor(ev){
 const items=(GFX.prices&&GFX.prices.saison&&GFX.prices.saison.rows)||[];
 const m=ev.evName?items.filter(r=>(r.hinweis||'').includes(ev.evName)):[];
 if(m.length){const vk=sum(m.map(r=>r.vk))/m.length,ek=sum(m.map(r=>r.ek))/m.length;return {names:m.map(r=>r.produkt),name:m[0].produkt.replace(/ \(.*\)/,''),price:vk,cost:ek/vk,f:1,emoji:ev.item.emoji,preorder:ev.evName==='Weihnachten'};}
 return {names:[ev.item.name],name:ev.item.name,price:300,cost:.7,f:.5,emoji:ev.item.emoji};
}

/* ---------- State ---------- */
export let state=null;
export function setState(s){state=s;}
export const totalSlots=sum(DISTRICTS.map(d=>d.slots));
export const CALIB={k:.62}; // Gesamt-Kalibrierung der Umsätze (aus Bobs Simulation)
export function rivalCfg(){return{cats:Object.fromEntries(CATS.map(c=>[c.id,true])),price:1,night:true}}
export function playerCfg(){return{cats:Object.fromEntries(CATS.map(c=>[c.id,true])),px:{},night:true,svc:{},svcSince:{},camps:{}}}
export function newState(logo){
 const s={v:5,city:CITY.id,planRev:PLAN_REV,logo:logo||defaultLogo(),week:1,cash:START_CASH,loan:0,loanPay:0,rep:10,nextId:1,stores:[],campaigns:[],hist:[],news:[],paper:[],milestones:{},cum:{rev:0,profit:0},lastReport:null,flow:{inv:0,fin:0},lossCF:0,tut:{},tutOff:false,taxCut:true};
 // v3.1: alle Ketten starten ohne Läden; die Plan-Läden sind nur mögliche Standorte
 // v3.2: Spieler übernimmt „Omas Laden“ (fertig gebaut, schlichte Ausstattung, 1–2 Aushilfen, keine Nachtschicht)
 {const sh=OMA_SHOP,b=starterBuild(),cfg=playerCfg();
  s.stores.push({id:s.nextId++,chain:'player',d:sh.d,slot:sh.i,tier:sh.tier,no:1,oma:true,starter:true,name:'Omas Laden',opened:1,build:0,cfg,b,mgr:omaManager(),deleg:{staff:false,prod:false,mkt:false,inc:false},deposit:0,invest:Math.round(buildCost(b)*.4),bh:{sauber:3,frische:3,service:3,auswahl:3,overall:3}});}
 placeStartRivals(s);
 return s;
}
// Omas Laden startet mit einer Filialleitung (Junior, solide Werte)
function omaManager(){const m=genManager();const t=MGR_TIERS[1];return {...m,name:'Haruko Sato',female:true,age:58,avatar:'👵',stufe:t.stufe,skills:{service:3,einkauf:3,verkauf:3,effizienz:3},traits:['charme'],salary:MGR_STD_SALARY,expect:MGR_STD_SALARY,morale:75,weeks:0,xp:0};}
// Start-Rivalen laut RIVAL_START (gilt bis Erik entscheidet)
function placeStartRivals(s){const R=RIVAL_START,cnt={};for(const d of DISTRICTS)cnt[d.id]=0;
 const chains=R.mode==='perChain'?Array.from({length:R.perChain},()=>RIVALS).flat():RIVALS.slice(0,R.total);// reihum, damit sich die Ketten verteilen
 for(const c of chains){let best=null;
  for(const d of DISTRICTS){if(R.mode==='total'&&cnt[d.id])continue;const sameChain=s.stores.filter(x=>x.d===d.id&&x.chain===c).length;
   for(let i=0;i<d.slots;i++){/* Rivalen stehen auf Plan-Läden außerhalb der 20 freien Standorte und nicht auf Omas Laden */
    if(slotOpen(d.id,i,1)||s.stores.some(x=>x.d===d.id&&x.slot===i))continue;
    const sc=TIERS[tierOf(d.id,i)].pass/Math.pow(1+cnt[d.id]+2*sameChain,2);if(!best||sc>best.sc)best={d:d.id,i,sc};}}
  if(!best)break;cnt[best.d]++;
  s.stores.push({id:s.nextId++,chain:c,d:best.d,slot:best.i,tier:tierOf(best.d,best.i),opened:1,cfg:rivalCfg(),b:defaultBuild(),build:0});}
}
// Spielstände: 3 Slots (Slot 1 = bisheriger Autosave-Schlüssel), Autosave in den aktiven Slot
export const SLOTS_N=3;
const CK='';// v6: eine Firma, ein Spielstand für alle Städte (alte '-yokohama'-Stände werden ignoriert)
export const slotKey=n=>n===1?SAVE_KEY+CK:SAVE_KEY+CK+'-'+n;
export function save(){try{if(!state)return;state.savedAt=Date.now();tagLots(state);localStorage.setItem(slotKey(state.slot||1),JSON.stringify(state))}catch(e){}}
export function slotInfo(n){const s=load(n);return s?{slot:n,lost:!!s.lost,week:s.week,cash:s.cash,savedAt:s.savedAt||null,name:s.logo&&s.logo.name,stores:s.stores.filter(x=>x.chain==='player').length+sum(awayStores(s).map(a=>a.n)),city:s.city}:null;}
export function listSlots(){return Array.from({length:SLOTS_N},(_,i)=>slotInfo(i+1));}
export function anySave(){return listSlots().some(Boolean);}
const NAME_MAP=[[/8-Twelve/g,'Eight'],[/エイト・トゥエルブ/g,'エイト'],[/FamiliaMart/g,'Familia'],[/ファミリアマート/g,'ファミリア'],[/MiniHalt/g,'Minihalt']];
export function migrateNames(raw){return raw==null?raw:NAME_MAP.reduce((t,[r,n])=>t.replace(r,n),raw)}
// V4: Läden, die wegen der Wolkenkratzer umgezogen sind, bekommen ihren neuen Slot (alte Spielstände laufen weiter)
// Läden mit gespeicherter Grundstücks-ID (ab V4) folgen ihrem Grundstück, egal mit welcher Turm-Platzierung gespeichert wurde
export function migrateSlots(s){const old=(s.planRev||1)<2;for(const x of s.stores||[]){if(x.lot!=null){const m=lotSlot(x.lot);if(m){x.d=m.d;x.slot=m.i;}continue;}if(old){const m=SLOT_MIGRATION[x.d+':'+x.slot];if(m){x.d=m.d;x.slot=m.i;}}}s.planRev=PLAN_REV;return s;}
const tagLots=s=>{for(const x of s.stores||[]){const sh=PLAN_SLOTS[x.d]&&PLAN_SLOTS[x.d][x.slot];if(sh)x.lot=sh.id;}};
export function load(n=1){try{const s=JSON.parse(migrateNames(localStorage.getItem(slotKey(n))));if(s&&s.v===5){s.slot=n;s.city=s.city||'tokio';s.evMods=s.evMods||[];s.priceActs=s.priceActs||{};return migrateSlots(switchCity(s))}}catch(e){}return null}
// Zweite Stadt: Läden/Rivalen/Aktionen der gerade nicht besuchten Stadt ruhen in s.away[stadt];
// deren Filialen liefern weiter ihr letztes Wochenergebnis. Erster Besuch: keine Omas Laden, 0 Rivalen.
export function switchCity(s){const c=CITY.id;if(s.city===c)return s;s.away=s.away||{};
 const op=sum(s.stores.filter(x=>x.chain==='player').map(x=>x.last&&x.last.op||0));
 s.away[s.city]={stores:s.stores,priceActs:s.priceActs,evMods:s.evMods,campaigns:s.campaigns,planRev:s.planRev,op};
 const b=s.away[c];delete s.away[c];
 if(b){s.stores=b.stores;s.priceActs=b.priceActs||{};s.evMods=b.evMods||[];s.campaigns=b.campaigns||[];s.planRev=b.planRev||PLAN_REV;}
 else{s.stores=[];s.priceActs={};s.evMods=[];s.campaigns=[];s.planRev=PLAN_REV;placeStartRivals(s);s.cityFrom=s.cityFrom||{};s.cityFrom[c]=s.week;}
 s.city=c;s.lastReport=null;return s;}
export const awayStores=s=>Object.entries(s.away||{}).map(([c,a])=>({city:c,n:a.stores.filter(x=>x.chain==='player').length,op:a.op||0}));
// Stadtwechsel-Marker
export const rivalFinanz={on:false};
export const rivalNur={};// Kette → erlaubte Viertel-Typen (Tsubame Eki nur Bahnhöfe)
export const weekHooks=[];
export const mine=()=>state.stores.filter(s=>s.chain==='player');
export const inD=id=>state.stores.filter(s=>s.d===id);
export function siteInfo(did,i){
 const t=TIERS[tierOf(did,i)],h=((did.charCodeAt(0)*31+i*17+did.length*7)%97),ar=AREAS[did]||DMAP[did].areas||[DMAP[did].name];
 return {tier:t,rentM:t.rentM,rentW:Math.round(t.rentM*12/52),deposit:Math.round(t.rentM*t.depM),pass:t.pass,address:`${ar[i%ar.length]} ${1+(h%5)}-${1+(h*3%29)}-${1+(h*7%19)}, ${CITY.name}`,ward:WARDS[did]||DMAP[did].ward||DMAP[did].name};
}
export const storeRentW=s=>Math.round(TIERS[s.tier||tierOf(s.d,s.slot)].rentM*12/52);
export function foodTaxCut(w=state.week){if(state&&state.taxCut===false)return false;const d=weekDate(w);return d>=TAX.cutFrom&&d<=TAX.cutTo;}
/* Anlagen */
export function assets(s){const o=[];for(const k of Object.keys(BUILD)){const i=s.b[k];if(i==null||i<0)continue;const x=BUILD[k].opts[i];if(!x)continue;o.push({k,price:x.price*(x.n||1),dep:x.dep||6,building:k==='fac'||k==='inn'});}return o;}
export const invested=s=>sum(assets(s).map(a=>a.price));
export const depWeekly=s=>sum(assets(s).map(a=>a.price/(a.dep*52)));
export function bookValue(s){const age=Math.max(0,state.week-(s.opened||0));return sum(assets(s).map(a=>a.price*Math.max(0,1-age/(a.dep*52))));}
export function equity(){return state.cash+sum(mine().map(s=>bookValue(s)+(s.deposit||0)))-state.loan;}
export const brand=c=>c==='player'?0.9+state.rep/300:CHAINS[c].brand;
export const chainName=c=>c==='player'?state.logo.name:CHAINS[c].name;
export function freeSlots(did){const used=new Set(inD(did).map(s=>s.slot));return Array.from({length:DMAP[did].slots},(_,i)=>i).filter(i=>!used.has(i)&&slotOpen(did,i,state.week));}
export const openCount=()=>unlockedCount(state.week);
export const freeTotal=()=>sum(DISTRICTS.map(d=>freeSlots(d.id).length));
export function storeLabel(s){return s.name||`${DMAP[s.d].name} #${s.no||1}`}
export const openCostParts=(did,i,b)=>{const si=siteInfo(did,i);return {bau:buildCost(b),deposit:si.deposit,ware:STOCK_INIT};};
export const openCost=(did,i,b)=>{const p=openCostParts(did,i,b);return p.bau+p.deposit+p.ware;};
/* Kredit (Bob: 4,5 %, 10 Jahre, Annuität, ab Monat 7, max 48 Mio) */
export const loanAvailable=()=>state.week>=LOAN.fromWeek;
export const loanRoom=()=>Math.max(0,LOAN.max-state.loan);
function annuity(L){const r=LOAN.rate/52,n=520;return L<=0?0:L*r/(1-Math.pow(1+r,-n));}
export function takeLoan(v){if(!loanAvailable())return {err:`Die Bank will erst 6 Monate Zahlen sehen (ab KW ${LOAN.fromWeek}).`};if(v>loanRoom())return {err:'Kreditrahmen von ¥48 Mio ausgeschöpft'};state.loan+=v;state.cash+=v;state.flow.fin+=v;state.loanPay=annuity(state.loan);save();return {ok:1};}
export function repayLoan(v){v=Math.min(v,state.loan,Math.max(0,state.cash));if(v<=0)return {err:'Nicht genug Geld'};state.loan-=v;state.cash-=v;state.flow.fin-=v;state.loanPay=annuity(state.loan);save();return {ok:1};}

/* ---------- Filialleiter ---------- */
let mid=1;
const qz=x=>Math.max(1,Math.min(5,Math.round(x*2)/2));
export function genManager(){
 const f=Math.random()<.5,r=Math.random();
 const t=r<.03?MGR_TIERS[3]:r<.25?MGR_TIERS[2]:r<.65?MGR_TIERS[1]:MGR_TIERS[0];
 const sk={service:qz(t.sk[0]+rnd(-.6,.6)),einkauf:qz(t.sk[1]+rnd(-.6,.6)),verkauf:qz(t.sk[2]+rnd(-.6,.6)),effizienz:qz(t.sk[3]+rnd(-.6,.6))};
 const pool=Object.keys(TRAITS).filter(x=>x!=='chaot'),traits=[pick(pool)];if(Math.random()<.25)traits.push(pick(pool));if(Math.random()<.12)traits.push('chaot');
 const tot=sum(Object.values(sk)),salary=Math.round((t.salary+(tot-sum(t.sk))*180000+rnd(-150000,150000))/10000)*10000;
 const age=Math.floor(rnd(24,60)),mm=Math.round(rnd(6,120));
 return {id:Date.now().toString(36)+(mid++),name:pick(FAMILY)+' '+pick(f?GIVEN_F:GIVEN_M),female:f,age,avatar:age>52?(f?'👵':'👴'):(f?'👩‍💼':'👨‍💼'),stufe:t.stufe,skills:sk,traits:[...new Set(traits)],salary,expect:salary,xp:0,morale:72,weeks:0,empM:mm+Math.round(rnd(0,24)),mgrM:Math.round(mm*rnd(.1,.6))};
}
export function genCandidates(n=3){return Array.from({length:n},genManager).sort((a,b)=>b.salary-a.salary);}
export const mgrStars=m=>sum(Object.values(m.skills))/4;
const BASE_SK={service:2.5,einkauf:2.5,effizienz:2.5,verkauf:2.5};
export function mgrFx(s){
 const m=s&&s.mgr,dg=(s&&s.deleg)||{};
 const eff=(k,flag)=>m&&dg[flag]?m.skills[k]:(m?Math.max(BASE_SK[k],BASE_SK[k]+(m.skills[k]-2.5)*0.35):BASE_SK[k]);
 const t=x=>!!m&&m.traits.includes(x);
 const men=eff('service','staff'),prod=eff('einkauf','prod'),mkt=eff('verkauf','mkt'),eth=eff('effizienz','inc');
 return {men,prod,mkt,eth,sf:.9+.04*men+(t('charme')?.04:0),sigma:Math.max(.03,.22-.035*prod)*(t('frische')?.7:1),wageMul:(1.12-.04*men)*(t('sparfuchs')?.94:1),basket:1+.025*(mkt-1),capMul:1+.03*men};
}
/* ---------- Ladeneffekte ---------- */
const OPT=(s,k)=>{const i=s.b[k];return i>=0&&BUILD[k].opts[i]?BUILD[k].opts[i]:null;};
export function storeFx(s,ev){
 const d=DMAP[s.d],fac=OPT(s,'fac'),inn=OPT(s,'inn'),pos=OPT(s,'pos'),self=OPT(s,'self'),fr=OPT(s,'fridge'),cf=OPT(s,'coffee'),sm=OPT(s,'smoothie'),hot=OPT(s,'hot');
 let attr=((fac?fac.q:2)-3)*.012+((inn?inn.q:3)-3)*.012+(fac&&fac.night?fac.night*d.night:0)+(fac&&fac.tourist&&d.type==='tourist'?fac.tourist:0);
 if(inn&&inn.eat&&['office','uni','tourist'].includes(d.type))attr+=.02;
 const m=mgrFx(s);
 const cap=7700*((pos?pos.prod:3)/3)*(self?1+(self.prod-3)*.07+.05:1)*m.capMul;
 const cold=ev&&['winter','autumn'].includes(ev.key);
 const cm={coffee:cf?[.8,1,1.4][Math.min(2,Math.max(0,(cf.q>=5?2:cf.q>=3?1:0)))]*(inn&&inn.eat?1.12:1):0,
  drinks:(.94+.02*(fr?fr.prod:3))*(sm?1.06:1)*(hot?(cold?1.1:1.03):1),
  bento:(.96+.02*(fr?fr.prod:3))*(inn&&inn.eat?1.1:1),
  oden:s.b.oden>=0?(s.b.oden===1?1.1:1):0,snacks:1*(s.b.fryer>=0?(s.b.fryer===1?1.15:1.08):.92)*(s.b.steamer>=0?1.06:1)};
 const power=COST.powerM*12/52*(fr&&fr.power?1+fr.power:1);
 const dep=depWeekly(s),assetTax=sum(assets(s).filter(a=>!a.building).map(a=>a.price))*.014/52*.6;
 return {attr,cap,cm,power,dep,assetTax,wageMul:self?(self.self?.9:.96):1,m};
}
export function svcStats(s,served){
 const c=s.cfg,d=DMAP[s.d],f=(served||BASE_CUST)/BASE_CUST;let fees=0,work=0,fixed=0;const per={};
 for(const k of SVC_KEYS){if(!c.svc[k])continue;const v=SERVICES[k],tx=v.perDay*7*f*((SVC_TYPE_MUL[k]||{})[d.type]||1);
  per[k]={tx,fee:tx*v.commission,hours:tx*v.work/60};fees+=tx*v.commission;work+=tx*v.work/60;fixed+=v.monthly*12/52;}
 return {fees,work,fixed,per};
}
// v3.2 (Bob): keine Schicht-/Aushilfskräfte mehr. Pro Laden eine Filialleitung; bei „24 Stunden geöffnet“ nur eine Nachtkraft (8 h × Lohn × 1,25)
export function staffPlan(s){return {dayP:0,nightP:1};}// Erik: alle Läden 24/7 → jede Filiale zahlt eine Nachtkraft
export function campCost(s,custRev){let c=0;for(const id in s.cfg.camps||{}){const k=CAMPAIGNS.find(x=>x.id===id);if(!k)continue;c+=(k.weekly||0)+(k.revPct?k.revPct*(custRev||0):0);const st=s.cfg.camps[id];if(st&&st.fresh)c+=(k.once||0)+(k.setup||0);}return c;}
export function storeCosts(s,served){
 const c=s.cfg,fx=storeFx(s),m=fx.m,sv=svcStats(s,served);
 const {dayP,nightP}=staffPlan(s),W=COST.wage,owl=!!s.mgr&&s.mgr.traits.includes('nachteule');
 const daily=nightP*COST.shiftH*W*(1+COST.nightBonus)*(owl?.75:1)+sv.work/7*W;
 const wages=daily*7*(1+COST.lnk)*m.wageMul*fx.wageMul;
 // jeder Laden zahlt eine Filialleitung (ohne eingestellte: Standardgehalt) inkl. Nebenkosten
 const salary=(s.mgr?s.mgr.salary:MGR_STD_SALARY)/52*(1+COST.lnk);
 return {wages,salary,rent:storeRentW(s),mkt:campCost(s,0),admin:14000*12/52+20000,svcFixed:sv.fixed,power:fx.power,fees:sv.fees,svcHours:sv.work,svcPer:sv.per,dayP,nightP,dep:fx.dep,assetTax:fx.assetTax};
}
/* ---------- BuuHuu ---------- */
export const ghostMul=g=>1+.15*(g-3);
export function ghostRound(g){return Math.max(1,Math.min(5,Math.round(g*2)/2));}
export function rateStore(s,r){
 const fx=storeFx(s),m=fx.m,inn=OPT(s,'inn'),fr=OPT(s,'fridge'),pos=OPT(s,'pos'),self=OPT(s,'self'),sh=OPT(s,'shelf'),cf=OPT(s,'coffee');
 const cl=x=>Math.max(1,Math.min(5,x));
 const offered=CATS.filter(k=>s.cfg.cats[k.id]&&!(k.id==='coffee'&&!cf)&&!(k.id==='oden'&&s.b.oden<0)).length/CATS.length;
 const extras=['fryer','steamer','smoothie','hot'].filter(k=>s.b[k]>=0).length;
 const avgpx=sum(CATS.map(k=>(s.cfg.px&&s.cfg.px[k.id])||1))/CATS.length;
 const n={sauber:cl(.9+.35*(inn?inn.q:3)+.35*m.eth),
  frische:cl(3+(.08-(r?r.wasteRate:.08))*20-(r?r.stockout:0)*10+((fr?fr.q:3)-3)*.25+(m.prod-2.5)*.15),
  service:cl(3+(m.men-3)*.4+((pos?pos.prod:3)-3)*.3-(r?r.queue:0)*12+(self?.3:0)),
  auswahl:cl(3+(offered-.85)*8+extras*.18+((sh?sh.q:3)-3)*.2+(cf&&cf.q>=4?.2:0))};
 const adv=s.cfg.camps&&s.cfg.camps.social?.2:0,price=-(avgpx-1)*3;
 const prev=s.bh||{sauber:3,frische:3,service:3,auswahl:3};
 const o={};for(const k in n)o[k]=prev[k]*.55+n[k]*.45;
 for(const id in s.cfg.camps||{}){const c=CAMPAIGNS.find(x=>x.id===id);if(c&&c.bh)for(const k in c.bh)if(o[k]!=null)o[k]=cl(o[k]+c.bh[k]*.4);}
 o.overall=ghostRound(sum(['sauber','frische','service','auswahl'].map(k=>o[k]))/4+price);
 return o;
}
let TEXTE=null;export function setTexte(t){TEXTE=t;}
export function quote(s){
 const q=TEXTE&&TEXTE.buuhuu_stimmen,qs=TEXTE&&TEXTE.buuhuu_stimmen_services;if(!q)return null;
 const g=Math.max(1,Math.min(5,Math.round(s.bh?s.bh.overall:3)));
 const pool=[...(q[String(g)]||[])];
 if(qs){const c=s.cfg.svc,add=(k,pos)=>qs[k]&&(qs[k][pos?'positiv':'negativ']||[]).forEach(x=>pool.push(x));
  if(g>=4){if(c.parcelIn||c.parcelOut)add('paket',1);if(c.atm)add('geldautomat',1);if(s.b.coffee>=1)add('kaffeemaschine',1);if(s.b.smoothie>=0)add('smoothie',1);if(s.b.hot>=0)add('warme_getraenke',1);if(s.b.self>=0)add('selbstkasse',1);if(s.b.oden>=0||s.b.steamer>=0)add('oden_nikuman',1);}
  if(g<=2){if(!c.parcelIn)add('paket',0);if(!c.atm)add('geldautomat',0);if(s.b.self<0)add('selbstkasse',0);if(s.b.hot<0)add('warme_getraenke',0);}}
 return pool.length?pick(pool):null;
}
/* ---------- Woche ---------- */
function runStore(s,d,ev,custExp,cust,events){
 if(s.integ&&state.week<s.integ.bis)cust*=s.integ.kunden;// übernommener Laden: 1 Jahr weniger Kunden (Umstellung)
 const c=s.cfg,fx=storeFx(s,ev),m=fx.m,mg=s.mgr;
 if(mg&&s.deleg&&s.deleg.inc&&mg.traits.includes('chaot')&&Math.random()<.18){cust*=.85;events.push(`🌪️ ${mg.name} hatte in ${storeLabel(s)} eine chaotische Woche (−15 % Kunden).`);}
 else if(!mg||!(s.deleg&&s.deleg.inc)){if(Math.random()<.05*(1-(m.eth-1)/5)){cust*=.9;events.push(`⚠️ Zwischenfall in ${storeLabel(s)}: Ladendiebstahl & Chaos an der Kasse (−10 % Kunden). Ein Filialleiter mit Zwischenfall-Delegation hilft.`);}}
 const served=cust<=fx.cap?cust:fx.cap+(cust-fx.cap)*.2;
 const queue=cust>0?(cust-served)/cust:0,ratio=served/custExp;
 let rev=0,cogs=0,waste=0,wasteU=0,stockU=0,demU=0,lostU=0;const cats={};
 const sa=saisonFor(ev),cut=foodTaxCut();
 const wk=s.cfg.camps||{};
 for(const k of CATS){
  if(!c.cats[k.id]||(k.id==='coffee'&&s.b.coffee<0)||(k.id==='oden'&&s.b.oden<0))continue;
  let price=k.price,costR=k.cost,unitsF=1,fresh=k.fresh;
  if(k.id==='saison'){price=sa.price;costR=sa.cost;unitsF=sa.f*Math.min(1.5,Math.max(.08,300/price));if(sa.preorder)fresh=false;}
  const sfac=seasonFactor(k,ev);if(sfac<=0)continue;
  const pxm=(c.px&&c.px[k.id])||1;
  let campCat=1,campWaste=1;for(const id in wk){const cp=CAMPAIGNS.find(x=>x.id===id);if(!cp)continue;if(cp.cat&&cp.cat[k.id])campCat*=cp.cat[k.id];if(cp.waste)campWaste*=cp.waste[k.id]||cp.waste.all||1;}
  const elast=Math.pow(1/pxm,1.1*(.5+d.ps*.5));
  const dem=custExp*ratio*k.p*d.w[k.id]*sfac*unitsF*(ev.cm[k.id]||1)*(fx.cm[k.id]??1)*campCat*elast*(cut&&k.id!=='alltag'?1.05:1)*CALIB.k;
  const act=dem*rnd(.9,1.1),uc=price*costR;let sold=act;
  if(fresh){const stock=Math.max(0,act*(1+gauss()*m.sigma))*1.04;sold=Math.min(stock,act);const w=(stock-sold)*campWaste;waste+=w*uc;wasteU+=w;stockU+=stock;lostU+=act-sold;demU+=act;}
  const inn=OPT(s,'inn');sold*=1+((inn?inn.q:3)-3)*.015;const r=sold*price*pxm*m.basket;rev+=r;cogs+=sold*uc;cats[k.id]=r;
 }
 // Nachteule: nur noch -25 % Nachtkraft-Kosten (Bob/Erik 21.10.)
 const co=storeCosts(s,served);co.mkt=campCost(s,rev);co.fees*=evSum(s,'fee',1);co.mkt+=evSum(s,'marge',0)/100*rev+evSum(s,'cashWk',0);// Event-Folgen (Bob): Marge-Pp, Mehrkosten/Wo, Paketprovision
 if(s.integ&&state.week>=s.integ.bis)cogs*=s.integ.ek;// nach der Integration: bessere Einkaufskonditionen
 const gross=rev-cogs;
 const res={id:s.id,d:d.id,cust:served,demand:cust,queue,cap:fx.cap,rev,cogs,gross,waste,wasteRate:stockU?wasteU/stockU:0,stockout:demU?lostU/demU:0,...co,cats};
 res.op=gross-waste-co.wages-co.salary-co.rent-co.mkt-co.admin-co.svcFixed-co.power+co.fees-co.dep-co.assetTax;
 res.net=res.op;return res;
}
function custFor(s,d,ev){
 const si=TIERS[s.tier],rivals=inD(s.d).filter(x=>x.chain!=='player').length,own=inD(s.d).filter(x=>x.chain==='player'&&x!==s&&!x.build).length;
 const fx=storeFx(s,ev),m=fx.m,age=state.week-(s.opened||0);
 const ramp=age<4?.8:age<8?.9:1;
 let camp=1;const wk=s.cfg.camps||{};for(const id in wk){const cp=CAMPAIGNS.find(x=>x.id===id);if(cp){camp*=1+(cp.cust||0)*(cp.decay&&wk[id].left<(cp.dur||1)?.5:1)*(cp.big&&['station','office'].includes(d.type)?cp.big:1);if(cp.night&&s.cfg.night)camp*=1+cp.night*d.night;if(cp.tourist&&d.type==='tourist')camp*=1+cp.tourist;}}
 let sb=0;for(const k of SVC_KEYS)if(s.cfg.svc[k])sb+=SERVICES[k].bonus*Math.sqrt((SVC_TYPE_MUL[k]||{})[d.type]||1);
 const avgpx=sum(CATS.map(k=>(s.cfg.px&&s.cfg.px[k.id])||1))/CATS.length;
 const offered=CATS.filter(k=>s.cfg.cats[k.id]&&!(k.id==='coffee'&&s.b.coffee<0)&&!(k.id==='oden'&&s.b.oden<0));
 const tot=sum(CATS.map(k=>k.p*k.price*d.w[k.id])),off=sum(offered.map(k=>k.p*k.price*d.w[k.id]));
 let a=si.pass*CONV*ghostMul(s.bh?s.bh.overall:3)*brand('player')*(ev.tm[d.type]||1)*(ev.tm.all||1)*(1-rivalLoss(s))*evMul(s)/(1+.12*own)*ramp*camp*(1+sb*d.svc)*(1+fx.attr)*m.sf/.94;
 a*=Math.max(.5,1-(avgpx-1)*1.2*d.ps);a*=.5+.5*(off/tot);
 if(state.campaigns.some(x=>x.chain==='player'))a*=1;
 return a;
}
/* ---------- Konkurrenz-Nähe ---------- */
export const slotPos=(d,i)=>{const sh=PLAN_SLOTS[d]&&PLAN_SLOTS[d][i];return sh?{x:sh.x,z:sh.z}:null;};
export const storeDist=(a,b)=>{const p=slotPos(a.d,a.slot),q=slotPos(b.d,b.slot);return p&&q?Math.hypot(p.x-q.x,p.z-q.z)/FELD:99;};// in Feldern
export function nearRivals(s){return state.stores.filter(x=>x.chain!=='player'&&storeDist(s,x)<=RIVAL_RULES.nahFelder);}
export function rivalLoss(s){const R=RIVAL_RULES;let l=0,nearUsed=false;const act=state.priceActs||{};
 for(const x of state.stores){if(x.chain==='player')continue;const dd=storeDist(s,x),near=dd<=R.nahFelder;
  if(near&&!(R.nahMaxEinmal&&nearUsed)){nearUsed=true;l+=(state.week-(x.opened||0)<R.verlustNahWochen?R.verlustNahNeu:R.verlustNah)+(act[x.chain]>0?R.aktionVerlust:0);}else if(dd<=R.umfeldFelder)l+=R.verlustUmfeld+(act[x.chain]>0?R.aktionVerlust/2:0);else if(x.d===s.d)l+=R.verlustBezirk;}
 return Math.min(R.verlustMax,l);}
const evHit=(e,s)=>e.ziel==='alle'||(e.ziel==='laden'&&e.sid===s.id)||(e.ziel==='stadtteil'&&e.d===s.d);
export function evSum(s,k,def){let m=def;for(const e of state.evMods||[]){if(e.left<=0||e[k]==null||!evHit(e,s))continue;m=k==='marge'||k==='cashWk'?m+e[k]:m*e[k];}return m;}
export function evMul(s){let m=1;for(const e of state.evMods||[]){if(e.left<=0||e.cust==null)continue;if(e.ziel==='alle'||(e.ziel==='laden'&&e.sid===s.id)||(e.ziel==='stadtteil'&&e.d===s.d))m*=e.cust;}return m;}
const GROUP={coffee:'heiss',oden:'heiss',drinks:'kalt',onigiri:'essen',bento:'essen',brot:'essen',saison:'essen',snacks:'sonst',alltag:'sonst'};
export function endWeek(){
 const w=state.week,ev=seasonInfo(w);
 const rep={week:w,date:dateLabel(weekDate(w)),ev:{label:ev.label,emoji:ev.emoji,desc:ev.desc},stores:[],news:[],tips:[],events:[],share:{},milestones:[],opened:[],closed:[],ready:[],paper:[]};
 const cust={player:0};RIVALS.forEach(c=>cust[c]=0);
 // offene Entscheidung der Woche: wer nichts wählt, bekommt Option B (wirkt noch in dieser Woche)
 if(state.event&&!state.event.done&&state.event.w<=w)chooseEvent('b',rep.events);
 for(const e of state.evMods||[]){const t=eventText(e.id);if(t&&e.cust!=null)rep.events.push(`🗳️ Folge deiner Entscheidung („${t.text.replace(/\{\w+\}/g,'…').slice(0,48)}“): Kunden ${e.cust>=1?'+':'−'}${Math.round(Math.abs(e.cust-1)*100)} %${e.left>1?` (noch ${e.left-1} Wo.)`:''}`);}
 const T={rev:0,cogs:0,gross:0,waste:0,wages:0,salary:0,rent:0,mkt:0,admin:0,svcFixed:0,power:0,fees:0,cust:0,dep:0,assetTax:0,heiss:0,kalt:0,essen:0,sonst:0};
 for(const s of mine()){
  const d=DMAP[s.d];
  if(s.build>0){s.build--;const co=storeCosts(s,0);const r={id:s.id,d:d.id,cust:0,demand:0,queue:0,cap:0,rev:0,cogs:0,gross:0,waste:0,wasteRate:0,stockout:0,...co,wages:0,power:0,salary:0,fees:0,mkt:0,svcFixed:0,dep:0,assetTax:0,cats:{},building:true};r.op=-(co.rent+co.admin);r.net=r.op;s.prev=s.last;s.last=r;rep.stores.push(r);
   if(s.build===0){rep.ready.push(s.id);rep.events.push(`🎉 ${storeLabel(s)} ist fertig und öffnet nächste Woche!`);}continue;}
 }
 for(const dd of DISTRICTS){
  const ds=inD(dd.id).filter(s=>!s.build);if(!ds.length)continue;
  for(const s of ds){
   if(s.chain==='player'){
    const ce=custFor(s,dd,ev),cu=ce*rnd(.96,1.04);
    const r=runStore(s,dd,ev,ce,cu,rep.events);r.bh=null;s.prev=s.last;s.last=r;rep.stores.push(r);cust.player+=r.cust;
    s.bh=rateStore(s,r);r.ghosts=s.bh.overall;managerWeek(s,r,rep.events);
    for(const id in s.cfg.camps){const st=s.cfg.camps[id],cp=CAMPAIGNS.find(x=>x.id===id);st.fresh=false;if(cp&&cp.dur>0){st.left=(st.left??cp.dur)-1;if(st.left<=0){delete s.cfg.camps[id];rep.events.push(`📣 Kampagne „${cp.name}“ in ${storeLabel(s)} ist zu Ende.`);}}}
    for(const k in r.cats)T[GROUP[k]]+=r.cats[k];
   }else{
    const n=ds.length,cu=TIERS[s.tier||tierOf(s.d,s.slot)].pass*CONV*CHAINS[s.chain].brand*rnd(.9,1.1)/(1+.1*(n-1));s.lastCust=cu;cust[s.chain]+=cu;
   }
  }
 }
 for(const r of rep.stores)for(const k in T)if(k in r&&!['heiss','kalt','essen','sonst'].includes(k))T[k]+=r[k]||0;
 // Zinsen / Tilgung / Steuer
 const intr=state.loan*LOAN.rate/52;let princ=0;
 if(state.loan>0){princ=Math.min(state.loan,Math.max(0,state.loanPay-intr));state.loan-=princ;if(state.loan<1){state.loan=0;state.loanPay=0;}}
 T.interest=intr;T.princ=princ;
 T.ebit=sum(rep.stores.map(r=>r.op));T.away=sum(awayStores(state).map(a=>a.op));T.ebit+=T.away;rep.away=awayStores(state);
 let pre=T.ebit-intr,tax=0;
 if(pre<0)state.lossCF+=-pre;else{const use=Math.min(pre,state.lossCF);state.lossCF-=use;tax=(pre-use)*.3064;}
 T.tax=tax;T.net=pre-tax;
 const cfOp=T.net+T.dep;
 T.cf={op:cfOp,inv:-state.flow.inv,fin:state.flow.fin-princ};T.cf.sum=T.cf.op+T.cf.inv+T.cf.fin+(state.flow.inv?state.flow.inv:0)*0;
 state.cash+=cfOp-princ;state.cum.rev+=T.rev;state.cum.profit+=T.net;
 state.flow={inv:0,fin:0};
 rep.T=T;
 const allC=sum(Object.values(cust));for(const c in cust)rep.share[c]=allC?cust[c]/allC:0;
 let dr=rep.stores.filter(r=>!r.building).length?0:-.1;
 for(const r of rep.stores){if(r.building)continue;const s=state.stores.find(x=>x.id===r.id);dr+=.25+((s.bh?s.bh.overall:3)-3)*.15-r.stockout*5-r.queue*3;}
 state.rep=clamp(state.rep+dr,0,100);
 // Tipps
 const nx=seasonInfo(w+1);
 for(const r of rep.stores){if(r.building)continue;const s=state.stores.find(x=>x.id===r.id),n=storeLabel(s);
  if(r.queue>.04)rep.tips.push(`🧾 <b>${n}</b>: ${pct(r.queue)} der Kunden gingen wegen Warteschlangen. Bessere Kasse oder Selbstbedienungskasse einbauen?`);
  if(r.stockout>.08)rep.tips.push(`🍙 In <b>${n}</b> war Frischware oft ausverkauft. Ein Filialleiter mit Produkt-Skill bestellt treffsicherer.`);
  else if(r.wasteRate>.12)rep.tips.push(`🗑️ <b>${n}</b>: ${pct(r.wasteRate)} Abschrift. Preise oder Menü anpassen.`);
  if(!s.mgr)rep.tips.push(`👔 <b>${n}</b> hat noch keinen Filialleiter. Stell einen ein und delegiere Aufgaben.`);
  else if(s.mgr.morale<40)rep.tips.push(`😟 ${s.mgr.name} ist unzufrieden. Mehr Gehalt, sonst droht die Kündigung.`);
  if(s.b.oden>=0&&!s.cfg.cats.oden&&seasonFactor(CATS.find(k=>k.id==='oden'),ev)>1.3)rep.tips.push(`🍢 Oden-Saison! In <b>${n}</b> ist Oden nicht im Menü.`);
 }
 rep.tips=[...new Set(rep.tips)].slice(0,3);
 // Rivalen
 // Rivalen: eröffnen nur auf freigeschalteten Standorten, gemächlich; ein paar bleiben für den Spieler frei
 const rivalCap=Math.round(unlockedCount(w)*RIVAL_RULES.anteilMax);let forceEv=null;
 for(const c of (rivalFinanz.on?[]:RIVALS)){// Finanzmenü an: Rivalen wachsen nach Kasse/Kredit (finanzen.js rvWeek)
  const rc=state.stores.filter(s=>s.chain!=='player').length,free=freeTotal();
  const p=w<RIVAL_RULES.abWoche?0:CHAINS[c].aggr*RIVAL_RULES.chanceFaktor*Math.max(0,1-rc/Math.max(1,rivalCap));
  if(free>RIVAL_RULES.freiLassen&&Math.random()<p){const o=rivalOpen(c,w);if(o){rep.opened.push(o.st.id);
   rep.news.push({chain:c,near:!!o.near,text:o.near?`<b>${CHAINS[c].name}</b> eröffnet ${o.gegenueber?'gegenüber':'in der Nähe'} deiner Filiale in ${DMAP[o.near.d].name}.`:`<b>${CHAINS[c].name}</b> eröffnet eine neue Filiale in ${DMAP[o.st.d].name}.`});
   if(o.gegenueber)forceEv={id:'ev_konkurrenz_nebenan',sid:o.near.id,chain:c};}}
 }
 // Preisaktionen der Ketten (wirken auf nahe Spieler-Filialen, s. rivalLoss)
 state.priceActs=state.priceActs||{};for(const c in state.priceActs)state.priceActs[c]=Math.max(0,state.priceActs[c]-1);
 for(const c of RIVALS){if(state.priceActs[c]>0||!state.stores.some(x=>x.chain===c))continue;if(Math.random()<RIVAL_RULES.aktionChance){state.priceActs[c]=RIVAL_RULES.aktionWochen;
  const hit=mine().filter(s=>state.stores.some(x=>x.chain===c&&storeDist(s,x)<=RIVAL_RULES.nahFelder));
  rep.news.push({chain:c,text:`<b>${CHAINS[c].name}</b> startet eine Rabattaktion (${RIVAL_RULES.aktionWochen} Wochen)${hit.length?` – das spürt ${storeLabel(hit[0])}`:''}.`});}}
 // Jahreswechsel: neue Standorte
 {const nb=unlockedCount(w+1)-unlockedCount(w);if(nb>0){rep.unlocked=nb;rep.events.push(`🗺️ Neue Standorte verfügbar: ${nb}`);rep.news.push({chain:'player',text:`<b>Neue Standorte verfügbar: ${nb}</b>. Auf der Karte gibt es neue 空き-Pins.`});}}
 // Entscheidungen: Folgen der laufenden Woche zählen herunter, neues Event für die nächste Woche
 state.evMods=(state.evMods||[]).map(e=>({...e,left:e.left-1})).filter(e=>e.left>0);
 rollEvent(w+1,forceEv);rep.event=state.event||null;
 state.news=rep.news.map(n=>({...n,week:w})).concat(state.news).slice(0,14);
 rep.paper=makePaper(rep,ev,w);state.paper=rep.paper;
 for(const f of weekHooks)f(state,rep,T);// Zusatzmodule (Finanzmenü) – Kasse/Netto
 state.hist.push({week:w,rev:T.rev,net:T.net,cash:state.cash,share:rep.share.player});
 if(state.hist.length>104)state.hist.shift();
 checkMilestones(rep,T);
 state.week++;state.lastReport=rep;save();
 return rep;
}
function managerWeek(s,r,events){
 const m=s.mgr;if(!m)return;m.weeks++;
 m.xp+=(m.traits.includes('ehrgeiz')?1.6:1)*(r.net>0?1.3:1);
 if(m.xp>=10){m.xp-=10;const ks=Object.keys(m.skills).filter(k=>m.skills[k]<5);if(ks.length){const k=pick(ks);m.skills[k]=Math.min(5,m.skills[k]+.5);events.push(`📈 ${m.name} (${storeLabel(s)}) wird besser.`);}}
 let target=65+(m.salary/m.expect-1)*120+(r.net>0?8:-12)-r.queue*40;if(m.traits.includes('gelassen'))target=Math.max(target,62);
 m.morale=clamp(m.morale+(target-m.morale)*.25,0,100);
 if(m.morale<25&&Math.random()<.35){events.push(`😢 ${m.name} hat in ${storeLabel(s)} gekündigt.`);s.mgr=null;s.deleg={staff:false,prod:false,mkt:false,inc:false};}
}
function fill(t,o){return t.replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:m);}
function makePaper(rep,ev,w){
 const _P=makePaper0(rep,ev,w);if(rep.unlocked)_P.unshift({tab:'top',text:`Neue Standorte verfügbar: ${rep.unlocked}. Makler melden freie Ladenflächen in ganz Tokio.`});return _P;}
function makePaper0(rep,ev,w){
 const P=[],tx=TEXTE&&TEXTE.shimbun,name=state.logo.name,own=mine().filter(s=>!s.build);
 const first=own[0],dn=first?DMAP[first.d].name:'Tokio';
 const o={kette:name,stadtteil:dn,anzahl:own.length,geister:first&&first.bh?first.bh.overall:3};
 if(tx){
  if(rep.ready.length||rep.opened.length&&0)P.push({tab:'top',text:fill(tx.eigene[0],o)});
  if(own.length>=2&&state.milestones.two===w)P.push({tab:'top',text:fill(tx.eigene[1],o)});
  if(first&&first.bh&&first.bh.overall>=4)P.push({tab:'top',text:fill(tx.eigene[2],{...o,stadtteil:dn})});
  if(rep.T.net>(state.hist.reduce((a,h)=>Math.max(a,h.net),0)))P.push({tab:'top',text:fill(tx.eigene[3],o)});
  const season=ev.key==='hanami'||ev.label==='Hanami'?'fruehling':ev.label==='Golden Week'?'golden_week':ev.key==='winter'?'winter':ev.key==='autumn'?'herbst':ev.key==='summer'?'sommer':'fruehling';
  (tx.saison[season]||[]).slice(0,1).forEach(t=>P.push({tab:'markt',text:t}));
  P.push({tab:'einzel',text:fill(pick(tx.konkurrenz),{stadtteil:pick(DISTRICTS).name})});
  rep.news.forEach(n=>P.push({tab:'einzel',text:n.text.replace(/<\/?b>/g,'')}));
  P.push({tab:'wirt',text:pick(tx.wirtschaft)});
 }
 if(foodTaxCut(w)&&w<=3)P.push({tab:'wirt',text:'Spielregel (angenommen, nicht real bestätigt): Im Spiel gilt ab April 2027 vorübergehend ein Steuersatz von 1 % auf Lebensmittel. Das bringt etwas mehr Absatz.'});
 P.push({tab:'markt',text:`Marktanteil von ${name}: ${pct(rep.share.player||0)}. ${rep.share.eight>.3?'Eight bleibt Marktführer.':'Das Rennen ist offen.'}`});
 for(const s of own){if(s.bh&&s.bh.overall<=2)P.push({tab:'top',text:`BuuHuu-Ranking: ${name} in ${DMAP[s.d].name} nur ${s.bh.overall} Geister – Kunden meckern.`});}
 if(!P.some(p=>p.tab==='top'))P.push({tab:'top',text:`${ev.emoji} ${ev.label}: ${ev.desc}`});
 return P;
}
export const MILESTONES=[
 {id:'first',label:'Erste Filiale eröffnet',test:()=>mine().some(s=>!s.build)},
 {id:'profit',label:'Erste Woche mit Gewinn',test:(r,T)=>T&&T.net>0},
 {id:'two',label:'Zweite Filiale gebaut',test:()=>mine().length>=2},
 {id:'three',label:'3 Filialen',test:()=>mine().length>=3},
 {id:'ghost5',label:'5 Geister bei BuuHuu',test:()=>mine().some(s=>s.bh&&s.bh.overall>=5)},
 {id:'mio',label:'¥1 Mio Gewinn in einer Woche',test:(r,T)=>T&&T.net>=1e6},
 {id:'share15',label:'15 % Marktanteil in Tokio',test:r=>r&&r.share.player>=.15},
];
export function checkMilestones(rep,T){const out=[];for(const m of MILESTONES)if(!state.milestones[m.id]&&m.test(rep,T)){state.milestones[m.id]=state.week;out.push(m.label);rep&&rep.milestones.push(m.label);}return out;}

/* ---------- Aktionen ---------- */
export function buildNew(did,slot,b){
 const parts=openCostParts(did,slot,b),cost=parts.bau+parts.deposit+parts.ware;
 if(state.cash<cost)return {err:'Nicht genug Geld 💸'};
 if(!freeSlots(did).includes(slot))return {err:'Standort ist schon belegt'};
 const no=Math.max(0,...mine().filter(s=>s.d===did).map(s=>s.no||0))+1;
 const s={id:state.nextId++,chain:'player',d:did,slot,tier:tierOf(did,slot),no,opened:state.week+BUILD_WEEKS,build:BUILD_WEEKS,cfg:playerCfg(),b:{...b},mgr:null,deleg:{staff:false,prod:false,mkt:false,inc:false},deposit:parts.deposit,invest:parts.bau,bh:{sauber:3,frische:3,service:3,auswahl:3,overall:3}};
 state.stores.push(s);state.cash-=cost;state.flow.inv+=cost;checkMilestones(null,null);save();return {store:s,cost};
}
export function upgrade(s,k,i){
 const cur=s.b[k],o=i>=0?BUILD[k].opts[i]:null;
 if(cur===i)return {};
 const price=o?optPrice(k,i):0,back=cur>=0?Math.round(optPrice(k,cur)*.4):0,cost=Math.max(0,price-back);
 if(state.cash<cost)return {err:'Nicht genug Geld'};
 state.cash-=cost;state.flow.inv+=cost;s.b[k]=i;s.invest=(s.invest||0)+price;save();return {paid:cost};
}
export function closeStore(id){const s=state.stores.find(x=>x.id===id);if(!s)return;const back=bookValue(s)*.3+(s.deposit||0);state.cash+=back;state.flow.inv-=back;state.stores=state.stores.filter(x=>x!==s);save();}
export function signService(s,key,on){
 const c=s.cfg,v=SERVICES[key];c.svcSince=c.svcSince||{};
 if(!on){if(!c.svc[key])return {};const wk=state.week-(c.svcSince[key]||0);let pen=0;if(wk<v.min){pen=Math.round(v.sign*.5+50000);state.cash-=pen;}c.svc[key]=false;save();return {penalty:pen};}
 if(state.cash<v.sign)return {err:'Nicht genug Geld'};
 state.cash-=v.sign;c.svc[key]=true;c.svcSince[key]=state.week;save();return {paid:v.sign};
}
export function toggleCamp(s,id){
 const cp=CAMPAIGNS.find(x=>x.id===id);if(!cp||cp.hidden)return {};
 if(s.cfg.camps[id]){delete s.cfg.camps[id];save();return {off:1};}
 const first=(cp.once||0)+(cp.setup||0);if(state.cash<first+(cp.weekly||0))return {err:'Nicht genug Geld'};
 s.cfg.camps[id]={fresh:true,left:cp.dur||0};
 save();return {on:1,first};
}
export function hire(s,m,salary){s.mgr={...m,salary,morale:75,weeks:0,xp:0};s.deleg=s.deleg||{staff:false,prod:false,mkt:false,inc:false};save();}
export function offerResult(m,salary){const ratio=salary/m.expect;if(ratio>=1)return true;if(ratio<.88)return false;return Math.random()<(ratio-.88)/.12;}
export function fireManager(s){if(!s.mgr)return;const c=Math.round(s.mgr.salary/52*2);state.cash-=c;s.mgr=null;s.deleg={staff:false,prod:false,mkt:false,inc:false};save();return c;}
export function designOf(s){
 const b=s.b||defaultBuild(),sm=b.coffee;
 return {facade:s.facade||'brand',building:b.fac===0?0:b.fac===1?1:0,sign:b.fac===1?2:b.fac===2?1:0,awning:b.fac===2?3:b.fac===0?2:1,layout:1,shelves:b.fridge>=2?2:0,counter:b.self>=0?2:b.pos>=1?1:0,coffee:sm<0?0:sm>=2?2:1,eatin:b.inn===2?2:b.inn===1?1:0,lighting:b.inn===1?2:b.inn===2?1:0,owned:{}};
}

/* ---------- Rivalen eröffnen (bevorzugt nahe Spieler-Filialen) ---------- */
export function rivalOpen(c,w){const R=RIVAL_RULES,own=mine().filter(s=>!s.build);const all=[];
 for(const d of DISTRICTS){if(rivalNur[c]&&!rivalNur[c].includes(d.type))continue;for(const i of freeSlots(d.id))all.push({d:d.id,i});}if(!all.length)return null;
 let best=null,bs=-1,near=null,nearD=99;const wantNear=own.length&&Math.random()<R.nahBevorzugt;
 for(const q of all){const tmp={d:q.d,slot:q.i};let nd=99,nn=null;for(const s of own){const dd=storeDist(s,tmp);if(dd<nd){nd=dd;nn=s;}}
  let sc=TIERS[tierOf(q.d,q.i)].pass/Math.pow(1+inD(q.d).filter(x=>x.chain===c).length,1.5)*rnd(.6,1.4);
  if(wantNear)sc*=nd<=R.nahFelder?8:nd<=R.umfeldFelder?4:1/(1+nd/10);
  if(sc>bs){bs=sc;best=q;near=nd<=R.umfeldFelder?nn:null;nearD=nd;}}
 const st={id:state.nextId++,chain:c,d:best.d,slot:best.i,tier:tierOf(best.d,best.i),opened:w,cfg:rivalCfg(),b:defaultBuild(),build:0};
 state.stores.push(st);return {st,near,gegenueber:near&&nearD<=R.nahFelder};}
/* ---------- Wochen-Entscheidungen (Texte: Ito, Zahlen: events_data.js) ---------- */
export const eventText=id=>((TEXTE||GFX.texte||{}).events||[]).find(e=>e.id===id)||null;
function evOk(id,c,w){const own=mine().filter(s=>!s.build);if(!own.length||!eventText(id))return null;const E=EVENTS[id];
 if(E.einmal&&(state.evSeen||{})[id])return null;const m=weekDate(w).getMonth()+1;let cand=own;
 switch(E.bed){case 'mgr':cand=own.filter(s=>s.mgr);break;case 'self':cand=own.filter(s=>s.b.self>=0);break;case 'sommer':if(m<6||m>9)return null;break;
  case 'regen':if(m!==6)return null;break;case 'oma1j':cand=own.filter(s=>s.oma&&w-(s.opened||1)>=52);break;case 'rival':cand=own.filter(s=>nearRivals(s).length);break;}
 return cand.length?cand:null;}
export function rollEvent(w,force){state.event=null;
 if(force&&EVENTS[force.id]&&eventText(force.id)){const s=state.stores.find(x=>x.id===force.sid);if(s){state.event={id:force.id,sid:s.id,chain:force.chain,w};return state.event;}}
 if(w<EVENT_RULES.abWoche||Math.random()>EVENT_RULES.chance)return null;
 const seen=state.evSeen||{},ids=Object.keys(EVENTS).filter(id=>id!==state.lastEv&&id!=='ev_konkurrenz_nebenan'&&!(seen[id]&&w-seen[id]<EVENT_RULES.sperreWochen));if(!ids.length)return null;
 for(let k=0;k<12;k++){const id=pick(ids),cand=evOk(id,null,w);if(!cand)continue;const s=pick(cand);
  const chain=EVENTS[id].rivalKette?pick(RIVALS):(nearRivals(s)[0]||{}).chain||pick(RIVALS);state.event={id,sid:s.id,chain,w};return state.event;}
 return null;}
export function eventView(e=state.event){if(!e)return null;const t=eventText(e.id),s=state.stores.find(x=>x.id===e.sid);if(!t||!s)return null;
 const o={kette:CHAINS[e.chain]?CHAINS[e.chain].name:'Eight',laden:storeLabel(s),stadtteil:DMAP[s.d].name};
 const cap=v=>evCost(v);
 const eff=opt=>{const x=EVENTS[e.id][opt],p=[];if(x.cash)p.push(`${fmtY(-cap(x.cash))}`);for(const m of x.mods||[]){const v=Math.round((m.cust-1)*100);p.push(`${m.p?Math.round(m.p*100)+' % Chance: ':''}Umsatz ${v>=0?'+':'−'}${Math.abs(v)} % (${m.wk} Wo.)`);}
  if(x.marge)p.push(`Marge −${String(x.marge.pp).replace('.',',')} % (${x.marge.wk} Wo.)`);if(x.cashWk)p.push(`${fmtY(-x.cashWk.v)}/Wo. (${x.cashWk.wk} Wo.)`);if(x.feeMul)p.push(`Paketprovision ×${String(x.feeMul.m).replace('.',',')} (${x.feeMul.wk} Wo.)`);
  if(x.rep)p.push(`Ruf ${x.rep>0?'+':''}${x.rep}`);if(x.bh)p.push('BuuHuu '+(Object.values(x.bh).reduce((a,b)=>a+b,0)>0?'besser':'schlechter'));if(x.morale)p.push(`Laune ${x.morale>0?'+':''}${x.morale}`);if(x.salary)p.push(`Gehalt +${Math.round((x.salary-1)*100)} %`);if(x.quit)p.push('Filialleitung geht');return p.join(' · ')||'keine Kosten';};
 return {id:e.id,figur:t.figur||'kobo',text:fill(t.text,o),a:fill(t.option_a,o),b:fill(t.option_b,o),effA:eff('a'),effB:eff('b'),ziel:EVENTS[e.id].ziel,laden:o.laden,done:e.done,hint:EVENTS[e.id].bed==='rival'?rivalHint():''};}
// Hinweis auf der Event-Karte: Rivalen-Abzug läuft unabhängig von der Wahl (Zahlen aus RIVAL_RULES)
export function rivalHint(){const R=RIVAL_RULES,p=x=>Math.round(x*100);const c=x=>p(Math.min(R.verlustMax,x));return `Konkurrenz kostet −${c(R.verlustNahNeu)} % (${R.verlustNahWochen} Wo.), dann −${c(R.verlustNah)} %`;}
const evCost=v=>Math.round(Math.min(-v,EVENT_RULES.maxSchaden,Math.max(0,state.cash*EVENT_RULES.maxKostenAnteil))/1000)*1000;
export function chooseEvent(opt,log){const e=state.event;if(!e||e.done)return null;const E=EVENTS[e.id],x=E[opt]||{},s=state.stores.find(y=>y.id===e.sid),v=eventView(e);
 e.done=opt;state.lastEv=e.id;state.evSeen=state.evSeen||{};state.evSeen[e.id]=state.week;if(!s)return null;
 let cost=0;if(x.cash){cost=evCost(x.cash);state.cash-=cost;}
 const M=(state.evMods=state.evMods||[]),base={id:e.id,ziel:E.ziel,sid:s.id,d:s.d};let cust=null;
 for(const m of x.mods||[]){if(m.p&&Math.random()>m.p)continue;M.push({...base,cust:m.cust,left:m.wk});cust=(cust||1)*m.cust;}
 if(x.marge)M.push({...base,marge:x.marge.pp,left:x.marge.wk});if(x.cashWk)M.push({...base,cashWk:x.cashWk.v,left:x.cashWk.wk});if(x.feeMul)M.push({...base,fee:x.feeMul.m,left:x.feeMul.wk});
 if(x.rep)state.rep=clamp(state.rep+x.rep,0,100);
 if(x.bh&&s.bh)for(const k in x.bh)if(s.bh[k]!=null)s.bh[k]=clamp(s.bh[k]+x.bh[k],1,5);
 if(s.mgr){if(x.morale)s.mgr.morale=clamp(s.mgr.morale+x.morale,0,100);if(x.salary)s.mgr.salary=Math.round(s.mgr.salary*x.salary/10000)*10000;
  if(x.quit){s.mgr=null;s.deleg={staff:false,prod:false,mkt:false,inc:false};}}
 const msg=`🗳️ ${v?v.text.replace(/<[^>]+>/g,''):''} → ${opt==='a'?v.a:v.b}${cost?` (${fmtY(-cost)})`:''}`;
 if(log)log.push(msg+' (automatisch Option B, weil nichts gewählt wurde)');save();return {cost,cust,msg};}
