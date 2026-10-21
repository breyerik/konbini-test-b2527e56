// Spieler als Privatperson (Erik 22:07 freigegeben; Werte Bob daten/PREISE.md 21.10.2026)
export const START_PRIVAT=1.0e6;// Start-Privatgeld
export const GEHALT_MONAT=300000;// Geschäftsführergehalt aus der Firmenkasse ins Privatvermögen
export const STEUER_DIVIDENDE=.20;// Steuer auf Dividenden (real JP 20,315 %)
export const DARLEHEN_ZINS=.02;// Einlage als Darlehen: 2 % Zins/Jahr, Rückzahlung vor jeder Dividende
export const DARLEHEN_TILGUNG=.3;// so viel vom Wochengewinn geht in die Rückzahlung, solange ein Darlehen offen ist (Spielwert)
export const EINLAGE={standard:'darlehen',schritt:1e6,start:5e6};
export const DIVIDENDE={min:0,max:50,standard:20};// freiwillig nach dem eigenen Börsengang (% vom Gewinn)
export const KNAPP={kasse:1e6,sperreWochen:8};// Firmenkasse unter 1 Mio → Frage nach Einlage (höchstens alle 8 Wochen)
export const NAME_STANDARD='Chefin/Chef';
