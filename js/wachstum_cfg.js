// Erik 22.10. 16:29: Startkredit nach 2 Monaten bei positivem Einkommen, damit ein zweiter Laden schnell möglich ist;
// große Hersteller verhandeln erst ab 3 / 6 / 9 Läden („Dann erst ab 3,6, und ab 9 alles“).
export const STARTKREDIT={abWoche:9,gewinnWochen:4,betrag:20e6,jahre:10,zinsAufschlag:1.25,bank:'mitsu-kame-bank'};// Zins = Leitzins + Aufschlag; ein Mal pro Spiel
// Hersteller-Stufen nach Börsenwert (Kurs × Aktien): ≥ 3.000 Mrd → 9 Läden, ≥ 1.000 Mrd → 6, ≥ 400 Mrd → 3, darunter ab Start
export const HERSTELLER_STUFEN=[{abWert:3000e9,laeden:9},{abWert:1000e9,laeden:6},{abWert:400e9,laeden:3}];
export const ZU_KLEIN='Ihre Kette ist für uns aktuell noch zu klein – melden Sie sich ab {n} Läden wieder.';
