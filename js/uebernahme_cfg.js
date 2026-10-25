// Realistische Übernahme-Regeln (Bob, Erik freigegeben 22:34). Alle Spielwerte hier. ?uebernahme_real=0 schaltet zurück auf die alte 51-%-Regel.
const QS=new URLSearchParams(globalThis.location?location.search:'');
export const ON=true;// Erik 23.10.: 51-%-Regel entfernt – nur noch Übernahmeangebot an alle Aktionäre
export const SPERRE_WOCHEN=26;// nach gescheitertem Angebot
export const ZUFALL=.15;// Annahmequote Streubesitz schwankt ±15 Punkte (Seed-RNG)
export const MELDE_SCHWELLE=.05;// ab 5 % Meldepflicht → Kobo-Hinweis
export const MARKT_MAX=.299;// frei über die Börse höchstens 29,9 %
export const ANGEBOT_AB=.30;// ≥ 30 % nur per öffentlichem Übernahmeangebot an alle
export const LAUFZEIT={min:4,max:12,standard:8};// Wochen
export const PRAEMIE={min:20,max:60,schritt:5,standard:30};// % über 12-Wochen-Schnitt
export const SCHNITT_WOCHEN=12;
// Annahmechance nach Prämie (freundlich); dazwischen linear
export const CHANCE=[[0,.06],[20,.15],[30,.40],[40,.70],[50,.90]];// Whitebeard 23.10.: ab Marktpreis glatt steigend, nie 0 über Marktpreis
export const BODEN=.5;// Streubesitz-Zustimmung über Marktpreis nie unter 50 % der Kurve (auch feindlich/Zufall)// PREISE.md Nr. 3 (Bob): ≥ 50 % → 90 %
export const FEINDLICH_MINUS=.20;// feindlich = Vorstand des Ziels lehnt ab: −20 Prozentpunkte (PREISE.md Nr. 3)
export const VORSTAND_EMPFIEHLT_AB=30;// Vorstand empfiehlt ab +30 % Prämie, darunter lehnt er ab (PREISE.md legt das nicht fest – Spielwert)
export const STABIL={min:.10,max:.20};// stabile Aktionäre (Banken, Partner) verkaufen nie
export const KONTROLLE=.50;// über 50 % nach dem Angebot = Übernahme
export const SQUEEZE_OUT=.667;// ab 66,7 % werden die Restaktionäre zum Angebotspreis herausgekauft
export const ABWEHR={giftpilleAb:.20,giftpilleFaktor:.5,weisserRitter:.25,ritterAufschlag:.10};// PREISE.md Nr. 4: nur bei feindlich; Giftpille ab 20 % Käuferanteil halbiert ihn (Hauptversammlung); weißer Ritter 25 %, wenn eine Kette genug Kasse hat (bietet +10 %)
export const KOSTEN={berater:.02,beraterMin:20e6,pruefung:10e6};// bei Misserfolg verloren
export const INTEGRATION={jeLaden:3e6,wochen:52,kunden:.95,untereinander:4,ekDanach:.97,abstandFelder:15};
export const RIVALE_AUF_SPIELER={praemieMin:40,chanceWoche:.05};// Rivalen greifen den Spieler nur mit ≥ 40 % an
