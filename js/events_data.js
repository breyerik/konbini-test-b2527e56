// Konbini Empire – Datentabelle für Wochen-Entscheidungen und aktive Konkurrenz.
// Event-Zahlen: Bob (PREISE.md). Rivalen-Regeln: Bob/Whitebeard wo vermerkt, Rest PH = Platzhalter Franky. Übersicht: daten/EVENTS_PLATZHALTER.md
// Texte kommen von Ito: marketing/texte.json → events (id, figur, text, option_a, option_b).
//
export const PH=false;// Event-Wirkungen: Bob, daten/PREISE.md „Event-Wirkungen“ (Entwurf 21.10., Erik-Freigabe offen)
// Schema je Option: cash einmalig · mods [{cust,wk,p}] Umsatz-Faktor für wk Wochen (p = Eintrittschance) · marge {pp,wk} Marge −pp Prozentpunkte vom Umsatz
//  cashWk {v,wk} Mehrkosten je Woche · feeMul {m,wk} Paketprovision × m · morale · salary (Faktor, dauerhaft)
//  NAEH = Näherung von Franky, wo Bobs Tabelle etwas beschreibt, das das Spiel so nicht kennt (für Bob markiert)
export const EVENT_RULES={
 abWoche:3,          // Franky: Tutorial-Wochen bleiben ruhig (nicht in Bobs Tabelle)
 chance:.6,          // Bob: 60 % je Woche
 sperreWochen:12,    // Bob: gleiches Event frühestens nach 12 Wochen
 maxSchaden:300000,  // Bob: kein Event > 300.000 ¥ Netto-Schaden (Einmalkosten werden darauf gedeckelt)
 maxKostenAnteil:.05,// Franky: Bob V3: zusätzlich höchstens 5 % der Kasse, bei Kasse ≤ 0 keine Kosten (kein Game Over durch ein Event)
};
// Event-Wirkungen V3 (Bob, daten/PREISE.md + daten/event_wirkungen_v3.json, auf V2, 21.10.2026; Erik-Freigabe offen) – ev_lieferant_preis A/B getauscht wie Itos Texte
export const EVENTS={
 ev_taifun:{ziel:'laden',a:{cash:-150000,mods:[{cust:1.15,wk:1,p:.5}]},b:{mods:[{cust:.95,wk:1}]}},
 ev_influencer:{ziel:'laden',a:{cash:-150000,mods:[{cust:1.15,wk:2,p:.6}]},b:{}},
 // NAEH: A „Verlust nur −5 %“ statt −12 % → Umsatz ×0,95/0,88 für 4 Wo; B: Rivalen-Abzug (−12 %) läuft ohnehin über RIVAL_RULES
 ev_konkurrenz_nebenan:{ziel:'laden',bed:'rival',a:{marge:{pp:4,wk:4},mods:[{cust:1.08,wk:4}]},b:{}},
 // Bob V3: Zahlen = Marge −0,5 Pp 4 Wo; Lieferantenwechsel −100k + 50 % Risiko
 // Ito 21.10.: Texte getauscht – A „Günstigeren Lieferanten suchen“ (Risiko), B „Zahlen“ (sicher)
 ev_lieferant_preis:{ziel:'laden',a:{cash:-100000,mods:[{cust:.95,wk:4,p:.5}]},b:{marge:{pp:.5,wk:4}}},
 ev_hitzewelle:{ziel:'laden',bed:'sommer',a:{cash:-120000,mods:[{cust:1.18,wk:2,p:.7}]},b:{mods:[{cust:1.05,wk:2}]}},
 ev_matsuri:{ziel:'stadtteil',a:{cash:-170000,mods:[{cust:1.3,wk:1}]},b:{mods:[{cust:1.05,wk:1}]}},
 // NAEH (Bob V2 bestätigt): Stimmung = Umsatz +3 % 8 Wo
 ev_filialleitung_urlaub:{ziel:'laden',bed:'mgr',a:{cash:-220000,mods:[{cust:1.03,wk:8}]},b:{mods:[{cust:.99,wk:2}]}},
 ev_kunde_beschwerde:{ziel:'laden',a:{cash:-60000},b:{mods:[{cust:.98,wk:2}]}},
 ev_tv_bericht:{ziel:'laden',a:{cash:-250000,mods:[{cust:1.12,wk:5,p:.5}]},b:{}},
 ev_anime_kollab:{ziel:'laden',a:{cash:-300000,mods:[{cust:1.2,wk:5,p:.4}]},b:{}},
 ev_kasse_defekt:{ziel:'laden',bed:'self',a:{cash:-90000},b:{mods:[{cust:.92,wk:1}]}},
 ev_schulausflug:{ziel:'laden',a:{cash:-60000,mods:[{cust:1.08,wk:1}]},b:{}},
 ev_regen:{ziel:'laden',a:{cash:-50000,mods:[{cust:1.06,wk:1}]},b:{}},
 ev_nachbar_laerm:{ziel:'laden',a:{cashWk:{v:5000,wk:4}},b:{cash:-3000}},
 ev_bauarbeiten:{ziel:'laden',a:{cash:-40000},b:{mods:[{cust:.95,wk:2}]}},
 ev_paket_ansturm:{ziel:'laden',a:{cash:-60000,feeMul:{m:1.5,wk:2}},b:{mods:[{cust:.97,wk:2}]}},
 ev_buuhuu_kritik:{ziel:'laden',a:{cash:-90000},b:{mods:[{cust:.97,wk:2}]}},
 ev_neues_produkt:{ziel:'laden',a:{cash:-200000,mods:[{cust:1.08,wk:6,p:.5}]},b:{}},
 // NAEH: B „Einarbeitung“ – Filialleitung bleibt im Spiel (kein Wechsel), nur Kosten + Umsatzdelle
 ev_filialleitung_abwerbung:{ziel:'laden',bed:'mgr',rivalKette:true,a:{cash:-180000,salary:1.02},b:{cash:-50000,mods:[{cust:.97,wk:2}]}},
 ev_jubilaeum:{ziel:'laden',bed:'oma1j',einmal:true,a:{marge:{pp:10,wk:1},mods:[{cust:1.2,wk:1},{cust:1.03,wk:12}]},b:{cash:-5000,mods:[{cust:1.01,wk:12}]}},
};
// Aktive Konkurrenz (Rivalen starten mit 0 Läden – Erik)
export const RIVAL_RULES={
 abWoche:5,            // PH: erste Woche, in der Rivalen eröffnen können
 chanceFaktor:.40,     // Bob V2: Wochen-Chance je Kette = aggr (data.js) × Faktor
 anteilMax:.5,         // PH: Rivalen belegen höchstens 50 % der freigeschalteten Standorte
 freiLassen:3,         // PH: so viele Standorte bleiben immer für den Spieler frei
 nahFelder:4,          // PH: „gegenüber/nah“ = Abstand ≤ 4 Felder (ca. 40 m)
 umfeldFelder:10,      // PH: „in der Nähe“ = Abstand ≤ 10 Felder (ca. 100 m)
 verlustUmfeld:.03,    // Bob V2: −3 % je Rivalen-Filiale im Umfeld (statt Stadtteil-Wert)
 nahBevorzugt:.6,      // PH: Chance, dass eine Kette gezielt neben einer Spieler-Filiale eröffnet
 verlustNahNeu:.12,    // Bob (PREISE.md, 21.10.): −12 % je naher Rivalen-Filiale in den ersten 8 Wochen nach deren Eröffnung
 verlustNahWochen:8,   // Bob
 verlustNah:.06,       // Bob: danach dauerhaft −6 %
 nahMaxEinmal:true,    // Bob/Whitebeard: Nah-Abzug max. 1× pro Laden (weitere nahe Rivalen zählen wie Umfeld)
 verlustBezirk:.03,    // PH: −3 % je weiterer Rivalen-Filiale im selben Stadtteil
 verlustMax:.12,       // Bob V3: Rivalen kosten eine Filiale höchstens 12 % Kunden (kein Bankrott nur durch Rivalen)
 aktionChance:.06,     // PH: Wochen-Chance, dass eine Kette mit Läden eine Preisaktion startet
 aktionWochen:2,       // PH
 aktionVerlust:.04,    // PH: zusätzlich −4 % je naher Filiale der Kette während der Aktion (innerhalb verlustMax)
};
