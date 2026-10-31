// Konbini Empire v2 – Spieldaten
export const SAVE_KEY='konbini-empire-v2';
export const START=new Date(2026,9,19); // Mo, 19. Oktober 2026 (Erik 25.10.: echte KW 43)
export const WAGE=1150;
export const MONTHS=['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];

// 9 Warengruppen nach Bobs preise.csv (Preise netto, Werte werden beim Start aus daten/preise.csv überschrieben)
// p = Kaufwahrscheinlichkeit pro Kunde, sf = Saisonfaktor (Frühling/Sommer/Herbst/Winter)
export const CATS=[
 {id:'onigiri',name:'Onigiri',csv:'Onigiri',jp:'おにぎり',emoji:'🍙',icon:'onigiri',p:.40,price:207,cost:.68,sf:{spring:1,summer:1,autumn:1,winter:1}},
 {id:'bento',name:'Bentō',csv:'Bentō',jp:'弁当',emoji:'🍱',icon:'bento',p:.17,price:569,cost:.68,sf:{spring:1,summer:1,autumn:1,winter:1}},
 {id:'brot',name:'Sandwiches & Brot',csv:'Sandwiches/Brot',jp:'パン',emoji:'🥪',icon:'sandwich',p:.16,price:227,cost:.70,sf:{spring:1,summer:1,autumn:1,winter:1}},
 {id:'oden',name:'Oden',csv:'Oden',jp:'おでん',emoji:'🍢',icon:'oden',p:.10,price:146,cost:.50,sf:{spring:.4,summer:0,autumn:1.4,winter:2}},
 {id:'coffee',name:'Kaffee',csv:'Kaffee',jp:'コーヒー',emoji:'☕',icon:'kaffee',p:.26,price:169,cost:.25,sf:{spring:1,summer:.5,autumn:1.3,winter:1.6}},
 {id:'tee',name:'Tee',csv:'Tee',jp:'お茶',emoji:'🍵',icon:'tee',p:.14,price:162,cost:.62,sf:{spring:1,summer:1.1,autumn:1,winter:1}},// Erik 22.10.: Tee eigenes Start-Produkt, aus Getränke herausgelöst (p .62 → .48 + .14)
 {id:'drinks',name:'Getränke',csv:'Getränke',jp:'飲み物',emoji:'🥤',icon:'getraenke',p:.48,price:151,cost:.65,sf:{spring:1,summer:1.6,autumn:.9,winter:.5}},
 {id:'snacks',name:'Snacks & Heißes',csv:'Snacks/Süßes',jp:'おやつ',emoji:'🍫',icon:'snacks',p:.55,price:221,cost:.60,sf:{spring:1,summer:1,autumn:1,winter:1}},
 {id:'saison',name:'Saisonware',csv:'Saisonware',jp:'季節限定',emoji:'🌸',icon:'saisonware',p:.12,price:300,cost:.70,sf:{spring:1,summer:1,autumn:1,winter:1}},
 {id:'alltag',name:'Alltagsartikel',csv:'Alltagsartikel',jp:'日用品',emoji:'🧴',icon:'alltagsartikel',p:.22,price:449,cost:.65,sf:{spring:1,summer:1.4,autumn:1.2,winter:.7}},
];
export const CATMAP=Object.fromEntries(CATS.map(c=>[c.id,c]));
// Gewichtung der Warengruppen je Viertel-Typ
export const TYPE_W={
 station:{onigiri:1.3,bento:1,brot:1.3,oden:.8,coffee:1.35,drinks:1.35,tee:1.35,snacks:1.1,saison:1,alltag:1},
 office:{onigiri:1.2,bento:1.6,brot:1.3,oden:.7,coffee:1.6,drinks:1,tee:1,snacks:.9,saison:.8,alltag:.8},
 uni:{onigiri:1.45,bento:1.05,brot:1.2,oden:.8,coffee:1,drinks:1.3,tee:1.3,snacks:1.4,saison:.9,alltag:.8},
 tourist:{onigiri:1.25,bento:.9,brot:1,oden:1.1,coffee:.9,drinks:1.3,tee:1.3,snacks:1.2,saison:1.6,alltag:1.1},
 nightlife:{onigiri:1.1,bento:.7,brot:.8,oden:.9,coffee:.8,drinks:1.6,tee:1.6,snacks:1.3,saison:1,alltag:1.3},
 residential:{onigiri:1,bento:1.15,brot:1.1,oden:1.35,coffee:.8,drinks:1,tee:1,snacks:1,saison:1,alltag:1.3},
};
export const TYPES={
 station:{label:'Bahnhof',icon:'🚉',color:'#20a4f3'},
 office:{label:'Büro',icon:'🏢',color:'#7c6cf0'},
 residential:{label:'Wohnen',icon:'🏡',color:'#2fb67c'},
 uni:{label:'Universität',icon:'🎓',color:'#f5a524'},
 tourist:{label:'Tourismus',icon:'⛩️',color:'#ff5a7a'},
 nightlife:{label:'Nachtleben',icon:'🌃',color:'#c04de0'},
};
// Weltkoordinaten (x = Ost, z = Süd), Karte ca. ±130
// mult = Bobs Kunden-Multiplikator; rentM = Monatsmiete Standardladen 40 Tsubo (Bob; * = geschätzt)
// traffic = Konbini-Kundenpotenzial pro Woche im Viertel (Spielwert, aus mult abgeleitet)
export const DISTRICTS=[
 {id:'shinjuku',name:'Shinjuku',jp:'新宿',type:'station',x:-35,z:-11,mult:1.6,rentM:2140000,slots:8,night:.30,ps:.6,svc:.8},
 {id:'shibuya',name:'Shibuya',jp:'渋谷',type:'station',x:-29,z:49,mult:1.4,rentM:1820000,slots:7,night:.36,ps:.8,svc:.8},
 {id:'marunouchi',name:'Marunouchi',jp:'丸の内',type:'office',x:50,z:8,mult:1.35,rentM:2320000,rentEst:true,slots:6,night:.06,ps:.4,svc:1},
 {id:'roppongi',name:'Roppongi',jp:'六本木',type:'nightlife',x:12,z:33,mult:1.25,rentM:1920000,rentEst:true,slots:6,night:.48,ps:.6,svc:.7},
 {id:'asakusa',name:'Asakusa',jp:'浅草',type:'tourist',x:74,z:-62,mult:1.2,rentM:1472760,slots:6,night:.12,ps:.5,svc:.7},
 {id:'hongo',name:'Hongō',jp:'本郷',type:'uni',x:26,z:-46,mult:1.05,rentM:1200000,rentEst:true,slots:5,night:.24,ps:1.5,svc:.8},
 {id:'setagaya',name:'Setagaya',jp:'世田谷',type:'residential',x:-78,z:74,mult:1.0,rentM:1167440,slots:6,night:.14,ps:1.2,svc:1.6},
];
import {SHOPS,SHOPS_BASE,SHOP_MOVES,ALL_MOVES,lm,PLAN as _PLAN,CITY as _CITY} from './plan.js';
// Mehrstadt: eine Stadt mit districts:'plan' bringt ihre Stadtteile im Plan mit (stadtteile:[{id,name,jp,type,x,z,mult,rentM,night,ps,svc}])
{const L=_CITY.districts==='plan'?_PLAN.stadtteile:Array.isArray(_CITY.districts)?_CITY.districts:null;if(L&&L.length)DISTRICTS.splice(0,DISTRICTS.length,...L.map(d=>({slots:0,...d})));}
export const INIT_RIVALS_V2={shinjuku:['eight','lawsun','familia'],shibuya:['eight','familia'],marunouchi:['lawsun','eight'],hongo:['minihalt'],asakusa:['eight','lawsun'],setagaya:['familia','minihalt'],roppongi:['lawsun']};
// v3: Läden kommen aus Yukis Stadtplan. Jeder Laden gehört zum nächstgelegenen Viertel (nur Label/Adresse).
export const PLAN_SLOTS=Object.fromEntries(DISTRICTS.map(d=>[d.id,[]]));
for(const sh of SHOPS){let best=DISTRICTS[0],bd=1e9;for(const d of DISTRICTS){const dd=Math.hypot(sh.x-d.x,sh.z-d.z);if(dd<bd){bd=dd;best=d}}sh.d=best.id;sh.i=PLAN_SLOTS[best.id].length;PLAN_SLOTS[best.id].push(sh);}
for(const d of DISTRICTS)d.slots=PLAN_SLOTS[d.id].length;
// V4: Spielstand-Migration nach Ladenumzügen (Wolkenkratzer). Alte Slot-Nummern (d:i) -> neue über die Grundstücks-ID.
const _nearest=sh=>{let best=DISTRICTS[0],bd=1e9;for(const d of DISTRICTS){const dd=Math.hypot(sh.x-d.x,sh.z-d.z);if(dd<bd){bd=dd;best=d}}return best.id;};
export const SLOT_MIGRATION={};
{const cnt={},byLot=new Map(SHOPS.map(s=>[s.id,s]));for(const sh of SHOPS_BASE){const d=_nearest(sh);cnt[d]=cnt[d]||0;const i=cnt[d]++;const n=byLot.get(SHOP_MOVES[sh.id]||sh.id);if(n&&(n.d!==d||n.i!==i))SLOT_MIGRATION[d+':'+i]={d:n.d,i:n.i};}}
// Grundstück -> aktueller Slot; lotSlot() folgt notfalls einem Umzug (vor- oder rückwärts) beider Platzierungen
export const LOT_SLOT=new Map(SHOPS.map(s=>[s.id,{d:s.d,i:s.i}]));
export function lotSlot(id){if(LOT_SLOT.has(id))return LOT_SLOT.get(id);for(const [a,b] of ALL_MOVES){if(a===id&&LOT_SLOT.has(b))return LOT_SLOT.get(b);if(b===id&&LOT_SLOT.has(a))return LOT_SLOT.get(a);}return null;}
export const PLAN_REV=Object.keys(SHOP_MOVES).length?2:1;
// v3.1: Freischaltung der Standorte. Start 20 (Lagen gemischt, über die Stadt verteilt), dann pro Spieljahr +5, +5, +4, danach +2.
function spreadOrder(list,seedPick){const out=[...seedPick],rest=list.filter(s=>!out.includes(s));
 while(rest.length){let bi=0,bd=-1;rest.forEach((s,i)=>{const d=out.length?Math.min(...out.map(o=>Math.hypot(o.x-s.x,o.z-s.z))):0;if(d>bd){bd=d;bi=i}});out.push(rest.splice(bi,1)[0]);}return out;}
const START_MIX={top:3,city:6,wohn:7,rand:4};
// Omas Laden: fester Startladen (City-Lage, nächster Plan-Laden am Rathaus Shinjuku), nicht Teil der freien Standorte
const _rh=lm(_CITY.start)||lm('shinjuku-rathaus')||{cx:0,cz:0};
export const OMA_SHOP=SHOPS.filter(s=>s.tier==='city').sort((a,b)=>Math.hypot(a.x-_rh.cx,a.z-_rh.cz)-Math.hypot(b.x-_rh.cx,b.z-_rh.cz))[0];
const SHOPS_FREE=SHOPS.filter(s=>s!==OMA_SHOP);
const _first=[];for(const t of Object.keys(START_MIX)){const ord=spreadOrder(SHOPS_FREE.filter(s=>s.tier===t),[]);_first.push(...ord.slice(0,START_MIX[t]));}
export const UNLOCK_ORDER=[..._first,...spreadOrder(SHOPS_FREE.filter(s=>!_first.includes(s)),_first).slice(_first.length)].map(s=>s.k);
export const UNLOCK_START=20;
export function unlockedCount(week){const y=Math.floor((week-1)/52);return Math.min(SHOPS_FREE.length,UNLOCK_START+Math.min(y,2)*5+(y>=3?4:0)+Math.max(0,y-3)*2);}
const UNLOCK_RANK=new Map(UNLOCK_ORDER.map((k,i)=>[k,i]));
export function slotOpen(did,i,week){const sh=PLAN_SLOTS[did]&&PLAN_SLOTS[did][i];return !!sh&&UNLOCK_RANK.get(sh.k)<unlockedCount(week);}
export const INIT_RIVALS=Object.fromEntries(DISTRICTS.map(d=>[d.id,PLAN_SLOTS[d.id].filter(s=>s.owner!=='frei').map(s=>s.owner)]));
export const BASE_CUST=5628; // 804 Kunden/Tag (Bob: echter Lawson-Schnitt) × 7
for(const d of DISTRICTS){d.rent=Math.round(d.rentM*12/52);d.traffic=Math.round(BASE_CUST*d.mult*((INIT_RIVALS[d.id]||[]).length+1)*1.2);d.w=TYPE_W[d.type];}
// Kosten nach Bobs ladenkosten.csv
export const COST={wage:1280,nightBonus:.25,lnk:.15,shiftH:8,powerM:350000,ausbau:9000000,ware:4000000,depositMonths:6};
export const DMAP=Object.fromEntries(DISTRICTS.map(d=>[d.id,d]));

export const PRICE=[{label:'Günstig',sub:'−8 %',m:.92},{label:'Normal',sub:'Listenpreis',m:1},{label:'Premium',sub:'+10 %',m:1.1}];
export const MKT=[{label:'Keins',cost:0,f:1},{label:'Flyer',cost:40000,f:1.05},{label:'Social',cost:110000,f:1.11},{label:'TV',cost:260000,f:1.18}];
// Partnerverträge für Services (Bobs services.csv; fiktive Partner mit Parodienamen)
// sign = Freischaltkosten, monthly = laufende Kosten/Monat, commission = Provision pro Vorgang, perDay = Vorgänge/Tag beim Start,
// bonus = Kundenbonus, work = Personalminuten pro Vorgang (Spielwert), min = Mindestlaufzeit in Wochen
export const SERVICES={
 parcelIn:{label:'Paketservice',icon:'paket-abgabe',emoji:'📦',partner:'Shironeko Express',plogo:'shironeko',sign:0,monthly:0,commission:80,perDay:25,bonus:.05,work:3.6,min:12,csv:'Shironeko Express Paketannahme',pitch:'Paketannahme und -abholung in einem Vertrag (V6: zusammengelegt). Bringt Stammkundschaft aus der Nachbarschaft.'},
 atm:{label:'Geldautomat',icon:'geldautomat',emoji:'🏧',partner:'Futatsuboshi Bank',plogo:'futatsuboshi',sign:0,monthly:0,commission:16,perDay:109,bonus:.05,work:.15,min:26,csv:'Geldautomat (Partnerbank)',pitch:'Viele Vorgänge, kaum Arbeit, bringt Laufkundschaft.'},
 bills:{label:'Rechnungen bezahlen',icon:'rechnungen',emoji:'🧾',partner:'Shiharai Plus',sign:50000,monthly:0,commission:60,perDay:40,bonus:.03,work:1.5,min:8,csv:'Rechnungen bezahlen',pitch:'Strom, Steuern, Online-Shopping bar zahlen. Stammkunden!'},
 tickets:{label:'Tickets',icon:'tickets',emoji:'🎫',partner:'Kippu Plaza',sign:100000,monthly:5000,commission:40,perDay:8,bonus:.02,work:3,min:12,csv:'Tickets (Konzert/Event)',pitch:'Konzert- und Eventtickets am Terminal, stark in Nachtleben & Tourismus.'},
 copy:{label:'Kopierer & Drucker',icon:'kopierer',emoji:'🖨️',partner:'Fukusha Print',sign:800000,monthly:30000,commission:60,perDay:25,bonus:.02,work:.5,min:26,csv:'Kopierer/Drucker',pitch:'Drucken, Kopieren, Fotos. Teuer, läuft bei Unis und Büros.'},
};
// V6 (Erik 25.10.): diese Werte gelten auch dann, wenn daten/services.csv etwas anderes sagt – Geldautomat ohne Monatskosten, Paketservice zusammengelegt (25 Vorgänge/Tag, +5 %), ohne Freischaltkosten
export const SVC_FIX={parcelIn:{sign:0,monthly:0,commission:80,perDay:25,bonus:.05},atm:{monthly:0}};
export const SVC_KEYS=Object.keys(SERVICES);
export const SVC_TYPE_MUL={tickets:{nightlife:1.8,tourist:1.5,station:1.2},parcelIn:{residential:1.45,office:1.05,uni:1.1},bills:{residential:1.5},copy:{uni:1.6,office:1.3},atm:{tourist:1.2,station:1.1}};

// Ladendesign: jede Option einmal kaufen, danach frei umschaltbar
export const FACADES=[
 {id:'white',label:'Weiß',c:'#ffffff'},{id:'cream',label:'Creme',c:'#f6ecd9'},{id:'grey',label:'Hellgrau',c:'#e2e6ec'},
 {id:'wood',label:'Holz',c:'#c8996a'},{id:'mint',label:'Mint',c:'#cdeee0'},{id:'sky',label:'Himmel',c:'#d4e8ff'},
 {id:'rose',label:'Rosé',c:'#ffdbe4'},{id:'brand',label:'Markenfarbe',c:null},
];
export const DESIGN={
 building:{label:'Fassade',opts:[
  {label:'Stadtladen',cost:0,attr:0,desc:'Klassische Front mit großem Schaufenster',gfx:'fac0'},
  {label:'Eckladen',cost:1200000,attr:.035,rent:1.08,desc:'Glas an zwei Seiten: +3,5 %, Miete +8 %',gfx:'fac1'}]},
 sign:{label:'Schild',opts:[
  {label:'Leuchtkasten',cost:0,attr:0,desc:'Klassisches Leuchtschild über der Tür',gfx:'sign0'},
  {label:'Noren-Vorhang',cost:450000,attr:.025,desc:'+2,5 %, Tourismus +5 %',gfx:'sign1'},
  {label:'Werbe-Pylon',cost:1200000,attr:.05,weekly:5000,desc:'+5 % (Bahnhof/Tourismus +7 %), weithin sichtbar',gfx:'sign2'}]},
 awning:{label:'Markise',opts:[
  {label:'Keine',cost:0,attr:0,desc:'Schlicht'},
  {label:'Glatt',cost:250000,attr:.015,desc:'+1,5 %, in der Regenzeit +4 %',gfx:'awn1'},
  {label:'Streifen',cost:180000,attr:.02,desc:'+2 % Attraktivität',gfx:'awn2'},
  {label:'Wellen',cost:300000,attr:.025,desc:'+2,5 %, verspielt',gfx:'awn3'}]},
 layout:{label:'Ladenformat',opts:[
  {label:'Mini · 20 Tsubo',cost:0,attr:-.08,basket:.8,cap:.55,rent:.5,ausbau:5000000,ware:2000000,staff:.75,power:.6,desc:'Kleiner Einstieg: halbe Miete, aber kleineres Sortiment (Bon −20 %) und Kapazität −45 %'},
  {label:'Standard · 40 Tsubo',cost:0,attr:0,cap:1,rent:1,ausbau:9000000,ware:4000000,staff:1,power:1,desc:'Typische Konbini (Bob: 40 Tsubo)'},
  {label:'Groß · 60 Tsubo',cost:0,attr:.04,basket:1.08,cap:1.35,rent:1.5,ausbau:13000000,ware:5500000,staff:1.3,power:1.4,desc:'Kapazität +35 %, Bon +8 %, +4 %, Miete ×1,5'}]},
 shelves:{label:'Regale',opts:[
  {label:'Standard',cost:0,desc:'Normale Regalreihen'},
  {label:'Hochregale',cost:800000,desc:'Mehr Auswahl: Sonstiges +6 %'},
  {label:'Kühlwand',cost:1100000,weekly:8000,desc:'Getränke +12 %, Bentō +5 %'}]},
 counter:{label:'Kasse',opts:[
  {label:'Eine Kasse',cost:0,cap:1,desc:'Basis-Kapazität'},
  {label:'Doppelkasse',cost:700000,cap:1.2,desc:'Kapazität +20 %'},
  {label:'Self-Checkout',cost:1800000,cap:1.35,wage:.95,desc:'Kapazität +35 %, Personal −5 %'}]},
 coffee:{label:'Kaffee',opts:[
  {label:'Keine',cost:0,desc:'Kein Kaffee im Angebot'},
  {label:'Automat',cost:0,desc:'Standard-Kaffeemaschine'},
  {label:'Barista-Bar',cost:1500000,attr:.02,weekly:10000,desc:'Kaffee ×1,5, +2 %'}]},
 eatin:{label:'Sitzplätze',opts:[
  {label:'Keine',cost:0,desc:'Nur Mitnahme'},
  {label:'Theke (6)',cost:400000,attr:.02,desc:'Bentō +8 %, +2 % (Büro/Uni/Tourismus +4 %)'},
  {label:'Lounge (16)',cost:1400000,attr:.05,weekly:12000,desc:'Bentō & Kaffee +15 %, +5 % (Büro/Uni/Tourismus +7 %)'}]},
 lighting:{label:'Licht',opts:[
  {label:'Standard',cost:0,desc:'Neonröhren'},
  {label:'LED hell',cost:300000,attr:.01,weekly:-6000,desc:'+1 %, spart ¥6.000/Woche'},
  {label:'Warmes Design',cost:900000,attr:.04,desc:'+4 %, Kunden achten weniger auf Preise'}]},
};
export const DESIGN_KEYS=['building','sign','awning','layout','shelves','counter','coffee','eatin','lighting'];
export function defaultDesign(){return {facade:'white',building:0,sign:0,awning:0,layout:1,shelves:0,counter:0,coffee:1,eatin:0,lighting:0,owned:{}}}

// Manager
// Bobs personal.csv: Menschen, Produkt, Marketing, Ethik (1–5; UI zeigt 0–100)
export const SKILLS=[
 {id:'service',label:'Menschen',icon:'🤝',desc:'Personalplanung, Service & Kapazität'},
 {id:'einkauf',label:'Produkt',icon:'📦',desc:'Treffsichere Bestellungen und volle Regale'},
 {id:'verkauf',label:'Marketing',icon:'📣',desc:'Größerer Warenkorb, lokales Marketing'},
 {id:'effizienz',label:'Ethik',icon:'⚖️',desc:'Sauberkeit, Zwischenfälle, schlanke Kosten'},
];
export const TRAITS={
 nachteule:{label:'Nachteule',icon:'🦉',desc:'Übernimmt einen Teil der Nachtschicht: Nachtkraft −25 % Kosten',good:true},
 sparfuchs:{label:'Sparfuchs',icon:'🦊',desc:'Personalkosten −6 %',good:true},
 charme:{label:'Charmant',icon:'🌟',desc:'+4 % Attraktivität, stärkt den Ruf',good:true},
 trend:{label:'Trendscout',icon:'📈',desc:'Saisonware +25 %',good:true},
 sprache:{label:'Sprachtalent',icon:'🗣️',desc:'Touristen-Viertel +8 % Attraktivität',good:true},
 ehrgeiz:{label:'Ehrgeizig',icon:'🔥',desc:'Lernt 60 % schneller, will mehr Gehalt',good:true},
 gelassen:{label:'Gelassen',icon:'🍵',desc:'Bleibt zufrieden, Warteschlangen halb so schlimm',good:true},
 chaot:{label:'Chaotisch',icon:'🌪️',desc:'Manchmal eine schlechte Woche (−15 %)',good:false},
};
export const FAMILY=['Tanaka','Satō','Suzuki','Takahashi','Watanabe','Itō','Yamamoto','Nakamura','Kobayashi','Katō','Yoshida','Yamada','Sasaki','Matsumoto','Inoue','Kimura','Hayashi','Shimizu','Mori','Ikeda','Fujita','Okada','Hasegawa','Ishikawa'];
export const GIVEN_F=['Yui','Aoi','Hana','Sakura','Mei','Rin','Haruka','Miyu','Nanami','Emi','Kaori','Yoko'];
export const GIVEN_M=['Haruto','Ren','Sōta','Yūto','Kenji','Takumi','Daiki','Hiroshi','Kaito','Riku','Shō','Akira'];

export const CHAINS={
 eight:{name:'Eight',jp:'エイト',color:'#13A89E',color2:'#FFC93C',brand:1.12,aggr:.12,file:'eight'},
 lawsun:{name:'Lawsun',jp:'ローサン',color:'#FF8A3D',color2:'#FFE08A',brand:1.04,aggr:.10,file:'lawsun'},
 familia:{name:'Familia',jp:'ファミリア',color:'#8E5BD1',color2:'#F7A1B5',brand:1.04,aggr:.10,file:'familia'},
 minihalt:{name:'Minihalt',jp:'ミニハルト',color:'#2E3A8C',color2:'#5DBB73',brand:.9,aggr:.07,file:'minihalt'},
};
export const RIVALS=['eight','lawsun','familia','minihalt'];

// Logo-Editor
export const LOGO_SHAPES=[{id:'circle',label:'Kreis'},{id:'squircle',label:'Quadrat'},{id:'hexagon',label:'Sechseck'},{id:'shield',label:'Wappen'},{id:'diamond',label:'Raute'},{id:'banner',label:'Banner'}];
export const LOGO_SYMBOLS=[{id:'star',label:'Stern'},{id:'sakura',label:'Sakura'},{id:'onigiri',label:'Onigiri'},{id:'wave',label:'Welle'},{id:'moon',label:'Mond'},{id:'leaf',label:'Blatt'},{id:'heart',label:'Herz'},{id:'bolt',label:'Blitz'},{id:'cat',label:'Katze'},{id:'letter',label:'Initiale'},{id:'kanji',label:'Kanji'}];
// V4: Yukis 8 Logofarben (grafik/editor/farben.json, von Erik freigegeben) -> var(--ladenfarbe) / var(--zweitfarbe) der Editor-Logos v2
export const LOGO_COLORS=[{"name": "Akane", "hex": "#E94F4F"}, {"name": "Orange", "hex": "#F28C38"}, {"name": "Yuzu", "hex": "#F2B705"}, {"name": "Matcha", "hex": "#4CAF6A"}, {"name": "Türkis", "hex": "#1FA8A0"}, {"name": "Aozora", "hex": "#3D7BD9"}, {"name": "Fuji", "hex": "#7B4FD6"}, {"name": "Sakura", "hex": "#E8679A"}];
export const LOGO_BG=LOGO_COLORS.map(c=>c.hex);
export const LOGO_FG=['#FFFFFF','#2B2D42',...LOGO_BG];
export const colorName=h=>{const c=LOGO_COLORS.find(c=>c.hex.toLowerCase()===String(h).toLowerCase());return c?c.name:(String(h).toLowerCase()==='#ffffff'?'Weiß':String(h).toLowerCase()==='#2b2d42'?'Tinte':h);};
export const KANJI=['星','福','光','和','花','空'];
export function defaultLogo(){return {name:'Hoshi Mart',shape:'squircle',symbol:EDITOR_LOGOS_V2?'v2-a1':'star',bg:'#E94F4F',fg:'#FFFFFF',kanji:'星',ring:true}}

/* ================= v2.1: Coffee-Inc-Flow (Bobs finale Daten) ================= */
// v3.2: abschaltbare Kartenteile (Yamanote-Linie + Zug + Bahnwerbung, Haneda, HQ-Pin) – zum Zurückholen auf true setzen
export {FEATURES} from './plan.js';
import {FEATURES} from './plan.js';
// Rivalen beim Start: mode 'total' = insgesamt `total` Läden (je 1 pro Kette, verschiedene Bezirke), 'perChain' = `perChain` je Kette
export const RIVAL_START={mode:'perChain',total:0,perChain:0};// Erik 21.10.: Rivalen starten mit 0 Läden und eröffnen im Spielverlauf (sim.js, events_data.js)
// Erik: alle Läden 24/7 (kein Schalter). Bob: Standard-Filialleitung 4,5 Mio ¥/Jahr
export const MGR_STD_SALARY=4500000;
// Yukis Filialleiter-Grafiken (grafik/filialleiter/): von Erik freigegeben (false = Emojis)
export const MGR_ART=true;
// Yukis Gründungs-Editor-Logos v2 (grafik/logos/editor-v2/): von Erik freigegeben, ersetzen die alten Symbole (false = alte)
export const EDITOR_LOGOS_V2=true;
// V4: Yukis Wolkenkratzer (grafik/wolkenkratzer, Platzierung stadtplan-v6-wolkenkratzer.json): von Erik freigegeben (AN).
// Das Flag liegt in plan.js (SKYSCRAPERS=true), weil die Ladenumzüge vor dem Aufbau von SHOPS greifen müssen.
export {SKYSCRAPERS} from './plan.js';
// Yukis spielstand-karte-verloren.svg: AUS bis Erik freigibt (false = normale Karte, ausgegraut, mit Itos slot_verloren)
export const LOST_CARD_ART=false;
export const LOGO_SYMBOLS_V2=[['a1','Kanji Fuku'],['a2','Hanko'],['a3','Noren'],['a4','Chōchin'],['b1','Streifen'],['b2','Farbblock 24'],['b3','Buchstabe'],['b4','Ladenschild'],['c1','Katze'],['c2','Kitsune'],['c3','Kranich'],['c4','Panda'],['d1','Monogramm'],['d2','Linie & Tasche'],['d3','Negativ-Laden'],['d4','Wortmarke']].map(([id,label])=>({id:'v2-'+id,label}));
export const MGR_PORTRAITS=['haruto','yui','kenji','sakura','hiroshi','emi','ren','aoi','daichi','mei','takumi','nanami'];
export const START_CASH=5e6; // v3.2: Start mit Omas Laden + 5 Mio ¥
export const BUILD_WEEKS=2;
// ausbau.csv (Fallback; wird beim Start aus daten/ausbau.csv überschrieben)
// q = Qualität 1–5, prod = Produktivität 1–5, n = Anzahl im Standardladen, dep = Abschreibung in Jahren
export const BUILD={
 fac:{label:'Außenbereich',icon:'fassade',opts:[
  {name:'Standard',price:2500000,q:2,dep:15,desc:'Schild, Beleuchtung',gfx:'iso_fac0'},
  {name:'Neon-Tokio',price:3200000,q:4,dep:15,desc:'Leuchtreklame: +Nachtkunden',gfx:'iso_fac1',night:.12},
  {name:'Holz-Machiya (Japan Stil)',price:3800000,q:5,dep:15,desc:'Passt zu Asakusa: +Touristen',gfx:'iso_fac2',tourist:.12}]},
 inn:{label:'Innenbereich',opts:[
  {name:'Standard-Konbini',price:7500000,q:3,dep:15,desc:'Helle Regalreihen, klassisch',gfx:'iso_inn0'},
  {name:'Shōwa-Retro',price:9000000,q:4,dep:15,desc:'Nostalgie-Look, Holz & warmes Licht',gfx:'iso_inn1'},
  {name:'Natural Premium mit Sitzecke',price:11000000,q:5,dep:15,desc:'+Sauberkeit, Sitzecke: Bentō & Kaffee',gfx:'iso_inn2',eat:true}]},
 shelf:{label:'Regale',must:true,gfx:'regal',opts:[{name:'Standard',price:1000000,q:3,prod:3,n:1,dep:3,desc:'Einfache Ladeneinbauten'}]},
 fridge:{label:'Kühlregal',must:true,gfx:'kuehlregal',opts:[
  {name:'Kompakt 600 mm',price:110000,q:2,prod:1,n:6,dep:6,desc:'Günstig, wenig Platz für Getränke'},
  {name:'Schiebetür 1200 mm',price:263000,q:3,prod:3,n:6,dep:6,desc:'Solider Standard'},
  {name:'Inverter 1200 mm',price:490000,q:4,prod:5,n:6,dep:6,desc:'Viel Platz, −15 % Strom',power:-.15}]},
 freezer:{label:'Tiefkühltruhe',gfx:'tiefkuehltruhe',opts:[{name:'Standard',price:209000,q:3,prod:3,n:1,dep:6,desc:'Eis & Tiefkühlware'}]},
 coffee:{label:'Kaffeeautomat',must:true,gfx:'kaffeemaschine',cat:'coffee',opts:[
  {name:'Filter-Basis',price:350000,q:2,prod:2,n:1,dep:6,desc:'Einfacher Filterkaffee'},
  {name:'Vollautomat',price:1200000,q:3,prod:4,n:1,dep:6,desc:'Frisch gemahlen, Standard'},
  {name:'Barista-Top',price:2200000,q:5,prod:5,n:1,dep:6,desc:'+Kaffee-Nachfrage'}]},
 oden:{label:'Oden-Topf',gfx:'oden-topf',cat:'oden',opts:[
  {name:'Klein',price:80000,q:2,prod:2,n:1,dep:6,desc:'Lohnt sich im Winter'},
  {name:'Groß mit Temperaturregelung',price:200000,q:4,prod:4,n:1,dep:6,desc:'Mehr Auswahl, immer heiß'}]},
 fryer:{label:'Heißtheke (Fritteuse)',gfx:'fritteuse',cat:'snacks',opts:[
  {name:'Ein-Becken',price:150000,q:2,prod:2,n:1,dep:6,desc:'Karaage & Korokke'},
  {name:'Zwei-Becken',price:450000,q:4,prod:4,n:1,dep:6,desc:'Doppelte Menge, knuspriger'}]},
 steamer:{label:'Nikuman-Dampfgarer',gfx:'dampfgarer',cat:'snacks',opts:[
  {name:'Standard',price:150000,q:3,prod:3,n:1,dep:6,desc:'Nikuman im Winter'},
  {name:'Doppel',price:300000,q:4,prod:5,n:1,dep:6,desc:'Mehr Sorten'}]},
 smoothie:{label:'Smoothie-Maschine',gfx:'smoothie-maschine',cat:'drinks',opts:[
  {name:'Frappé-Station',price:400000,q:3,prod:3,n:1,dep:6,desc:'Becher aus Tiefkühler + Milch'},
  {name:'Smoothie-Mixer Selbstbedienung',price:900000,q:4,prod:4,n:1,dep:6,desc:'Frische Smoothies, junge Kundschaft'}]},
 hot:{label:'Heißgetränke-Wärmer',gfx:'heissgetraenke-vitrine',cat:'drinks',opts:[
  {name:'Klein 36 Dosen',price:33000,q:2,prod:2,n:1,dep:6,desc:'Warmer Tee & Dosenkaffee, im Winter ein Hit'}]},
 self:{label:'Selbstbedienungskasse',gfx:'selbstbedienungskasse',opts:[
  {name:'Halbselbst',price:1500000,q:3,prod:4,n:1,dep:5,desc:'Personal scannt, Kunde zahlt'},
  {name:'Vollselbst',price:2500000,q:3,prod:5,n:1,dep:5,desc:'Kein Anstehen, weniger Personal',self:true}]},
 pos:{label:'Kasse',must:true,gfx:'kasse',opts:[
  {name:'Tablet-Kasse',price:250000,q:2,prod:3,n:2,dep:5,desc:'2 Kassen, solide'},
  {name:'Terminal-Kasse',price:750000,q:4,prod:5,n:2,dep:5,desc:'Schneller, +Service'}]},
};
export const EQUIP_KEYS=['shelf','fridge','freezer','coffee','oden','fryer','steamer','smoothie','hot','pos','self'];
export const BUILD_CSV={'Fassade':'fac','Innenausbau':'inn','Regale (einfache Ladeneinbauten)':'shelf','Kühlregal (Modul)':'fridge','Tiefkühltruhe':'freezer','Kaffeemaschine':'coffee','Oden-Topf':'oden','Fritteuse':'fryer','Dampfgarer Nikuman':'steamer','Smoothie-Maschine':'smoothie','Hot-Drink-Warmer (Flaschentee/Dosenkaffee)':'hot','Selbstbedienungskasse':'self','Kasse (POS)':'pos'};
export const STOCK_INIT=1500000;// Bob, final
// Neue Ausstattung: Index je Kategorie, -1 = nicht eingebaut
export function starterBuild(){return {fac:0,inn:0,shelf:0,fridge:0,freezer:-1,coffee:0,oden:0,fryer:-1,steamer:-1,smoothie:-1,hot:-1,pos:0,self:-1}}// V6: Omas Laden hat den Oden-Topf (alle 6 Startprodukte verkaufen ab Woche 1)
export function defaultBuild(){return {fac:0,inn:0,shelf:0,fridge:1,freezer:0,coffee:1,oden:0,fryer:-1,steamer:-1,smoothie:-1,hot:-1,pos:0,self:-1}}
export const optPrice=(k,i)=>{if(i<0)return 0;const o=BUILD[k].opts[i];return o.price*(o.n||1)};
export const buildCost=b=>Object.keys(BUILD).reduce((a,k)=>a+optPrice(k,b[k]??-1),0);

// Filialleiter (personal.csv): Jahresgehalt
export const MGR_TIERS=[
 {stufe:'Junior',salary:3800000,sk:[2,2,1,3]},{stufe:'Standard',salary:4500000,sk:[3,3,3,3]},
 {stufe:'Profi',salary:5500000,sk:[4,4,4,4]},{stufe:'Star',salary:6500000,sk:[5,5,5,5],rare:true}];
export const SHIFT_WAGE=1280;

// Kampagnen (marketing.csv von Bob, Ideen von Ito); Icons von Yuki, 3 ohne eigenes Icon → generisch
export const CAMPAIGNS=[
 {id:'wlan',name:'Kostenloses WLAN',icon:'wlan',weekly:5000,setup:30000,dur:0,cust:.02,bh:{service:.1},night:.05,tourist:.05},
 {id:'lade',name:'Handy-Ladestation',icon:'ladestation',weekly:1000,setup:60000,dur:0,cust:.01,bh:{service:.1},night:.03},
 {id:'onigiri',name:'Onigiri-Aktion 2+1 gratis',icon:'onigiri-aktion',revPct:.10,revCat:'onigiri',dur:4,cust:.02,cat:{onigiri:1.25},bh:{auswahl:.1}},
 {id:'punkte',name:'Punktekarte / App',icon:'punktekarte',weekly:30000,revPct:.005,dur:0,cust:.03,stamm:.05,bh:{}},
 {id:'flyer',name:'Flyer und Plakate',icon:'flyer',once:100000,dur:2,cust:.04,decay:true},
 {id:'bahn1',hidden:!FEATURES.rail,name:'Bahnwerbung Yamanote (Plakat)',icon:'bahnwerbung',once:1990000,dur:3,cust:.06,chain:true,big:1.5},
 {id:'bahn2',hidden:!FEATURES.rail,name:'Bahnwerbung Yamanote (Screen 15 s)',icon:'bahnwerbung',once:3500000,dur:3,cust:.09,chain:true,big:1.5,generic:false},
 {id:'hanami',name:'Saisonaktion Hanami-Bentō',icon:'saisonaktion',once:150000,dur:3,cust:.03,cat:{saison:1.4},bh:{auswahl:.2},season:'hanami'},
 {id:'odenw',name:'Saisonaktion Oden-Wochen',icon:'saisonaktion',once:100000,dur:2,cust:.04,cat:{oden:1.6},bh:{auswahl:.1},season:'odenzeit',odenPrice:.8},
 {id:'xmas',name:'Saisonaktion Weihnachtskuchen',icon:'saisonaktion',once:200000,dur:4,cust:.02,cat:{saison:2},season:'xmas'},
 {id:'anime',name:'Anime-/Idol-Kollaboration',icon:'kollaboration',once:5000000,dur:3,cust:.25,cat:{snacks:1.3,drinks:1.3},bh:{auswahl:.3},after:-.05},
 {id:'social',name:'Social Media',icon:'soziale-medien',weekly:30000,dur:0,cust:.03,young:.06},
 {id:'buuhuu',name:'Anzeige im BuuHuu-Ranking',icon:'buuhuu-anzeige',weekly:50000,dur:0,cust:.03},
];
export const CAMP_CSV={'Kostenloses WLAN':'wlan','Handy-Ladestation':'lade','Onigiri-Aktion 2+1 gratis':'onigiri','Punktekarte / App':'punkte','Flyer und Plakate':'flyer','Bahnwerbung Yamanote (Hängeplakat)':'bahn1','Bahnwerbung Yamanote (Bildschirm 15 s)':'bahn2','Saisonaktion Hanami-Bentō':'hanami','Saisonaktion Oden-Wochen':'odenw','Saisonaktion Weihnachtskuchen':'xmas','Anime-/Idol-Kollaboration mit Sammelstickern':'anime','Social Media':'social','Anzeige im BuuHuu-Ranking':'buuhuu'};
export const BH_CATS=[{id:'sauber',label:'Sauberkeit'},{id:'auswahl',label:'Auswahl'},{id:'service',label:'Service'}];
// Verkehrsknoten für spätere Reisen zwischen Städten
export const HUBS=[{id:'tokyo-st',name:'Tokio Hauptbahnhof',sub:'Shinkansen nach Osaka & Kyōto',x:(lm(_CITY.hub)||{cx:0}).cx,z:(lm(_CITY.hub)||{cz:0}).cz,icon:'🚄'},{id:'haneda',name:'Flughafen Haneda',sub:'Flüge in andere Städte',x:(lm('haneda')||{cx:0}).cx,z:(lm('haneda')||{cz:110}).cz,icon:'✈️'}];
// Straßennamen-Generator für Adressen (Stadtteil-Chōme-Nummer)
export const WARDS={shinjuku:'Shinjuku',shibuya:'Shibuya',marunouchi:'Chiyoda',roppongi:'Minato',asakusa:'Taitō',hongo:'Bunkyō',setagaya:'Setagaya'};
export const AREAS={shinjuku:['Nishi-Shinjuku','Shinjuku','Kabukichō','Yoyogi'],shibuya:['Dōgenzaka','Jingūmae','Udagawachō','Shibuya'],marunouchi:['Marunouchi','Yūrakuchō','Ōtemachi','Nihonbashi','Kyōbashi'],roppongi:['Roppongi','Azabu-Jūban','Akasaka','Nishi-Azabu'],asakusa:['Asakusa','Kaminarimon','Ueno','Kuramae'],hongo:['Hongō','Yushima','Yanaka','Sendagi'],setagaya:['Sangenjaya','Shimokitazawa','Kyōdō','Sakura-Shinmachi']};

// Lage-Stufen (Bobs standorte.csv; Fallback = Werte aus der Datei). Jede Bauparzelle auf der einen Tokio-Karte hat genau eine Stufe.
export const TIERS={
 top:{id:'top',csv:'Top',label:'Top-Lage',color:'#FFC93C',rentM:1485000,depM:6,pass:59500,badge:'lage-top',names:['marunouchi','tokyo','shinjuku','shibuya']},
 city:{id:'city',csv:'City',label:'City-Lage',color:'#3D7BD9',rentM:1348440,depM:6,pass:52500,badge:'lage-city',names:['roppongi','asakusa','ikebukuro']},
 wohn:{id:'wohn',csv:'Wohngebiet',label:'Wohngebiet',color:'#5DBB73',rentM:1167440,depM:6,pass:41000,badge:'lage-wohngebiet',names:['setagaya','hong','hongo']},
 rand:{id:'rand',csv:'Stadtrand',label:'Stadtrand',color:'#9AD8EE',rentM:739440,depM:6,pass:33000,badge:'lage-stadtrand',names:['hach','tama']},
};
export const TIER_ORDER=['top','city','wohn','rand'];
const DIST_TIER={};
export function rebuildTierMap(){for(const d of DISTRICTS){DIST_TIER[d.id]='wohn';const nm=(d.name+' '+d.id).toLowerCase();for(const t of TIER_ORDER)if(TIERS[t].names.some(n=>nm.includes(n)||d.id.includes(n)))DIST_TIER[d.id]=t;}}
rebuildTierMap();
// Parzelle -> Stufe: äußere Parzellen von Setagaya sind Stadtrand
export function tierOf(did,i){const sh=PLAN_SLOTS[did]&&PLAN_SLOTS[did][i];return sh?sh.tier:DIST_TIER[did];}
export const TAX={food:.08,foodCut:.01,other:.10,cutFrom:new Date(2027,3,1),cutTo:new Date(2029,2,31)};
export const LOAN={rate:.045,max:48e6,fromWeek:27,own:.3};
export const CONV=.119; // Passanten -> Kunden (Bob: 1.012 Kunden/Tag bei 59.500/Woche)
