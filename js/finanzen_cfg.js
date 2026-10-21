// Finanzmenü: Spielwerte (Franky nach Bobs Konzept V2 + PREISE.md „Kaufquoten Marken-Deals“). Werte mit „Annahme“ sind Platzhalter, bis Bob sie liefert.
export const LEITZINS=1.25;// BoJ, % (Bob)
export const MEHRERTRAG=.4;// nur Mehrertrag ggü. Ersatzmarke zählt (Bob): 40 % des Rohertrags
export const BASIS_KUNDEN_WOCHE=1750;// Standardladen ≈ 250 Kunden/Tag (Bob)
export const GEBUEHR_AKTIEN=.01;// 1 % Gebühr, Verkaufserlös kommt 1 Woche später
// Kaufquoten je Produkttyp (Anteil der Wochenkunden, die 1 Stück kaufen) und Saison. bier/wasser: Bob; Rest: Annahme Franky
export const KAUFQUOTE={bier:.057,wasser:.034,cola:.045,energy:.025,kaffee:.03,tee:.034,suess:.02,chips:.02,nudeln:.025,probiotik:.015,saft:.01,eis:.02,brot:.04,wuerz:.006,tk:.008,fleisch:.01,hygiene:.008,kosmetik:.004,tabak:.06,manga:.015,kuji:.006,prepaid:.004,mode:.003,alltag:.008,nusscreme:.006};
export const SAISON={bier:{sommer:.3,winter:-.2},wasser:{sommer:.3},cola:{sommer:.2},energy:{sommer:.1},eis:{sommer:.5,winter:-.4}};// Sommer Jun–Aug, Winter Dez–Feb (bier/wasser: Bob, Rest: Annahme)
// Einkaufs-Rabattstufen nach Filialzahl (keine Mindestmenge)
export const STUFEN=[{von:1,bis:4,f:1},{von:5,bis:9,f:.958},{von:10,bis:19,f:.926},{von:20,bis:1e9,f:.895}];
export const LAUFZEIT_RABATT=m=>(12-m)/6*.01;// 6 Mon. +1 %, 12 ±0, 18 −1 %, 24 −2 %
export const EXKL={ekMinus:.03,zahlungJeLaden:130000};// Exklusivität bei Inlandsmarken (Annahme): Einkauf −3 %, Einmalzahlung je Laden
// Produkt je Branche (Inlandsmarken, Bob ③-b): Name, VK brutto, Marge auf Netto-VK (Stufe 1–4), Typ für Kaufquote, Einheit. EK = Netto-VK × (1 − Marge)
export const PRODUKT={'Bier/Getränke':['Super-Trocken 350 ml',250,0.24,'bier','Dose'],'Grüntee':['Grüntee 600 ml',162,0.33,'tee','Flasche'],'Getränke/Kaffee':['Dosenkaffee 185 g',145,0.33,'kaffee','Dose'],'Softdrinks':['Cola 500 ml',199,0.31,'cola','Flasche'],
 'Schokolade/Milch':['Schokoriegel',140,0.3,'suess','Stück'],'Süßwaren':['Schokostäbchen',140,0.3,'suess','Packung'],'Chips':['Chips 70 g',159,0.32,'chips','Tüte'],'Instant-Nudeln':['Cup-Nudeln',267,0.28,'nudeln','Becher'],'Probiotik':['Probiotik-Drink',150,0.27,'probiotik','Flasche'],
 'Säfte':['Tomatensaft',150,0.27,'saft','Flasche'],'Milch/Eis':['Eis am Stiel',180,0.33,'eis','Stück'],'Brot':['Melonpan',298,0.3,'brot','Stück'],'Mayonnaise':['Mayo 130 g',300,0.3,'wuerz','Flasche'],'Würzmittel':['Tiefkühl-Gyoza',350,0.3,'tk','Packung'],
 'Fleisch':['Würstchen',300,0.3,'fleisch','Packung'],'Curry':['Curry-Retorte',300,0.3,'wuerz','Packung'],'Sojasauce':['Sojasauce klein',300,0.3,'wuerz','Flasche'],'Tiefkühl':['Tiefkühl-Gyoza',350,0.3,'tk','Packung'],'Hygiene':['Reise-Set',400,0.33,'hygiene','Set'],
 'Kosmetik':['Pflege-Reiseset',400,0.33,'kosmetik','Set'],'Tabak':['Zigaretten',580,0.1,'tabak','Packung'],'Verlag':['Wochen-Manga',350,0.22,'manga','Heft'],'Spielzeug':['Ichiban-Kuji',790,0.24,'kuji','Los'],'Spiele':['Prepaid-Karte 3.000',3000,0.03,'prepaid','Karte'],
 'Elektronik':['Prepaid-Karte 3.000',3000,0.03,'prepaid','Karte'],'Mode':['Socken',990,0.34,'mode','Paar'],'Alltagswaren':['Schreibwaren',449,0.35,'alltag','Stück'],'Discounter':['Alltagswaren',449,0.35,'alltag','Stück']};
