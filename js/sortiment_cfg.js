// Start-Sortiment & Freischaltung (Erik 22.10. 09:02): zum Start nur 6 Produkte, alles Weitere per Markenverhandlung oder Messe.
// ?sortiment=alt schaltet zurück (alles offen wie V5).
export const ON=new URLSearchParams(globalThis.location?location.search:'').get('sortiment')!=='alt';
export const START=[{id:'start:wasser',name:'Mineralwasser',cat:'drinks',csv:'^Wasser'},{id:'start:kaffee',name:'Kaffee',cat:'coffee'},{id:'start:tee',name:'Tee',cat:'tee'},
 {id:'start:oden',name:'Oden',cat:'oden'},{id:'start:onigiri',name:'Onigiri',cat:'onigiri'},{id:'start:bento',name:'Bentō',cat:'bento'}];
// Artikelname (aus „liefert“ der Firmen / Messe-Typ) → Warengruppe im Laden. Erste passende Regel gewinnt.
export const KAT_WORT=[[/tee/i,'tee'],[/kaffee/i,'coffee'],[/bier|chūhai|chuhai|softdrink|cola|limo|sport|saft|säfte|wasser|probiotik|milch|joghurt|energy/i,'drinks'],
 [/brot|sandwich|melonpan/i,'brot'],[/bentō|bento|fertig/i,'bento'],[/schoko|bonbon|pocky|chips|nudel|tiefkühl|eis|snack|riegel|nuss|wurm|fleisch|würst/i,'snacks'],
 [/kollab|kuji|saison/i,'saison'],[/hygiene|maske|kosmetik|batterie|ladekabel|schreib|socke|unterwäsche|zeitschrift|manga|prepaid|kopfhörer|spielzeug|alltag/i,'alltag']];
