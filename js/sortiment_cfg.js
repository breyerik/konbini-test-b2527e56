// Start-Sortiment & Freischaltung (Erik 22.10. 09:02): zum Start nur 6 Produkte, alles Weitere per Markenverhandlung oder Messe.
// ?sortiment=alt schaltet zurück (alles offen wie V5).
export const ON=new URLSearchParams(globalThis.location?location.search:'').get('sortiment')!=='alt';
export const START=[{id:'start:wasser',name:'Mineralwasser',cat:'drinks',csv:'^Wasser'},{id:'start:kaffee',name:'Kaffee',cat:'coffee'},{id:'start:tee',name:'Tee',cat:'tee'},
 {id:'start:oden',name:'Oden',cat:'oden'},{id:'start:onigiri',name:'Onigiri',cat:'onigiri'},{id:'start:bento',name:'Bentō',cat:'bento'}];
// Artikelname (aus „liefert“ der Firmen / Messe-Typ) → Warengruppe im Laden. Erste passende Regel gewinnt.
export const KAT_WORT=[[/tee/i,'tee'],[/kaffee/i,'coffee'],[/bier|chūhai|chuhai|softdrink|cola|limo|sport|saft|säfte|wasser|probiotik|milch|joghurt|energy/i,'drinks'],
 [/brot|sandwich|melonpan/i,'brot'],[/bentō|bento|fertig/i,'bento'],[/schoko|bonbon|pocky|chips|nudel|tiefkühl|eis|snack|riegel|nuss|wurm|fleisch|würst/i,'snacks'],
 [/kollab|kuji|saison/i,'saison'],[/hygiene|maske|kosmetik|batterie|ladekabel|schreib|socke|unterwäsche|zeitschrift|manga|prepaid|kopfhörer|spielzeug|alltag/i,'alltag']];
export const MESSE_TYP={cola:'drinks',energy:'drinks',wasser:'drinks',kaffee:'coffee',suess:'snacks',nusscreme:'snacks',chips:'snacks'};
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