// Marken-Messe (Yuki: messe-marken-blatt): 10 ausländische Marken, jedes Jahr im April, Verträge 1 oder 2 Jahre, enden immer am 30.4. (Erik 21.10.2026: ohne Lücke)
// art: direkt = fester Preis + Einmalzahlung; bieten = Bietverfahren gegen die Konkurrenz. VK aus Yukis Mockups/Annahme; Marge auf Netto-VK (Bob: Gletscherquell 33 %, Sorairo Cola 31 %; Rest Annahme)
// Vertragsende und Messe-Termin (entschieden von Erik: Ende 30.4., Messe bleibt April). Regel im Code: ein Vertrag endet nie,
// bevor das Messe-Fenster (der ganze Messe-Monat) vorbei ist – sonst würde er auslaufen, bevor man ihn verlängern kann.
export const VERTRAG_ENDE={tag:30,monat:4};// Erik bestätigt 21.10.2026: Messe im April, Verträge enden 30.4.; Verlängerung auf der Messe schließt nahtlos an
export const MESSE_TERMIN={monat:4,von:14,bis:16};
export const MESSE={tage:'14.–16. April',ort:'Tokyo Big Hall',marken:[
 {id:'fizzwell-cola',name:'Fizzwell Cola',stand:'A1',land:'USA',prod:'Cola 500 ml',typ:'cola',vk:199,marge:0.31,art:'bieten',einheit:'Flasche'},
 {id:'sorairo-cola',name:'Sorairo Cola',stand:'A2',land:'USA',prod:'Cola 500 ml',typ:'cola',vk:199,marge:0.31,art:'direkt',zahlung:800000,einheit:'Flasche'},
 {id:'oni-power',name:'Oni Power',stand:'B1',land:'AT',prod:'Energy 250 ml',typ:'energy',vk:226,marge:0.3,art:'bieten',einheit:'Dose'},
 {id:'kraken-energy',name:'Kraken Energy',stand:'B2',land:'USA',prod:'Energy 500 ml',typ:'energy',vk:260,marge:0.3,art:'direkt',zahlung:900000,einheit:'Dose'},
 {id:'alpenbohne-cafe',name:'Alpenbohne Café',stand:'C1',land:'CH',prod:'Dosenkaffee',typ:'kaffee',vk:160,marge:0.33,art:'direkt',zahlung:600000,einheit:'Dose'},
 {id:'gletscherquell',name:'Gletscherquell',stand:'C2',land:'FR',prod:'Mineralwasser 500 ml',typ:'wasser',vk:120,marge:0.33,art:'direkt',zahlung:1600000,einheit:'Flasche',herkunft:'aus den Alpen'},
 {id:'wackelwurm',name:'Wackelwurm',stand:'D1',land:'DE',prod:'Fruchtgummi',typ:'suess',vk:180,marge:0.3,art:'direkt',zahlung:500000,einheit:'Tüte'},
 {id:'crunchtown-bar',name:'Crunchtown Bar',stand:'D2',land:'USA',prod:'Schokoriegel',typ:'suess',vk:160,marge:0.3,art:'bieten',einheit:'Riegel'},
 {id:'nocciola-sole',name:'Nocciola Sole',stand:'E1',land:'IT',prod:'Nuss-Creme',typ:'nusscreme',vk:450,marge:0.3,art:'direkt',zahlung:400000,einheit:'Glas'},
 {id:'stackies',name:'Stackies',stand:'E2',land:'USA',prod:'Stapelchips',typ:'chips',vk:280,marge:0.32,art:'direkt',zahlung:700000,einheit:'Dose'}]};