export const MESSE_TYP={cola:'drinks',energy:'drinks',wasser:'drinks',kaffee:'drinks',suess:'snacks',nusscreme:'snacks',chips:'snacks'};// V6: feste Gruppe (Dosenkaffee = Kühlregal)
// Nachfrage einer Warengruppe je nach Zahl freigeschalteter Artikel (Erik 11:15: eine Gruppe mit 1 Artikel läuft voll; Mehrwert der Freischaltung kommt über neue Gruppen und Preise);
// Gruppen, die im Start-Sortiment als ein Produkt gelten (Kaffee, Tee, Oden, Onigiri, Bentō), laufen sofort voll.
// Ersatzkauf (Annahme für Bob): fehlt eine Warengruppe, geben Kunden diesen Anteil ihres Geldes für die offenen Gruppen aus
// und kommen trotzdem (zählt so viel wie „im Angebot“ für Kundenzahl und Auswahl-Bewertung). Hält Omas Laden zum Start im Plus.
export const ERSATZ=1;
// Erik 22.10. 11:15: fehlende Gruppen kosten zum Start weniger Kunden. Gewicht einer gesperrten Gruppe für Kundenzahl/Auswahl (0 = voll fehlend, 1 = zählt wie im Angebot)
export const KUNDEN_SANFT=.8;
// Preis-Option A: Gruppenpreis = Schnitt der freigeschalteten Artikel aus daten/preise.csv (Artikel ohne CSV-Zeile zählen mit dem Gruppenschnitt)
export const PREIS_JE_ARTIKEL=true;
// Billigere Artikel verkaufen sich öfter: Menge × (Gruppenpreis/Artikelpreis)^PREIS_MENGE (Wasser ¥108 statt Ø ¥220 → ~1,6× Stück)
export const PREIS_MENGE=.7;
export const ERSATZ_ART='umsatz';// einmal gezählt (Whitebeard 22.10.): 'kunden' = Kunden kommen trotzdem (Kundenzahl+Auswahl), kaufen aber nur Offenes; 'umsatz' = Ausgaben wandern in offene Gruppen
export const BREITE={basis:1,jeArtikel:0,voll:['coffee','tee','oden','onigiri','bento']};
// ---------- V6 Einzelprodukte (Erik 25.10. 15:49 „Ja“ zum Umbau) ----------
// Jede Ware (Start, Gerät, Inlandsvertrag, Messe, Eigenmarke, Übernahme) ist ein eigenes Produkt: eigener Name, eigener Umsatz,
// FESTE Warengruppe (kein Namensraten mehr), Pflichtgerät. Gruppen ohne Startprodukt bleiben zu – dort verkaufen nur die einzelnen Produkte.
// Gerät (Index in s.b ≥ 0) → Name/Icon für Hinweise
export const GERAETE={fridge:['Kühlregal','❄️'],freezer:['Tiefkühltruhe','🧊'],coffee:['Kaffeeautomat','☕'],oden:['Oden-Topf','🍢'],fryer:['Fritteuse','🍗'],steamer:['Dampfgarer','♨️'],smoothie:['Smoothie-Maschine','🥤']};
// Startprodukte brauchen ihr Gerät (Kühlware explizit am Kühlregal)
export const START_DEV={drinks:['fridge'],tee:['fridge'],onigiri:['fridge'],bento:['fridge'],brot:['fridge'],coffee:['coffee'],oden:['oden']};
// Kannibalisierung (Annahme, Bob prüft): dieser Anteil des Produktumsatzes fehlt dafür bei den Startgruppen
// (offen = Gruppe hat ein Startprodukt, Kunden hätten das gekauft; gesperrt = vorher als Ersatz in offene Gruppen gewandert). Rest = Zusatzkäufe.
export const ERSATZ_RUECK={offen:.4,gesperrt:.25,maxAnteil:.5};
// Kundenbonus je verkaufendem Zusatzprodukt (mehr Auswahl → mehr Kunden), gedeckelt (Annahme, Bob prüft)
export const PRODUKT_KUNDEN={je:.004,max:.05,auswahlJe:.05,auswahlMax:.6};
// Artikel aus „liefert“ der Inlandsfirmen → Produkt. vk brutto, m = Marge auf Netto-VK, typ → Kaufquote (finanzen_cfg KAUFQUOTE). Werte: Bob/PREISE.md, sonst Annahme (Bob prüft)
export const ARTIKEL={
 'Bier':{label:'Bier 350 ml',cat:'drinks',dev:['fridge'],typ:'bier',vk:250,m:.24},
 'Chūhai':{label:'Chūhai 350 ml',cat:'drinks',dev:['fridge'],typ:'chuhai',vk:198,m:.26},
 'Softdrinks':{label:'Limo 500 ml',cat:'drinks',dev:['fridge'],typ:'cola',vk:160,m:.31},
 'Cola':{label:'Cola 500 ml',cat:'drinks',dev:['fridge'],typ:'cola',vk:199,m:.31},
 'Limonade':{label:'Limonade 500 ml',cat:'drinks',dev:['fridge'],typ:'cola',vk:160,m:.31},
 'Sportdrinks':{label:'Sportdrink 500 ml',cat:'drinks',dev:['fridge'],typ:'energy',vk:160,m:.31},
 'Tee':{label:'Grüntee 600 ml',cat:'tee',dev:['fridge'],typ:'tee',vk:162,m:.33},
 'Säfte':{label:'Saft 500 ml',cat:'drinks',dev:['fridge'],typ:'saft',vk:150,m:.27},
 'Probiotik':{label:'Probiotik-Drink',cat:'drinks',dev:['fridge'],typ:'probiotik',vk:150,m:.27},
 'Dosenkaffee':{label:'Dosenkaffee 185 g',cat:'drinks',dev:['fridge'],typ:'kaffee',vk:145,m:.33},// kalte Dose im Kühlregal, nicht Kaffeeautomat
 'Wasser':{label:'Quellwasser 500 ml',cat:'drinks',dev:['fridge'],typ:'wasser',vk:108,m:.33},
 'Milch':{label:'Milch 500 ml',cat:'drinks',dev:['fridge'],typ:'saft',vk:168,m:.27},
 'Joghurt':{label:'Trinkjoghurt',cat:'drinks',dev:['fridge'],typ:'probiotik',vk:140,m:.3},
 'Eis':{label:'Eis am Stiel',cat:'snacks',dev:['freezer'],typ:'eis',vk:180,m:.33},
 'Tiefkühl':{label:'Tiefkühl-Gyoza',cat:'snacks',dev:['freezer'],typ:'tk',vk:350,m:.3},
 'Bentō-Zutaten':{label:'Bentō-Beilage',cat:'bento',dev:['fridge'],typ:'wuerz',vk:250,m:.3},
 'Fertiggerichte':{label:'Fertiggericht',cat:'bento',dev:['fridge'],typ:'fertig',vk:398,m:.3},
 'Instant-Nudeln':{label:'Cup-Nudeln',cat:'snacks',dev:[],typ:'nudeln',vk:267,m:.28},
 'Schokolade':{label:'Schokoriegel',cat:'snacks',dev:[],typ:'suess',vk:140,m:.3},
 'Bonbons':{label:'Bonbons',cat:'snacks',dev:[],typ:'suess',vk:120,m:.3},
 'Pocky':{label:'Schokostäbchen',cat:'snacks',dev:[],typ:'suess',vk:160,m:.3},
 'Chips':{label:'Chips 70 g',cat:'snacks',dev:[],typ:'chips',vk:159,m:.32},
 'Brot':{label:'Toastbrot',cat:'brot',dev:['fridge'],typ:'brot',vk:198,m:.3},
 'Sandwiches':{label:'Sandwich',cat:'brot',dev:['fridge'],typ:'brot',vk:298,m:.3},
 'Melonpan':{label:'Melonpan',cat:'brot',dev:[],typ:'brot',vk:127,m:.35},
 'Prepaid-Karten':{label:'Prepaid-Karte 3.000',cat:'alltag',dev:[],typ:'prepaid',vk:3000,m:.03},
 'Kollab-Waren':{label:'Kollab-Edition',cat:'saison',dev:[],typ:'kuji',vk:990,m:.3},
 'Kopfhörer':{label:'Kopfhörer',cat:'alltag',dev:[],typ:'technik',vk:1980,m:.3},
 'Schreibwaren':{label:'Schreibwaren',cat:'alltag',dev:[],typ:'alltag',vk:449,m:.35},
 'Socken':{label:'Socken',cat:'alltag',dev:[],typ:'mode',vk:990,m:.34},
 'Unterwäsche':{label:'Unterwäsche',cat:'alltag',dev:[],typ:'mode',vk:1290,m:.34},
 'Hygiene':{label:'Hygiene-Set',cat:'alltag',dev:[],typ:'hygiene',vk:400,m:.33},
 'Masken':{label:'Masken 7er',cat:'alltag',dev:[],typ:'hygiene',vk:398,m:.35},
 'Kosmetik':{label:'Pflege-Reiseset',cat:'alltag',dev:[],typ:'kosmetik',vk:400,m:.33},
 'Ichiban-Kuji-Lotterie':{label:'Kuji-Los',cat:'saison',dev:[],typ:'kuji',vk:790,m:.24},
 'Spielzeug':{label:'Spielzeug',cat:'alltag',dev:[],typ:'kuji',vk:550,m:.3},
 'Zeitschriften':{label:'Zeitschrift',cat:'alltag',dev:[],typ:'manga',vk:650,m:.22},
 'Manga':{label:'Wochen-Manga',cat:'alltag',dev:[],typ:'manga',vk:350,m:.22},
 // Kiraku Shōji (R01, Bob PREISE.md:698): eigene Artikelnamen, Preise aus Bobs Tabelle
 'Manga-Wochenheft':{label:'Manga-Wochenheft',cat:'alltag',dev:[],typ:'manga',vk:300,ek:234},
 'Zeitschrift':{label:'Zeitschrift',cat:'alltag',dev:[],typ:'manga',vk:650,ek:507},
 'Batterien AA 4er':{label:'Batterien AA 4er',cat:'alltag',dev:[],typ:'batterie',vk:398,ek:239},
 'Batterien AAA 4er':{label:'Batterien AAA 4er',cat:'alltag',dev:[],typ:'batterie',vk:398,ek:239},
 'USB-Ladekabel':{label:'USB-Ladekabel',cat:'alltag',dev:[],typ:'technik',vk:1100,ek:550},
 'Vinyl-Schirm':{label:'Vinyl-Schirm',cat:'alltag',dev:[],typ:'schirm',vk:550,ek:330},
 // V6 (Whitebeard Vorabtest 22d0cd1): Hauptprodukte der Branchen (Werte aus finanzen_cfg PRODUKT, Bob)
 'Würzsauce':{label:'Würzsauce',cat:'alltag',dev:[],typ:'wuerz',vk:300,m:.3},
 'Sojasauce':{label:'Sojasauce klein',cat:'alltag',dev:[],typ:'wuerz',vk:300,m:.3},
 'Mayonnaise':{label:'Mayo 130 g',cat:'alltag',dev:['fridge'],typ:'wuerz',vk:300,m:.3},
 'Curry-Retorte':{label:'Curry-Retorte',cat:'alltag',dev:[],typ:'wuerz',vk:300,m:.3},
 'Würstchen':{label:'Würstchen',cat:'snacks',dev:['fridge'],typ:'fleisch',vk:300,m:.3},
 'Tomatensaft':{label:'Tomatensaft',cat:'drinks',dev:['fridge'],typ:'saft',vk:150,m:.27}};