export const BIETEN={sekunden:15,schritt:100000,rivalen:['eight','lawsun','familia'],rivalFaktor:[.55,1.15]};// (alt, ungenutzt)
// Bob (PREISE.md): Rivalen bieten bis zu diesem Anteil ihres eigenen Break-even (Rohertrag/Woche ihrer Läden × 0,4 × Vertragswochen); neue Ketten: standard
export const BIETEN_ANTEIL={eight:.9,lawsun:.8,familia:.7,standard:.75};
// Banken (Bob ④): Zuschlag nur, wenn Ø operativer Cashflow 13 Wo. ≥ 1,5 × Wochenrate aller Kredite
export const BANKEN=[{id:'mitsu-kame-bank',jahre:10,aufschlag:3.25,mult:6},{id:'futatsuboshi-bank',jahre:5,aufschlag:2.75,mult:4},{id:'kome-kura-bank',jahre:3,aufschlag:4.0,mult:3}];
export const CF_REGEL=1.5;
// Beteiligungs-Stufen (Bob ③-a)
export const ANTEIL_STUFEN=[{p:.001,t:'„Partner“: −2 % Einkauf, 1 Aktions-Display pro Laden'},{p:.005,t:'−5 % Einkauf, Neuheiten 4 Wochen früher'},{p:.01,t:'−7 % Einkauf, Marken-Aktion −50 % (1×/Quartal)'},{p:.05,t:'−10 % Einkauf'},{p:.1,t:'Exklusiv: die Konkurrenz verliert die Marke'}];
// Konkurrenz (Bob ③-c)
export const KONKURRENZ=[{c:'eight'},{c:'lawsun'},{c:'familia'},{c:'asayake'},{c:'tsubame'},{c:'minihalt'},{c:'zabu'}];// alle privat bis zum eigenen Börsengang (Erik 20:16)
export const IPO={umsatz:10e9,filialen:50,gewinnJahre:2,kgv:15,gebuehr:.05,dividende:.3,minFilialen:.5,streu:[10,49]};
// Verbrauchsteuer (PREISE.md): Lebensmittel/Getränke ohne Alkohol 8 % (während der Steuersenkung 1 %), alles andere 10 %. Margen immer auf Netto-VK.
export const STEUER10=new Set(['bier','tabak','hygiene','kosmetik','manga','kuji','prepaid','mode','alltag']);