// V6 (Whitebeard Vorabtest): Produkte je Firma passend zu Name/Branche. Vorrang vor dem Gruppen-Feld „liefert“ aus finanzen_data.js (generiert, Bobs Konzept)
export const FIRMEN_ARTIKEL={
 'oto-oto-denki':['Kopfhörer','USB-Ladekabel'],'ocha-niwa':['Tee'],'mono-mono-wear':['Socken','Unterwäsche'],
 'taisho-kashi':['Schokolade','Pocky','Milch'],'banzai-kashi':['Schokolade','Bonbons','Pocky'],'kodama-seika':['Schokolade','Bonbons','Pocky'],'paripari-kobo':['Chips'],
 'umami-no-kami':['Würzsauce'],'shoyu-maru':['Sojasauce'],'mayo-kun':['Mayonnaise'],'ie-curry':['Curry-Retorte'],'buta-buta-ham':['Würstchen'],'kori-rei':['Tiefkühl','Eis'],
 'nyusan-chan':['Probiotik','Joghurt'],'tomato-kago':['Tomatensaft','Säfte'],'kesho-do':['Kosmetik']};
// Geräteware: kommt mit dem Gerät in den Laden (Fritteuse = Karaage & Korokke, Dampfgarer = Nikuman, Smoothie-Maschine = Frappé, braucht Tiefkühltruhe).
// Preise preise.csv (Bob), Korokke + alle Kaufquoten Annahme (Bob prüft). sf = Saison wie CATS
export const GERAET_PRODUKTE=[
 {id:'geraet:karaage',name:'Karaage-Bällchen 5 Stk',cat:'snacks',dev:['fryer'],q:.03,vk:288,ek:134},
 {id:'geraet:korokke',name:'Korokke',cat:'snacks',dev:['fryer'],q:.015,vk:120,ek:56},
 {id:'geraet:nikuman',name:'Nikuman',cat:'snacks',dev:['steamer'],q:.025,vk:168,ek:78,sf:{spring:.4,summer:0,autumn:1.4,winter:2}},
 {id:'geraet:frappe',name:'Café-Frappé',cat:'drinks',dev:['smoothie','freezer'],q:.015,vk:310,ek:144,sf:{spring:1,summer:1.6,autumn:.9,winter:.5}}];