// Messe-Laufzeiten in Wochen (Bob 21.10.): Neuabschluss gilt ab Abschluss Mitte April, Verlängerung nahtlos ab 1.5.
export const MESSE_WOCHEN={neu:{1:54,2:106},verl:{1:52,2:104}};
// ---------- Rivalen als Firmen (Erik 20:16, Werte Bob 20:17 – Bob prüfen) ----------
// Alle Ketten starten wie der Spieler privat (nicht börsennotiert, keine Dividende) mit kleinem Startkapital und 0 Läden.
export const RIVAL_START={eight:8e6,lawsun:7e6,familia:7e6,asayake:6e6,tsubame:6e6,minihalt:5e6};
// Grobe Ketten-GuV je Laden/Woche (Annahme Franky, Bob prüfen): Umsatz und Gewinnquote; neuer Laden kostet ladenKosten aus der Kasse
export const RIVAL_LADEN={umsatzWoche:2.2e6,gewinnQuote:.09,ladenKosten:2.5e7,buchwert:2.5e7};// Bob 20:37: 9 % Marge
// Börsengang der Rivalen: gleiche Hürden wie beim Spieler (IPO), frühestens ab Spieljahr 3; Chance/Woche je Kette (aggressiv früher, Minihalt kaum)
export const RIVAL_IPO={abJahr:3,chance:{eight:.08,lawsun:.05,familia:.05,asayake:.04,tsubame:.04,minihalt:.002},streu:[20,35],aktien:1e8};
// Kurswirkung: je 5 % gekaufter Anteil steigt der Kurs um ~3 %
export const RIVAL_KURS={jeAnteil:.05,plus:.03,vol:.2};
// Erik 20:20 bestätigt → Standard an (=0 schaltet aus):
export const GRUENDER_VERKAUF=new URLSearchParams(globalThis.location?location.search:'').get('gruender_verkauf')!=='0';// Gründer verkauft Rest nur zu +30 %
export const GRUENDER_AUFSCHLAG=.3;
// Rivalen übernehmen den Spieler (Erik 20:20: an, ?uebernahme_spieler=0 aus): erst nach unserem Börsengang; Gebot für ALLE Aktien ≥ +60 % über 12-Wochen-Schnitt; Kasse+Kredit muss reichen; halten wir ≥ 51 %, entscheiden wir allein
export const RIVAL_UEBERNAHME=new URLSearchParams(globalThis.location?location.search:'').get('uebernahme_spieler')!=='0';
export const SPIELER_UEBERNAHME={aufschlag:.6,schnittWochen:12,kreditJahresgewinne:2,chance:.05,eigenMin:.51};
// Rivalen kaufen Spieler-Aktien (wenn wir börsennotiert sind); Kobo warnt ab 25 % Fremdbesitz
export const FREMD={chance:.04,anteil:.02,warnung:.25,eilmeldung:.40,rueckkauf:.05};// Kobo warnt ab 25 %, Eilmeldung „Übernahme droht“ ab 40 %, Rückkauf in 5-%-Schritten
export const UEBERNAHME_AB=.51;
// Kaufangebot an private Ketten (Erik 20:20: an, ?kaufangebot=0 aus; erst ab 20 eigenen Läden). Annahme-Chance linear 0 % bei 100 % des Firmenwerts → 100 % bei 130 %; 12 Wochen Sperre nach Absage
export const KAUFANGEBOT=new URLSearchParams(globalThis.location?location.search:'').get('kaufangebot')!=='0';
export const ANGEBOT={abLaeden:20,von:1.0,bis:1.3,sperreWochen:12,stufen:[1.0,1.1,1.2,1.3]};
// Rückkauf eigener Aktien als Abwehr: noch NICHT bestätigt (Erik) → nur mit ?rueckkauf=1
export const RUECKKAUF=new URLSearchParams(globalThis.location?location.search:'').get('rueckkauf')==='1';
// Firmenwert (Bob 20:22): Kasse + ½ × Läden × Ladenwert + 4 × Jahresgewinn − Schulden; gilt für uns und die Rivalen
export const FIRMENWERT={ladenWert:15e6,gewinnFaktor:4};
// Börsengang: Streubesitz 10–70 %, ab 50 % rote Zone (Übernahme möglich)
export const IPO_STREU={min:10,max:70,rot:50};
// Rivalen-Wachstum (Bob 20:37): Kredite nach unserer Regel (Ø Wochengewinn 13 Wo. ≥ 1,5 × Raten), Startkredit 25 Mio für den ersten Laden
export const RIVAL_KREDIT={start:25e6,zins:.045,laufWochen:520,regel:1.5,reserve:5e6};// Laufzeit/Zins wie Mitsu-Kame (10 J., 4,5 %)
export const RIVAL_WACHSTUM={eight:.25,lawsun:.15,familia:.14,asayake:.12,tsubame:.11,minihalt:.08};// Chance/Woche, einen Laden zu eröffnen (wenn Geld/Kredit reicht)
export const RIVAL_KARTE={anteil:.6,freiLassen:1};// so viele neue Läden landen auf der aktuellen Karte, der Rest in anderen Städten (zählt mit)

// Rivalen expandieren über Städte (Erik 23:17): ab ~4 Läden in der Heimatstadt eröffnen Ketten auch in anderen Städten, gewichtet nach Größe und Nähe; Geld/Kredit-Regeln wie immer
export const RIVAL_STAEDTE={heimat:{eight:'tokio',lawsun:'tokio',familia:'yokohama',minihalt:'yokohama',asayake:'osaka',tsubame:'nagoya'},abLaeden:4,heimGewicht:2.5,kmSkala:150,
 staedte:{tokio:{name:'Tokio',groesse:3,km:0},yokohama:{name:'Yokohama',groesse:1.2,km:30},nagoya:{name:'Nagoya',groesse:1.3,km:260},kyoto:{name:'Kyoto',groesse:.8,km:370},osaka:{name:'Osaka',groesse:1.8,km:400}},
 // VORSCHLAG BOB – von Erik noch NICHT bestätigt: erster Laden in einer neuen Stadt kostet einmalig ¥10 Mio, dort im ersten Jahr −15 % Umsatz
 neuStadt:{an:new URLSearchParams(globalThis.location?location.search:'').get('neustadt_kosten')==='1',einmal:10e6,umsatzFaktor:.85,wochen:52,vorschlagBob:true}};