// Messe-Typ → Gruppe + Gerät (Dosenkaffee = kalte Dose, Kühlregal)
export const MESSE_PRODUKT={cola:{cat:'drinks',dev:['fridge']},energy:{cat:'drinks',dev:['fridge']},wasser:{cat:'drinks',dev:['fridge']},kaffee:{cat:'drinks',dev:['fridge']},suess:{cat:'snacks',dev:[]},nusscreme:{cat:'snacks',dev:[]},chips:{cat:'snacks',dev:[]}};
// Eigenmarken (buero_cfg EIGENMARKEN): feste Gruppe + Gerät
export const EIGEN_PRODUKT={chiki:{cat:'snacks',dev:['fryer']},limo:{cat:'drinks',dev:['fridge']},dorayaki:{cat:'snacks',dev:[]},purin:{cat:'snacks',dev:['fridge']}};
// Firmen ohne verhandelbares Produkt (BUGS 25.10.): nicht in der Verhandlungsliste. Hotaru Denchi liefert über Kiraku Shōji.
// V6 (Whitebeard 4816e73): nackte Produktnamen (ohne Firmenname) sind über alle Firmen eindeutig – Firma → Artikel → eigener Name (R40)
export const FIRMEN_LABEL={
 'hoo-braeu':{'Bier':'Premium-Lager 350 ml','Chūhai':'Chūhai Zitrone 350 ml','Softdrinks':'Melonensoda 500 ml'},
 'hokkyokusei-braeu':{'Bier':'Pils 350 ml','Chūhai':'Chūhai Grapefruit 350 ml','Softdrinks':'Ginger Ale 500 ml'},
 'tsukiya-getraenke':{'Chūhai':'Chūhai Pfirsich 350 ml','Tee':'Gerstentee 600 ml'},
 'kiraku-shoji':{'USB-Ladekabel':'Ladekabel USB-C','Zeitschrift':'Rätselheft'},
 'nanashi-do':{'Socken':'Sneakersocken','Unterwäsche':'Boxershorts'},
 'banzai-kashi':{'Schokolade':'Waffelriegel','Pocky':'Keksstäbchen'},
 'kodama-seika':{'Schokolade':'Nussriegel','Pocky':'Erdbeerstäbchen','Bonbons':'Kaubonbons'},
 'taisho-kashi':{'Milch':'Kakaomilch 500 ml'},
 'tora-hygiene':{'Hygiene':'Zahnpflege-Set','Masken':'Masken Kids 7er','Kosmetik':'Handcreme'},
 'fuwari':{'Hygiene':'Taschentücher 3er','Masken':'Masken Plus 7er','Kosmetik':'Abschminktücher'},
 'senaka-co':{'Kosmetik':'Lippenpflege'},
 'marukun-suisan':{'Instant-Nudeln':'Cup-Udon'},
 'ushi-ushi-milch':{'Joghurt':'Joghurt-Drink Erdbeere','Eis':'Milcheis-Becher'},
};
export const OHNE_PRODUKT=['gocha-gocha-kingdom','shironeko-express','inaho-motors','kome-kura-bank','mitsu-kame-bank','futatsuboshi-bank','hotaru-denchi'];
